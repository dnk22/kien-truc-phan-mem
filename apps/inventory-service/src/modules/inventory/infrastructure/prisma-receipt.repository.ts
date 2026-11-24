import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { ReceiptRepository } from '../domain/inventory.repository';
import type {
  DocumentStatus,
  ListQuery,
  ReceiptInput,
  ReceiptSnapshot,
} from '../domain/inventory.types';
import { InventoryError, missing } from '../domain/inventory.errors';
import { inventoryWrite } from './inventory-transaction';
import type { Prisma } from '../../../generated/client';
const include = { items: true, supplier: true } as const;
@Injectable()
export class PrismaReceiptRepository implements ReceiptRepository {
  constructor(private readonly db: PrismaService) {}
  async list(q: ListQuery) {
    const where: Prisma.PurchaseReceiptWhereInput = {
      supplierId: q.supplierId,
      status: q.status as DocumentStatus | undefined,
    };
    const [items, total] = await this.db.$transaction([
      this.db.purchaseReceipt.findMany({
        where,
        include,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      }),
      this.db.purchaseReceipt.count({ where }),
    ]);
    return { items, total };
  }
  async get(id: string) {
    const item = await this.db.purchaseReceipt.findUnique({
      where: { id },
      include,
    });
    if (!item) throw missing('Phiếu nhập');
    return item;
  }
  private async checkSupplier(tx: Prisma.TransactionClient, id: string) {
    const supplier = await tx.supplier.findUnique({ where: { id } });
    if (!supplier) throw missing('Nhà cung cấp');
    if (supplier.status !== 'ACTIVE')
      throw new InventoryError(
        'SUPPLIER_INACTIVE',
        'Nhà cung cấp ngừng hoạt động.',
      );
  }
  create(input: ReceiptInput, items: ReceiptSnapshot[], actor: string) {
    return inventoryWrite(this.db, async (tx) => {
      await this.checkSupplier(tx, input.supplierId);
      return tx.purchaseReceipt.create({
        data: {
          supplierId: input.supplierId,
          createdBy: actor,
          items: { create: items },
        },
        include,
      });
    });
  }
  update(id: string, input: ReceiptInput, items: ReceiptSnapshot[]) {
    return inventoryWrite(this.db, async (tx) => {
      const current = await tx.purchaseReceipt.findUnique({ where: { id } });
      if (!current) throw missing('Phiếu nhập');
      if (current.status !== 'DRAFT')
        throw new InventoryError('RECEIPT_NOT_DRAFT', 'Chỉ sửa phiếu nháp.');
      await this.checkSupplier(tx, input.supplierId);
      await tx.purchaseReceiptItem.deleteMany({ where: { receiptId: id } });
      return tx.purchaseReceipt.update({
        where: { id },
        data: { supplierId: input.supplierId, items: { create: items } },
        include,
      });
    });
  }
  confirm(id: string, actor: string) {
    return inventoryWrite(this.db, async (tx) => {
      const receipt = await tx.purchaseReceipt.findUnique({
        where: { id },
        include,
      });
      if (!receipt) throw missing('Phiếu nhập');
      if (receipt.status === 'CONFIRMED') return receipt;
      if (receipt.status !== 'DRAFT')
        throw new InventoryError('RECEIPT_NOT_DRAFT', 'Phiếu đã hủy.');
      await this.checkSupplier(tx, receipt.supplierId);
      for (const item of receipt.items) {
        await tx.inventory.upsert({
          where: { productId: item.productId },
          create: {
            productId: item.productId,
            productCode: item.productCode,
            productName: item.productName,
            onHand: item.quantity,
            version: 1,
          },
          update: {
            onHand: { increment: item.quantity },
            version: { increment: 1 },
            productCode: item.productCode,
            productName: item.productName,
          },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            referenceId: id,
            type: 'PURCHASE',
            quantity: item.quantity,
            actorId: actor,
          },
        });
      }
      return tx.purchaseReceipt.update({
        where: { id },
        data: {
          status: 'CONFIRMED',
          confirmedBy: actor,
          confirmedAt: new Date(),
        },
        include,
      });
    });
  }
  cancel(id: string) {
    return inventoryWrite(this.db, async (tx) => {
      const current = await tx.purchaseReceipt.findUnique({
        where: { id },
        include,
      });
      if (!current) throw missing('Phiếu nhập');
      if (current.status === 'CANCELLED') return current;
      if (current.status !== 'DRAFT')
        throw new InventoryError(
          'RECEIPT_NOT_DRAFT',
          'Không thể hủy phiếu đã xác nhận.',
        );
      return tx.purchaseReceipt.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include,
      });
    });
  }
}
