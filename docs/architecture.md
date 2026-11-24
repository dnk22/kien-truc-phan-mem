# Kiến trúc DEV-1 và baseline DEV-0

Hiện đã triển khai Identity/Gateway/Application Shell. Phần cuối tài liệu mô tả DEV-1 thực tế; các phần DEV-0 bên dưới giữ để đối chiếu baseline.

Nguồn quyết định: Master Specification mục 1, 6, 7 và báo cáo Chương 2/5. DEV-0 xây nền tảng vận hành, không thay đổi quyết định nghiệp vụ.

## Thành phần

| App               | Cổng nội bộ | Dữ liệu sở hữu                   |
| ----------------- | ----------- | -------------------------------- |
| web               | 3000        | Không DB; state UI thuộc feature |
| api-gateway       | 8080        | Không DB                         |
| identity-service  | 3001        | identity_db / identity_user      |
| product-service   | 3002        | product_db / product_user        |
| inventory-service | 3003        | inventory_db / inventory_user    |
| sales-service     | 3004        | sales_db / sales_user            |
| report-service    | 3005        | report_db / report_user          |

Một PostgreSQL instance; role nghiệp vụ không có superuser/create DB/create role/replication. Revoke PUBLIC database privileges để chống quyền CONNECT mặc định của PostgreSQL; default DB cũng đóng CONNECT với PUBLIC. Mỗi role chỉ sở hữu DB của mình. Role bootstrap chỉ dùng init/health, không cấp URL cho app. Mỗi DB có migration history Prisma và bảng `foundation_metadata`; seed upsert marker DEV-0. Chưa có bảng nghiệp vụ hoặc FK liên service.

Compose có đúng 9 container chính: 7 app + PostgreSQL + RabbitMQ. Chỉ web/gateway publish host ports. Backend và broker/DB nằm trên `private` internal network. Web gọi Gateway qua reverse proxy Nginx; khi dev dùng Vite proxy. Không proxy `/internal/v1/*` ra ngoài. Gateway chưa forward endpoint nghiệp vụ.

## Shared packages

- contracts: response types, metadata, pagination, technical health contract.
- auth: so sánh service credential bằng timingSafeEqual; chưa guard hoặc JWT. Không nhầm helper này với việc tất cả request đã được bảo vệ.
- logger: Pino JSON, tên service, level, redact field nhạy cảm. Request logs chỉ ghi method, status, correlationId, thời gian; không ghi body, header hoặc URL chứa query.
- config: validate environment qua Zod; Nest bootstrap, CORS gateway, DTO ValidationPipe, error filter, health endpoints, correlation middleware và Swagger. Chỉ dùng backend.

`HealthProbe` là technical interface được inject qua symbol `HEALTH_PROBE`. Mỗi service cung cấp `DatabaseProbe` dùng Prisma Client riêng; Gateway dùng `ProcessProbe`. Domain logic không có trong shared packages. Không tạo repository interface nghiệp vụ giả ở DEV-0.

## Health và vận hành

`/health/live` đo HTTP process. `/health/ready` của service chạy `SELECT 1` qua Prisma với connection/pool timeout trong Compose URL; khi DB unavailable trả 503 với lỗi đã sanitize. Gateway ready chỉ kiểm tra tiến trình. Health technical response giữ dạng `{status,service}`; lỗi dùng envelope chung. Broker có `rabbitmq-diagnostics ping`; không buộc Sales chờ RabbitMQ để giữ định hướng checkout độc lập broker. Service startup chạy migrate + seed trước HTTP, lifecycle đóng Prisma và hỗ trợ SIGTERM.

Correlation ID nhận header hợp lệ `[a-zA-Z0-9_-]{1,64}` hoặc tạo UUID mới, trả lại header và log. Xuyên HTTP client liên service sẽ bổ sung khi có client nghiệp vụ ở milestone tương ứng. Chưa có client để tuyên bố đã kiểm chứng propagation xuyên service.

Backend image dùng Node Debian slim + OpenSSL/CA, user node. DEV-0 giữ CLI và dependencies build trong image để migrate khi startup, chưa tối ưu production image size. Web dùng multi-stage build và Nginx. Tag image pin phiên bản, chưa pin digest; lockfile pin dependencies npm. Volume tồn tại qua restart; không tự reset dữ liệu.

## Ranh giới cho milestone sau

Feature module theo `presentation/controller+DTO → application/service/use-case → domain/interface/entity`; infrastructure hiện thực repository và service client qua DI token. ID tham chiếu ngoài service là UUID, tiền nguyên VND có kiểm tra safe integer, timestamp UTC và UI Asia/Ho_Chi_Minh. Năm DB không truy vấn chéo.

