import { Injectable } from '@nestjs/common';
import type { ProductDirectory } from '../domain/sales.repository';
import type { ProductBatchResult } from '@minimart/contracts';
import { InternalHttpClient } from './internal-http.client';
import { SalesError } from '../domain/sales.errors';
@Injectable()
export class SalesProductDirectory implements ProductDirectory {
  constructor(private readonly http: InternalHttpClient) {}
  async batch(ids: string[], correlationId?: string) {
    try {
      const result = await this.http.request<ProductBatchResult>(process.env.PRODUCT_SERVICE_URL ?? 'http://127.0.0.1:3002', '/internal/v1/products/batch', 'POST', { productIds: ids }, correlationId);
      return result.items;
    } catch { throw new SalesError('PRODUCT_UNAVAILABLE', 'Không thể lấy giá sản phẩm.', 503); }
  }
}
