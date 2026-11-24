import type {
  InvoiceDraft,
  InvoiceRecord,
  InvoiceQuery,
  PaymentResult,
  ProductSnapshot,
  CartItem,
  Reservation,
  SagaIntent,
} from './sales.types';
export const INVOICES = Symbol('INVOICES');
export const PRODUCT_DIRECTORY = Symbol('SALES_PRODUCT_DIRECTORY');
export const STOCK_PORT = Symbol('SALES_STOCK_PORT');
export const PAYMENT_CREATORS = Symbol('PAYMENT_CREATORS');
export interface InvoiceRepository {
  get(id: string): Promise<InvoiceRecord | null>;
  findPrepare(actor: string, key: string): Promise<InvoiceRecord | null>;
  create(
    draft: InvoiceDraft,
    key: string,
    hash: string,
  ): Promise<InvoiceRecord>;
  list(query: InvoiceQuery): Promise<{ items: InvoiceRecord[]; total: number }>;
  startPayment(
    id: string,
    actor: string,
    key: string,
    hash: string,
    payment: PaymentResult,
  ): Promise<InvoiceRecord>;
  startCancel(id: string, actor: string): Promise<InvoiceRecord>;
  ready(id: string, reservationId: string): Promise<InvoiceRecord>;
  complete(id: string): Promise<InvoiceRecord>;
  cancelled(id: string): Promise<InvoiceRecord>;
  failedReserve(id: string, code: string): Promise<InvoiceRecord>;
  defer(id: string, intent: SagaIntent, code: string): Promise<InvoiceRecord>;
  due(): Promise<InvoiceRecord[]>;
}
export interface ProductDirectory {
  batch(ids: string[], correlationId?: string): Promise<ProductSnapshot[]>;
}
export interface StockPort {
  lookup(
    invoiceId: string,
    correlationId?: string,
  ): Promise<Reservation | null>;
  reserve(
    invoiceId: string,
    items: CartItem[],
    correlationId?: string,
  ): Promise<Reservation>;
  commit(
    id: string,
    correlationId?: string,
    actorId?: string,
  ): Promise<Reservation>;
  release(id: string, correlationId?: string): Promise<Reservation>;
}
