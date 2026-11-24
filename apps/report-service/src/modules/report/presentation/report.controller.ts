import { BadRequestException,Controller,Get,Query,Req,UseGuards } from '@nestjs/common';
import { LiveSessionGuard,Roles,RolesGuard } from '@minimart/auth';
import { success } from '@minimart/config';
import { ReportService } from '../application/report.service';
import { reportPeriod } from '../domain/report-period';
@Controller('api/v1/reports')
@UseGuards(LiveSessionGuard,RolesGuard)
@Roles('MANAGER')
export class ReportController {
  constructor(private readonly service:ReportService){}
  @Get('revenue')
  async revenue(@Query() q:Record<string,unknown>,@Req() req:{correlationId?:string}){
    let period;
    try{
      if(Object.keys(q).some(k=>!['from','to'].includes(k))||typeof q.from!=='string'||typeof q.to!=='string')throw new Error('range');
      period=reportPeriod(q.from,q.to);
    }catch{throw new BadRequestException({code:'INVALID_REPORT_PERIOD',message:'Chọn khoảng ngày hợp lệ, tối đa 366 ngày.'});}
    return success(req,await this.service.revenue(period));
  }
  @Get('inventory')
  async stock(@Req() req:{correlationId?:string}){return success(req,await this.service.stock(req.correlationId));}
}
