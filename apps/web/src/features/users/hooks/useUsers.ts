import { useQuery } from '@tanstack/react-query';
import { listUsers } from '../api/users.api';
import type { UserFilters } from '../types';
export function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => listUsers(filters),
    retry: false,
  });
}
