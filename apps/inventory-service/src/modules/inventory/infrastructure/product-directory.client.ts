import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type {
  ProductDirectory,
  ProductLookup,
} from '../domain/inventory.repository';
import type { ApiSuccess, ProductBatchResult } from '@minimart/contracts';
@Injectable()
export class ProductDirectoryClient implements ProductDirectory {
  async batch(ids: string[], correlationId?: string): Promise<ProductLookup[]> {
    try {
      const response = await fetch(
        new URL(
          '/internal/v1/products/batch',
          process.env.PRODUCT_SERVICE_URL ?? 'http://127.0.0.1:3002',
        ),
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-correlation-id': correlationId ?? '',
            'x-service-credential': process.env.SERVICE_CREDENTIAL ?? '',
          },
          body: JSON.stringify({ productIds: ids }),
          signal: AbortSignal.timeout(5000),
          redirect: 'error',
        },
      );
      if (!response.ok) throw new Error('Product lookup failed');
      const result = (await response.json()) as ApiSuccess<ProductBatchResult>;
      if (!result.success || !Array.isArray(result.data.items))
        throw new Error('Invalid product response');
      return result.data.items;
    } catch {
      throw new ServiceUnavailableException({
        code: 'PRODUCT_UNAVAILABLE',
        message: 'Không thể kiểm tra sản phẩm.',
      });
    }
  }
  async list(
    query: { page: number; pageSize: number; search?: string },
    correlationId?: string,
  ) {
    try {
      const url = new URL(
        '/internal/v1/products',
        process.env.PRODUCT_SERVICE_URL ?? 'http://127.0.0.1:3002',
      );
      url.searchParams.set('page', String(query.page));
      url.searchParams.set('pageSize', String(query.pageSize));
      if (query.search) url.searchParams.set('search', query.search);
      const response = await fetch(url, {
        headers: {
          'x-service-credential': process.env.SERVICE_CREDENTIAL ?? '',
          'x-correlation-id': correlationId ?? '',
        },
        signal: AbortSignal.timeout(5000),
        redirect: 'error',
      });
      if (!response.ok) throw new Error('Product directory unavailable');
      const result = (await response.json()) as ApiSuccess<ProductLookup[]> & {
        meta: { total: number };
      };
      if (
        !result.success ||
        !Array.isArray(result.data) ||
        !Number.isSafeInteger(result.meta.total)
      )
        throw new Error('Invalid directory');
      return { items: result.data, total: result.meta.total };
    } catch {
      throw new ServiceUnavailableException({
        code: 'PRODUCT_UNAVAILABLE',
        message: 'Không thể tra cứu danh sách sản phẩm.',
      });
    }
  }
}
