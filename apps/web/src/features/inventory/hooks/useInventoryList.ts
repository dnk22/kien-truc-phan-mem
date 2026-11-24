import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import type { ListParams } from '../api/inventory.api';
export function useInventoryList<T>(key:string,load:(params:ListParams)=>Promise<{items:T[];total:number}>){
 const [filters,setFilters]=useState<ListParams>({page:1,pageSize:10});
 const search=useDebounce(filters.search?.trim()??'');
 const params={...filters,search:search||undefined};
 const query=useQuery({queryKey:['inventory',key,params],queryFn:()=>load(params)});
 return {filters,setFilters,query,pagination:{current:filters.page,pageSize:filters.pageSize,total:query.data?.total??0,showSizeChanger:true,onChange:(page:number,pageSize:number)=>setFilters(old=>({...old,page:pageSize!==old.pageSize?1:page,pageSize}))}};
}
