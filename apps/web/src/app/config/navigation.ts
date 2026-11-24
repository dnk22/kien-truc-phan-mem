import type { Role } from '@minimart/contracts';
export interface NavItem {
  path: string;
  label: string;
  roles: readonly Role[];
  available: boolean;
  labels?: Partial<Record<Role, string>>;
}
const all: readonly Role[] = ['ADMIN', 'MANAGER', 'CASHIER', 'WAREHOUSE'];
export const navigation: NavItem[] = [
  {
    path: '/users',
    label: 'Quản lý nhân viên',
    roles: ['ADMIN'],
    available: true,
  },
  {
    path: '/dashboard',
    label: 'Tổng quan',
    roles: ['MANAGER'],
    available: false,
  },
  { path: '/pos', label: 'Bán hàng POS', roles: ['CASHIER'], available: false },
  {
    path: '/products',
    labels: { CASHIER: 'Tra cứu sản phẩm', WAREHOUSE: 'Tra cứu sản phẩm' },
    label: 'Sản phẩm',
    roles: ['MANAGER', 'CASHIER', 'WAREHOUSE'],
    available: false,
  },
  {
    path: '/categories',
    label: 'Danh mục',
    roles: ['MANAGER'],
    available: false,
  },
  {
    path: '/suppliers',
    label: 'Nhà cung cấp',
    roles: ['MANAGER'],
    available: false,
  },
  {
    path: '/purchase-receipts',
    label: 'Nhập hàng',
    roles: ['MANAGER', 'WAREHOUSE'],
    available: false,
  },
  {
    path: '/inventory',
    labels: { CASHIER: 'Tra cứu tồn kho' },
    label: 'Tồn kho',
    roles: ['MANAGER', 'CASHIER', 'WAREHOUSE'],
    available: false,
  },
  {
    path: '/inventory/movements',
    label: 'Lịch sử biến động',
    roles: ['MANAGER', 'WAREHOUSE'],
    available: false,
  },
  {
    path: '/inventory/adjustments',
    label: 'Kiểm kê',
    roles: ['MANAGER', 'WAREHOUSE'],
    available: false,
  },
  {
    path: '/invoices',
    labels: { CASHIER: 'Hóa đơn của tôi' },
    label: 'Hóa đơn',
    roles: ['MANAGER', 'CASHIER'],
    available: false,
  },
  { path: '/reports', label: 'Báo cáo', roles: ['MANAGER'], available: false },
  { path: '/profile', label: 'Thông tin cá nhân', roles: all, available: true },
];

export function navigationLabel(item: NavItem, role?: Role) {
  return (role ? item.labels?.[role] : undefined) ?? item.label;
}
