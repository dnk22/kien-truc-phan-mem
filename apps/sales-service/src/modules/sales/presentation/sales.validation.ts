import { BadRequestException } from '@nestjs/common';
import type {
  CartItem,
  InvoiceQuery,
  InvoiceStatus,
  PaymentRequest,
} from '../domain/sales.types';
function invalid(): never {
  throw new BadRequestException({
    code: 'VALIDATION_ERROR',
    message: 'Dữ liệu không hợp lệ.',
  });
}
function object(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return invalid();
  const v = value as Record<string, unknown>;
  if (Object.keys(v).some((key) => !allowed.includes(key))) invalid();
  return v;
}
export function idempotencyKey(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9._:-]{1,128}$/.test(value))
    return invalid();
  return value;
}
export function cartInput(value: unknown): CartItem[] {
  const body = object(value, ['items']);
  if (
    !Array.isArray(body.items) ||
    body.items.length < 1 ||
    body.items.length > 100
  )
    return invalid();
  const ids = new Set<string>();
  return body.items.map((raw: unknown) => {
    const item = object(raw, ['productId', 'quantity']);
    if (
      typeof item.productId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        item.productId,
      ) ||
      typeof item.quantity !== 'number' ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 2147483647
    )
      return invalid();
    const productId = item.productId.toLowerCase();
    if (ids.has(productId)) return invalid();
    ids.add(productId);
    return { productId, quantity: item.quantity };
  });
}
export function paymentInput(value: unknown): PaymentRequest {
  const body = object(value, ['method', 'amountReceived', 'confirmed']);
  if (
    body.method === 'CASH' &&
    typeof body.amountReceived === 'number' &&
    Number.isSafeInteger(body.amountReceived) &&
    body.amountReceived > 0 &&
    body.confirmed === undefined
  )
    return { method: 'CASH', amountReceived: body.amountReceived };
  if (
    body.method === 'BANK_TRANSFER' &&
    body.confirmed === true &&
    body.amountReceived === undefined
  )
    return { method: 'BANK_TRANSFER', confirmed: true };
  return invalid();
}
export function invoiceQuery(value: unknown): InvoiceQuery {
  const q = object(value, ['page', 'pageSize', 'status', 'search']);
  const integer = (v: unknown, fallback: number, max: number) => {
    if (v === undefined) return fallback;
    if (typeof v !== 'string' || !/^\d+$/.test(v)) return invalid();
    const n = Number(v);
    if (!Number.isSafeInteger(n) || n < 1 || n > max) return invalid();
    return n;
  };
  if (
    q.status !== undefined &&
    ![
      'PENDING',
      'READY',
      'PROCESSING',
      'RECOVERY',
      'COMPLETED',
      'FAILED',
      'CANCELLED',
    ].includes(String(q.status))
  )
    invalid();
  if (
    q.search !== undefined &&
    (typeof q.search !== 'string' || q.search.length > 200)
  )
    invalid();
  return {
    page: integer(q.page, 1, 1000000),
    pageSize: integer(q.pageSize, 20, 100),
    status: q.status as InvoiceStatus | undefined,
    search: q.search as string | undefined,
  };
}
