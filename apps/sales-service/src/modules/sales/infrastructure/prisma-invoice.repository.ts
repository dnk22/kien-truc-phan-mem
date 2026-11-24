import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { Prisma } from '../../../generated/client';
import type { InvoiceRepository } from '../domain/sales.repository';
import type {
  InvoiceDraft,
  InvoiceQuery,
  PaymentResult,
  SagaIntent,
} from '../domain/sales.types';
import { SalesError } from '../domain/sales.errors';
import { assertCanCancel, assertCanConfirm } from '../domain/invoice.state';
import { invoiceInclude, toInvoice } from './invoice.mapper';
import { salesWrite } from './sales-transaction';

@Injectable()
export class PrismaInvoiceRepository implements InvoiceRepository {
  constructor(private readonly db: PrismaService) {}
  private async required(tx: Prisma.TransactionClient, id: string) {
    const row = await tx.invoice.findUnique({
      where: { id },
      include: invoiceInclude,
    });
    if (!row)
      throw new SalesError('INVOICE_NOT_FOUND', 'Không tìm thấy hóa đơn.', 404);
    return toInvoice(row);
  }
  private async patch(
    tx: Prisma.TransactionClient,
    id: string,
    data: Prisma.InvoiceUncheckedUpdateInput,
  ) {
    return toInvoice(
      await tx.invoice.update({ where: { id }, data, include: invoiceInclude }),
    );
  }
  private assertOwner(row: { cashierId: string }, actor: string) {
    if (row.cashierId !== actor)
      throw new SalesError('FORBIDDEN', 'Không có quyền với hóa đơn này.', 403);
  }
  async get(id: string) {
    const row = await this.db.invoice.findUnique({
      where: { id },
      include: invoiceInclude,
    });
    return row ? toInvoice(row) : null;
  }
  async findPrepare(actor: string, key: string) {
    const row = await this.db.invoice.findUnique({
      where: { cashierId_prepareKey: { cashierId: actor, prepareKey: key } },
      include: invoiceInclude,
    });
    return row ? toInvoice(row) : null;
  }
  create(draft: InvoiceDraft, key: string, hash: string) {
    return salesWrite(this.db, async (tx) => {
      const existing = await tx.invoice.findUnique({
        where: {
          cashierId_prepareKey: { cashierId: draft.cashierId, prepareKey: key },
        },
        include: invoiceInclude,
      });
      if (existing) {
        if (existing.prepareHash !== hash)
          throw new SalesError(
            'IDEMPOTENCY_CONFLICT',
            'Khóa đã dùng cho giỏ hàng khác.',
          );
        return toInvoice(existing);
      }
      const { items, totalAmount, ...header } = draft;
      return toInvoice(
        await tx.invoice.create({
          data: {
            ...header,
            totalAmount: BigInt(totalAmount),
            prepareKey: key,
            prepareHash: hash,
            items: {
              create: items.map((item) => ({
                ...item,
                unitPrice: BigInt(item.unitPrice),
                subtotal: BigInt(item.subtotal),
              })),
            },
          },
          include: invoiceInclude,
        }),
      );
    });
  }
  async list(query: InvoiceQuery) {
    const where: Prisma.InvoiceWhereInput = {
      cashierId: query.cashierId,
      status: query.status,
      code: query.search
        ? { contains: query.search, mode: 'insensitive' }
        : undefined,
    };
    const [rows, total] = await this.db.$transaction([
      this.db.invoice.findMany({
        where,
        include: invoiceInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.db.invoice.count({ where }),
    ]);
    return { items: rows.map(toInvoice), total };
  }
  startPayment(
    id: string,
    actor: string,
    key: string,
    hash: string,
    payment: PaymentResult,
  ) {
    return salesWrite(this.db, async (tx) => {
      const row = await this.required(tx, id);
      this.assertOwner(row, actor);
      const prior = await tx.invoice.findUnique({
        where: { cashierId_confirmKey: { cashierId: actor, confirmKey: key } },
      });
      if (prior && (prior.id !== id || prior.confirmHash !== hash))
        throw new SalesError(
          'IDEMPOTENCY_CONFLICT',
          'Khóa thanh toán đã dùng cho dữ liệu khác.',
        );
      if (row.confirmKey) {
        if (row.confirmKey !== key || row.confirmHash !== hash)
          throw new SalesError(
            'PAYMENT_ALREADY_RECORDED',
            'Hóa đơn đã có yêu cầu thanh toán.',
          );
        return row;
      }
      assertCanConfirm(row);
      await tx.payment.create({
        data: {
          invoiceId: id,
          method: payment.method,
          amountReceived: BigInt(payment.amountReceived),
          changeAmount: BigInt(payment.changeAmount),
        },
      });
      return this.patch(tx, id, {
        status: 'PROCESSING',
        sagaIntent: 'COMMIT',
        confirmKey: key,
        confirmHash: hash,
        attempts: 0,
        nextAttemptAt: new Date(),
        lastError: null,
      });
    });
  }
  startCancel(id: string, actor: string) {
    return salesWrite(this.db, async (tx) => {
      const row = await this.required(tx, id);
      this.assertOwner(row, actor);
      if (row.sagaIntent === 'RELEASE' || row.status === 'CANCELLED')
        return row;
      assertCanCancel(row);
      return this.patch(tx, id, {
        status: 'RECOVERY',
        sagaIntent: 'RELEASE',
        attempts: 0,
        nextAttemptAt: new Date(),
        lastError: null,
      });
    });
  }
  ready(id: string, reservationId: string) {
    return salesWrite(this.db, async (tx) => {
      const row = await this.required(tx, id);
      if (row.sagaIntent !== 'RESERVE') return row;
      return this.patch(tx, id, {
        status: 'READY',
        sagaIntent: 'NONE',
        reservationId,
        attempts: 0,
        lastError: null,
      });
    });
  }
  complete(id: string) {
    return salesWrite(this.db, async (tx) => {
      const row = await this.required(tx, id);
      if (row.status === 'COMPLETED') return row;
      if (row.sagaIntent !== 'COMMIT' || !row.payment)
        throw new SalesError(
          'INVALID_SAGA_STATE',
          'Không thể hoàn tất hóa đơn.',
        );
      const completedAt = new Date();
      const eventId = randomUUID();
      const payload = {
        eventId,
        eventType: 'sale.completed.v1',
        occurredAt: completedAt.toISOString(),
        payload: {
          invoiceId: row.id,
          invoiceCode: row.code,
          cashierId: row.cashierId,
          totalAmount: row.totalAmount,
          paymentMethod: row.payment.method,
          completedAt: completedAt.toISOString(),
          items: row.items.map(
            ({ productId, productName, quantity, unitPrice, subtotal }) => ({
              productId,
              productName,
              quantity,
              unitPrice,
              subtotal,
            }),
          ),
        },
      };
      await tx.outboxEvent.create({
        data: { id: eventId, eventType: 'sale.completed.v1', payload },
      });
      return this.patch(tx, id, {
        status: 'COMPLETED',
        sagaIntent: 'NONE',
        completedAt,
        lastError: null,
      });
    });
  }
  cancelled(id: string) {
    return salesWrite(this.db, async (tx) => {
      const row = await this.required(tx, id);
      if (row.status === 'CANCELLED') return row;
      if (row.sagaIntent !== 'RELEASE' || row.payment)
        throw new SalesError('INVALID_SAGA_STATE', 'Không thể hủy hóa đơn.');
      return this.patch(tx, id, {
        status: 'CANCELLED',
        sagaIntent: 'NONE',
        lastError: null,
      });
    });
  }
  failedReserve(id: string, code: string) {
    return salesWrite(this.db, async (tx) => {
      const row = await this.required(tx, id);
      if (row.sagaIntent !== 'RESERVE') return row;
      return this.patch(tx, id, {
        status: 'FAILED',
        sagaIntent: 'NONE',
        lastError: code,
      });
    });
  }
  defer(id: string, intent: SagaIntent, code: string) {
    return salesWrite(this.db, async (tx) => {
      const row = await this.required(tx, id);
      if (row.sagaIntent !== intent) return row;
      const attempts = row.attempts + 1;
      return this.patch(tx, id, {
        status: 'RECOVERY',
        attempts,
        lastError: code,
        nextAttemptAt: new Date(
          Date.now() + Math.min(60000, 1000 * 2 ** Math.min(attempts, 6)),
        ),
      });
    });
  }
  async due() {
    const rows = await this.db.invoice.findMany({
      where: {
        sagaIntent: { not: 'NONE' },
        attempts: { lt: 20 },
        nextAttemptAt: { lte: new Date() },
      },
      include: invoiceInclude,
      orderBy: { nextAttemptAt: 'asc' },
      take: 20,
    });
    return rows.map(toInvoice);
  }
}
