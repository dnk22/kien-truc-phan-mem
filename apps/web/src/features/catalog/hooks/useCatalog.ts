import { useState } from 'react';
import { useMutation,useQuery,useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import type { CatalogStatus } from '@minimart/contracts';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { errorMessage } from '../../../shared/utils/errorMessage';
import { catalogApi } from '../api/catalog.api';
import type { CatalogFilters } from '../types';
export function useCatalog<T,V>(resource:'categories'|'products'){
 const api=catalogApi<T,V>(resource);
 const cache=useQueryClient();
 const [filters,setFilters]=useState<CatalogFilters>({page:1,pageSize:10});
 const search=useDebounce(filters.search?.trim()??'');
 const query=useQuery({queryKey:[resource,{...filters,search}],queryFn:()=>api.list({...filters,search:search||undefined})});
 const success=()=>{void cache.invalidateQueries({queryKey:[resource]});void message.success('Đã lưu thay đổi.');};
 const failure=(e:unknown)=>void message.error(errorMessage(e));
 const save=useMutation({mutationFn:({id,values}:{id?:string;values:V})=>api.save(id,values),onSuccess:success,onError:failure});
 const status=useMutation({mutationFn:({id,status}:{id:string;status:CatalogStatus})=>api.status(id,status),onSuccess:success,onError:failure});
 return {filters,setFilters,query,save,status};
}
