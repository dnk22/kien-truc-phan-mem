import { Injectable } from '@nestjs/common';
import type { SaleCompletedEvent } from '@minimart/contracts';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { ProjectionRepository } from '../domain/report.repository';
@Injectable()
export class PrismaProjectionRepository implements ProjectionRepository {
  constructor(private readonly db: PrismaService) {}
  async apply(event: SaleCompletedEvent) {
    await this.db.$transaction(async (tx) => {
      // Both keys are unique. createMany skipDuplicates maps to ON CONFLICT DO NOTHING.
      const processed = await tx.processedEvent.createMany({
        data: [{ eventId: event.eventId }],
        skipDuplicates: true,
      });
      if (!processed.count) return;
      const p = event.payload;
      const fact = await tx.salesFact.createMany({
        data: [
          {
            invoiceId: p.invoiceId,
            invoiceCode: p.invoiceCode,
            cashierId: p.cashierId,
            totalAmount: BigInt(p.totalAmount),
            paymentMethod: p.paymentMethod,
            completedAt: new Date(p.completedAt),
          },
        ],
        skipDuplicates: true,
      });
      if (!fact.count) return;
      await tx.salesItemFact.createMany({
        data: p.items.map((i) => ({
          invoiceId: p.invoiceId,
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: BigInt(i.unitPrice),
          subtotal: BigInt(i.subtotal),
        })),
      });
    });
  }
}
