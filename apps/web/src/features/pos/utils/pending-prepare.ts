import type { SaleCartItem } from '@minimart/contracts';
export interface PendingPrepare { key: string; items: SaleCartItem[] }
const storageKey = (actor: string) => 'minimart:pos:prepare:' + actor;
export function readPendingPrepare(actor: string): PendingPrepare | null {
  try {
    const raw = sessionStorage.getItem(storageKey(actor));
    return raw ? JSON.parse(raw) as PendingPrepare : null;
  } catch { return null; }
}
export function writePendingPrepare(actor: string, pending: PendingPrepare | null) {
  try {
    if (pending) sessionStorage.setItem(storageKey(actor), JSON.stringify(pending));
    else sessionStorage.removeItem(storageKey(actor));
  } catch { /* UI remains usable if storage is disabled. */ }
}

export interface PendingConfirm { key: string; input: import('@minimart/contracts').SalePaymentInput }
export function readCheckoutState(actor: string): { id?: string; pendingConfirm?: PendingConfirm } {
  try {
    const raw = sessionStorage.getItem('minimart:pos:checkout:' + actor);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
export function writeCheckoutState(actor: string, id?: string, pendingConfirm?: PendingConfirm | null) {
  try {
    const key = 'minimart:pos:checkout:' + actor;
    if (id) sessionStorage.setItem(key, JSON.stringify({ id, pendingConfirm }));
    else sessionStorage.removeItem(key);
  } catch { /* The invoice history remains available. */ }
}
