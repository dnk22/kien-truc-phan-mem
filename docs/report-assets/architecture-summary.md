# Architecture summary cho Ch2/3

Một Web React/Vite, API Gateway Nest,5 business services và PostgreSQL/RabbitMQ, tổng9 container. PostgreSQL có5 DB/user, không cross-DB query hoặc FK. Gateway nối public/private networks, không DB, proxy allowlist public; /internal/v1 không public. Web Nginx proxy API/health. Default host3000/8080; nghiệm thu dùng3300/8080.

Layered: presentation → application → domain ports; infrastructure Prisma/HTTP realize ports; composition root nối bằng DI tokens. Shared packages chỉ kỹ thuật. Inventory gọi Product catalog pages và batch, ghép inventory rows và zero defaults; lowStock available<=threshold, summary gồm catalog, không chỉ10 inventory rows. Sales kiểm tra price/ACTIVE, Builder tạo InvoiceDraft; repository lưu default PENDING/RESERVE. Không có Invoice domain entity với methods transition; state đổi trong repositories và assertCanConfirm/assertCanCancel.

Saga prepare/reserve/READY; payment trước remote commit; PROCESSING/COMMIT; Inventory commit ghi actor cashier; COMPLETED+Outbox atomic. Persist RELEASE trước release; cancel chỉREADY/no payment. Local TX không mở qua HTTP. Retry phải lookup remote trước side effect, worker5s/attempts<20/backoff<=60s, không auto-refund hay auto-expire. Actor/correlation propagate cùng credential nội bộ; live session forward bearer tới Identity, role check tại backend.

Outbox poll2s, persistent mandatory + publisher confirm + return check rồi SENT. Consumer validate/dedup/event+facts TX rồi manual ACK; transient retry durable10s queue, mandatory return handling, retry budget5, poison DLQ. At-least-once, không exactly-once/HA. Report đọc projection của mình; stock qua Inventory REST. GMT+7 ngày inclusive/exclusive next midnight.

Khác DOCX: advisory lock V1 thay mô tả row-lock; snapshot lúc draft có thể khác catalog sau này; class dự kiến ReserveStockUseCase/RevenueService/StockClient được thay bằng ReservationService/ReportService/StockPort và adapters thực tế. Không sửa database để khớp thiết kế dự kiến. ERD chỉ FK vật lý; stock_movements/adjustments/product UUID không FK sang inventories hoặc Product DB. Foundation marker và \_prisma_migrations được lược bỏ có chú thích.
