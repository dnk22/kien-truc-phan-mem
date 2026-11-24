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
