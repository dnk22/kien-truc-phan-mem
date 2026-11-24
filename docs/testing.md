# Kiểm thử FINAL — 24/11/2026 GMT+7

Nghiệm thu local: 9 container healthy, DEV-6 exit0, 44 unique acceptance cases PASS; không còn P0/P1 quan sát trong luồng demo. Trạng thái hiện hành: [final-review-progress](final-review-progress.md). Full quality gate hiện PASS (exit 0 cho cả 8 lệnh) theo [quality-gates.json](evidence/final/quality-gates.json) và [log](evidence/final/quality-gates.log). Jest: **24 suites / 65 tests**, không skipped; web test là typecheck, không tính là browser E2E.

| Nhóm                                                           | Bằng chứng hiện hành                          | Quy tắc ghi nhận                                                                            |
| -------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Install/generate/format/build/lint/typecheck/test/format check | evidence/final/quality-gates.log              | exact exit codes                                                                            |
| Compose/image startup/migration/seed                           | compose-ps.json, migration-seed.json khi chạy | 9 container health riêng; migration từ volume rỗng và replay/schema diff                    |
| DEV-6 integration/outages                                      | evidence/final/dev6.log                       | PASS chỉ khi script exit 0, không đếm dòng fixture thành test độc lập                       |
| FINAL API/SQL/fault/browser                                    | evidence/final/acceptance.json                | case ID + actual outcome; source chưa chạy không phải PASS                                  |
| Data consistency                                               | evidence/final/data-invariants.json           | kiểm tra SQL và API sau projection catch-up                                                 |
| Browser                                                        | screenshots/PDF evidence/final                | production Nginx build, Chrome headless, API/DB thật                                        |
| Performance                                                    | evidence/final/performance.json               | hai protected CRUD read endpoints, 20 concurrent, 400 requests/endpoint; target p95 <=500ms |

Commands và setup: [release runbook](release.md), [DEV-6/FINAL harness](dev6-verification.md). Không dùng benchmark nhỏ thành SLA production. Single machine, no HA/multi-replica leases; HTTPS production, physical printer, backup/restore và multi-tab refresh vẫn chưa nghiệm thu.

Lần build Docker đầu gặp auth/network và quyền filesystem NFC/NFD của Bake; build tuần tự đã compile đủ 7 application images. Docker Desktop sau đó treo ở container start; kết quả phục hồi/startup phải đọc ở progress, không suy diễn image build PASS thành runtime PASS.

## Lịch sử DEV-0–7 (không phải trạng thái nghiệm thu hiện hành)

Các mục bên dưới là snapshot trước FINAL; dòng “pending/blocked” được giữ làm lịch sử. Kết quả hiện hành ở phần trên và manifest FINAL.

# Kiểm thử DEV-1 — 24/11/2026 GMT+7

Lệnh chuẩn: install frozen lockfile → build → lint → typecheck → test → format:check. Chi tiết DEV-0 lịch sử ở [testing-dev0.md](testing-dev0.md); script foundation đã được cập nhật JWT env và URL `/foundation` để chạy lại trên DEV-1.

## Phạm vi và kết quả

