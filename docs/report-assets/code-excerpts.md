# Code excerpts từ source thực tế

HEAD fe96c3eda789f8d88ea9482c8fe7fe82a02a7ca1. Mỗi khối là đoạn nguyên văn (không phải file độc lập), không thêm dấu ba chấm hoặc sửa định dạng code. Line numbers1-based. Trạng thái test là lịch sử FINAL-2; source file hiện tại khớp HEAD và SHA256. Chỉ gán đóng góp thành viên khi có xác nhận riêng.

## Factory Method

Source: [apps/sales-service/src/modules/sales/domain/payment/payment.creator.ts](../../apps/sales-service/src/modules/sales/domain/payment/payment.creator.ts), lines 1–17.

```ts
import type { PaymentStrategy } from './payment.strategy';
import { CashPaymentStrategy } from './cash-payment.strategy';
import { BankTransferStrategy } from './bank-transfer.strategy';

export abstract class PaymentCreator {
  abstract create(): PaymentStrategy;
}
export class CashPaymentCreator extends PaymentCreator {
  create(): PaymentStrategy {
    return new CashPaymentStrategy();
  }
}
export class BankTransferPaymentCreator extends PaymentCreator {
  create(): PaymentStrategy {
    return new BankTransferStrategy();
  }
}
```

## Strategy — cash

Source: [apps/sales-service/src/modules/sales/domain/payment/cash-payment.strategy.ts](../../apps/sales-service/src/modules/sales/domain/payment/cash-payment.strategy.ts), lines 5–19.

```ts
  process(request: PaymentRequest, totalAmount: number): PaymentResult {
    const received = request.amountReceived;
    if (
      !Number.isSafeInteger(received) ||
      received === undefined ||
      received < totalAmount
    )
      throw new SalesError('INSUFFICIENT_CASH', 'Tiền khách đưa chưa đủ.', 400);
    return {
      method: 'CASH',
      amountReceived: received,
      changeAmount: received - totalAmount,
    };
  }
}
```

## Builder — validation snapshot

Source: [apps/sales-service/src/modules/sales/domain/invoice.builder.ts](../../apps/sales-service/src/modules/sales/domain/invoice.builder.ts), lines 16–40.

```ts
  build(): InvoiceDraft {
    if (!this.cashierId || !this.items.length || this.items.length > 100)
      throw new SalesError('INVALID_INVOICE', 'Hóa đơn không hợp lệ.', 400);
    const ids = new Set<string>();
    let totalAmount = 0;
    for (const item of this.items) {
      if (
        ids.has(item.productId) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 2147483647 ||
        ![item.productId, item.productCode, item.productName, item.unit].every(
          (value) => typeof value === 'string' && value.trim().length > 0,
        ) ||
        !Number.isSafeInteger(item.unitPrice) ||
        item.unitPrice < 1 ||
        !Number.isSafeInteger(item.subtotal) ||
        item.subtotal !== item.unitPrice * item.quantity
      )
        throw new SalesError(
          'INVALID_INVOICE_ITEM',
          'Dòng hóa đơn không hợp lệ.',
          400,
        );
      ids.add(item.productId);
```

## Facade — confirm/cancel

Source: [apps/sales-service/src/modules/sales/application/checkout.facade.ts](../../apps/sales-service/src/modules/sales/application/checkout.facade.ts), lines 34–47.

```ts
  async confirm(
    id: string,
    actor: string,
    key: string,
    request: PaymentRequest,
    correlationId?: string,
  ) {
    await this.payments.confirm(id, actor, key, request);
    return this.orchestrator.advance(id, correlationId);
  }
  async cancel(id: string, actor: string, correlationId?: string) {
    await this.invoices.cancel(id, actor);
    return this.orchestrator.advance(id, correlationId);
  }
```

## Saga — reconcile COMMIT

Source: [apps/sales-service/src/modules/sales/application/checkout-orchestrator.ts](../../apps/sales-service/src/modules/sales/application/checkout-orchestrator.ts), lines 82–100.

```ts
      if (!reservation || reservation.id !== invoice.reservationId)
        throw new SalesError('RESERVATION_MISSING', 'Cần đối soát giữ hàng.');
      if (intent === 'COMMIT') {
        if (reservation.status === 'RESERVED')
          reservation = await this.stock.commit(
            reservation.id,
            correlationId,
            invoice.cashierId,
          );
        this.expectState(reservation, 'COMMITTED');
        return await this.invoices.complete(id);
      }
      if (reservation.status === 'RESERVED')
        reservation = await this.stock.release(reservation.id, correlationId);
      this.expectState(reservation, 'RELEASED');
      return await this.invoices.cancelled(id);
    } catch (error) {
      const code = (error as { code?: string }).code ?? 'SAGA_OUTCOME_UNKNOWN';
      return this.invoices.defer(id, intent, code);
```

## COMPLETED + Outbox atomic

Source: [apps/sales-service/src/modules/sales/infrastructure/prisma-invoice.repository.ts](../../apps/sales-service/src/modules/sales/infrastructure/prisma-invoice.repository.ts), lines 221–230.

```ts
      await tx.outboxEvent.create({
        data: { id: eventId, eventType: 'sale.completed.v1', payload },
      });
      return this.patch(tx, id, {
        status: 'COMPLETED',
        sagaIntent: 'NONE',
        completedAt,
        lastError: null,
      });
    });
```

## Idempotent projection

Source: [apps/report-service/src/modules/report/infrastructure/prisma-projection.repository.ts](../../apps/report-service/src/modules/report/infrastructure/prisma-projection.repository.ts), lines 11–35.

```ts
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
```

## Inventory advisory lock

Source: [apps/inventory-service/src/modules/inventory/infrastructure/inventory-transaction.ts](../../apps/inventory-service/src/modules/inventory/infrastructure/inventory-transaction.ts), lines 4–16.

```ts
export async function inventoryWrite<T>(
  db: PrismaService,
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  try {
    return await db.$transaction(
      async (tx) => {
        // One inventory writer at a time in V1 (single store). No HTTP inside this transaction.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(2026112403)`;
        return work(tx);
      },
      { maxWait: 5000, timeout: 10000 },
    );
```
