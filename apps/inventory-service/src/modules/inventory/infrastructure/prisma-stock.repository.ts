import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { StockRepository } from '../domain/inventory.repository';
import type { AdjustmentInput,DocumentStatus,ListQuery } from '../domain/inventory.types';
import { InventoryError,missing } from '../domain/inventory.errors';
import { available,assertAdjustment } from '../domain/stock.rules';
import { inventoryWrite } from './inventory-transaction';
import type { Prisma } from '../../../generated/client';
@Injectable()
export class PrismaStockRepository implements StockRepository {
 constructor(private readonly db:PrismaService){}
 async list(q:ListQuery){
  const where:Prisma.InventoryWhereInput={productId:q.productId,OR:q.search?[{productName:{contains:q.search,mode:'insensitive'}},{productCode:{contains:q.search,mode:'insensitive'}}]:undefined};
  // The single-store demo uses bounded DB result pages; low-stock requires comparing columns.
  const rows=await this.db.inventory.findMany({where,orderBy:[{productName:'asc'},{productId:'asc'}]});
  const filtered=rows.filter(row=>!q.lowStock||available(row)<=row.threshold);
  return {items:filtered.slice((q.page-1)*q.pageSize,q.page*q.pageSize).map(row=>({...row,available:available(row)})),total:filtered.length};
 }
 async get(productId:string){
  const row=await this.db.inventory.findUnique({where:{productId}});
  return row?{...row,available:available(row)}:{productId,onHand:0,reserved:0,available:0,version:0,threshold:5};
 }
 async movements(q:ListQuery){
  const where={productId:q.productId};
  const [items,total]=await this.db.$transaction([this.db.stockMovement.findMany({where,skip:(q.page-1)*q.pageSize,take:q.pageSize,orderBy:[{createdAt:'desc'},{id:'asc'}]}),this.db.stockMovement.count({where})]);
  return {items,total};
 }
 async adjustments(q:ListQuery){
  const where={productId:q.productId,status:q.status as DocumentStatus|undefined};
  const [items,total]=await this.db.$transaction([this.db.stockAdjustment.findMany({where,skip:(q.page-1)*q.pageSize,take:q.pageSize,orderBy:[{createdAt:'desc'},{id:'asc'}]}),this.db.stockAdjustment.count({where})]);
  return {items,total};
 }
 createAdjustment(input:AdjustmentInput,actor:string){
  return inventoryWrite(this.db,async tx=>{
   const stock=await tx.inventory.findUnique({where:{productId:input.productId}});
   if(!stock)throw missing('Tồn kho');
   assertAdjustment(stock,input.expectedVersion,input.counted);
   return tx.stockAdjustment.create({data:{...input,createdBy:actor}});
  });
 }
 confirmAdjustment(id:string,actor:string){
  return inventoryWrite(this.db,async tx=>{
   const adjustment=await tx.stockAdjustment.findUnique({where:{id}});
   if(!adjustment)throw missing('Phiếu kiểm kê');
   if(adjustment.status==='CONFIRMED')return adjustment;
   if(adjustment.status!=='DRAFT')throw new InventoryError('ADJUSTMENT_NOT_DRAFT','Phiếu không còn ở trạng thái nháp.');
   const stock=await tx.inventory.findUnique({where:{productId:adjustment.productId}});
   if(!stock)throw missing('Tồn kho');
   assertAdjustment(stock,adjustment.expectedVersion,adjustment.counted);
   const delta=adjustment.counted-stock.onHand;
   await tx.inventory.update({where:{productId:stock.productId},data:{onHand:adjustment.counted,version:{increment:1}}});
   if(delta!==0)await tx.stockMovement.create({data:{productId:stock.productId,referenceId:id,type:delta>0?'ADJUSTMENT_IN':'ADJUSTMENT_OUT',quantity:Math.abs(delta),actorId:actor}});
   return tx.stockAdjustment.update({where:{id},data:{status:'CONFIRMED',confirmedBy:actor,confirmedAt:new Date()}});
  });
 }
 cancelAdjustment(id:string){
  return inventoryWrite(this.db,async tx=>{
   const current=await tx.stockAdjustment.findUnique({where:{id}});
   if(!current)throw missing('Phiếu kiểm kê');
   if(current.status==='CANCELLED')return current;
   if(current.status!=='DRAFT')throw new InventoryError('ADJUSTMENT_NOT_DRAFT','Không thể hủy phiếu đã xác nhận.');
   return tx.stockAdjustment.update({where:{id},data:{status:'CANCELLED'}});
  });
 }
 async summary(){
  const rows=await this.db.inventory.findMany();
  return {productCount:rows.length,onHand:rows.reduce((n,r)=>n+r.onHand,0),reserved:rows.reduce((n,r)=>n+r.reserved,0),available:rows.reduce((n,r)=>n+available(r),0),lowStockCount:rows.filter(r=>available(r)<=r.threshold).length};
 }
}
