import type { ApiSuccess, Pagination, CatalogStatus } from '@minimart/contracts';
import { client } from '../../../shared/api/client';
import type { CatalogFilters } from '../types';
export function catalogApi<T,V>(resource:'categories'|'products'){
 const path='/api/v1/'+resource;
 return {
  async list(filters:CatalogFilters){const result=(await client.get<ApiSuccess<T[]> & {meta:Pagination}>(path,{params:filters})).data;return {items:result.data,total:result.meta.total};},
  async get(id:string){return (await client.get<ApiSuccess<T>>(path+'/'+id)).data.data;},
  async save(id:string|undefined,values:V){return id?client.patch(path+'/'+id,values):client.post(path,values);},
  async status(id:string,status:CatalogStatus){return client.patch(path+'/'+id+'/status',{status});},
 };
}
