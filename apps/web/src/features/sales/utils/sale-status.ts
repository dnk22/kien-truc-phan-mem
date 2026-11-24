import type { SaleStatus } from '@minimart/contracts';
export const saleStatusLabels: Record<SaleStatus, string> = {
  PENDING: 'Đang giữ hàng',
  READY: 'Chờ thanh toán',
  PROCESSING: 'Đang xử lý',
  RECOVERY: 'Cần đối soát',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Thất bại',
  CANCELLED: 'Đã hủy',
};
export const isTerminal = (status: SaleStatus) =>
  ['COMPLETED', 'FAILED', 'CANCELLED'].includes(status);
