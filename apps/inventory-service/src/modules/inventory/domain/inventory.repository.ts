import type { AdjustmentInput,ListQuery,ReceiptInput,ReceiptSnapshot,ReservationInput,SupplierInput,SupplierStatus } from './inventory.types';
export const SUPPLIERS=Symbol('SUPPLIERS');
export const RECEIPTS=Symbol('RECEIPTS');
export const STOCK=Symbol('STOCK');
export const RESERVATIONS=Symbol('RESERVATIONS');
export const PRODUCTS=Symbol('PRODUCTS');
export interface Page<T>{items:T[];total:number}
export interface ProductLookup {id:string;code:string;name:string;status:'ACTIVE'|'INACTIVE'}
export interface ProductDirectory { batch(ids:string[]):Promise<ProductLookup[]> }
export interface SupplierRepository {
 list(q:ListQuery,activeOnly:boolean):Promise<Page<unknown>>;
 get(id:string,activeOnly:boolean):Promise<unknown>;
 create(input:SupplierInput):Promise<unknown>;
 update(id:string,input:Partial<SupplierInput>&{status?:SupplierStatus}):Promise<unknown>;
}
export interface ReceiptRepository {
 list(q:ListQuery):Promise<Page<unknown>>;
 get(id:string):Promise<unknown>;
 create(input:ReceiptInput,items:ReceiptSnapshot[],actor:string):Promise<unknown>;
 update(id:string,input:ReceiptInput,items:ReceiptSnapshot[]):Promise<unknown>;
 confirm(id:string,actor:string):Promise<unknown>;
 cancel(id:string):Promise<unknown>;
}
export interface StockRepository {
 list(q:ListQuery):Promise<Page<unknown>>;
 get(productId:string):Promise<unknown>;
 movements(q:ListQuery):Promise<Page<unknown>>;
 adjustments(q:ListQuery):Promise<Page<unknown>>;
 createAdjustment(input:AdjustmentInput,actor:string):Promise<unknown>;
 confirmAdjustment(id:string,actor:string):Promise<unknown>;
 cancelAdjustment(id:string):Promise<unknown>;
 summary():Promise<unknown>;
}
export interface ReservationRepository {
 reserve(input:ReservationInput):Promise<unknown>;
 get(id:string):Promise<unknown>;
 byInvoice(invoiceId:string):Promise<unknown>;
 transition(id:string,action:'COMMITTED'|'RELEASED'):Promise<unknown>;
}
