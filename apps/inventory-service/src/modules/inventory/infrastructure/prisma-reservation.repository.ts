import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { ReservationRepository } from '../domain/inventory.repository';
import type { ReservationInput } from '../domain/inventory.types';
import { InventoryError, missing } from '../domain/inventory.errors';
import { assertAvailable, sameItems } from '../domain/stock.rules';
import { inventoryWrite } from './inventory-transaction';
const include = { items: true } as const;
@Injectable()
export class PrismaReservationRepository implements ReservationRepository {
  constructor(private readonly db: PrismaService) {}
  reserve(input: ReservationInput) {
    return inventoryWrite(this.db, async (tx) => {
      const prior = await tx.stockReservation.findUnique({
        where: { invoiceId: input.invoiceId },
        include,
      });
      if (prior) {
        if (!sameItems(prior.items, input.items))
          throw new InventoryError(
            'RESERVATION_PAYLOAD_CONFLICT',
            'Giữ hàng đã tồn tại với dữ liệu khác.',
          );
        return prior;
      }
      const items = [...input.items].sort((a, b) =>
        a.productId.localeCompare(b.productId),
      );
      for (const item of items) {
        const stock = await tx.inventory.findUnique({
          where: { productId: item.productId },
        });
        assertAvailable(stock, item.quantity);
        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            reserved: { increment: item.quantity },
            version: { increment: 1 },
          },
        });
      }
      return tx.stockReservation.create({
        data: { invoiceId: input.invoiceId, items: { create: items } },
        include,
      });
    });
  }
  async get(id: string) {
    const result = await this.db.stockReservation.findUnique({
      where: { id },
      include,
    });
    if (!result) throw missing('Giữ hàng');
    return result;
  }
  async byInvoice(invoiceId: string) {
    const result = await this.db.stockReservation.findUnique({
      where: { invoiceId },
      include,
    });
    if (!result) throw missing('Giữ hàng');
    return result;
  }
  transition(id: string, action: 'COMMITTED' | 'RELEASED', actorId?: string) {
    return inventoryWrite(this.db, async (tx) => {
      const reservation = await tx.stockReservation.findUnique({
        where: { id },
        include,
      });
      if (!reservation) throw missing('Giữ hàng');
      if (reservation.status === action) return reservation;
      if (reservation.status !== 'RESERVED')
        throw new InventoryError(
          'RESERVATION_STATE_CONFLICT',
          'Giữ hàng đã kết thúc.',
        );
      for (const item of reservation.items) {
        const stock = await tx.inventory.findUnique({
          where: { productId: item.productId },
        });
        if (
          !stock ||
          stock.reserved < item.quantity ||
          stock.onHand < item.quantity
        )
          throw new InventoryError(
            'STOCK_INVARIANT',
            'Dữ liệu giữ hàng không nhất quán.',
          );
        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            reserved: { decrement: item.quantity },
            onHand:
              action === 'COMMITTED' ? { decrement: item.quantity } : undefined,
            version: { increment: 1 },
          },
        });
        if (action === 'COMMITTED')
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              referenceId: reservation.invoiceId,
              type: 'SALE',
              actorId,
              quantity: item.quantity,
            },
          });
      }
      return tx.stockReservation.update({
        where: { id },
        data: { status: action },
        include,
      });
    });
  }
}
