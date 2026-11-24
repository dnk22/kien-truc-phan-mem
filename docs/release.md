# Local release / acceptance runbook

Trạng thái hiện hành ở [final-review-progress](final-review-progress.md) và [evidence](evidence/final/manifest.md). Nguồn DEV-0–7 đã tích hợp trên main trước FINAL, start commit 5274c90. Không tự tạo commit, PR, tag hoặc deploy. Môi trường local một siêu thị, một replica Sales recovery/publisher và Report consumer.

## Chạy từ checkout

1. Node 22.22.2, pnpm 10.32.1, Docker Desktop/Engine đang chạy, Compose V2+. `test -f .env || cp .env.example .env`; kiểm tra giá trị demo và các cổng trống.
2. `pnpm install --frozen-lockfile`, `pnpm db:generate`, `pnpm format`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format:check`.
3. `docker compose config --quiet`; `docker compose up --build -d`; `docker compose ps`. Chờ **9 container healthy**. Gateway ready không đủ chứng minh toàn hệ thống.
4. Explicit seed: `docker compose exec -e DEMO_SEED_ENABLED=true identity-service pnpm db:seed`, tương tự product-service và inventory-service. Migrate và foundation seed đã chạy trong startup; demo seed không cập nhật bản ghi hiện có.
5. Web mặc định localhost:3000/login, Gateway localhost:8080, Swagger /docs. Nếu 3000 bận, dùng WEB_PORT=3300, CORS_ORIGIN=http://localhost:3300 và thêm origin này vào CSRF_ALLOWED_ORIGINS. Giữ Gateway 8080 để dùng Nginx proxy mặc định.
6. Tạo/xác nhận phiếu nhập để có stock thật. Checkout tạo payment, movement, invoice, outbox; RabbitMQ project facts. Không ghi trực tiếp invoice COMPLETED/fact để giả demo.

Trên macOS tên đường dẫn tiếng Việt, Compose 5/Bake có thể yêu cầu filesystem entitlement vì NFC/NFD. `node scripts/build-compose.mjs --env-file .env --project-name minimart` build tuần tự với quyền đọc đúng workspace; sau đó `docker compose -p minimart up -d --no-build`. Script không nới Dockerfile hoặc frozen lockfile. [Docker Bake reference](https://docs.docker.com/reference/cli/docker/buildx/bake/) giải thích filesystem entitlements.

## Nghiệm thu có fault injection

Chỉ dùng project riêng `minimart-final` hoặc `minimart-verify-*` và file env riêng. Stack hiện tại là minimart-final với Web 3300. Các biến:

```sh
export VERIFY_DISPOSABLE=true VERIFY_FAULTS=true
export VERIFY_COMPOSE_PROJECT=minimart-final VERIFY_ENV_FILE=/tmp/minimart-final.env
export VERIFY_WEB_URL=http://localhost:3300
node --env-file=/tmp/minimart-final.env scripts/verify-dev6.mjs
npm install --prefix /tmp/minimart-verification playwright@1.57.0
pnpm verify:final
```

Cần Google Chrome hoặc CHROME_PATH; VERIFY_TOOLS_PACKAGE tùy chọn để trỏ package.json chứa Playwright. FINAL kiểm tra label project trước khi gây lỗi. Trigger SQL/proxy chỉ nằm trong stack disposable, có finally cleanup. Kết quả ghi docs/evidence/final; lần chạy lại ghi đè acceptance.json, nên lưu riêng bằng chứng cũ trước khi chạy nếu cần audit. Không chạy hai harness cùng lúc vì cùng thay đổi DB/broker.

Nếu bị kill giữa fault test: kiểm tra và gỡ trigger `final_fault`/function `final_inject_failure()` trên `sales_db.invoices` hoặc `report_db.sales_facts` bằng bootstrap trong chính stack disposable; khởi động RabbitMQ/Report; recreate Sales từ compose.yaml không kèm override tạm; xóa container `minimart-final-fault-proxy` nếu còn. Không xóa volume để chữa lỗi.

## Vận hành / đối soát

- 401: kiểm tra session/role/token expiry, cookie, JWT issuer/audience và CSRF origin. Không dùng local-demo key ở production.
- 503: xem logs service sở hữu và dependency; health ready của từng container. Request in-flight đã qua guard có thể hoàn tất trước revoke.
- RECOVERY: không nhận tiền lần nữa, không tạo hóa đơn thay thế, không sửa stock/payment thủ công. Xem invoice, sagaIntent, payment và reservation; khôi phục dependency và dùng lại confirm **cùng Idempotency-Key và payload gốc**. Worker tự retry tối đa 20; sau đó cần người quản lý đối soát. UI hiển thị cảnh báo khi đạt giới hạn; chưa có giao diện operator đầy đủ.
- Pending outbox: khôi phục broker; chờ publisher confirm rồi SENT và projection bắt kịp. Không tự đánh dấu SENT. Delivery at-least-once, projection idempotent.
- DLQ: giữ eventId, điều tra lỗi payload/DB, chỉ replay sau khi sửa nguyên nhân; không tự dựng sale. Chưa có DLQ replay UI. Fault tests giữ poison messages làm bằng chứng, không coi đó là sự kiện nghiệp vụ bị mất.
- `docker compose down` giữ named volumes. Không dùng `down -v` trên dữ liệu dùng chung. Stack nghiệm thu đã được tạo riêng nhưng dữ liệu/evidence nên giữ cho review.

Production HTTPS/Secure cookie, secret rotation, backup/restore, multi-replica leases, multi-tab refresh coordination và HA chưa được nghiệm thu. Không tự xuất bản lên dịch vụ ngoài.

Môi trường nghiệm thu đã dùng JWT_ACCESS_TTL_SECONDS=900 và LOGIN_RATE_LIMIT_MAX=1000 trong file env test riêng để chạy fixtures/faults liên tục, không đổi defaults sản phẩm. Rate-limit logic vẫn được unit-test; benchmark là GET nghiệp vụ có live-session check, không phải bypass auth. Full run đã exit0; lượt UI cuối và SQL đối soát bổ sung có provenance trong acceptance-runs.json.