| Nhóm                                         | Kết quả                    | Minh chứng                                                                                                                           |
| -------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Build/lint/typecheck/format/frozen install   | PASS                       | evidence/dev1/checks.log                                                                                                             |
| Jest unit + HTTP integration                 | 11 suites / 27 tests       | JWT signature/exp/iss/aud/algorithm/config, rate limit, password/auth orchestration, safe profile mapper, 6 backend health           |
| Upgrade migration DEV-0 → DEV-1              | PASS                       | Tạo foundation SQL và marker, resolve migration cũ, deploy migration mới; marker giữ nguyên                                          |
| Migration từ DB rỗng và deploy lặp lại       | PASS foundation regression | 5 service migrations và schema; script verify-native                                                                                 |
| Seed                                         | PASS                       | 4 users, chạy lại không trùng; sửa hash/status/profile rồi seed không ghi đè; production demo seed bị chặn                           |
| Auth HTTP + PostgreSQL thật                  | PASS                       | 4 role login, sai/missing/locked, invalid/expired JWT, refresh rotate/replay/expired/concurrent, logout, password đúng/sai và revoke |
| Backend RBAC                                 | PASS                       | ADMIN quản lý users; 3 role khác 403 tại Gateway và trực tiếp Identity; no token 401; fake role headers không nâng quyền             |
| User CRUD/filter/pagination                  | PASS                       | Create/detail/update/status/role; validation 400, missing 404, unique 409; bcrypt trong DB; không trả hash                           |
| Last Admin concurrency                       | PASS                       | Hai request tự khóa hoặc tự hạ quyền: chỉ một thành công, DB luôn còn 1 Admin ACTIVE; request cuối cùng trả conflict                 |
| Frontend E2E                                 | PASS                       | Real login 4 role, menu/default route, 403/404 routes, create/edit/lock/unlock/role UI, session reload, logout, change password      |
| Axios single-flight                          | PASS                       | Hai GET cùng token hết hạn → đúng 1 refresh HTTP thật → cả 2 request retry 200                                                       |
| UI trạng thái/mobile                         | PASS                       | Loading qua delay request thật, empty search thật, error qua abort network và retry; mobile drawer/profile không tràn ngang          |
| Gateway timeout/unavailable + 429            | PASS                       | Dedicated gateway process cấu hình rate=2, unavailable endpoint và slow HTTP dependency                                              |
| DEV-0 hồi quy                                | PASS                       | 7 app startup, 18 health/OpenAPI + web HTML, 20 cross-DB denials, DB outage live 200/ready 503                                       |
| Compose config                               | PASS                       | CLI độc lập 2.39.4 config --quiet; 9 services, web/gateway host ports                                                                |
| Docker image/Compose/RabbitMQ runtime        | BLOCKED                    | Có Docker CLI 29.9.3 nhưng không daemon socket; compose plugin chưa cài vào Docker CLI                                               |
| Production HTTPS/Secure cookie deployment    | NOT_RUN                    | Code bắt buộc Secure khi NODE_ENV production, chưa có HTTPS deployment để chạy E2E                                                   |
| Product/Inventory/POS/Report/Saga/outbox/P95 | NOT_RUN / NOT_MEASURED     | Ngoài DEV-1; không có nghiệp vụ giả hoặc số đo hiệu năng suy diễn                                                                    |

Bảng được chốt theo exit code/log của lần kiểm chứng cuối; không cộng duplicate assertions thành số test nghiệp vụ độc lập. Script API có nhiều assertions kiểm tra status/hash/DB invariants; số Jest 27 là riêng, không đại diện tổng E2E cases. Web `pnpm test` vẫn là typecheck; E2E chạy bằng script riêng.

