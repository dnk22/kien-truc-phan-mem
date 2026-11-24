import { Module } from '@nestjs/common';
import { HealthController, HEALTH_PROBE } from '@minimart/config';
import { DatabaseProbe } from './infrastructure/database/database.probe';
import { SalesModule } from './modules/sales/sales.module';
import { OutboxModule } from './modules/outbox/outbox.module';
@Module({
  imports: [SalesModule, OutboxModule],
  controllers: [HealthController],
  providers: [{ provide: HEALTH_PROBE, useClass: DatabaseProbe }],
})
export class AppModule {}
