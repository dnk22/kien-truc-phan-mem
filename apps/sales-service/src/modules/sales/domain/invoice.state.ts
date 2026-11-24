import { SalesError } from './sales.errors';
import type { InvoiceRecord } from './sales.types';
export function assertCanConfirm(invoice: InvoiceRecord) {
  if (invoice.status !== 'READY' || invoice.sagaIntent !== 'NONE' || !invoice.reservationId || invoice.payment)
    throw new SalesError('INVOICE_NOT_READY', 'Hóa đơn chưa sẵn sàng thanh toán.');
}
export function assertCanCancel(invoice: InvoiceRecord) {
  if (invoice.payment || invoice.sagaIntent === 'COMMIT' || invoice.status === 'COMPLETED')
    throw new SalesError('PAYMENT_ALREADY_RECORDED', 'Không thể hủy sau khi đã ghi nhận tiền.');
  if (invoice.status !== 'READY' && invoice.status !== 'CANCELLED')
    throw new SalesError('INVOICE_NOT_CANCELLABLE', 'Chỉ hủy hóa đơn đã giữ hàng; giao dịch đang xử lý cần chờ đối soát.');
}
