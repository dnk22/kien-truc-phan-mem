import { Module } from '@nestjs/common';
import { JwtGuard,RolesGuard } from '@minimart/auth';
import { InventoryProxyService } from './inventory-proxy.service';
import { SupplierProxyController } from './supplier-proxy.controller';
import { ReceiptProxyController } from './receipt-proxy.controller';
import { StockProxyController } from './stock-proxy.controller';
@Module({controllers:[SupplierProxyController,ReceiptProxyController,StockProxyController],providers:[InventoryProxyService,JwtGuard,RolesGuard]})
export class InventoryProxyModule {}
