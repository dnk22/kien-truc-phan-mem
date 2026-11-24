# MiniMart Management — Nhóm 06 PTIT

Nguồn chuẩn: [Prompt_Codex_MiniMart.md](Prompt_Codex_MiniMart.md), đối chiếu `Bao_cao_Nhom_06_Sieu_thi_mini.docx`. Hai tài liệu nguồn được giữ nguyên.

**Milestone: FINAL-1 / FINAL-2 đã nghiệm thu local trên `main`, HEAD `5274c90` giữ nguyên. 9 container healthy, 44 ca acceptance PASS và 65 Jest tests PASS.** Trạng thái và giới hạn hiện hành ở [final-review-progress](docs/final-review-progress.md); kết quả lịch sử DEV-0/1 không thay thế lần nghiệm thu này.

## Khởi động bằng Docker Compose

Cần Node 22.22.2, pnpm 10.32.1, Docker daemon và Compose V2 trở lên. Giữ file `.env` hiện có; chỉ sao chép mẫu khi chưa có.

```sh
test -f .env || cp .env.example .env
pnpm install --frozen-lockfile
docker compose config --quiet
docker compose up --build -d
docker compose ps
# Chờ 9 container healthy; explicit seed chỉ dành cho demo development:
docker compose exec -e DEMO_SEED_ENABLED=true identity-service pnpm db:seed
docker compose exec -e DEMO_SEED_ENABLED=true product-service pnpm db:seed
docker compose exec -e DEMO_SEED_ENABLED=true inventory-service pnpm db:seed
```

Web mặc định `http://localhost:3000/login`, Gateway `http://localhost:8080`, Swagger `/docs`, OpenAPI `/docs-json`. `WEB_PORT`/`GATEWAY_PORT` có thể đổi; khi đổi web port phải đồng bộ `CORS_ORIGIN` và `CSRF_ALLOWED_ORIGINS`. Lần nghiệm thu dùng Web `http://localhost:3300`, Gateway `8080`, project riêng `minimart-final`; không dừng app khác trên cổng 3000.

Chỉ web và Gateway publish host ports. Năm business services, PostgreSQL với năm database/user riêng và RabbitMQ nằm trong network riêng. Gateway readiness chỉ xác minh process của Gateway; xem health từng container. Startup chạy migration và foundation seed; seed demo không ghi đè dữ liệu đã sửa. Không seed stock hoặc hóa đơn giả: lập phiếu nhập và Manager xác nhận, sau đó checkout thật.

Nếu Compose/Bake báo đường dẫn không được phép trên macOS với tên thư mục tiếng Việt, dùng script [build-compose.mjs](scripts/build-compose.mjs) để cấp quyền đọc đúng workspace với hai dạng Unicode; sau đó up bằng image đã build:

```sh
node scripts/build-compose.mjs --env-file .env --project-name minimart
# Hoặc bỏ hai tùy chọn để dùng .env/project mặc định.
docker compose -p minimart up -d --no-build
```

Script build tuần tự để tránh nhiều tiến trình pnpm tranh RAM. Không thay Dockerfile bằng cài dependency thiếu lockfile.

## Tài khoản demo

Đặt `DEMO_PASSWORD` trước khi seed; `.env.example` dành cho local có giá trị **MiniMartDemo!2026**.

| Username  | Role      | Route mặc định |
| --------- | --------- | -------------- |
| admin     | ADMIN     | /users         |
| manager   | MANAGER   | /dashboard     |
| cashier   | CASHIER   | /pos           |
| warehouse | WAREHOUSE | /inventory     |

`DEMO_SEED_ENABLED=true` chỉ được dùng khi NODE_ENV development/test. Seed từ chối production. Production: đặt APP_NODE_ENV=production, JWT_SECRET ngẫu nhiên riêng (≥32 ký tự, không dùng local-demo key), COOKIE_SECURE=true, CORS_ORIGIN và CSRF_ALLOWED_ORIGINS là HTTPS origins thực tế và triển khai sau HTTPS reverse proxy; không bật demo seed. Chưa kiểm chứng deployment HTTPS production trong phiên này.

Khóa/đổi role/đổi mật khẩu thu hồi session cũ tại Identity. Đổi mật khẩu yêu cầu mật khẩu hiện tại và buộc đăng nhập lại. Không tạo lại hoặc reset volume để khôi phục một tài khoản đã sửa; seed không reset password/status.

## Môi trường và phiên bản

Node **22.22.2**, pnpm **10.32.1**, TypeScript **5.9.3**. Giữ nguyên dependencies DEV-0; phiên bản trực tiếp pin chính xác, cây dependencies trong pnpm-lock.yaml.

