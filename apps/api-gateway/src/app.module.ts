import { Module } from '@nestjs/common';
import { HealthController, HEALTH_PROBE, ProcessProbe } from '@minimart/config';
import { IdentityProxyModule } from './modules/identity/identity-proxy.module';
import { CatalogProxyModule } from './modules/catalog/catalog-proxy.module';
import { InventoryProxyModule } from './modules/inventory/inventory-proxy.module';
import { SalesProxyModule } from './modules/sales/sales-proxy.module';
import { ReportProxyModule } from './modules/report/report-proxy.module';
@Module({
  imports: [
    IdentityProxyModule,
    CatalogProxyModule,
    InventoryProxyModule,
    SalesProxyModule,
    ReportProxyModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: HEALTH_PROBE, useClass: ProcessProbe }],
})
export class AppModule {}
