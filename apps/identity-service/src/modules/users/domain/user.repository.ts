import type { Role, UserStatus } from '@minimart/contracts';
export interface IdentityUser {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: Role;
  status: UserStatus;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}
export interface UserQuery {
  page: number;
  pageSize: number;
  search?: string;
  role?: Role;
  status?: UserStatus;
}
export interface CreateUser {
  username: string;
  passwordHash: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: Role;
}
export interface UpdateUser {
  fullName?: string;
  email?: string | null;
  phone?: string | null;
  role?: Role;
  status?: UserStatus;
}
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export interface UserRepository {
  findByUsername(username: string): Promise<IdentityUser | null>;
  findById(id: string): Promise<IdentityUser | null>;
  list(query: UserQuery): Promise<{ items: IdentityUser[]; total: number }>;
  create(actorId: string, input: CreateUser): Promise<IdentityUser>;
  update(actorId: string, id: string, input: UpdateUser): Promise<IdentityUser>;
}
