# Minh chứng báo cáo — DEV-1

Ngày 24/11/2026 GMT+7. Git commit/tag: N/A. Đầu phiên chưa có Git; cuối phiên repository ở main nhưng chưa có commit, source untracked. Agent không tạo hoặc sửa Git metadata. Node 22.22.2, pnpm 10.32.1, PostgreSQL thật 17.7, Chrome/macOS arm64. Các phiên bản sản phẩm và dependencies mới trong README/pnpm-lock.yaml.

| Yêu cầu                 | Implementation                                                                                           | Kiểm chứng                                                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| FR01–09, BR01–03        | Identity modules + auth/users controllers/services/repositories; JWT/session/Role guards; admin users UI | Unit, HTTP/DB integration và browser E2E thực tế; xem testing.md                                                          |
| NFR02                   | bcrypt, JWT validation, live DB session/version, RBAC, CSRF, rate limit, safe profiles/logging           | 4 role login; role denial trực tiếp Identity/Gateway; lock/role/password/logout revocation; replay và refresh concurrency |
| NFR03–04                | Independent apps, layers, DI repository interfaces                                                       | Build mỗi app/package; no shared domain behavior; UML Identity class/component                                            |
| NFR08                   | Jest/Supertest + native scripts/API/browser fixtures                                                     | 27 Jest tests và assertions tích hợp; logs lưu evidence/dev1                                                              |
| NFR09–10                | Compose, health, structured logs/correlation, timeout/error mapping                                      | Config CLI và native startup/health; Docker runtime BLOCKED                                                               |
| Last Admin invariant    | Advisory locks + DB transaction + actor revalidation                                                     | Competing lock/demotion requests; DB còn ít nhất 1 ACTIVE ADMIN                                                           |
| Migration/seed          | New migration, old foundation unchanged; env-gated upsert demo users                                     | Upgrade foundation, deploy lặp lại, seed không overwrite, production seed refusal                                         |
| FR10–57 / BR04–21       | Chưa triển khai                                                                                          | NOT_RUN, shell placeholders chỉ báo Chưa khả dụng                                                                         |
| NFR01 P95/20 concurrent | Chưa đo                                                                                                  | NOT_MEASURED                                                                                                              |

## Evidence thật

`docs/evidence/dev1/verification.log` ghi API/database/browser checks từ script chạy thật. `checks.log` ghi quality gate và exit codes. `compose-validation.log` ghi CLI config và lỗi daemon; không có ảnh Docker chạy giả.

Screenshots: login-desktop, users-desktop, users-empty, users-loading, users-error, manager-desktop, cashier-desktop, warehouse-desktop, navigation-mobile, profile-mobile, swagger-desktop. Tất cả được chụp từ Chrome; loading/error dùng lỗi transport có chủ đích trên luồng thật, không mock dữ liệu thành công. Process logs identity/gateway có correlation IDs và HTTP status, không chứa password/token/cookie.

UML source thực tế: `identity-class.puml`, `login-sequence.puml`, `refresh-sequence.puml`, `auth-component.puml`, `identity-erd.puml`; chưa render ảnh UML. Diagram nghiệp vụ Sales/Inventory chưa thay thiết kế dự kiến bằng implementation giả.

## Phần báo cáo cần cập nhật sau review

- Chương 2/3: đối chiếu Identity/session family/tokenVersion và live revocation; role enum, không Role table thứ hai.
- Chương 5.1–5.3: phiên bản, cấu trúc, lệnh chạy/seed và ảnh login/users/profile thật. Đánh dấu native verification và Docker BLOCKED riêng.
- Chương 5.4: có thể cập nhật TC01 sai password và TC02 Cashier bị 403 bằng evidence DEV-1. TC03–TC15 nghiệp vụ chưa chạy.
- Chương 5.6: chỉ nghiệm thu Identity/Application Shell hiện có; không khẳng định P95, checkout/Saga/Outbox hoặc production deployment đạt.
- Chương 4 GoF vẫn chờ DEV-4; không tính JWT guards hoặc repository DI là bốn GoF patterns.

Không sửa DOCX nguồn ở phase này. Dừng DEV-1 trước khi chuyển DEV-2.
