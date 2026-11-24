import type { ApiSuccess,Pagination,SupplierSummary,PurchaseReceiptSummary,StockSummary,StockAdjustmentSummary,StockMovementSummary,ProductSummary,PurchaseItem } from '@minimart/contracts';
import { client } from '../../../shared/api/client';
export interface ListParams {page:number;pageSize:number;search?:string;status?:string;productId?:string;supplierId?:string;lowStock?:boolean}
export interface SupplierValues {code:string;name:string;phone?:string|null;address?:string|null}
export interface ReceiptValues {supplierId:string;items:PurchaseItem[]}
export interface AdjustmentValues {productId:string;expectedVersion:number;counted:number;reason:string}
async function list<T>(path:string,params:ListParams){
 const result=(await client.get<ApiSuccess<T[]> & {meta:Pagination}>('/api/v1/'+path,{params})).data;
 return {items:result.data,total:result.meta.total};
}
export const inventoryApi={
 suppliers:(params:ListParams)=>list<SupplierSummary>('suppliers',params),
 receipts:(params:ListParams)=>list<PurchaseReceiptSummary>('purchase-receipts',params),
 stock:(params:ListParams)=>list<StockSummary>('inventory',params),
 movements:(params:ListParams)=>list<StockMovementSummary>('inventory/movements',params),
 adjustments:(params:ListParams)=>list<StockAdjustmentSummary>('inventory/adjustments',params),
 products:(params:ListParams)=>list<ProductSummary>('products',params),
 async getStock(id:string){return (await client.get<ApiSuccess<StockSummary>>('/api/v1/inventory/'+id)).data.data;},
 saveSupplier:(id:string|undefined,values:SupplierValues)=>id?client.patch('/api/v1/suppliers/'+id,values):client.post('/api/v1/suppliers',values),
 supplierStatus:(id:string,status:string)=>client.patch('/api/v1/suppliers/'+id+'/status',{status}),
 saveReceipt:(id:string|undefined,values:ReceiptValues)=>id?client.patch('/api/v1/purchase-receipts/'+id,values):client.post('/api/v1/purchase-receipts',values),
 receiptAction:(id:string,action:'confirm'|'cancel')=>client.post('/api/v1/purchase-receipts/'+id+'/'+action),
 createAdjustment:(values:AdjustmentValues)=>client.post('/api/v1/inventory/adjustments',values),
 adjustmentAction:(id:string,action:'confirm'|'cancel')=>client.post('/api/v1/inventory/adjustments/'+id+'/'+action),
};
