import { Inject,Injectable } from '@nestjs/common';
import { SUPPLIERS,type SupplierRepository } from '../domain/inventory.repository';
import type { ListQuery,SupplierInput,SupplierStatus } from '../domain/inventory.types';
@Injectable()
export class SupplierService {
 constructor(@Inject(SUPPLIERS) private readonly repository:SupplierRepository){}
 list(q:ListQuery,activeOnly:boolean){return this.repository.list(q,activeOnly);}
 get(id:string,activeOnly:boolean){return this.repository.get(id,activeOnly);}
 create(input:SupplierInput){return this.repository.create(input);}
 update(id:string,input:Partial<SupplierInput>&{status?:SupplierStatus}){return this.repository.update(id,input);}
}
