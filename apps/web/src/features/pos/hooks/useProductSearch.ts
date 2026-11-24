import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { inventoryApi } from '../../inventory/api/inventory.api';
export function useProductSearch() {
  const [search, setSearch] = useState('');
  const value = useDebounce(search.trim());
  const query = useQuery({
    queryKey: ['pos', 'products', value],
    queryFn: () =>
      inventoryApi.products({
        page: 1,
        pageSize: 30,
        status: 'ACTIVE',
        search: value || undefined,
      }),
  });
  return { search, setSearch, query };
}
