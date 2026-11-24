import { Inject, Injectable } from '@nestjs/common';
import {
  PRODUCTS,
  STOCK,
  type ProductDirectory,
  type ProductLookup,
  type StockRepository,
} from '../domain/inventory.repository';
import type {
  AdjustmentInput,
  ListQuery,
  StockRow,
} from '../domain/inventory.types';
import { missing } from '../domain/inventory.errors';
@Injectable()
export class StockService {
  constructor(
    @Inject(STOCK) private readonly repository: StockRepository,
    @Inject(PRODUCTS) private readonly products: ProductDirectory,
  ) {}
  private merge(product: ProductLookup, stock?: StockRow) {
    return {
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      onHand: stock?.onHand ?? 0,
      reserved: stock?.reserved ?? 0,
      available: (stock?.onHand ?? 0) - (stock?.reserved ?? 0),
      version: stock?.version ?? 0,
      threshold: stock?.threshold ?? 5,
    };
  }
  private async allProducts(search?: string, correlationId?: string) {
    const items: ProductLookup[] = [];
    for (let page = 1; ; page++) {
      const result = await this.products.list(
        { page, pageSize: 100, search },
        correlationId,
      );
      items.push(...result.items);
      if (!result.items.length || items.length >= result.total) break;
    }
    return [...new Map(items.map((p) => [p.id, p])).values()];
  }
  private async combine(products: ProductLookup[]) {
    const stocks = await this.repository.byProducts(products.map((p) => p.id));
    const map = new Map(stocks.map((stock) => [stock.productId, stock]));
    return products.map((product) => this.merge(product, map.get(product.id)));
  }
  async list(q: ListQuery, correlationId?: string) {
    if (q.productId) {
      const stock = await this.get(q.productId, correlationId);
      const items =
        q.lowStock && stock.available > stock.threshold ? [] : [stock];
      return { items: q.page === 1 ? items : [], total: items.length };
    }
    if (q.lowStock) {
      const items = (
        await this.combine(await this.allProducts(q.search, correlationId))
      ).filter((s) => s.available <= s.threshold);
      return {
        items: items.slice((q.page - 1) * q.pageSize, q.page * q.pageSize),
        total: items.length,
      };
    }
    const result = await this.products.list(q, correlationId);
    return { items: await this.combine(result.items), total: result.total };
  }
  async get(id: string, correlationId?: string) {
    const [product] = await this.products.batch([id], correlationId);
    if (!product) throw missing('Sản phẩm');
    return this.merge(product, await this.repository.get(id));
  }
  movements(q: ListQuery) {
    return this.repository.movements(q);
  }
  adjustments(q: ListQuery) {
    return this.repository.adjustments(q);
  }
  async createAdjustment(
    input: AdjustmentInput,
    actor: string,
    correlationId?: string,
  ) {
    const [product] = await this.products.batch(
      [input.productId],
      correlationId,
    );
    if (!product) throw missing('Sản phẩm');
    return this.repository.createAdjustment(input, actor, product);
  }
  confirmAdjustment(id: string, actor: string) {
    return this.repository.confirmAdjustment(id, actor);
  }
  cancelAdjustment(id: string) {
    return this.repository.cancelAdjustment(id);
  }
  async summary(correlationId?: string) {
    const items = await this.combine(
      await this.allProducts(undefined, correlationId),
    );
    return {
      productCount: items.length,
      onHand: items.reduce((n, s) => n + s.onHand, 0),
      reserved: items.reduce((n, s) => n + s.reserved, 0),
      available: items.reduce((n, s) => n + s.available, 0),
      lowStockCount: items.filter((s) => s.available <= s.threshold).length,
    };
  }
}
