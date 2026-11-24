# Tiến độ hiện hành — FINAL-1 / FINAL-2

Cập nhật 24/11/2026 GMT+7. `main`, start 5274c90, DEV-0–7 đã tích hợp qua các merge trước phiên. Working tree ban đầu sạch; không tạo branch/PR/commit/tag/deploy trong FINAL. Master Markdown và source DOCX giữ nguyên.

| Phần                              | Trạng thái                                                                                                                        |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| DEV-0–7 source                    | Đã tích hợp, review actual source                                                                                                 |
| FINAL-1 dependencies/review/fixes | Lockfile đồng bộ; sửa catalog zero stock, report retry routing, movement actor/correlation, Builder, Swagger, POS; xem issue list |
| Quality gates                     | 8/8 exit 0; 24 Jest suites, 65 tests                                                                                              |
| FINAL-2 runtime                   | PASS trong phạm vi local: 9 healthy containers, 44 acceptance cases; xem giới hạn ở manifest/progress                             |
| FINAL-3 DOCX/UML                  | Chưa thực hiện; giữ nguyên báo cáo gốc                                                                                            |

Chi tiết [progress](final-review-progress.md), [testing](testing.md), [requirement matrix](report-evidence.md), [evidence](evidence/final/manifest.md). Snapshot cũ dưới đây chỉ là lịch sử, không quyết định trạng thái hiện hành.

## Historical milestones

# Tiến độ triển khai

Master Specification: `Prompt_Codex_MiniMart.md`. Báo cáo DOCX là thiết kế tham chiếu; không sửa hai tài liệu nguồn. Cập nhật 24/11/2026 GMT+7. Đầu phiên chưa có Git repository; kiểm tra cuối phiên repository đang ở main, chưa có commit và source untracked. Commit/tag N/A; agent không init Git, tạo branch, commit hoặc PR.

| Milestone | Trạng thái                                   | Phạm vi                                                                            |
| --------- | -------------------------------------------- | ---------------------------------------------------------------------------------- |
| DEV-0     | Đã có foundation; Docker runtime vẫn BLOCKED | 7 apps, 4 shared packages, 5 DB, Docker/Compose, health/logging/env                |
| DEV-1     | Hoàn thành native; chờ review                | Identity, sessions, JWT/RBAC, Gateway auth/users, application shell, auth/users UI |
| DEV-2     | Code submitted; verification pending         | Product/category                                                                   |
| DEV-3     | Code submitted; verification pending         | Inventory/supplier/receipt/reservation/adjustment                                  |
| DEV-4     | Code submitted; verification pending         | Checkout/POS/Saga/GoF                                                              |
| DEV-5     | Chưa bắt đầu                                 | Outbox/RabbitMQ/Report                                                             |
| DEV-6     | Chưa bắt đầu                                 | Nghiệm thu toàn bộ nghiệp vụ, fault/concurrency/performance                        |
| DEV-7     | Chưa bắt đầu                                 | Demo/tài liệu/seed nghiệp vụ hoàn chỉnh                                            |

## DEV-1 implementation

- Identity layered modules Authentication/User/Role/Session; repository interfaces + Prisma implementations qua DI, không truy cập DB khác. Role enum duy nhất trong DB.
- Migration mới `20261124010000_identity`, giữ nguyên foundation migration; users và refresh_sessions với UUID, timestamp UTC, username/tokenHash unique, FK nội bộ và session indexes.
- Login bcrypt, JWT ngắn hạn đúng issuer/audience/signature/algorithm/exp; refresh HttpOnly cookie + rotation/family revocation; logout; me; password change thu hồi toàn bộ sessions. Live session/tokenVersion checking ở Identity làm rõ hiệu lực lock/role/logout.
- Admin-only user list/detail/create/profile/status/role, search/filter/pagination, DTO validation, DB unique conflict, không DELETE. Transaction advisory lock bảo vệ Admin cuối cùng khi request đồng thời; admin actor revalidated trong transaction.
- Gateway JWT/RolesGuard, route allowlist, forwarding cookie/correlation/status/envelope, timeout và login rate limit; không DB hoặc business user logic, không public internal paths.
- Demo seed explicit theo env, production bị chặn, không ghi đè existing users; không seed nghiệp vụ DEV-2.
- Web role-aware responsive shell, drawer/sidebar/header/breadcrumb/user dropdown; auth memory state, session restore/single-flight refresh; lazy routes; users CRUD/status/role UI nối API thật. Shared wrappers trên Ant Design.
- README/API/permissions/testing/architecture/demo/report evidence, 5 Identity PlantUML source diagrams, script kiểm chứng và screenshots thật.

## Review gate

Chỉ DEV-1 được triển khai trong phiên này; dừng trước DEV-2. Xem `testing.md` và `evidence/dev1` để đánh giá kết quả thực tế. Docker daemon vẫn không có socket; không suy diễn native PASS thành Docker/RabbitMQ runtime PASS. Production HTTPS/Secure cookie deployment chưa kiểm chứng, rate limiter in-memory và refresh đa tab/lost-response còn giới hạn đã ghi contract.

## Kết quả chốt DEV-1

Install frozen lockfile, build, lint, typecheck, 27 Jest tests trong 11 suites và format check PASS. `verify-dev1.mjs` exit 0: upgrade/seed/production seed guard, auth/users/RBAC/last-admin concurrency, correlation/CORS, browser E2E, real Swagger-origin login, rate limit 429, timeout/unavailable 503. `verify-native.mjs` exit 0: 7 app startup, migration/seed 5 DB, 20 cross-DB CONNECT denials, health/OpenAPI và DB down live 200/ready 503. Logs và screenshots tại `evidence/dev1/`; regression log tại `evidence/native-verification.log`. Docker daemon/Compose runtime/RabbitMQ vẫn BLOCKED; production HTTPS và nghiệp vụ DEV-2+ NOT_RUN.

## DEV-2 implementation candidate

Catalog layered repositories and application services; categories/products migration, development seed, public and private batch API, JWT/live-session RBAC, Gateway routing, React catalog features, shared UI reuse, validation tests and UML. See dev2-api.md. Runtime and quality gates have not been executed on this branch. DEV-3 not started.

## DEV-3 implementation candidate

Inventory schema, transactional repositories, supplier/receipt/stock/adjustment and reservation APIs, shared live session guard, Gateway, frontend screens, demo supplier seed, unit test sources and UML. See dev3-api.md. Runtime verification pending; DEV-4 not started.

## DEV-4 implementation candidate

Sales schema, two-stage POS, persistent checkout saga, recovery worker, payment strategies and creators, invoice builder and facade, public APIs, invoice history/detail/print, transactional outbox write, tests and UML. Publisher/consumer deferred to DEV-5. See dev4-api.md and design-patterns.md. Runtime verification pending.

## DEV-5 implementation candidate

Report DB projection, RabbitMQ publisher/consumer, retries/DLQ, revenue and stock APIs, dashboard and report views, test sources and UML. New AMQP dependencies require lockfile regeneration before build; verification pending. DEV-6 not started.

## DEV-6 implementation candidate

Added disposable-stack HTTP acceptance harness and optional Compose outage checks, targeted source fixes and verification matrix. Runtime execution remains pending. DEV-7 not started.

## DEV-7 source handoff

Release/demo runbooks, current architecture/API/RBAC documentation, grouped requirement traceability, UML overview and five schema-derived ERDs, release checklist and final evidence template added. Rendering and all runtime acceptance gates remain pending. No release tag; no source DOCX changes.