| Nhóm                                  | Phiên bản                               |
| ------------------------------------- | --------------------------------------- |
| React / React DOM                     | 19.2.0                                  |
| Vite / plugin React                   | 7.3.1 / 5.1.1                           |
| Ant Design / React Router             | 5.29.1 / 7.9.6                          |
| TanStack Query / Zustand / Axios      | 5.90.11 / 5.0.8 / 1.13.2                |
| NestJS / Swagger                      | 11.1.24 / 11.2.3                        |
| Prisma CLI / Client                   | 6.19.3 / 6.19.3                         |
| PostgreSQL / RabbitMQ                 | 17.7-bookworm / 4.2.1-management-alpine |
| JWT / bcrypt / cookie (DEV-1)         | 9.0.3 / 6.0.0 / 1.0.2                   |
| Jest / ts-jest / Supertest            | 29.7.0 / 29.4.5 / 7.1.4                 |
| ESLint / typescript-eslint / Prettier | 9.39.1 / 8.48.1 / 3.7.4                 |

Shared contracts có CJS + ESM output để dùng runtime role constants ở Nest và Vite. Không thay toàn bộ build config để né bundle warning. AMQP client 0.10.9 và types 0.10.7 đã được đồng bộ trong frozen lockfile.

## Phát triển native

Cung cấp PostgreSQL thật với 5 DB và users theo `infrastructure/postgres/init-databases.sh`. Không dùng shared superuser cho application. Root `.env` chứa common configuration; từng service `.env` chứa DATABASE_URL tới DB local tương ứng.

```sh
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
cp apps/identity-service/.env.example apps/identity-service/.env
# Tương tự 4 service còn lại; sửa URL DB local theo môi trường của bạn.
pnpm build
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Prisma migrate đọc `.env` từng app; seed Node đọc `.env` root + app, biến đã export có ưu tiên cao hơn file. `pnpm dev` watch JS đã build; khi sửa backend TS, chạy build lại hoặc `pnpm --filter @minimart/identity-service exec tsc -p tsconfig.json --watch` ở terminal riêng. Vite có HMR và proxy `/api`/`/health` tới Gateway.

```sh
pnpm --filter @minimart/identity-service... build
pnpm --filter @minimart/identity-service test
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
# 7 apps đang chạy:
pnpm smoke
```

Build generate Prisma Client riêng cho từng service, không cần DB đang online. Jest cần shared packages đã build. Web test script là typecheck; browser E2E riêng sử dụng API/DB thật, không coi typecheck là E2E.

## Kiểm chứng tự động với PostgreSQL tạm

Không cần cài PostgreSQL hệ thống cho script kiểm chứng; dùng binary PostgreSQL thật trong `/tmp` (không phải DB in-memory):

```sh
npm install --prefix /tmp/minimart-verification embedded-postgres@17.7.0-beta.16 yaml@2.8.1 playwright@1.57.0
pnpm build
node scripts/verify-dev1.mjs
node scripts/verify-native.mjs
```

Cần Chrome/Chromium đã cài, có thể đặt CHROME_PATH. Script DEV-1 dùng cổng 55433, 3000–3005, 8080, 18080–18083; script foundation dùng 55432 và các cổng app. Chạy tuần tự, để cổng trống. Script tự tạo DB riêng, kiểm thử, chụp ảnh và dừng/xóa dữ liệu tạm; không kết nối DB thật của người dùng. DEV-1 kiểm tra upgrade từ migration DEV-0, seed bảo toàn, API auth/users, concurrency, browser, refresh single-flight và error/loading/empty states.

## Cấu trúc

```text
apps/identity-service/src/
  infrastructure/database/        # PrismaService + health
  modules/auth/{application,presentation}
  modules/users/{domain,application,presentation,infrastructure}
  modules/sessions/{domain,infrastructure}
  modules/roles/                  # RoleModule/RolesGuard; persisted role enum
apps/api-gateway/src/modules/identity/
  auth-proxy.controller.ts
  users-proxy.controller.ts
  identity-proxy.service.ts
apps/web/src/
  app/{config,layout,pages}
  features/auth/{api,components,hooks,pages,stores,types,utils}
  features/users/{api,components,hooks,pages,types,utils}
  shared/{api,components,hooks,types,utils}
