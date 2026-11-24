import { BadRequestException } from '@nestjs/common';
import type {
  AdjustmentInput,
  ListQuery,
  ReceiptInput,
  ReservationInput,
  SupplierInput,
  SupplierStatus,
} from '../domain/inventory.types';
function invalid(): never {
  throw new BadRequestException({
    code: 'VALIDATION_ERROR',
    message: 'Dữ liệu không hợp lệ.',
  });
}
function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return invalid();
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some((k) => !keys.includes(k))) invalid();
  return result;
}
function str(value: unknown, max: number) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    return invalid();
  return value.trim();
}
function optional(value: unknown, max: number) {
  return value === null || value === '' ? null : str(value, max);
}
function int(value: unknown, min = 0) {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < min ||
    value > 2147483647
  )
    return invalid();
  return value;
}
export function uuid(value: unknown) {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    return invalid();
  return value.toLowerCase();
}
export function supplierInput(value: unknown, partial: false): SupplierInput;
export function supplierInput(
  value: unknown,
  partial: true,
): Partial<SupplierInput>;
export function supplierInput(value: unknown, partial: boolean) {
  const v = object(value, ['code', 'name', 'phone', 'address']);
  const result: Partial<SupplierInput> = {};
  if (!partial || v.code !== undefined) result.code = str(v.code, 64);
  if (!partial || v.name !== undefined) result.name = str(v.name, 200);
  if (v.phone !== undefined) result.phone = optional(v.phone, 50);
  if (v.address !== undefined) result.address = optional(v.address, 500);
  return result;
}
export function supplierStatus(value: unknown): SupplierStatus {
  const v = object(value, ['status']);
  if (v.status !== 'ACTIVE' && v.status !== 'INACTIVE') return invalid();
  return v.status;
}
function unique<T extends { productId: string }>(items: T[]) {
  if (new Set(items.map((i) => i.productId)).size !== items.length) invalid();
  return items;
}
function array(value: unknown) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 100)
    return invalid();
  return value as unknown[];
}
export function receiptInput(value: unknown): ReceiptInput {
  const v = object(value, ['supplierId', 'items']);
  const items = unique(
    array(v.items).map((raw) => {
      const i = object(raw, ['productId', 'quantity', 'unitCost']);
      return {
        productId: uuid(i.productId),
        quantity: int(i.quantity, 1),
        unitCost: int(i.unitCost, 1),
      };
    }),
  );
  if (
    !Number.isSafeInteger(
      items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
    )
  )
    return invalid();
  return { supplierId: uuid(v.supplierId), items };
}
export function reservationInput(value: unknown): ReservationInput {
  const v = object(value, ['invoiceId', 'items']);
  return {
    invoiceId: uuid(v.invoiceId),
    items: unique(
      array(v.items).map((raw) => {
        const i = object(raw, ['productId', 'quantity']);
        return { productId: uuid(i.productId), quantity: int(i.quantity, 1) };
      }),
    ),
  };
}
export function adjustmentInput(value: unknown): AdjustmentInput {
  const v = object(value, [
    'productId',
    'expectedVersion',
    'counted',
    'reason',
  ]);
  return {
    productId: uuid(v.productId),
    expectedVersion: int(v.expectedVersion),
    counted: int(v.counted),
    reason: str(v.reason, 1000),
  };
}
export function listQuery(
  value: unknown,
  kind: 'suppliers' | 'receipts' | 'stock' | 'movements' | 'adjustments',
): ListQuery {
  const fields = {
    suppliers: ['search', 'status'],
    receipts: ['supplierId', 'status'],
    stock: ['search', 'productId', 'lowStock'],
    movements: ['productId'],
    adjustments: ['productId', 'status'],
  };
  const v = object(value, ['page', 'pageSize', ...fields[kind]]);
  const page = (raw: unknown, def: number, max: number) => {
    if (raw === undefined) return def;
    if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return invalid();
    const n = Number(raw);
    if (!Number.isSafeInteger(n) || n < 1 || n > max) return invalid();
    return n;
  };
  const q: ListQuery = {
    page: page(v.page, 1, 1000000),
    pageSize: page(v.pageSize, 20, 100),
  };
  if (v.search !== undefined) q.search = str(v.search, 200);
  if (v.status !== undefined) {
    const allowed =
      kind === 'suppliers'
        ? ['ACTIVE', 'INACTIVE']
        : ['DRAFT', 'CONFIRMED', 'CANCELLED'];
    if (typeof v.status !== 'string' || !allowed.includes(v.status)) invalid();
    q.status = v.status as string;
  }
  if (v.supplierId !== undefined) q.supplierId = uuid(v.supplierId);
  if (v.productId !== undefined) q.productId = uuid(v.productId);
  if (v.lowStock !== undefined) {
    if (v.lowStock !== 'true' && v.lowStock !== 'false') invalid();
    q.lowStock = v.lowStock === 'true';
  }
  return q;
}
