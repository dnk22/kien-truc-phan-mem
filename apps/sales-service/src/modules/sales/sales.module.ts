import { Module } from '@nestjs/common';
import { LiveSessionGuard, RolesGuard } from '@minimart/auth';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import {
  INVOICES,
  PRODUCT_DIRECTORY,
  STOCK_PORT,
  PAYMENT_CREATORS,
} from './domain/sales.repository';
import {
  CashPaymentCreator,
  BankTransferPaymentCreator,
} from './domain/payment/payment.creator';
import { PrismaInvoiceRepository } from './infrastructure/prisma-invoice.repository';
import { SalesProductDirectory } from './infrastructure/product-directory.client';
import { InventoryStockClient } from './infrastructure/stock.client';
import { InternalHttpClient } from './infrastructure/internal-http.client';
import { InvoiceService } from './application/invoice.service';
import { PaymentService } from './application/payment.service';
import { CheckoutOrchestrator } from './application/checkout-orchestrator';
import { CheckoutFacade } from './application/checkout.facade';
import { RecoveryWorker } from './application/recovery.worker';
import { CheckoutController } from './presentation/checkout.controller';
import { InvoiceController } from './presentation/invoice.controller';
@Module({
  imports: [DatabaseModule],
  controllers: [CheckoutController, InvoiceController],
  providers: [
    LiveSessionGuard,
    RolesGuard,
    InternalHttpClient,
    InvoiceService,
    PaymentService,
    CheckoutOrchestrator,
    CheckoutFacade,
    RecoveryWorker,
    { provide: INVOICES, useClass: PrismaInvoiceRepository },
    { provide: PRODUCT_DIRECTORY, useClass: SalesProductDirectory },
    { provide: STOCK_PORT, useClass: InventoryStockClient },
    {
      provide: PAYMENT_CREATORS,
      useFactory: () => ({
        CASH: new CashPaymentCreator(),
        BANK_TRANSFER: new BankTransferPaymentCreator(),
      }),
    },
  ],
})
export class SalesModule {}
