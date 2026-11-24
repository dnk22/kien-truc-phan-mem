import { useQuery } from '@tanstack/react-query';
import type { CategorySummary } from '@minimart/contracts';
import { catalogApi } from '../../catalog/api/catalog.api';
import type { CategoryValues } from '../../catalog/types';
export function useCategories(){
 return useQuery({queryKey:['categories','options'],queryFn:async()=>{
  const api=catalogApi<CategorySummary,CategoryValues>('categories');
  const first=await api.list({page:1,pageSize:100});
  const rest=await Promise.all(Array.from({length:Math.max(0,Math.ceil(first.total/100)-1)},(_,i)=>api.list({page:i+2,pageSize:100})));
  return [...first.items,...rest.flatMap(page=>page.items)];
 }});
}
