import type { Prisma } from '../../../generated/client';
import type { InvoiceRecord } from '../domain/sales.types';
export const invoiceInclude = { items: true, payment: true } as const;
export type StoredInvoice = Prisma.InvoiceGetPayload<{
  include: typeof invoiceInclude;
}>;
export function toInvoice(row: StoredInvoice): InvoiceRecord {
  return {
    ...row,
    totalAmount: Number(row.totalAmount),
    items: row.items.map((item) => ({
      productId: item.productId,
      productCode: item.productCode,
      productName: item.productName,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    })),
    payment: row.payment
      ? {
          method: row.payment.method,
          amountReceived: Number(row.payment.amountReceived),
          changeAmount: Number(row.payment.changeAmount),
        }
      : null,
  };
}
