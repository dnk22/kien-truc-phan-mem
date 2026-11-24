import type { SaleCompletedEvent } from '@minimart/contracts';
export class InvalidSaleEvent extends Error {}
function invalid(): never {
  throw new InvalidSaleEvent('Invalid sale.completed.v1 payload');
}
function obj(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return invalid();
  return v as Record<string, unknown>;
}
function string(v: unknown, max = 500): string {
  if (typeof v !== 'string' || !v.trim() || v.length > max) return invalid();
  return v;
}
function uuid(v: unknown): string {
  const value = string(v, 36);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    return invalid();
  return value.toLowerCase();
}
function amount(v: unknown, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 1 || v > max)
    return invalid();
  return v;
}
function date(v: unknown): string {
  const value = string(v, 40);
  if (!Number.isFinite(Date.parse(value)) || !/Z$/.test(value))
    return invalid();
  return new Date(value).toISOString();
}
export function parseSaleEvent(raw: unknown): SaleCompletedEvent {
  const event = obj(raw),
    p = obj(event.payload);
  if (
    event.eventType !== 'sale.completed.v1' ||
    (p.paymentMethod !== 'CASH' && p.paymentMethod !== 'BANK_TRANSFER')
  )
    return invalid();
  if (!Array.isArray(p.items) || p.items.length < 1 || p.items.length > 100)
    return invalid();
  const ids = new Set<string>();
  let sum = 0;
  const items = p.items.map((rawItem: unknown) => {
    const i = obj(rawItem),
      productId = uuid(i.productId);
    const quantity = amount(i.quantity, 2147483647),
      unitPrice = amount(i.unitPrice),
      subtotal = amount(i.subtotal);
    if (ids.has(productId) || subtotal !== quantity * unitPrice)
      return invalid();
    ids.add(productId);
    sum += subtotal;
    return {
      productId,
      productName: string(i.productName, 200),
      quantity,
      unitPrice,
      subtotal,
    };
  });
  const totalAmount = amount(p.totalAmount);
  if (!Number.isSafeInteger(sum) || sum !== totalAmount) return invalid();
  return {
    eventId: uuid(event.eventId),
    eventType: 'sale.completed.v1',
    occurredAt: date(event.occurredAt),
    payload: {
      invoiceId: uuid(p.invoiceId),
      invoiceCode: string(p.invoiceCode),
      cashierId: uuid(p.cashierId),
      totalAmount,
      paymentMethod: p.paymentMethod,
      completedAt: date(p.completedAt),
      items,
    },
  };
}
