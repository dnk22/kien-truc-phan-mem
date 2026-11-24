import { BadRequestException } from '@nestjs/common';
import type { CatalogQuery, CatalogStatus, CategoryInput, ProductInput } from '../domain/catalog.repository';
function invalid():never {throw new BadRequestException({code:'VALIDATION_ERROR',message:'Dữ liệu không hợp lệ.'});}
function record(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))return invalid();return value as Record<string,unknown>;}
function keys(value:Record<string,unknown>,allowed:string[]){if(Object.keys(value).some(k=>!allowed.includes(k)))invalid();}
function str(value:unknown,max:number){if(typeof value!=='string'||!value.trim()||value.trim().length>max)return invalid();return value.trim();}
function optional(value:unknown,max:number){if(value===null||value==='')return null;if(typeof value==='string'&&!value.trim())return null;return str(value,max);}
export function status(value:unknown):CatalogStatus{if(value!=='ACTIVE'&&value!=='INACTIVE')return invalid();return value;}
export function price(value:unknown):number{if(typeof value!=='number'||!Number.isInteger(value)||value<=0||value>2147483647)return invalid();return value;}
export function uuid(value:unknown):string{if(typeof value!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))return invalid();return value.toLowerCase();}
function categoryFields(v:Record<string,unknown>,partial:boolean):Partial<CategoryInput>{
 const result:Partial<CategoryInput>={};
 if(!partial||v.code!==undefined)result.code=str(v.code,64);
 if(!partial||v.name!==undefined)result.name=str(v.name,200);
 if(v.description!==undefined)result.description=optional(v.description,2000);
 return result;
}
export function categoryInput(value:unknown,partial:false):CategoryInput;
export function categoryInput(value:unknown,partial:true):Partial<CategoryInput>;
export function categoryInput(value:unknown,partial:boolean){const v=record(value);keys(v,['code','name','description']);return categoryFields(v,partial);}
export function productInput(value:unknown,partial:false):ProductInput;
export function productInput(value:unknown,partial:true):Partial<ProductInput>;
export function productInput(value:unknown,partial:boolean){
 const v=record(value);keys(v,['code','name','description','categoryId','barcode','unit','sellingPrice','imageUrl']);
 const result:Partial<ProductInput>=categoryFields(v,partial);
 if(!partial||v.categoryId!==undefined)result.categoryId=uuid(v.categoryId);
 if(!partial||v.unit!==undefined)result.unit=str(v.unit,50);
 if(!partial||v.sellingPrice!==undefined)result.sellingPrice=price(v.sellingPrice);
 if(v.barcode!==undefined)result.barcode=optional(v.barcode,64);
 if(v.imageUrl!==undefined){result.imageUrl=optional(v.imageUrl,2048);if(result.imageUrl){try{if(!['http:','https:'].includes(new URL(result.imageUrl).protocol))invalid();}catch{return invalid();}}}
 return result;
}
export function catalogQuery(value:unknown):CatalogQuery{
 const v=record(value);keys(v,['page','pageSize','search','status','categoryId','sortBy','sortOrder']);
 const integer=(x:unknown,d:number,max:number)=>{if(x===undefined)return d;if(typeof x!=='string'||!/^\d+$/.test(x))return invalid();const n=Number(x);if(!Number.isSafeInteger(n)||n<1||n>max)return invalid();return n;};
 const sortBy=v.sortBy??'name';const sortOrder=v.sortOrder??'asc';
 if(sortBy!=='name'&&sortBy!=='sellingPrice'&&sortBy!=='createdAt')return invalid();
 if(sortOrder!=='asc'&&sortOrder!=='desc')return invalid();
 return {page:integer(v.page,1,1000000),pageSize:integer(v.pageSize,20,100),search:v.search===undefined?undefined:str(v.search,200),status:v.status===undefined?undefined:status(v.status),categoryId:v.categoryId===undefined?undefined:uuid(v.categoryId),sortBy,sortOrder};
}
export function statusInput(value:unknown){const v=record(value);keys(v,['status']);return status(v.status);}
export function priceInput(value:unknown){const v=record(value);keys(v,['sellingPrice']);return price(v.sellingPrice);}
export function batchInput(value:unknown){const v=record(value);keys(v,['productIds']);if(!Array.isArray(v.productIds)||v.productIds.length<1||v.productIds.length>100)return invalid();return v.productIds.map(uuid);}
