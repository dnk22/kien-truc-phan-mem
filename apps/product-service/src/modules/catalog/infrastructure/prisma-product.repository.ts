import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { ProductRepository, ProductInput, CatalogQuery, CatalogStatus } from '../domain/catalog.repository';
import { CatalogError } from '../domain/catalog.errors';
import { catalogWrite } from './catalog-transaction';
import type { Prisma } from '../../../generated/client';
@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly db: PrismaService) {}
  async list(q: CatalogQuery) {
    const where: Prisma.ProductWhereInput = {status:q.status,categoryId:q.categoryId,OR:q.search?[{name:{contains:q.search,mode:'insensitive'}},{code:{contains:q.search,mode:'insensitive'}},{barcode:{contains:q.search,mode:'insensitive'}}]:undefined};
    const [items,total] = await this.db.$transaction([this.db.product.findMany({where,skip:(q.page-1)*q.pageSize,take:q.pageSize,orderBy:[{[q.sortBy]:q.sortOrder},{id:'asc'}]}),this.db.product.count({where})]);
    return {items,total};
  }
  get(id:string) { return this.db.product.findUnique({where:{id}}); }
  batch(ids:string[]) { return this.db.product.findMany({where:{id:{in:ids}}}); }
  private async checkCategory(tx:Prisma.TransactionClient,id:string,status:CatalogStatus) {
    const category=await tx.category.findUnique({where:{id}});
    if(!category) throw new CatalogError('CATEGORY_NOT_FOUND','Danh mục không tồn tại.',404);
    if(status==='ACTIVE' && category.status!=='ACTIVE') throw new CatalogError('CATEGORY_INACTIVE','Danh mục ngừng hoạt động.');
  }
  create(input:ProductInput) {
    return catalogWrite(this.db,async tx=>{
      await this.checkCategory(tx,input.categoryId,'ACTIVE');
      return tx.product.create({data:input});
    });
  }
  update(id:string,input:Partial<ProductInput>&{status?:CatalogStatus}) {
    return catalogWrite(this.db,async tx=>{
      const current=await tx.product.findUnique({where:{id}});
      if(!current) throw new CatalogError('PRODUCT_NOT_FOUND','Sản phẩm không tồn tại.',404);
      await this.checkCategory(tx,input.categoryId??current.categoryId,input.status??current.status);
      return tx.product.update({where:{id},data:input});
    });
  }
}
