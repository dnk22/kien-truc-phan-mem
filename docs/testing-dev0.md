# Kiểm thử DEV-0 — 24/11/2026 (GMT+7)

## Kết quả thực tế

| Kiểm tra                                | Kết quả | Phạm vi                                                                                                                                 |
| --------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`                          | PASS    | 12 workspace projects kể cả root; lockfile pin dependency tree                                                                          |
| `pnpm build`                            | PASS    | 4 packages + 7 apps; 5 Prisma Clients riêng                                                                                             |
| `pnpm lint`                             | PASS    | ESLint strict, không warning                                                                                                            |
| `pnpm typecheck`                        | PASS    | 11 packages/apps                                                                                                                        |
| `pnpm test`                             | PASS    | 8 suites, 9 Jest tests; web chỉ typecheck; contracts/logger không có test                                                               |
| `pnpm format:check`                     | PASS    | Code/config/docs; loại trừ hai nguồn đầu vào và evidence                                                                                |
| PostgreSQL 17.7 native                  | PASS    | 5 DB mới, 5 role riêng; migration mỗi DB chạy 2 lần; seed mỗi DB chạy 2 lần; mỗi DB đúng 1 marker                                       |
| Cách ly DB                              | PASS    | 20/20 kết nối chéo giữa 5 role bị PostgreSQL từ chối (42501)                                                                            |
| Native startup                          | PASS    | 6 backend + Vite trên cổng chuẩn                                                                                                        |
| `pnpm smoke`                            | PASS    | 18 GET health/live, health/ready, docs-json + HTML web                                                                                  |
| HTTP thực tế                            | PASS    | Correlation ID, CORS origin cho phép, internal Gateway route 404                                                                        |
| DB outage                               | PASS    | 5 service: live 200, ready 503 khi PostgreSQL dừng                                                                                      |
| Chrome                                  | PASS    | Gateway status thật, không pageerror; desktop 1365×900, mobile 390×844 không tràn ngang; ảnh thật                                       |
| Bash syntax                             | PASS    | `bash -n infrastructure/postgres/*.sh`                                                                                                  |
| Compose CLI 2.39.4                      | PASS    | `config --quiet`; đúng 9 service, chỉ web/gateway publish port                                                                          |
| Docker build/up / RabbitMQ runtime      | BLOCKED | Không có Docker daemon; chưa kiểm tra Dockerfiles chạy được, init shell thực tế trong container, Nginx proxy runtime hoặc broker health |
| FR/BR / checkout / fault recovery / P95 | NOT_RUN | Ngoài DEV-0, chưa có endpoint nghiệp vụ                                                                                                 |

Jest test HTTP override probe để kiểm tra status/error contract; đó là integration test HTTP với probe kiểm soát, không phải test DB thật. Kết quả DB thật và browser tách riêng ở `evidence/native-verification.log`. Hạ tầng native sử dụng SQL tạo role/database tương đương init script; không dùng psql để chạy chính init shell. Chỉ có bash syntax và code review cho shell khi chưa chạy Docker.

## Lệnh kiểm tra chuẩn

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
# Khi 7 app đang chạy:
pnpm smoke
```

Để test một app: `pnpm --filter @minimart/identity-service... build`, sau đó `pnpm --filter @minimart/identity-service test`. Mọi test cần package/config đã build; chạy test ngay sau install mà chưa build không phải workflow hỗ trợ. Jest tắt Watchman và bỏ index generated/dist.

## Tái lập kiểm tra native không có Docker (tùy chọn)

Máy kiểm chứng: macOS arm64, Node 22.22.2, PostgreSQL 17.7 qua `embedded-postgres@17.7.0-beta.16`, Google Chrome đã cài. Các công cụ phụ trợ chỉ cài vào `/tmp`, không thêm chúng vào runtime hoặc production dependencies của dự án.

```sh
npm install --prefix /tmp/minimart-verification embedded-postgres@17.7.0-beta.16 yaml@2.8.1 playwright@1.57.0
pnpm build
node scripts/verify-native.mjs
```

Có thể đặt `CHROME_PATH` đến Chrome/Chromium đã cài. Script dùng cổng 55432 và 3000–3005/8080, cần các cổng trống và quyền mở socket. Tạo cluster cô lập tại `/tmp/minimart-verification/database`, không kết nối dữ liệu khác; cleanup dừng tiến trình con và xóa cluster tạm, lưu logs/ảnh vào `docs/evidence`. Các dependency tùy chọn này pin trực tiếp trong lệnh, cây dependency phụ trợ không thuộc pnpm lock của sản phẩm.

Đường kiểm chứng là web → Vite proxy → Gateway ready → hiển thị status; riêng 5 backend → Prisma → DB của mình. Gateway không giả lập việc kiểm tra 5 DB qua trang web. Kết quả native không chứng minh container image hoặc RabbitMQ chạy được.

## Docker cần kiểm chứng tiếp

```sh
cp .env.example .env
docker compose config --quiet
docker compose up --build -d
docker compose ps
docker compose logs --no-color
```

Phiên này ban đầu `docker --version` báo `command not found`. Đã tải Compose CLI độc lập 2.39.4 vào `/tmp/minimart-verification/docker-compose` và chạy:

```sh
/tmp/minimart-verification/docker-compose --env-file .env.example config --quiet
/tmp/minimart-verification/docker-compose --env-file .env.example config --services
/tmp/minimart-verification/docker-compose --env-file .env.example up --build -d
```

Hai lệnh config thành công; up thất bại: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?`. Không tạo container/volume, không có ảnh `docker compose ps` giả.

## Vấn đề đã xử lý và giới hạn

- Prisma generate bị EPERM khi truy cập cache ngoài workspace: rerun trong môi trường được phép đã build thành công.
- Jest ban đầu bị Watchman EPERM: tắt Watchman; Supertest cần quyền mở socket.
- Bỏ generated/dist khỏi Jest index để tránh haste module collision.
- ESLint sửa cấu hình globals CJS/MJS và phạm vi TypeScript; không dùng `any` hoặc tắt lint toàn bộ.
- Vite cảnh báo chunk ~688 kB, gzip ~224 kB; chưa tối ưu bundle. Một số tooling/dependency có deprecation, ghi README; chưa có kết quả security audit.
- Chưa có JWT/RBAC, login rate limit, domain constraints, Saga, Outbox/AMQP, fault injection hoặc benchmark; không đánh dấu các tiêu chí đó PASS.
