import { Module } from '@nestjs/common';
import { RolesGuard } from '@minimart/auth';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CATEGORY_REPOSITORY, PRODUCT_REPOSITORY } from './domain/catalog.repository';
import { CategoryService } from './application/category.service';
import { ProductService } from './application/product.service';
import { PrismaCategoryRepository } from './infrastructure/prisma-category.repository';
import { PrismaProductRepository } from './infrastructure/prisma-product.repository';
import { CategoryController } from './presentation/category.controller';
import { ProductController } from './presentation/product.controller';
import { InternalProductController } from './presentation/internal-product.controller';
import { CatalogSessionGuard } from './presentation/catalog-session.guard';
@Module({imports:[DatabaseModule],controllers:[CategoryController,ProductController,InternalProductController],providers:[CategoryService,ProductService,CatalogSessionGuard,RolesGuard,{provide:CATEGORY_REPOSITORY,useClass:PrismaCategoryRepository},{provide:PRODUCT_REPOSITORY,useClass:PrismaProductRepository}]})
export class CatalogModule {}
