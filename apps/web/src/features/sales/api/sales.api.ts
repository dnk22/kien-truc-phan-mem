import type {
  ApiSuccess,
  Pagination,
  SaleCartItem,
  SaleInvoice,
  SalePaymentInput,
  SaleStatus,
} from '@minimart/contracts';
import { client } from '../../../shared/api/client';
export interface InvoiceFilters {
  page: number;
  pageSize: number;
  status?: SaleStatus;
  search?: string;
}
export const salesApi = {
  async prepare(items: SaleCartItem[], key: string) {
    return (
      await client.post<ApiSuccess<SaleInvoice>>(
        '/api/v1/sales/checkout/prepare',
        { items },
        { headers: { 'Idempotency-Key': key } },
      )
    ).data.data;
  },
  async confirm(id: string, input: SalePaymentInput, key: string) {
    return (
      await client.post<ApiSuccess<SaleInvoice>>(
        '/api/v1/sales/checkout/' + id + '/confirm',
        input,
        { headers: { 'Idempotency-Key': key } },
      )
    ).data.data;
  },
  async cancel(id: string) {
    return (
      await client.post<ApiSuccess<SaleInvoice>>(
        '/api/v1/sales/checkout/' + id + '/cancel',
      )
    ).data.data;
  },
  async get(id: string) {
    return (await client.get<ApiSuccess<SaleInvoice>>('/api/v1/invoices/' + id))
      .data.data;
  },
  async list(params: InvoiceFilters) {
    const result = (
      await client.get<ApiSuccess<SaleInvoice[]> & { meta: Pagination }>(
        '/api/v1/invoices',
        { params },
      )
    ).data;
    return { items: result.data, total: result.meta.total };
  },
};
