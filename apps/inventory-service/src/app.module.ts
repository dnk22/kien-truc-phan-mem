import { Module } from '@nestjs/common';
import { HealthController, HEALTH_PROBE } from '@minimart/config';
import { DatabaseProbe } from './infrastructure/database/database.probe';
import { InventoryModule } from './modules/inventory/inventory.module';
@Module({
  imports: [InventoryModule],
  controllers: [HealthController],
  providers: [{ provide: HEALTH_PROBE, useClass: DatabaseProbe }],
})
export class AppModule {}
