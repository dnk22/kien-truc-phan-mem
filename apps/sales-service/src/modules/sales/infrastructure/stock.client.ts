import { Injectable } from '@nestjs/common';
import type { StockPort } from '../domain/sales.repository';
import type { CartItem, Reservation } from '../domain/sales.types';
import { InternalHttpClient } from './internal-http.client';
import { RemoteError } from '../domain/sales.errors';
@Injectable()
export class InventoryStockClient implements StockPort {
  constructor(private readonly http: InternalHttpClient) {}
  private base() {
    return process.env.INVENTORY_SERVICE_URL ?? 'http://127.0.0.1:3003';
  }
  async lookup(invoiceId: string, correlationId?: string) {
    try {
      return await this.http.request<Reservation>(
        this.base(),
        '/internal/v1/stock/reservations/by-invoice/' + invoiceId,
        'GET',
        undefined,
        correlationId,
      );
    } catch (error) {
      if (error instanceof RemoteError && error.status === 404) return null;
      throw error;
    }
  }
  reserve(invoiceId: string, items: CartItem[], correlationId?: string) {
    return this.http.request<Reservation>(
      this.base(),
      '/internal/v1/stock/reservations',
      'POST',
      { invoiceId, items },
      correlationId,
    );
  }
  commit(id: string, correlationId?: string, actorId?: string) {
    return this.http.request<Reservation>(
      this.base(),
      '/internal/v1/stock/reservations/' + id + '/commit',
      'POST',
      { actorId },
      correlationId,
    );
  }
  release(id: string, correlationId?: string) {
    return this.http.request<Reservation>(
      this.base(),
      '/internal/v1/stock/reservations/' + id + '/release',
      'POST',
      {},
      correlationId,
    );
  }
}
