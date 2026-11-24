import { useQuery } from '@tanstack/react-query';
import { inventoryApi,type ListParams } from '../api/inventory.api';
async function all<T>(load:(p:ListParams)=>Promise<{items:T[];total:number}>,status?:string){
 const first=await load({page:1,pageSize:100,status});
 const pages=await Promise.all(Array.from({length:Math.max(0,Math.ceil(first.total/100)-1)},(_,i)=>load({page:i+2,pageSize:100,status})));
 return [...first.items,...pages.flatMap(p=>p.items)];
}
export function useInventoryOptions(){
 const suppliers=useQuery({queryKey:['inventory','supplier-options'],queryFn:()=>all(inventoryApi.suppliers,'ACTIVE')});
 const products=useQuery({queryKey:['inventory','product-options'],queryFn:()=>all(inventoryApi.products,'ACTIVE')});
 return {suppliers,products};
}
