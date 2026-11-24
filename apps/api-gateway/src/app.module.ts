import { Module } from '@nestjs/common';
import { HealthController, HEALTH_PROBE, ProcessProbe } from '@minimart/config';
import { IdentityProxyModule } from './modules/identity/identity-proxy.module';
import { CatalogProxyModule } from './modules/catalog/catalog-proxy.module';
import { InventoryProxyModule } from './modules/inventory/inventory-proxy.module';
@Module({
  imports: [IdentityProxyModule, CatalogProxyModule, InventoryProxyModule],
  controllers: [HealthController],
  providers: [{ provide: HEALTH_PROBE, useClass: ProcessProbe }],
})
export class AppModule {}
