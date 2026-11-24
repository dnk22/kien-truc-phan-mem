import { ProductService } from './product.service';
import type { ProductRepository, ProductRecord } from '../domain/catalog.repository';
describe('ProductService batch',()=>{
 it('deduplicates ids, reports missing ids and retains inactive records',async()=>{
  const item:ProductRecord={id:'p1',code:'P1',name:'Product',categoryId:'c1',unit:'Hộp',sellingPrice:100,status:'INACTIVE',createdAt:new Date(),updatedAt:new Date()};
  const repository:ProductRepository={list:jest.fn(),get:jest.fn(),create:jest.fn(),update:jest.fn(),batch:jest.fn().mockResolvedValue([item])};
  const service=new ProductService(repository);
  expect(await service.batch(['p1','p1','p2'])).toEqual({items:[item],missingIds:['p2']});
  expect(repository.batch).toHaveBeenCalledWith(['p1','p2']);
 });
});
