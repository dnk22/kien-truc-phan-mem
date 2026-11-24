import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCTS,
  RECEIPTS,
  type ProductDirectory,
  type ReceiptRepository,
} from '../domain/inventory.repository';
import type {
  ListQuery,
  ReceiptInput,
  ReceiptSnapshot,
} from '../domain/inventory.types';
import { InventoryError } from '../domain/inventory.errors';
@Injectable()
export class ReceiptService {
  constructor(
    @Inject(RECEIPTS) private readonly repository: ReceiptRepository,
    @Inject(PRODUCTS) private readonly products: ProductDirectory,
  ) {}
  list(q: ListQuery) {
    return this.repository.list(q);
  }
  get(id: string) {
    return this.repository.get(id);
  }
  private async snapshots(
    input: ReceiptInput,
    correlationId?: string,
  ): Promise<ReceiptSnapshot[]> {
    const products = await this.products.batch(
      input.items.map((i) => i.productId),
      correlationId,
    );
    const map = new Map(products.map((item) => [item.id, item]));
    return input.items.map((item) => {
      const product = map.get(item.productId);
      if (!product || product.status !== 'ACTIVE')
        throw new InventoryError(
          'INVALID_RECEIPT_PRODUCT',
          'Sản phẩm không tồn tại hoặc ngừng kinh doanh.',
        );
      return { ...item, productCode: product.code, productName: product.name };
    });
  }
  async create(input: ReceiptInput, actor: string, correlationId?: string) {
    return this.repository.create(
      input,
      await this.snapshots(input, correlationId),
      actor,
    );
  }
  async update(id: string, input: ReceiptInput, correlationId?: string) {
    return this.repository.update(
      id,
      input,
      await this.snapshots(input, correlationId),
    );
  }
  confirm(id: string, actor: string) {
    return this.repository.confirm(id, actor);
  }
  cancel(id: string) {
    return this.repository.cancel(id);
  }
}
