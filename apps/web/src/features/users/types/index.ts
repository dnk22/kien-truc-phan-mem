import type { Role, UserProfile, UserStatus } from '@minimart/contracts';
export interface UserFilters {
  page: number;
  pageSize: number;
  search?: string;
  role?: Role;
  status?: UserStatus;
}
export interface UserFormValues {
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  password?: string;
  role: Role;
}
export interface UserList {
  items: UserProfile[];
  total: number;
}
export type UserAction =
  | { kind: 'status'; user: UserProfile; status: UserStatus }
  | { kind: 'role'; user: UserProfile; role: Role };
