import { Module } from '@nestjs/common';
import { LiveSessionGuard, RolesGuard } from '@minimart/auth';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import {
  PROJECTION,
  REPORTS,
  INVENTORY_REPORT,
} from './domain/report.repository';
import { PrismaProjectionRepository } from './infrastructure/prisma-projection.repository';
import { PrismaReportRepository } from './infrastructure/prisma-report.repository';
import { InventoryReportClient } from './infrastructure/inventory-report.client';
import { RabbitMqConsumer } from './infrastructure/rabbitmq.consumer';
import { SaleProjectionService } from './application/sale-projection.service';
import { ReportService } from './application/report.service';
import { ReportController } from './presentation/report.controller';
@Module({
  imports: [DatabaseModule],
  controllers: [ReportController],
  providers: [
    LiveSessionGuard,
    RolesGuard,
    SaleProjectionService,
    ReportService,
    RabbitMqConsumer,
    { provide: PROJECTION, useClass: PrismaProjectionRepository },
    { provide: REPORTS, useClass: PrismaReportRepository },
    { provide: INVENTORY_REPORT, useClass: InventoryReportClient },
  ],
})
export class ReportModule {}
