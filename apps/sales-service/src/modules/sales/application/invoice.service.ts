import { Inject, Injectable } from '@nestjs/common';
import { INVOICES, PRODUCT_DIRECTORY, type InvoiceRepository, type ProductDirectory } from '../domain/sales.repository';
import { InvoiceBuilder } from '../domain/invoice.builder';
import { SalesError } from '../domain/sales.errors';
import type { CartItem, InvoiceQuery, InvoiceRecord } from '../domain/sales.types';
import { createHash } from 'node:crypto';
export function payloadHash(value: unknown) { return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }
@Injectable()
export class InvoiceService {
  constructor(@Inject(INVOICES) private readonly invoices: InvoiceRepository, @Inject(PRODUCT_DIRECTORY) private readonly products: ProductDirectory) {}
  async prepare(actor: string, key: string, items: CartItem[], correlationId?: string) {
    const sorted = [...items].sort((a, b) => a.productId.localeCompare(b.productId));
    const hash = payloadHash(sorted);
    const prior = await this.invoices.findPrepare(actor, key);
    if (prior) {
      if (prior.prepareHash !== hash) throw new SalesError('IDEMPOTENCY_CONFLICT', 'Khóa đã dùng cho giỏ hàng khác.');
      return prior;
    }
    const products = await this.products.batch(sorted.map(item => item.productId), correlationId);
    const byId = new Map(products.map(product => [product.id, product]));
    const lines = sorted.map(item => {
      const product = byId.get(item.productId);
      if (!product || product.status !== 'ACTIVE') throw new SalesError('PRODUCT_NOT_SELLABLE', 'Sản phẩm không tồn tại hoặc ngừng bán.');
      return { ...item, productCode: product.code, productName: product.name, unit: product.unit, unitPrice: product.sellingPrice, subtotal: item.quantity * product.sellingPrice };
    });
    const draft = new InvoiceBuilder().setCashier(actor).setItems(lines).build();
    return this.invoices.create(draft, key, hash);
  }
  async get(id: string, actor?: string): Promise<InvoiceRecord> {
    const invoice = await this.invoices.get(id);
    if (!invoice) throw new SalesError('INVOICE_NOT_FOUND', 'Không tìm thấy hóa đơn.', 404);
    if (actor && invoice.cashierId !== actor) throw new SalesError('FORBIDDEN', 'Không có quyền với hóa đơn này.', 403);
    return invoice;
  }
  list(query: InvoiceQuery) { return this.invoices.list(query); }
  cancel(id: string, actor: string) { return this.invoices.startCancel(id, actor); }
}
