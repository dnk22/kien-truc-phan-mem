import { Inject, Injectable } from '@nestjs/common';
import { INVOICES, PAYMENT_CREATORS, type InvoiceRepository } from '../domain/sales.repository';
import type { PaymentCreator } from '../domain/payment/payment.creator';
import type { PaymentMethod, PaymentRequest } from '../domain/sales.types';
import { SalesError } from '../domain/sales.errors';
import { InvoiceService, payloadHash } from './invoice.service';
@Injectable()
export class PaymentService {
  constructor(@Inject(INVOICES) private readonly invoices: InvoiceRepository, @Inject(PAYMENT_CREATORS) private readonly creators: Record<PaymentMethod, PaymentCreator>, private readonly invoiceService: InvoiceService) {}
  async confirm(id: string, actor: string, key: string, request: PaymentRequest) {
    const invoice = await this.invoiceService.get(id, actor);
    const hash = payloadHash({ id, ...request });
    if (invoice.confirmKey) {
      if (invoice.confirmKey !== key || invoice.confirmHash !== hash) throw new SalesError('IDEMPOTENCY_CONFLICT', 'Yêu cầu thanh toán không khớp.');
      return invoice;
    }
    const payment = this.creators[request.method].create().process(request, invoice.totalAmount);
    return this.invoices.startPayment(id, actor, key, hash, payment);
  }
}
