import { Module } from '@nestjs/common';
import { HealthController, HEALTH_PROBE } from '@minimart/config';
import { DatabaseProbe } from './infrastructure/database/database.probe';
import { CatalogModule } from './modules/catalog/catalog.module';
@Module({
  imports: [CatalogModule],
  controllers: [HealthController],
  providers: [{ provide: HEALTH_PROBE, useClass: DatabaseProbe }],
})
export class AppModule {}
