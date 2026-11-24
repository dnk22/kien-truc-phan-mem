import { Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { JwtGuard, Roles, RolesGuard } from '@minimart/auth';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { SalesProxyService } from './sales-proxy.service';
@ApiTags('checkout')
@ApiBearerAuth()
@Controller('api/v1/sales/checkout')
@UseGuards(JwtGuard, RolesGuard)
@Roles('CASHIER')
export class CheckoutProxyController {
  constructor(private readonly proxy: SalesProxyService) {}
  @Post('prepare') prepare(@Req() req: Request, @Res() res: Response) { return this.proxy.forward(req, res); }
  @Post(':id/confirm') confirm(@Req() req: Request, @Res() res: Response) { return this.proxy.forward(req, res); }
  @Post(':id/cancel') cancel(@Req() req: Request, @Res() res: Response) { return this.proxy.forward(req, res); }
}
