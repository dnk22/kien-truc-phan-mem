import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { JwtGuard, Roles, RolesGuard } from '@minimart/auth';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { InventoryProxyService } from './inventory-proxy.service';
@ApiTags('inventory')
@ApiBearerAuth()
@Controller('api/v1/inventory')
@UseGuards(JwtGuard, RolesGuard)
@Roles('MANAGER', 'WAREHOUSE', 'CASHIER')
export class StockProxyController {
  constructor(private readonly proxy: InventoryProxyService) {}
  @Get() list(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward(req, res);
  }
  @Get('movements') @Roles('MANAGER', 'WAREHOUSE') movements(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxy.forward(req, res);
  }
  @Get('adjustments') @Roles('MANAGER', 'WAREHOUSE') adjustments(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxy.forward(req, res);
  }
  @Post('adjustments') @Roles('MANAGER', 'WAREHOUSE') createAdjustment(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxy.forward(req, res);
  }
  @Post('adjustments/:id/confirm') @Roles('MANAGER') confirm(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxy.forward(req, res);
  }
  @Post('adjustments/:id/cancel') @Roles('MANAGER', 'WAREHOUSE') cancel(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxy.forward(req, res);
  }
  @Get(':id') get(@Req() req: Request, @Res() res: Response) {
    return this.proxy.forward(req, res);
  }
}
