import { Injectable,ServiceUnavailableException } from '@nestjs/common';
import type { ProductDirectory,ProductLookup } from '../domain/inventory.repository';
import type { ApiSuccess,ProductBatchResult } from '@minimart/contracts';
@Injectable()
export class ProductDirectoryClient implements ProductDirectory {
 async batch(ids:string[]):Promise<ProductLookup[]>{
  try{
   const response=await fetch(new URL('/internal/v1/products/batch',process.env.PRODUCT_SERVICE_URL??'http://127.0.0.1:3002'),{method:'POST',headers:{'content-type':'application/json','x-service-credential':process.env.SERVICE_CREDENTIAL??''},body:JSON.stringify({productIds:ids}),signal:AbortSignal.timeout(5000),redirect:'error'});
   if(!response.ok)throw new Error('Product lookup failed');
   const result=await response.json() as ApiSuccess<ProductBatchResult>;
   if(!result.success||!Array.isArray(result.data.items))throw new Error('Invalid product response');
   return result.data.items;
  }catch{throw new ServiceUnavailableException({code:'PRODUCT_UNAVAILABLE',message:'Không thể kiểm tra sản phẩm.'});}
 }
}
