import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { LiveSessionGuard, Roles, RolesGuard } from '@minimart/auth';
import { success } from '@minimart/config';
import { CheckoutFacade } from '../application/checkout.facade';
import { cartInput, idempotencyKey, paymentInput } from './sales.validation';
import {
  publicInvoice,
  SalesErrorFilter,
  type SalesRequest,
} from './sales-http';
@Controller('api/v1/sales/checkout')
@UseGuards(LiveSessionGuard, RolesGuard)
@UseFilters(SalesErrorFilter)
@Roles('CASHIER')
export class CheckoutController {
  constructor(private readonly facade: CheckoutFacade) {}
  @Post('prepare')
  @HttpCode(200)
  async prepare(
    @Body() body: unknown,
    @Headers('idempotency-key') key: unknown,
    @Req() req: SalesRequest,
  ) {
    return success(
      req,
      publicInvoice(
        await this.facade.prepare(
          req.principal.sub,
          idempotencyKey(key),
          cartInput(body),
          req.correlationId,
        ),
      ),
    );
  }
  @Post(':id/confirm')
  @HttpCode(200)
  async confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
    @Headers('idempotency-key') key: unknown,
    @Req() req: SalesRequest,
  ) {
    return success(
      req,
      publicInvoice(
        await this.facade.confirm(
          id,
          req.principal.sub,
          idempotencyKey(key),
          paymentInput(body),
          req.correlationId,
        ),
      ),
    );
  }
  @Post(':id/cancel')
  @HttpCode(200)
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: SalesRequest,
  ) {
    return success(
      req,
      publicInvoice(
        await this.facade.cancel(id, req.principal.sub, req.correlationId),
      ),
    );
  }
}
