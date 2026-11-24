export type InvoiceStatus = 'PENDING' | 'READY' | 'PROCESSING' | 'RECOVERY' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type SagaIntent = 'RESERVE' | 'COMMIT' | 'RELEASE' | 'NONE';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER';
export interface CartItem { productId: string; quantity: number }
export interface ProductSnapshot { id: string; code: string; name: string; unit: string; sellingPrice: number; status: 'ACTIVE' | 'INACTIVE' }
export interface InvoiceLine extends CartItem { productCode: string; productName: string; unit: string; unitPrice: number; subtotal: number }
export interface PaymentRequest { method: PaymentMethod; amountReceived?: number; confirmed?: boolean }
export interface PaymentResult { method: PaymentMethod; amountReceived: number; changeAmount: number }
export interface InvoiceDraft { id: string; code: string; cashierId: string; items: InvoiceLine[]; totalAmount: number }
export interface InvoiceRecord extends InvoiceDraft {
  status: InvoiceStatus;
  sagaIntent: SagaIntent;
  reservationId: string | null;
  payment: PaymentResult | null;
  prepareKey: string;
  prepareHash: string;
  confirmKey: string | null;
  confirmHash: string | null;
  attempts: number;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}
export interface Reservation { id: string; invoiceId: string; status: 'RESERVED' | 'COMMITTED' | 'RELEASED'; items: CartItem[] }
export interface InvoiceQuery { page: number; pageSize: number; status?: InvoiceStatus; cashierId?: string; search?: string }