packages/{contracts,auth,logger,config}/
scripts/verification/             # Runtime, API cases, browser cases
docs/uml/                         # Foundation + Identity diagrams
docs/evidence/dev1/               # Logs và screenshots thật
```

Controller mỏng, application điều phối, domain chứa repository contracts, infrastructure chứa Prisma adapters; DI token nối ở module. Không có DB chéo hoặc domain logic shared giữa service. Gateway không truy cập Identity DB.

## Vận hành và giới hạn

```sh
docker compose logs -f api-gateway identity-service
docker compose exec identity-service pnpm db:migrate
docker compose down
```

`docker compose down` giữ dữ liệu. **Reset toàn bộ dữ liệu demo** chỉ khi chủ động muốn xóa: `docker compose down -v`, rồi up/seed lại. Đổi `.env` password không tự đổi role đã nằm trong PostgreSQL volume; init chỉ chạy trên volume mới.

- Chi tiết bảo mật/rotation, CSRF, thời điểm thu hồi và HTTP codes: [API Contract](docs/api-contracts.md).
- Kết quả thực tế, lỗi đã sửa và cách tái lập: [Testing](docs/testing.md).
- [Tiến độ](docs/implementation-progress.md), [kiến trúc](docs/architecture.md), [permission matrix](docs/actor-permissions.md), [file DEV-1](docs/dev1-files.md), [demo](docs/demo.md), [minh chứng báo cáo](docs/report-evidence.md).
- Trạng thái Docker/RabbitMQ hiện hành: xem progress và evidence FINAL; không dùng kết quả native lịch sử làm Docker PASS.
- Refresh replay thu hồi family, có thể yêu cầu login lại khi nhiều tab refresh đồng thời hoặc mất response. Rate limit in-memory theo process; chưa distributed. Session history chưa có job dọn retention.
- Web vẫn có warning chunk >500 kB dù đã lazy load các route; chưa tối ưu sâu UI bundle. Tooling cũ có deprecation; chưa có security audit toàn cây dependencies.

### DEV-2 catalog

See [catalog API contract](docs/dev2-api.md). Run product migrations and seed in the configured development environment; with DEMO_SEED_ENABLED=true in a non-production environment, seed creates six categories and 30 example products, preserving existing records. Manager manages categories/products; cashier and warehouse can read products. No stock quantities are seeded here. See current acceptance results in docs/testing.md.

### DEV-3 inventory

See [inventory API contract](docs/dev3-api.md). With DEMO_SEED_ENABLED=true in development, inventory seed adds three suppliers. Use Manager or Warehouse to create a receipt and Manager to confirm it to establish stock. The inventory service never reads product_db; it validates items through Product internal API. Kết quả nghiệm thu hiện hành ở docs/testing.md.

### DEV-4 sales

Create confirmed purchase receipts first, then log in as cashier, search products at /pos, prepare checkout to see official total, record cash or manually verified bank transfer, and view/print completed invoices. See [Sales API](docs/dev4-api.md) and [GoF patterns](docs/design-patterns.md). Recovery worker retries pending intents; no broker dependency in checkout. Kết quả nghiệm thu hiện hành ở docs/testing.md.

### DEV-5 reporting

Lockfile đã đồng bộ; dùng `pnpm install --frozen-lockfile` và quality gates. Sales completion records outbox; publisher delivers to RabbitMQ and Report projects it. Manager dashboard and reports show real projected revenue and live stock summary. See [DEV-5 contract](docs/dev5-api.md). Kết quả nghiệm thu hiện hành ở docs/testing.md.

### DEV-6 verification

After synchronizing the lockfile and building a disposable local demo stack, run `VERIFY_DISPOSABLE=true pnpm verify:dev6` and optionally `VERIFY_DISPOSABLE=true VERIFY_FAULTS=true pnpm verify:dev6`. The latter stops and restarts Report and RabbitMQ; never run against a shared or production environment. See [verification runbook](docs/dev6-verification.md).

## FINAL local demo review

Read [release runbook](docs/release.md), [demo script](docs/demo.md), [architecture](docs/architecture-current.md), [API index](docs/api-index.md), [evidence matrix](docs/report-evidence.md) and [Codex handoff](docs/codex-final-review.md). Không tạo release tag. Kết quả mới ở docs/evidence/final; evidence DEV-0/1 được giữ làm lịch sử.

See [UML index](docs/uml/README.md), [release checklist](docs/release-checklist.md), and [final evidence template](docs/evidence/final/manifest.md).

## Nghiệm thu FINAL trên stack disposable

```sh
npm install --prefix /tmp/minimart-verification playwright@1.57.0
# Chrome đã cài; CHROME_PATH tùy chọn. File env cần đủ 4 tài khoản demo.
VERIFY_DISPOSABLE=true VERIFY_FAULTS=true \
VERIFY_COMPOSE_PROJECT=minimart-final VERIFY_ENV_FILE=/tmp/minimart-final.env \
VERIFY_WEB_URL=http://localhost:3300 \
node --env-file=/tmp/minimart-final.env scripts/verify-dev6.mjs
VERIFY_DISPOSABLE=true VERIFY_FAULTS=true \
VERIFY_COMPOSE_PROJECT=minimart-final VERIFY_ENV_FILE=/tmp/minimart-final.env \
VERIFY_WEB_URL=http://localhost:3300 pnpm verify:final
```

Với DEV-6, cách portable để nạp password: `node --env-file=/tmp/minimart-final.env scripts/verify-dev6.mjs` với các biến VERIFY ở trên. FINAL tự đọc file env được chỉ định; `VERIFY_TOOLS_PACKAGE` có thể trỏ package.json chứa Playwright. Test fault chỉ được chạy trên stack riêng: dừng/restart service, tạo trigger gây lỗi, đổi timestamp có kiểm soát và dùng proxy tạm. Không chạy trên dữ liệu dùng chung. Script luôn khôi phục lỗi đã gây trước khi thoát; nếu agent/process bị kill, dùng hướng dẫn cleanup trong release.md.
