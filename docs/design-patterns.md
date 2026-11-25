# Bốn GoF patterns — implementation và evidence FINAL-3

Mọi đoạn code dưới đây nguyên văn từ HEAD fe96c3e. [Excerpt manifest](report-assets/code-excerpts.json) ghi đầy đủ source/hash/line range. Unit test PASS là kết quả lịch sử FINAL-2 trong [quality-gates.log](evidence/final/quality-gates.log), không chạy lại trên working tree FINAL-3.

## Factory Method

Vấn đề: Chọn cách tạo payment strategy theo phương thức mà không nhúng nhánh cash/bank trong orchestration.

Ý tưởng, vai trò và luồng: PaymentCreator là abstract creator; CashPaymentCreator và BankTransferPaymentCreator override create(). SalesModule đăng ký creators; PaymentService chọn theo request.method rồi gọi create().

Ưu điểm và giới hạn: Thêm creator/strategy riêng cho phương thức mới; registry vẫn cần cấu hình. Hai phương thức hiện tại làm tăng số class, phù hợp ví dụ GoF có phạm vi nhỏ.

Nguồn: [apps/sales-service/src/modules/sales/domain/payment/payment.creator.ts](../apps/sales-service/src/modules/sales/domain/payment/payment.creator.ts), dòng 1–17.

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

Unit test: [domain/payment/payment.spec.ts](../apps/sales-service/src/modules/sales/domain/payment/payment.spec.ts); kiểm tra creators/strategy, Builder hoặc thứ tự Facade tương ứng. Lịch sử Jest PASS (tổng24 suites/65 tests bao gồm6 mocked health); luồng nghiệp vụ có A10/U03/U04/U08 hỗ trợ nhưng không thay unit test.

UML: [source](uml/final3-gof-factory.puml), [SVG](uml/rendered/svg/final3-gof-factory.svg), [PNG](uml/rendered/png/final3-gof-factory.png); render và visual review PASS.

## Strategy

Vấn đề: Cash cần kiểm tra tiền đủ và tính tiền thừa; transfer cần người dùng xác nhận đã nhận tiền.

Ý tưởng, vai trò và luồng: PaymentStrategy.process(request,totalAmount) là contract; CashPaymentStrategy và BankTransferStrategy hiện thực hai thuật toán. Creator tạo strategy tại runtime, PaymentService gọi process trước persistence.

Ưu điểm và giới hạn: Validation/thuật toán dễ kiểm thử độc lập. Transfer là xác nhận thủ công, không API ngân hàng và không bảo đảm nhận tiền ngoài hệ thống.

Nguồn: [apps/sales-service/src/modules/sales/domain/payment/cash-payment.strategy.ts](../apps/sales-service/src/modules/sales/domain/payment/cash-payment.strategy.ts), dòng 5–19.

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

Unit test: [domain/payment/payment.spec.ts](../apps/sales-service/src/modules/sales/domain/payment/payment.spec.ts); kiểm tra creators/strategy, Builder hoặc thứ tự Facade tương ứng. Lịch sử Jest PASS (tổng24 suites/65 tests bao gồm6 mocked health); luồng nghiệp vụ có A10/U03/U04/U08 hỗ trợ nhưng không thay unit test.

UML: [source](uml/final3-gof-strategy.puml), [SVG](uml/rendered/svg/final3-gof-strategy.svg), [PNG](uml/rendered/png/final3-gof-strategy.png); render và visual review PASS.

## Builder

Vấn đề: Tạo InvoiceDraft chứa snapshot hợp lệ và tổng tiền an toàn trước khi ghi hóa đơn.

Ý tưởng, vai trò và luồng: InvoiceService lấy giá Product chính thức, gọi InvoiceBuilder.setCashier().setItems().build(). Builder kiểm tra quantity, trùng product, snapshot và tổng; trả draft độc lập. Repository lưu PENDING/RESERVE.

Ưu điểm và giới hạn: Tập trung invariant và snapshot. Fluent Builder của dự án không có Director hay ConcreteBuilder tách riêng; không tự bổ sung các lớp này. Draft không phải Invoice entity có transition methods.

Nguồn: [apps/sales-service/src/modules/sales/domain/invoice.builder.ts](../apps/sales-service/src/modules/sales/domain/invoice.builder.ts), dòng 16–40.

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

Unit test: [domain/invoice.builder.spec.ts](../apps/sales-service/src/modules/sales/domain/invoice.builder.spec.ts); kiểm tra creators/strategy, Builder hoặc thứ tự Facade tương ứng. Lịch sử Jest PASS (tổng24 suites/65 tests bao gồm6 mocked health); luồng nghiệp vụ có A10/U03/U04/U08 hỗ trợ nhưng không thay unit test.

UML: [source](uml/final3-gof-builder.puml), [SVG](uml/rendered/svg/final3-gof-builder.svg), [PNG](uml/rendered/png/final3-gof-builder.png); render và visual review PASS.

## Facade

Vấn đề: Controller cần giao diện checkout đơn giản trong khi payment/stock/Saga có nhiều bước.

Ý tưởng, vai trò và luồng: CheckoutController gọi CheckoutFacade.prepare/confirm/cancel. Facade phối hợp InvoiceService, PaymentService, CheckoutOrchestrator; confirm persist payment trước advance, cancel persist intent trước release.

Ưu điểm và giới hạn: Controller mỏng, thứ tự orchestration dễ kiểm thử. Facade không tạo transaction phân tán; eventual recovery và xử lý outcome chưa biết thuộc orchestrator.

Nguồn: [apps/sales-service/src/modules/sales/application/checkout.facade.ts](../apps/sales-service/src/modules/sales/application/checkout.facade.ts), dòng 34–47.

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

Unit test: [application/checkout.facade.spec.ts](../apps/sales-service/src/modules/sales/application/checkout.facade.spec.ts); kiểm tra creators/strategy, Builder hoặc thứ tự Facade tương ứng. Lịch sử Jest PASS (tổng24 suites/65 tests bao gồm6 mocked health); luồng nghiệp vụ có A10/U03/U04/U08 hỗ trợ nhưng không thay unit test.

UML: [source](uml/final3-gof-facade.puml), [SVG](uml/rendered/svg/final3-gof-facade.svg), [PNG](uml/rendered/png/final3-gof-facade.png); render và visual review PASS.

Repository/DI hỗ trợ DIP nhưng không tính là bốn GoF ở trên. Saga, Transactional Outbox, API Gateway và Database per Service là architectural patterns; xem [architecture summary](report-assets/architecture-summary.md).
