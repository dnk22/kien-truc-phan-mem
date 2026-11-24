import type { CatalogStatus } from '@minimart/contracts';
export interface CatalogFilters { page:number; pageSize:number; search?:string; status?:CatalogStatus; categoryId?:string; sortBy?:'name'|'sellingPrice'|'createdAt'; sortOrder?:'asc'|'desc' }
export interface CategoryValues { code:string; name:string; description?:string|null }
export interface ProductValues extends CategoryValues { categoryId:string; barcode?:string|null; unit:string; sellingPrice:number; imageUrl?:string|null }
