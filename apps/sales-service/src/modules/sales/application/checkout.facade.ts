import { Injectable } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { PaymentService } from './payment.service';
import { CheckoutOrchestrator } from './checkout-orchestrator';
import type { CartItem, PaymentRequest } from '../domain/sales.types';
import { SalesError } from '../domain/sales.errors';
@Injectable()
export class CheckoutFacade {
  constructor(private readonly invoices: InvoiceService, private readonly payments: PaymentService, private readonly orchestrator: CheckoutOrchestrator) {}
  async prepare(actor: string, key: string, items: CartItem[], correlationId?: string) {
    const invoice = await this.invoices.prepare(actor, key, items, correlationId);
    const result = await this.orchestrator.advance(invoice.id, correlationId);
    if (result.status === 'FAILED') throw new SalesError(result.lastError ?? 'CHECKOUT_FAILED', 'Không đủ hàng để thực hiện giao dịch.');
    return result;
  }
  async confirm(id: string, actor: string, key: string, request: PaymentRequest, correlationId?: string) {
    await this.payments.confirm(id, actor, key, request);
    return this.orchestrator.advance(id, correlationId);
  }
  async cancel(id: string, actor: string, correlationId?: string) {
    await this.invoices.cancel(id, actor);
    return this.orchestrator.advance(id, correlationId);
  }
}
