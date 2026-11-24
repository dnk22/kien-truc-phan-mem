# FINAL GoF design patterns

All paths relative to apps/sales-service/src/modules/sales.

| Pattern        | Real classes / files                                                                              | Purpose and trade-off                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Factory Method | domain/payment/payment.creator.ts: PaymentCreator, CashPaymentCreator, BankTransferPaymentCreator | Abstract creator defines create(), subclasses override factory method; registry wired in sales.module.ts. New methods add creators rather than modify orchestration. Additional classes for two methods. |
| Strategy       | domain/payment/payment.strategy.ts, cash-payment.strategy.ts, bank-transfer.strategy.ts           | Shared process(request,total) contract; independent cash validation/change and manual transfer confirmation. No external money transfer.                                                                 |
| Builder        | domain/invoice.builder.ts: InvoiceBuilder                                                         | setCashier().setItems().build() validates positive Int32 quantity, nonblank snapshot identifiers/code/name/unit, duplicate product and safe integer total, builds independent snapshot.                  |
| Facade         | application/checkout.facade.ts: CheckoutFacade                                                    | Controller sees prepare/confirm/cancel; facade coordinates InvoiceService, PaymentService and CheckoutOrchestrator. Avoids embedding saga in controller.                                                 |

Repository and dependency injection support DIP, but are not counted as the four GoF patterns. Saga and Transactional Outbox are architectural patterns. Jest executes real unit tests for creators, both strategies, Builder and Facade; latest quality-gates log contains counts. Saga/integration tests exercise the resulting payment/stock flow separately.
