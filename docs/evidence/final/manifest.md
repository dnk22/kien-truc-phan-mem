# FINAL evidence manifest — 24/11/2026 GMT+7

Branch main; start/end HEAD 5274c90. Working tree initially clean; no agent commit/PR/tag/deploy. Original Master/DOCX hashes verified unchanged in source-baseline.json. Current code is uncommitted work on the active branch; commit alone does not identify the review diff, so use changed-files.md/json and code-review.diffstat.txt.

Environment: macOS arm64, Apple M1 Pro 10 CPU/32GiB; Node22.22.2, pnpm10.32.1, Docker29.9.3, Compose5.7.0, Buildx0.38.1. Docker VM10 CPU/~8GiB. PostgreSQL17.7, RabbitMQ4.2.1, Chrome headless via Playwright1.57.0. Dedicated project minimart-final, Web3300/Gateway8080, env /tmp/minimart-final.env; no secrets copied into this folder.

## Commands and actual outcomes

| Command / method | Exit/result | Evidence |
|---|---|---|
| pnpm install --no-frozen-lockfile | 0, lockfile synchronized | pnpm-lock.yaml diff; frozen verification |
| pnpm install --frozen-lockfile | 0 PASS | quality-gates.log/json |
| pnpm db:generate; pnpm format; pnpm build; pnpm lint; pnpm typecheck; pnpm test; pnpm format:check | all 0 PASS | quality-gates.log/json |
| Jest | 24 suites/65 tests PASS, 0 skipped | quality-gates.log; native-tests.log prior corroborating run |
| docker compose -p minimart-final --env-file /tmp/minimart-final.env config --quiet | 0 PASS | runtime-final.log |
| Compose build --print → buildx bake sequential (7 targets, exact workspace NFC/NFD entitlements) | all images exit 0 | docker-build.log; last up in that log failed during Desktop incident, not hidden |
| Web rebuild with OpenSSL | 0 PASS; recreate 0 | docker-web-fixed.log |
| docker compose -p minimart-final --env-file /tmp/minimart-final.env up -d --no-build | 0 after Desktop recovery | runtime-final.log, compose-ps.json |
| Explicit demo seed; migrate replay, Prisma diff, seed twice and production guard | PASS R02 | dev6.log, migration-seed.json, migrations-*.json |
| VERIFY_DISPOSABLE=true VERIFY_FAULTS=true node --env-file=/tmp/minimart-final.env scripts/verify-dev6.mjs | 0 PASS, 5 assertion groups | dev6.log |
| VERIFY_DISPOSABLE=true VERIFY_FAULTS=true node scripts/verify-final.mjs | 0 PASS, 41 cases in full invocation | acceptance.log, acceptance-runs.json |
| VERIFY_STAGE=browser node scripts/verify-final.mjs (same disposable variables) | 0 PASS, final 8 cases | browser.log, acceptance-browser.json |
| Post-browser consistency + reporting SQL/API | 0 PASS D01/D02; 43 cases before A18 supplement | data-checks.log, acceptance.json |
| Benchmark 20 clients, 400 requests per endpoint | PASS 0 errors, p95 43.94/31.79ms | performance.json |
| Source hash/evidence credential audit | PASS | final-review-progress.md, source-baseline.json |
| UML render/sync and DOCX edit | NOT_RUN; FINAL-3 | docs/uml/README.md |

All acceptance commands set VERIFY_COMPOSE_PROJECT=minimart-final, VERIFY_ENV_FILE=/tmp/minimart-final.env and VERIFY_WEB_URL=http://localhost:3300. Tools package default /tmp/minimart-verification/package.json; CHROME_PATH optional. See release.md for exact reproducible setup. Initial sandbox-only pnpm used a different cache and requested TTY; re-running with the existing pnpm/Prisma cache succeeded, without changing lockfile policy.

Boundary supplement: boundaries.log/api-boundaries.json record A18 direct service role/JWT denials and actual CORS preflight/CSRF rejection (exit0). acceptance.json now has44 unique cases; data-checks.log truthfully records43 before this final boundary supplement.

## Result interpretation

acceptance.json aggregates the **latest executed result per ID**: R01–03/A01–18/D01–02 =23 runtime/API/SQL groups; F01–12 =12 real faults; U01–08 =8 browser groups; P01 =1 benchmark. Total44/44 PASS, no skipped/blocked mandatory local cases. Do not add repeated browser/D01 runs or DEV-6's overlapping groups. Jest24/65 is separate (18 pure unit suites/59 tests and 6 in-process HTTP health suites/6 tests with mocked DB ports).

