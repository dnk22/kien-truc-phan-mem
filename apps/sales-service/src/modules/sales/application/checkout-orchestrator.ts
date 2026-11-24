import { Inject, Injectable } from '@nestjs/common';
import { INVOICES, STOCK_PORT, type InvoiceRepository, type StockPort } from '../domain/sales.repository';
import type { InvoiceRecord, Reservation } from '../domain/sales.types';
import { SalesError } from '../domain/sales.errors';

@Injectable()
export class CheckoutOrchestrator {
  private readonly running = new Map<string, Promise<InvoiceRecord>>();
  constructor(@Inject(INVOICES) private readonly invoices: InvoiceRepository, @Inject(STOCK_PORT) private readonly stock: StockPort) {}
  advance(id: string, correlationId?: string): Promise<InvoiceRecord> {
    const current = this.running.get(id);
    if (current) return current.then(async result => {
      const latest = await this.invoices.get(id);
      if (latest && latest.sagaIntent !== 'NONE' && latest.sagaIntent !== result.sagaIntent)
        return this.advance(id, correlationId);
      return latest ?? result;
    });
    const task = this.run(id, correlationId).finally(() => this.running.delete(id));
    this.running.set(id, task);
    return task;
  }
  private async run(id: string, correlationId?: string): Promise<InvoiceRecord> {
    const invoice = await this.invoices.get(id);
    if (!invoice) throw new SalesError('INVOICE_NOT_FOUND', 'Không tìm thấy hóa đơn.', 404);
    const intent = invoice.sagaIntent;
    if (intent === 'NONE') return invoice;
    try {
      // Always reconcile remote state before issuing an idempotent mutation.
      let reservation = await this.stock.lookup(id, correlationId);
      if (intent === 'RESERVE') {
        if (!reservation) {
          try {
            reservation = await this.stock.reserve(id, invoice.items.map(({ productId, quantity }) => ({ productId, quantity })), correlationId);
          } catch (error) {
            // Even a definite stock rejection is reconciled: another attempt may have succeeded.
            const remote = error as { status?: number; code?: string };
            if (remote.status === 409 && remote.code === 'INSUFFICIENT_STOCK') {
              const existing = await this.stock.lookup(id, correlationId);
              if (!existing) return await this.invoices.failedReserve(id, 'INSUFFICIENT_STOCK');
              reservation = existing;
            } else throw error;
          }
        }
        if (reservation.status !== 'RESERVED') throw new SalesError('RESERVATION_STATE_CONFLICT', 'Cần đối soát trạng thái giữ hàng.');
        return await this.invoices.ready(id, reservation.id);
      }
      if (!reservation || reservation.id !== invoice.reservationId)
        throw new SalesError('RESERVATION_MISSING', 'Cần đối soát giữ hàng.');
      if (intent === 'COMMIT') {
        if (reservation.status === 'RESERVED') reservation = await this.stock.commit(reservation.id, correlationId);
        this.expectState(reservation, 'COMMITTED');
        return await this.invoices.complete(id);
      }
      if (reservation.status === 'RESERVED') reservation = await this.stock.release(reservation.id, correlationId);
      this.expectState(reservation, 'RELEASED');
      return await this.invoices.cancelled(id);
    } catch (error) {
      const code = (error as { code?: string }).code ?? 'SAGA_OUTCOME_UNKNOWN';
      return this.invoices.defer(id, intent, code);
    }
  }
  private expectState(reservation: Reservation, status: Reservation['status']) {
    if (reservation.status !== status) throw new SalesError('RESERVATION_STATE_CONFLICT', 'Cần đối soát trạng thái giữ hàng.');
  }
}
