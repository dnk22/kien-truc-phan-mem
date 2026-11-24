import type { Role } from '../types';
export const roleLabels: Record<Role, string> = {
  ADMIN: 'Quản trị viên',
  MANAGER: 'Quản lý',
  CASHIER: 'Thu ngân',
  WAREHOUSE: 'Nhân viên kho',
};
export const roleHome: Record<Role, string> = {
  ADMIN: '/users',
  MANAGER: '/dashboard',
  CASHIER: '/pos',
  WAREHOUSE: '/inventory',
};