acceptance-initial.log/json retain the first failed virtual-dropdown test; browser-dropdown-retry.log/json retain a later pointer-interception failure. Final keyboard/search selection verifies actual backend creation/stock, without forced fake success. docker-web-rebuild.log retains the cancelled no-OpenSSL build; docker-web-fixed.log is the accepted image. Docker Desktop start deadlock and recovery are recorded in progress. Test fault logs contain intentional missing-queue/constraint errors; final outcomes and restored health determine acceptance.

## Data and visual evidence

- compose-ps.json: 9 healthy containers, published ports only Web/Gateway; no temporary proxy remains.
- migrations-identity/product/inventory/sales/report.json: applied migration IDs and completion timestamps; migration-seed.json records pre-replay counts.
- topology.json: durable main/retry/dead queues and arguments; openapi.json: actual Gateway document; correlation.json: sanitized structured records across services.
- data-invariants.json: 55 real invoices, 34 completed, 34 projected facts, 34 SENT outbox; movement quantities, actors, reservations, payment/change and totals reconcile after final browser run.
- performance.json: host/VM, dataset46 products/12 categories at measurement, duration, concurrency, request count, error rate, p50/p95/max; two protected READ endpoints only. Later UI fixtures increase dataset; this is a measured snapshot, not a claim about arbitrary data size or writes.
- login-desktop.png, users-desktop.png, products-desktop.png, warehouse-receipt.png, inventory-desktop.png, pos-ready.png, pos-cash-completed.png, pos-bank-completed.png, invoice-desktop.png, dashboard-desktop.png, reports-desktop.png, swagger-desktop.png.
- products-loading.png/products-empty.png/products-error.png: delayed/empty/aborted real requests and recovery; pos-mobile.png/navigation-mobile.png: actual390×844 viewport.
- payment-retry-completed.png: same confirm key survived browser refresh and successful retry. invoice-print.pdf: actual Chromium print rendering and window.print callback verified; no physical printer claim.
- browser-failure.png is failure evidence, not a successful demo screenshot.

## Scope limits / FINAL-3

At-least-once events with idempotent processing; single store/replica; manual bank confirmation; no external deployment, production HTTPS/HA/backup-restore/security audit or physical-printer test. Multi-tab refresh and operator/DLQ tooling remain limited. Requirement matrix has57 FR +21 BR +10 NFR; source groups are explicitly decomposed, BR07 verified by unit and NFR04 by source review, NFR01 only two representative READ benchmarks. See report-evidence.md; do not describe all88 as exhaustive runtime proof.

Before DOCX: confirm per-ID interpretation, reconcile/render/inspect UML class/sequence changes, choose final screenshots, annotate controlled timezone and retry-limit fixtures, and obtain separate authorization for report edits. Source DOCX remains unchanged.

## FINAL-3 provenance bổ sung (25/11/2026)

Giữ nguyên snapshot/logs FINAL-2 phía trên. Bản manifest nguyên gốc được bảo toàn ở [manifest-final2-original](../final3/manifest-final2-original.md). HEAD hiện tại fe96c3e, parent5274c90, local origin/main cùng HEAD (không fetch/push). Commit chứa đúng282 changed paths đã ghi nhận; không có historical working-tree per-file hash manifest để chứng minh byte identity. Không gán lần test cũ cho commit mới. Chi tiết [provenance.json](provenance.json).

FINAL-3 không đổi apps/packages/schema/lockfile. Khôi phục9 container hiện có, không reset volume; chụp bổ sung read-only (login tạo sessions), không chạy lại full acceptance. [Runtime snapshot](../final3/runtime-current.json), [queue snapshot](../final3/queues-current.json), [capture](../final3/capture.json).

Ảnh login/dashboard/inventory gốc là loading; ảnh report cũ có25 invoice ở thời điểm sớm hơn. Dùng ảnh thay thế đã settled và xem [screenshot review](../final3/screenshot-review.json). Pixel crops giữ bản gốc và tọa độ [crops](../final3/crops.json). PDF gốc giữ nguyên, không physical printer claim. [Current traceability audit](../../requirement-id-reconciliation.md) phân biệt79 runtime-supported,7 partial,1 unit,1 source; không sửa traceability.json lịch sử.
