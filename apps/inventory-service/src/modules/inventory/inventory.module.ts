import { Module } from '@nestjs/common';
import { LiveSessionGuard,RolesGuard } from '@minimart/auth';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { SUPPLIERS,RECEIPTS,STOCK,RESERVATIONS,PRODUCTS } from './domain/inventory.repository';
import { SupplierService } from './application/supplier.service';
import { ReceiptService } from './application/receipt.service';
import { StockService } from './application/stock.service';
import { ReservationService } from './application/reservation.service';
import { PrismaSupplierRepository } from './infrastructure/prisma-supplier.repository';
import { PrismaReceiptRepository } from './infrastructure/prisma-receipt.repository';
import { PrismaStockRepository } from './infrastructure/prisma-stock.repository';
import { PrismaReservationRepository } from './infrastructure/prisma-reservation.repository';
import { ProductDirectoryClient } from './infrastructure/product-directory.client';
import { SupplierController } from './presentation/supplier.controller';
import { ReceiptController } from './presentation/receipt.controller';
import { StockController } from './presentation/stock.controller';
import { InternalStockController } from './presentation/internal-stock.controller';
@Module({
 imports:[DatabaseModule],
 controllers:[SupplierController,ReceiptController,StockController,InternalStockController],
 providers:[SupplierService,ReceiptService,StockService,ReservationService,LiveSessionGuard,RolesGuard,
 {provide:SUPPLIERS,useClass:PrismaSupplierRepository},{provide:RECEIPTS,useClass:PrismaReceiptRepository},
 {provide:STOCK,useClass:PrismaStockRepository},{provide:RESERVATIONS,useClass:PrismaReservationRepository},{provide:PRODUCTS,useClass:ProductDirectoryClient}]
})
export class InventoryModule {}
