import { Controller,Get,Req,Res,UseGuards } from '@nestjs/common';
import { JwtGuard,Roles,RolesGuard } from '@minimart/auth';
import { ApiBearerAuth,ApiTags } from '@nestjs/swagger';
import type { Request,Response } from 'express';
import { ReportProxyService } from './report-proxy.service';
@ApiTags('reports')
@ApiBearerAuth()
@Controller('api/v1/reports')
@UseGuards(JwtGuard,RolesGuard)
@Roles('MANAGER')
export class ReportProxyController {
 constructor(private readonly proxy:ReportProxyService){}
 @Get('revenue') revenue(@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
 @Get('inventory') inventory(@Req() req:Request,@Res() res:Response){return this.proxy.forward(req,res);}
}
