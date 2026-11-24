import { Body,Controller,Get,Param,ParseUUIDPipe,Post,Query,Req,UseFilters,UseGuards } from '@nestjs/common';
import { LiveSessionGuard,Roles,RolesGuard } from '@minimart/auth';
import { success } from '@minimart/config';
import { StockService } from '../application/stock.service';
import { adjustmentInput,listQuery } from './inventory.validation';
import { InventoryErrorFilter,pageResponse,type InventoryRequest } from './inventory-http';
@Controller('api/v1/inventory')
@UseGuards(LiveSessionGuard,RolesGuard)
@UseFilters(InventoryErrorFilter)
@Roles('MANAGER','WAREHOUSE','CASHIER')
export class StockController {
 constructor(private readonly service:StockService){}
 @Get() async list(@Query() query:unknown,@Req() req:InventoryRequest){const q=listQuery(query,'stock');return pageResponse(req,q,await this.service.list(q));}
 @Get('movements') @Roles('MANAGER','WAREHOUSE') async movements(@Query() query:unknown,@Req() req:InventoryRequest){const q=listQuery(query,'movements');return pageResponse(req,q,await this.service.movements(q));}
 @Get('adjustments') @Roles('MANAGER','WAREHOUSE') async adjustments(@Query() query:unknown,@Req() req:InventoryRequest){const q=listQuery(query,'adjustments');return pageResponse(req,q,await this.service.adjustments(q));}
 @Post('adjustments') @Roles('MANAGER','WAREHOUSE') async createAdjustment(@Body() body:unknown,@Req() req:InventoryRequest){return success(req,await this.service.createAdjustment(adjustmentInput(body),req.principal.sub));}
 @Post('adjustments/:id/confirm') @Roles('MANAGER') async confirm(@Param('id',ParseUUIDPipe) id:string,@Req() req:InventoryRequest){return success(req,await this.service.confirmAdjustment(id,req.principal.sub));}
 @Post('adjustments/:id/cancel') @Roles('MANAGER','WAREHOUSE') async cancel(@Param('id',ParseUUIDPipe) id:string,@Req() req:InventoryRequest){return success(req,await this.service.cancelAdjustment(id));}
 @Get(':productId') async get(@Param('productId',ParseUUIDPipe) id:string,@Req() req:InventoryRequest){return success(req,await this.service.get(id));}
}
