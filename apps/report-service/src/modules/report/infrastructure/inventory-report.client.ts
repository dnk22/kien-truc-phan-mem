import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { ApiSuccess, InventoryReportSummary } from '@minimart/contracts';
import type { InventoryReportPort } from '../domain/report.repository';
@Injectable()
export class InventoryReportClient implements InventoryReportPort {
  async summary(correlationId?:string):Promise<InventoryReportSummary>{
    try{
      const response=await fetch(new URL('/internal/v1/stock/summary',process.env.INVENTORY_SERVICE_URL??'http://127.0.0.1:3003'),{headers:{'x-service-credential':process.env.SERVICE_CREDENTIAL??'','x-correlation-id':correlationId??''},signal:AbortSignal.timeout(3000),redirect:'error'});
      if(!response.ok)throw new Error('Inventory unavailable');
      const result=await response.json() as ApiSuccess<InventoryReportSummary>;
      if(!result.success||!result.data)throw new Error('Invalid response');
      return result.data;
    }catch{throw new ServiceUnavailableException({code:'INVENTORY_UNAVAILABLE',message:'Không thể tải thống kê kho.'});}
  }
}
