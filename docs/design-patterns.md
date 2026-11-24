# Trạng thái design patterns

DEV-0 chưa có nghiệp vụ Sales, vì vậy chưa hiện thực hoặc kiểm thử GoF Factory Method, Builder, Facade, Strategy. Không tạo class rỗng để đánh dấu hoàn thành.

DEV-4 phải hiện thực đúng Master Specification:

| Pattern        | Thiết kế phải hiện thực                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Factory Method | abstract PaymentCreator.create; CashPaymentCreator và BankTransferPaymentCreator override; creator registry tại composition root |
| Strategy       | PaymentStrategy.process với CashPaymentStrategy/BankTransferStrategy                                                             |
| Builder        | InvoiceBuilder.setCashier().setItems().build tạo PENDING hợp lệ                                                                  |
| Facade         | CheckoutFacade.prepare/confirm/cancel, controller mỏng, phối hợp Orchestrator/InvoiceService/PaymentService                      |

DEV-0 chỉ có Nest DI qua `HEALTH_PROBE` và adapter `DatabaseProbe`, thuộc nền tảng kỹ thuật. Đây không phải minh chứng bốn GoF patterns. Khi DEV-4 hoàn thành, cập nhật tài liệu này bằng đường dẫn class thực tế, unit tests, ví dụ trước/sau và trade-off; không ghi tên thiết kế dự kiến như code đã có.
