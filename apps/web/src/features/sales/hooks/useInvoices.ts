import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { salesApi,type InvoiceFilters } from '../api/sales.api';
export function useInvoices(){
 const [filters,setFilters]=useState<InvoiceFilters>({page:1,pageSize:10});
 const search=useDebounce(filters.search?.trim()??'');
 const params={...filters,search:search||undefined};
 const query=useQuery({queryKey:['sales','list',params],queryFn:()=>salesApi.list(params)});
 return {filters,setFilters,query};
}
