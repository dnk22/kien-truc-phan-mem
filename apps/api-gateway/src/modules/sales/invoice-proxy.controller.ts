import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { JwtGuard, Roles, RolesGuard } from '@minimart/auth';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { SalesProxyService } from './sales-proxy.service';
@ApiTags('invoices')
@ApiBearerAuth()
@Controller('api/v1/invoices')
@UseGuards(JwtGuard, RolesGuard)
@Roles('MANAGER', 'CASHIER')
export class InvoiceProxyController {
  constructor(private readonly proxy: SalesProxyService) {}
  @Get() list(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward(req, res);
  }
  @Get(':id') get(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward(req, res);
  }
}
