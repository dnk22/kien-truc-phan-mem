# DEV-6 và FINAL verification

DEV-6 source harness ở scripts/verification/dev6; kết quả chạy mới ở [dev6.log](evidence/final/dev6.log). Không dùng kết quả DEV-1 lịch sử cho source DEV-7/FINAL.

```sh
VERIFY_DISPOSABLE=true VERIFY_FAULTS=true \
VERIFY_COMPOSE_PROJECT=minimart-final VERIFY_ENV_FILE=/tmp/minimart-final.env \
VERIFY_WEB_URL=http://localhost:3300 \
node --env-file=/tmp/minimart-final.env scripts/verify-dev6.mjs
```

File env cung cấp DEMO_PASSWORD. Bốn tài khoản seeded; Gateway 8080; không có giao dịch khác trong lúc chạy. Harness hiện honor project/env file và origin tùy chọn; không stop project mặc định khác.

## Phạm vi

DEV-6: category/product/supplier/receipt fixture, unique code, role denial, replay receipt, insufficient stock, competing last unit, multi-item rollback, prepare/confirm idempotency và payload conflict, cash/change, adjustment, price snapshot, Report downtime/backlog và Rabbit outage/outbox catch-up. Script báo từng assertion group, không phải Jest test suites.

FINAL mở rộng ở scripts/verification/final, lệnh `pnpm verify:final` với cùng VERIFY variables. R01–03: 9 container, health, migration/schema/seed/topology/OpenAPI. A01–18: API/DB nghiệp vụ, Identity regression, RBAC/ownership, SQL invariants/20 cross-database denials. F01–12: broker/Report, duplicate/poison/DLQ, transient failure/missing retry queue, timeouts trước/sau reserve, restart sau commit, failed local completion, retry exhaustion, GMT+7 boundary. U01–08: browser UI → real API/DB, cash/bank, print/PDF, interrupted prepare, roles/forms/empty/error/retry/mobile/expired access. D01/D02: reconciliation dữ liệu và thống kê báo cáo. P01: 20 concurrent clients trên 2 endpoint đọc CRUD đại diện.

Không tạo invoice/fact giả. Timezone test đổi timestamp của giao dịch đã checkout thật trước khi publish, ghi rõ controlled fixture. Retry-limit test đặt attempts=19 để kiểm tra ngưỡng 20 nhanh; không giả lập 20 lần chờ thực tế. Proxy chỉ làm rơi/chậm/error transport, các mutation thành công đi qua Inventory thật. Error-state browser abort mạng, không mock success data. Print kiểm chứng window.print/PDF, không có máy in vật lý.

## Safety / repeatability

Chỉ project disposable có label đúng. Test restore service, trigger/proxy trong finally; xem release.md nếu process bị kill. Mỗi run dùng code/username/key ngẫu nhiên; để yên dữ liệu dùng chung. Không chạy hai harness đồng thời. Có thể để poison event trong DLQ làm bằng chứng; invariants chỉ tính source completed events hợp lệ. Auth TTL đủ dài cho fault tests; production/demo defaults không thay theo test env.

Kết quả thực tế và giới hạn cập nhật trong testing.md, final-review-progress.md và evidence/final/manifest.md; test có source không được tính PASS nếu chưa chạy.

Chạy lại riêng UI sau thay đổi Web: thêm `VERIFY_STAGE=browser`; kết quả ghi acceptance-browser.json/browser.log, không thay thế bộ API/fault đầy đủ. Lần nghiệm thu cuối đối soát D01/D02 lại sau tất cả thao tác UI; acceptance.json giữ latest case ID, không cộng các lần chạy trùng.