## Chạy lại

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm format:check
npm install --prefix /tmp/minimart-verification embedded-postgres@17.7.0-beta.16 yaml@2.8.1 playwright@1.57.0
node scripts/verify-dev1.mjs
node scripts/verify-native.mjs
```

Cần Chrome/Chromium, CHROME_PATH optional. macOS arm64/Node 22.22.2/PostgreSQL 17.7 là môi trường đã chạy. PostgreSQL là binary thật, không in-memory mock. Công cụ optional nằm `/tmp`, không vào runtime dependencies sản phẩm. Cần quyền truy cập cache Prisma và mở localhost sockets.

DEV-1 tạo cluster `/tmp/minimart-verification/dev1-database` ở 55433; app 3000–3005/8080, gateways/dependency thử lỗi ở 18080–18083. Harness kiểm tra port trống trước startup, không kill tiến trình không liên quan. DEV-0 dùng cluster riêng 55432. Các script dừng processes và xóa cluster tạm trong finally. Fixtures có thay đổi trực tiếp DB để tạo lỗi/khôi phục dữ liệu test; không chạy SQL đó trên dữ liệu người dùng.

Vite phải dùng NODE_ENV=development ngay cả khi backend kiểm thử dùng NODE_ENV=test; nếu dùng test mode, Ant Design tạo test-id trùng và modal không có accessible name đúng. Harness đã sửa điều này. Browser checks dùng API thật; chỉ delay/abort transport để kiểm tra loading/error, không cung cấp fake success data. Single-flight test gắn JWT expired ký bằng test key cho session thật trong memory store rồi quan sát refresh thật.

## Lỗi tìm thấy và đã xử lý

- Shared contracts CJS-only không thể export runtime ROLES vào Vite build: thêm dual CJS/ESM, giữ Node backend CJS.
- Identity health unit test cần override PrismaService mới thay vì yêu cầu DB trong test kỹ thuật; integration DB tách riêng.
- Axios 401 do CURRENT_PASSWORD_INVALID không phải access expiration: chỉ refresh với INVALID_ACCESS_TOKEN/SESSION_REVOKED, không logout người dùng do nhập sai mật khẩu hiện tại.
- Modal button loading icon thay accessible name: đặt aria-label ổn định. Ant Design Select được điều khiển bằng keyboard khi input readonly bị lớp label che, không force-click.
- Đóng editor sau mutation không đợi invalidate query để tránh callback cũ ảnh hưởng form vừa mở.
- Seed Node trước đây không tự đọc app `.env`: bổ sung Node env-file flags cho 5 service, không sửa migration cũ hoặc đổi DB.
- `.dockerignore` loại cả `.env` của app con để không copy secrets local vào image.

## Giới hạn

Live revocation được kiểm tra tại Identity, không tuyên bố Gateway tự đọc trạng thái DB. Request in-flight có thể đã qua guard; admin mutation revalidate actor trong transaction. Rate limit là in-memory per process; restart/reset process mất bộ đếm. Refresh đa tab hoặc lost response có thể khiến replay family bị revoke và cần login lại; chưa có cross-tab coordination/absolute session retention cleanup.

Docker/RabbitMQ/Nginx runtime và HTTPS deployment chưa chạy. Vite còn chunk >500 kB dù route-level lazy loading; chưa tối ưu sâu bundle hoặc audit toàn bộ transitive dependencies. P95 CRUD 20 concurrent chưa đo; request duration logs không được coi là benchmark.

## DEV-2 – verification pending

Added catalog validation and batch lookup unit tests. Build, lint, typecheck, formatting, Jest, migration/seed, PostgreSQL concurrency, Gateway/Identity integration, browser E2E and Docker runtime: **NOT RUN** for DEV-2. Prior DEV-1 evidence is historical, not evidence for this branch.

Local review: run root quality gate, check 30 demo products, category activation/deactivation races, unique code/barcode constraints, all role permissions, internal credential rejection, session revocation, UI CRUD/filter/pagination and DEV-1 regressions. Run migration and seed against disposable product_db, not production data.

## DEV-3 verification pending

Added stock rule, input validation and receipt snapshot test sources. No build/lint/format/typecheck/Jest/DB/browser/Docker commands executed for this branch. Required local tests: repeat confirm, cancelled receipt rejection, atomic failure across multiple products, concurrent last-stock reservations, same invoice payload retry/conflict, repeat commit/release and opposite transition rejection, stale adjustment and reserved floor, supplier/receipt RBAC, internal credential and gateway route isolation. Test with real PostgreSQL; no runtime PASS claimed.

## DEV-4 verification pending

Added Builder, Factory Method, Strategy, Facade and saga reconciliation unit test sources. Build/lint/format/typecheck/Jest/PostgreSQL/browser/Docker NOT RUN. Required tests: prepare same key replay and payload conflict, competing checkout for last item, invalid price/qty/payment, confirm/cancel race, timeout after remote commit, restart recovery, duplicate payment/outbox prevention, invoice owner isolation, price snapshot, print and POS retry. Verify 20-attempt exhaustion and manual reconciliation procedure. No runtime PASS claimed.

## DEV-5 verification pending

Added event validation, Vietnam report period and outbox worker test sources. NOT RUN: install, build, lint, format, typecheck, Jest, PostgreSQL, RabbitMQ, browser, Docker. Lockfile must be regenerated before frozen install. Acceptance: broker down checkout succeeds and outbox remains pending; broker up publisher resumes; Report down durable backlog; restart and consume; duplicate event/invoice no double-count; invalid payload DLQ; transient retry; GMT+7 date boundary; report RBAC; stock summary failure isolated from revenue. Verify topology and broker confirm behavior with real RabbitMQ. No runtime PASS claimed.

## DEV-6

See [DEV-6 verification runbook](dev6-verification.md). Source-only acceptance harness and regression fixes; all new checks NOT RUN. DEV-5 frozen lockfile remains blocked until local regeneration.
