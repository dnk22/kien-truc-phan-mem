import { Module } from '@nestjs/common';
import { JwtGuard, RolesGuard } from '@minimart/auth';
import { CatalogProxyService } from './catalog-proxy.service';
import { CategoriesProxyController } from './categories-proxy.controller';
import { ProductsProxyController } from './products-proxy.controller';
@Module({
  controllers: [CategoriesProxyController, ProductsProxyController],
  providers: [CatalogProxyService, JwtGuard, RolesGuard],
})
export class CatalogProxyModule {}
