import { Body,Controller,Get,Param,ParseUUIDPipe,Patch,Post,Query,Req,UseFilters,UseGuards } from '@nestjs/common';
import { LiveSessionGuard,Roles,RolesGuard } from '@minimart/auth';
import { success } from '@minimart/config';
import { ReceiptService } from '../application/receipt.service';
import { listQuery,receiptInput } from './inventory.validation';
import { InventoryErrorFilter,pageResponse,type InventoryRequest } from './inventory-http';
@Controller('api/v1/purchase-receipts')
@UseGuards(LiveSessionGuard,RolesGuard)
@UseFilters(InventoryErrorFilter)
@Roles('MANAGER','WAREHOUSE')
export class ReceiptController {
 constructor(private readonly service:ReceiptService){}
 @Get() async list(@Query() query:unknown,@Req() req:InventoryRequest){const q=listQuery(query,'receipts');return pageResponse(req,q,await this.service.list(q));}
 @Get(':id') async get(@Param('id',ParseUUIDPipe) id:string,@Req() req:InventoryRequest){return success(req,await this.service.get(id));}
 @Post() async create(@Body() body:unknown,@Req() req:InventoryRequest){return success(req,await this.service.create(receiptInput(body),req.principal.sub));}
 @Patch(':id') async update(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown,@Req() req:InventoryRequest){return success(req,await this.service.update(id,receiptInput(body)));}
 @Post(':id/confirm') @Roles('MANAGER') async confirm(@Param('id',ParseUUIDPipe) id:string,@Req() req:InventoryRequest){return success(req,await this.service.confirm(id,req.principal.sub));}
 @Post(':id/cancel') async cancel(@Param('id',ParseUUIDPipe) id:string,@Req() req:InventoryRequest){return success(req,await this.service.cancel(id));}
}
