import { Inject, Injectable } from '@nestjs/common';
import { PRODUCT_REPOSITORY, type ProductRepository, type ProductInput, type CatalogQuery, type CatalogStatus } from '../domain/catalog.repository';
import { CatalogError } from '../domain/catalog.errors';
@Injectable()
export class ProductService {
  constructor(@Inject(PRODUCT_REPOSITORY) private readonly repository:ProductRepository) {}
  list(q:CatalogQuery){return this.repository.list(q);}
  async get(id:string){const result=await this.repository.get(id);if(!result)throw new CatalogError('PRODUCT_NOT_FOUND','Sản phẩm không tồn tại.',404);return result;}
  create(input:ProductInput){return this.repository.create(input);}
  update(id:string,input:Partial<ProductInput>&{status?:CatalogStatus}){return this.repository.update(id,input);}
  async batch(ids:string[]){
    const unique=[...new Set(ids)];
    const items=await this.repository.batch(unique);
    const found=new Set(items.map(item=>item.id));
    return {items,missingIds:unique.filter(id=>!found.has(id))};
  }
}
