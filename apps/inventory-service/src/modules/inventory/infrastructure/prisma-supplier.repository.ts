import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { SupplierRepository } from '../domain/inventory.repository';
import type { ListQuery,SupplierInput,SupplierStatus } from '../domain/inventory.types';
import { missing } from '../domain/inventory.errors';
import { inventoryWrite } from './inventory-transaction';
import type { Prisma } from '../../../generated/client';
@Injectable()
export class PrismaSupplierRepository implements SupplierRepository {
 constructor(private readonly db:PrismaService){}
 async list(q:ListQuery,activeOnly:boolean){
  const where:Prisma.SupplierWhereInput={status:activeOnly?'ACTIVE':q.status as SupplierStatus|undefined,OR:q.search?[{code:{contains:q.search,mode:'insensitive'}},{name:{contains:q.search,mode:'insensitive'}}]:undefined};
  const [items,total]=await this.db.$transaction([this.db.supplier.findMany({where,skip:(q.page-1)*q.pageSize,take:q.pageSize,orderBy:[{name:'asc'},{id:'asc'}]}),this.db.supplier.count({where})]);
  return {items,total};
 }
 async get(id:string,activeOnly:boolean){
  const item=await this.db.supplier.findFirst({where:{id,status:activeOnly?'ACTIVE':undefined}});
  if(!item)throw missing('Nhà cung cấp');return item;
 }
 create(input:SupplierInput){return inventoryWrite(this.db,tx=>tx.supplier.create({data:input}));}
 update(id:string,input:Partial<SupplierInput>&{status?:SupplierStatus}){return inventoryWrite(this.db,tx=>tx.supplier.update({where:{id},data:input}));}
}
