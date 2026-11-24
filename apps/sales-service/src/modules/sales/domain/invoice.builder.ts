import { randomUUID } from 'node:crypto';
import { SalesError } from './sales.errors';
import type { InvoiceDraft, InvoiceLine } from './sales.types';

export class InvoiceBuilder {
  private cashierId?: string;
  private items: InvoiceLine[] = [];
  setCashier(id: string): this { this.cashierId = id; return this; }
  setItems(items: InvoiceLine[]): this { this.items = items.map(item => ({ ...item })); return this; }
  build(): InvoiceDraft {
    if (!this.cashierId || !this.items.length || this.items.length > 100)
      throw new SalesError('INVALID_INVOICE', 'Hóa đơn không hợp lệ.', 400);
    const ids = new Set<string>();
    let totalAmount = 0;
    for (const item of this.items) {
      if (ids.has(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1 ||
          !Number.isSafeInteger(item.unitPrice) || item.unitPrice < 1 ||
          !Number.isSafeInteger(item.subtotal) || item.subtotal !== item.unitPrice * item.quantity)
        throw new SalesError('INVALID_INVOICE_ITEM', 'Dòng hóa đơn không hợp lệ.', 400);
      ids.add(item.productId);
      totalAmount += item.subtotal;
      if (!Number.isSafeInteger(totalAmount)) throw new SalesError('AMOUNT_OVERFLOW', 'Tổng tiền vượt giới hạn.', 400);
    }
    const id = randomUUID();
    return { id, code: 'HD-' + id.toUpperCase(), cashierId: this.cashierId, items: this.items.map(item => ({ ...item })), totalAmount };
  }
}
