export interface ApiMeta {
  correlationId: string;
}
export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}
export interface ApiFailure {
  success: false;
  error: { code: string; message: string };
  meta: ApiMeta;
}
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
export interface HealthStatus {
  status: 'ok';
  service: string;
}

export const ROLES = ['ADMIN', 'MANAGER', 'CASHIER', 'WAREHOUSE'] as const;
export type Role = (typeof ROLES)[number];
export type UserStatus = 'ACTIVE' | 'LOCKED';
export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}
export interface AuthResult {
  accessToken: string;
  expiresIn: number;
  user: UserProfile;
}

export type CatalogStatus = 'ACTIVE' | 'INACTIVE';
export interface CategorySummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
}
export interface ProductReference {
  id: string;
  code: string;
  name: string;
  barcode: string | null;
  categoryId: string;
  unit: string;
  sellingPrice: number;
  status: CatalogStatus;
}
export interface ProductSummary extends ProductReference {
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface ProductBatchResult {
  items: ProductReference[];
  missingIds: string[];
}

export type InventoryDocumentStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
export interface SupplierSummary { id:string;code:string;name:string;phone:string|null;address:string|null;status:CatalogStatus }
export interface StockSummary { productId:string;productCode?:string;productName?:string;onHand:number;reserved:number;available:number;version:number;threshold:number }
export interface PurchaseItem { productId:string;quantity:number;unitCost:number }
export interface PurchaseReceiptSummary {id:string;supplierId:string;supplier:SupplierSummary;status:InventoryDocumentStatus;createdAt:string;items:(PurchaseItem&{productCode:string;productName:string})[]}
export interface StockAdjustmentSummary {id:string;productId:string;expectedVersion:number;counted:number;reason:string;status:InventoryDocumentStatus;createdAt:string}
export interface StockMovementSummary {id:string;productId:string;referenceId:string;type:'PURCHASE'|'SALE'|'ADJUSTMENT_IN'|'ADJUSTMENT_OUT';quantity:number;actorId:string|null;createdAt:string}
export interface ReserveStockInput {invoiceId:string;items:{productId:string;quantity:number}[]}
export interface StockReservationSummary extends ReserveStockInput {id:string;status:'RESERVED'|'COMMITTED'|'RELEASED'}

export type SaleStatus = 'PENDING' | 'READY' | 'PROCESSING' | 'RECOVERY' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type SalePaymentMethod = 'CASH' | 'BANK_TRANSFER';
export interface SaleCartItem { productId: string; quantity: number }
export interface SaleInvoiceItem extends SaleCartItem {
  productCode: string; productName: string; unit: string; unitPrice: number; subtotal: number;
}
export type SalePaymentInput = { method: 'CASH'; amountReceived: number } | { method: 'BANK_TRANSFER'; confirmed: true };
export interface SalePayment { method: SalePaymentMethod; amountReceived: number; changeAmount: number }
export interface SaleInvoice {
  id: string; code: string; cashierId: string; status: SaleStatus;
  sagaIntent: 'RESERVE' | 'COMMIT' | 'RELEASE' | 'NONE';
  totalAmount: number; reservationId: string | null; items: SaleInvoiceItem[];
  payment: SalePayment | null; attempts: number; lastError: string | null;
  createdAt: string; updatedAt: string; completedAt: string | null;
}

export interface SaleCompletedEvent {
  eventId: string;
  eventType: 'sale.completed.v1';
  occurredAt: string;
  payload: {
    invoiceId: string; invoiceCode: string; cashierId: string; totalAmount: number;
    paymentMethod: SalePaymentMethod; completedAt: string;
    items: { productId: string; productName: string; quantity: number; unitPrice: number; subtotal: number }[];
  };
}
export interface RevenueReport {
  from: string; to: string;
  revenue: number; invoiceCount: number; quantitySold: number;
  days: { date: string; revenue: number; invoiceCount: number }[];
  paymentMethods: { method: SalePaymentMethod; revenue: number; invoiceCount: number }[];
  topProducts: { productId: string; productName: string; quantity: number; revenue: number }[];
  updatedAt: string | null;
}
export interface InventoryReportSummary {
  productCount: number; onHand: number; reserved: number; available: number; lowStockCount: number;
}
