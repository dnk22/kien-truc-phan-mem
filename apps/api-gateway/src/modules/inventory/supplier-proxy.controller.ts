import { Controller,Get,Post,Patch,Req,Res,UseGuards } from '@nestjs/common';
import { JwtGuard,Roles,RolesGuard } from '@minimart/auth';
import { ApiBearerAuth,ApiTags } from '@nestjs/swagger';
import type { Request,Response } from 'express';
import { InventoryProxyService } from './inventory-proxy.service';
@ApiTags('suppliers')
@ApiBearerAuth()
@Controller('api/v1/suppliers')
@UseGuards(JwtGuard,RolesGuard)
@Roles('MANAGER','WAREHOUSE')
export class SupplierProxyController {
 constructor(private readonly proxy:InventoryProxyService){}
 @Get()  list(@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
 @Get(':id')  get(@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
 @Post() @Roles('MANAGER') create(@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
 @Patch(':id') @Roles('MANAGER') update(@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
 @Patch(':id/status') @Roles('MANAGER') status(@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
}
