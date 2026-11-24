import { Catch, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Principal } from '@minimart/auth';
import { SalesError } from '../domain/sales.errors';
import type { InvoiceRecord } from '../domain/sales.types';
export interface SalesRequest { correlationId?: string; principal: Principal }
export function publicInvoice(invoice: InvoiceRecord) {
  const { id, code, cashierId, status, sagaIntent, totalAmount, reservationId, items, payment, attempts, lastError, createdAt, updatedAt, completedAt } = invoice;
  return { id, code, cashierId, status, sagaIntent, totalAmount, reservationId, items, payment, attempts, lastError, createdAt, updatedAt, completedAt };
}
@Catch(SalesError)
export class SalesErrorFilter implements ExceptionFilter {
  catch(error: SalesError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<{ correlationId?: string }>();
    ctx.getResponse<{ status: (code: number) => { json: (body: unknown) => void } }>().status(error.status).json({ success: false, error: { code: error.code, message: error.message }, meta: { correlationId: req.correlationId ?? '' } });
  }
}
