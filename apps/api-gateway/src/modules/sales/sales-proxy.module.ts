import { Module } from '@nestjs/common';
import { JwtGuard, RolesGuard } from '@minimart/auth';
import { SalesProxyService } from './sales-proxy.service';
import { CheckoutProxyController } from './checkout-proxy.controller';
import { InvoiceProxyController } from './invoice-proxy.controller';
@Module({ controllers: [CheckoutProxyController, InvoiceProxyController], providers: [SalesProxyService, JwtGuard, RolesGuard] })
export class SalesProxyModule {}