DEV-1 JWT/RBAC và gateway route allowlist; DEV-2 Product; DEV-3 Inventory + reservations; DEV-4 checkout hai bước/Saga/GoF; DEV-5 Outbox/report. Không tạo dữ liệu demo hay placeholder API thành công để che phần chưa triển khai.

## Đối chiếu báo cáo

Không có thay đổi kiến trúc so với báo cáo. Bổ sung bảng technical marker nhằm kiểm chứng migration/seed trên DB rỗng; marker không thay ERD nghiệp vụ. Chỉ UML component/deployment/ERD foundation phản ánh mã hiện tại. UML use-case, Sales class/sequence/state, ERD nghiệp vụ sẽ cập nhật tại milestone hiện thực chúng, không gán thiết kế dự kiến thành code đã tồn tại.

# Cập nhật implementation DEV-1

Phần DEV-0 phía trên mô tả baseline lịch sử; Identity/Gateway và application shell đã được mở rộng như sau. Chi tiết contract hiện hành nằm trong `api-contracts.md`.

## Identity layers và ownership

Identity thêm `users`, `refresh_sessions` và PostgreSQL enums Role/UserStatus qua migration `20261124010000_identity`, giữ nguyên migration `20261124000000_foundation`. Role chỉ persist trong enum, không thêm Role table trùng nguồn dữ liệu. Session FK nằm trong identity_db; 4 DB khác chưa thêm bảng nghiệp vụ.

DatabaseModule cung cấp PrismaService duy nhất cho Identity repositories và DatabaseProbe. `USER_REPOSITORY` và `SESSION_REPOSITORY` là DI tokens; application chỉ gọi interfaces, không import Prisma hoặc DTO từ presentation. AuthService điều phối password/hash/token/session; UserService map profile và hash khi tạo user. RoleModule đăng ký RolesGuard dựa trên contract role cố định. UserPersistenceModule tách provider để không tạo vòng phụ thuộc giữa AuthenticationModule và UserModule.

Global advisory transaction lock serialize mọi admin mutation, revalidate actor và kiểm tra số ADMIN ACTIVE trước khi khóa/hạ quyền. User advisory lock phối hợp role/status/password/session để tránh race với refresh hoặc login. Không giữ DB transaction mở trong khi gọi HTTP. bcrypt chạy ngoài transaction, và repository kiểm tra lại hash/version trước khi ghi.

## Gateway và session

Gateway dùng shared JWT/RolesGuard, chỉ proxy method/path auth và users đã khai báo. Identity kiểm tra lại token + DB session/user trên protected request. Header role từ client không được tin; chỉ forward allowlist header, correlation ID và credential cấu hình từ server. Gateway không đọc DB. Timeout AbortSignal áp dụng fetch và đọc response; giữ status, body và Set-Cookie của Identity; lỗi dependency trả 503.

Refresh cookie host-only HttpOnly/SameSite=Lax, CSRF Origin allowlist + custom header; production yêu cầu Secure/HTTPS. Refresh token random chỉ lưu hash; rotation tạo session mới và revoke session cũ. Replay revoke toàn family. Identity xác thực live session/version nên lock/role/password/logout hiệu lực cho request kiểm tra sau commit; Gateway tự nó chỉ xác minh JWT. Request in-flight có thể đã qua guard; admin write còn kiểm tra actor trong transaction.

Shared auth chỉ chứa technical JWT/guards/credential/rate limit, không chứa user/session domain logic. Shared config tái dùng error envelope, response helper, OpenAPI error schemas và correlation/CORS. Shared contracts dual CJS/ESM phục vụ role types/constants ở backend và web.

## Web

Zustand chỉ lưu access token và identity/profile tối thiểu trong memory, không persist. TanStack Query giữ user list/profile server state. Axios single-flight refresh và một lần retry, chỉ xử lý 401 do INVALID_ACCESS_TOKEN/SESSION_REVOKED; CURRENT_PASSWORD_INVALID là lỗi form, không gây vòng refresh/logout. Revision kiểm soát response refresh cũ không ghi đè trạng thái login/logout mới.

Navigation config tập trung role/menu và route placeholders. PublicRoute, ProtectedRoute, RoleGuard và HomeRedirect tách riêng. MainLayout có SidebarNavigation, AppHeader, responsive drawer; pages dùng lazy loading. Shared UI wrappers mỏng trên Ant Design, không đưa logic quản lý user vào shared components.

## Khác biệt so với bản thiết kế dự kiến

Không thay đổi ranh giới kiến trúc. Bổ sung session family, tokenVersion và live session checking để làm rõ rotation/revocation. Local Compose Identity/Gateway dùng development mode có chủ đích cho HTTP demo; production mode bắt buộc Secure cookie và JWT key riêng. Demo seed explicit và bị chặn trong production. Không thêm Redis/Kafka/Payment service hay nghiệp vụ DEV-2.
