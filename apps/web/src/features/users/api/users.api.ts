import type {
  ApiSuccess,
  Pagination,
  Role,
  UserProfile,
  UserStatus,
} from '@minimart/contracts';
import { client } from '../../../shared/api/client';
import type { UserFilters, UserFormValues } from '../types';
export async function listUsers(filters: UserFilters) {
  const result = (
    await client.get<ApiSuccess<UserProfile[]> & { meta: Pagination }>(
      '/api/v1/users',
      { params: filters },
    )
  ).data;
  return { items: result.data, total: result.meta.total };
}
export async function createUser(input: UserFormValues) {
  return (await client.post('/api/v1/users', input)).data;
}
export async function updateUser(
  id: string,
  input: { fullName: string; email: string | null; phone: string | null },
) {
  return (await client.patch(`/api/v1/users/${id}`, input)).data;
}
export async function changeStatus(id: string, status: UserStatus) {
  return (await client.patch(`/api/v1/users/${id}/status`, { status })).data;
}
export async function changeRole(id: string, role: Role) {
  return (await client.patch(`/api/v1/users/${id}/role`, { role })).data;
}
