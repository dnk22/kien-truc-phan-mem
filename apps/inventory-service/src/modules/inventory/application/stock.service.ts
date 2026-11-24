import { Inject,Injectable } from '@nestjs/common';
import { STOCK,type StockRepository } from '../domain/inventory.repository';
import type { AdjustmentInput,ListQuery } from '../domain/inventory.types';
@Injectable()
export class StockService {
 constructor(@Inject(STOCK) private readonly repository:StockRepository){}
 list(q:ListQuery){return this.repository.list(q);}
 get(id:string){return this.repository.get(id);}
 movements(q:ListQuery){return this.repository.movements(q);}
 adjustments(q:ListQuery){return this.repository.adjustments(q);}
 createAdjustment(input:AdjustmentInput,actor:string){return this.repository.createAdjustment(input,actor);}
 confirmAdjustment(id:string,actor:string){return this.repository.confirmAdjustment(id,actor);}
 cancelAdjustment(id:string){return this.repository.cancelAdjustment(id);}
 summary(){return this.repository.summary();}
}
