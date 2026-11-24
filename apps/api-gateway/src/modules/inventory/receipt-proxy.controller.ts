import { Controller,Get,Post,Patch,Req,Res,UseGuards } from '@nestjs/common';
import { JwtGuard,Roles,RolesGuard } from '@minimart/auth';
import { ApiBearerAuth,ApiTags } from '@nestjs/swagger';
import type { Request,Response } from 'express';
import { InventoryProxyService } from './inventory-proxy.service';
@ApiTags('purchase-receipts')
@ApiBearerAuth()
@Controller('api/v1/purchase-receipts')
@UseGuards(JwtGuard,RolesGuard)
@Roles('MANAGER','WAREHOUSE')
export class ReceiptProxyController {
 constructor(private readonly proxy:InventoryProxyService){}
 @Get()  list(@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
 @Get(':id')  get(@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
 @Post()  create(@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
 @Patch(':id')  update(@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
 @Post(':id/confirm') @Roles('MANAGER') confirm(@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
 @Post(':id/cancel')  cancel(@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
}
