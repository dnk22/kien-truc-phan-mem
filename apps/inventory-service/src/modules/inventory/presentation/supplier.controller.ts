import { Body,Controller,Get,Param,ParseUUIDPipe,Patch,Post,Query,Req,UseFilters,UseGuards } from '@nestjs/common';
import { LiveSessionGuard,Roles,RolesGuard } from '@minimart/auth';
import { success } from '@minimart/config';
import { SupplierService } from '../application/supplier.service';
import { listQuery,supplierInput,supplierStatus } from './inventory.validation';
import { InventoryErrorFilter,pageResponse,type InventoryRequest } from './inventory-http';
@Controller('api/v1/suppliers')
@UseGuards(LiveSessionGuard,RolesGuard)
@UseFilters(InventoryErrorFilter)
@Roles('MANAGER','WAREHOUSE')
export class SupplierController {
 constructor(private readonly service:SupplierService){}
 @Get() async list(@Query() query:unknown,@Req() req:InventoryRequest){const q=listQuery(query,'suppliers');return pageResponse(req,q,await this.service.list(q,req.principal.role==='WAREHOUSE'));}
 @Get(':id') async get(@Param('id',ParseUUIDPipe) id:string,@Req() req:InventoryRequest){return success(req,await this.service.get(id,req.principal.role==='WAREHOUSE'));}
 @Post() @Roles('MANAGER') async create(@Body() body:unknown,@Req() req:InventoryRequest){return success(req,await this.service.create(supplierInput(body,false)));}
 @Patch(':id') @Roles('MANAGER') async update(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown,@Req() req:InventoryRequest){return success(req,await this.service.update(id,supplierInput(body,true)));}
 @Patch(':id/status') @Roles('MANAGER') async status(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown,@Req() req:InventoryRequest){return success(req,await this.service.update(id,{status:supplierStatus(body)}));}
}
