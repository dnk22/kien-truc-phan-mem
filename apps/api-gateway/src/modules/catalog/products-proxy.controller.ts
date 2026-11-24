import { Controller, Get, Post, Patch, Param, ParseUUIDPipe, Req, Res, UseGuards } from '@nestjs/common';
import { JwtGuard, Roles, RolesGuard } from '@minimart/auth';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CatalogProxyService } from './catalog-proxy.service';
@ApiTags('products')
@ApiBearerAuth()
@Controller('api/v1/products')
@UseGuards(JwtGuard,RolesGuard)
@Roles('MANAGER','CASHIER','WAREHOUSE')
export class ProductsProxyController {
 constructor(private readonly proxy:CatalogProxyService){}
 @Get() list(@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
 @Get(':id') get(@Param('id',ParseUUIDPipe) _id:string,@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
 @Post() @Roles('MANAGER') create(@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
 @Patch(':id') @Roles('MANAGER') update(@Param('id',ParseUUIDPipe) _id:string,@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
 @Patch(':id/status') @Roles('MANAGER') status(@Param('id',ParseUUIDPipe) _id:string,@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
 @Patch(':id/price') @Roles('MANAGER') price(@Param('id',ParseUUIDPipe) _id:string,@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
}
