export type DocumentStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
export type SupplierStatus = 'ACTIVE' | 'INACTIVE';
export interface SupplierInput {
  code: string;
  name: string;
  phone?: string | null;
  address?: string | null;
}
export interface StockItem {
  productId: string;
  quantity: number;
}
export interface ReceiptItem extends StockItem {
  unitCost: number;
}
export interface ReceiptInput {
  supplierId: string;
  items: ReceiptItem[];
}
export interface ReceiptSnapshot extends ReceiptItem {
  productCode: string;
  productName: string;
}
export interface AdjustmentInput {
  productId: string;
  expectedVersion: number;
  counted: number;
  reason: string;
}
export interface ListQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  supplierId?: string;
  productId?: string;
  lowStock?: boolean;
}
export interface StockRow {
  productId: string;
  productCode: string;
  productName: string;
  onHand: number;
  reserved: number;
  version: number;
  threshold: number;
}
export interface ReservationInput {
  invoiceId: string;
  items: StockItem[];
}
