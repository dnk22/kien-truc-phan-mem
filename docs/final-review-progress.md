# FINAL-1 / FINAL-2 — kết quả triển khai và nghiệm thu

Ngày 24/11/2026 GMT+7. Branch **main**, start/end HEAD **5274c90**; working tree ban đầu sạch. DEV-0–7 đã có trong lịch sử merge (DEV-6/7 qua merge lồng). Không tạo branch, PR, commit, merge, tag hoặc deploy. Master Markdown và source DOCX giữ nguyên, SHA256 đã kiểm tra lại.

## Trạng thái phase

| Phase                                       | Kết quả                         | Bằng chứng                                                                     |
| ------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| F1.0 discovery                              | DONE                            | source-baseline.json, branch/merge review                                      |
| F1.1 dependencies/environment               | PASS                            | AMQP pinned lockfile, frozen install                                           |
| F1.2–F1.6 business/pattern/API/UI/DB review | DONE; fixes verified            | issue table, source diff, tests                                                |
| F1.7 quality                                | PASS                            | 8 commands exit 0; 24 Jest suites / 65 tests                                   |
| F2.1 Docker                                 | PASS after environment recovery | 7 images; 9 healthy containers, 5 fresh DB migrations, replay/schema diff/seed |
| F2.2 acceptance                             | PASS in local scope             | A01–A18, R01–R03, role UI                                                      |
| F2.3 integration/faults                     | PASS                            | DEV-6 + F01–F12, real PostgreSQL/RabbitMQ                                      |
| F2.4 consistency                            | PASS                            | D01/D02 SQL/API, 34 completed = 34 facts = 34 SENT outbox                      |
| F2.5 browser                                | PASS                            | U01–U08 on final Nginx image/Chrome; screenshots/PDF                           |
| F2.6 performance                            | PASS for representative reads   | 20 clients ×20 requests, products p95 43.94ms/categories 31.79ms, error rate 0 |
| F2.7 demo                                   | READY for local review          | 4 roles, real receipt/stock/cash/bank/invoice/projection fixtures              |
| F2.8 documentation                          | DONE                            | 88 individual trace rows, updated runbooks and evidence manifest               |
| FINAL-3                                     | NOT_STARTED                     | UML synchronization/render and DOCX await separate review                      |

Acceptance totals: **44 unique case IDs, 44 PASS, 0 FAIL/SKIP/BLOCKED** in latest aggregate. This is 23 API/runtime/SQL cases +12 faults +8 browser +1 benchmark. Jest is separate: 18 pure unit suites/59 tests plus 6 HTTP health suites/6 tests with mocked DB ports, total 24/65. Web `test` is typecheck. DEV-6 separately passed 5 assertion groups; do not add duplicates to 44.

Full acceptance invocation passed 41 cases; final browser rerun added U08 and checked rebuilt Web, then D01 was rechecked and D02 added after all UI mutations. A18 finally verified direct business-service JWT/RBAC plus CORS/CSRF boundaries. Latest result per ID is retained, rather than summing retries. See acceptance-runs.json, acceptance.log, browser.log and data-checks.log. Initial harness failures are preserved separately; they are not silently represented as successful first runs.

## Issues found and fixed

| ID        | Severity             | Issue / root cause                                                                           | Files (main locations)                                                                                    | Fix                                                                                     | Verification                                                          |
| --------- | -------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| FINAL-001 | P0 build blocker     | Sales/Report manifests added AMQP without lockfile importers                                 | pnpm-lock.yaml                                                                                            | synchronize exact amqplib 0.10.9/types 0.10.7                                           | frozen install, all builds, real broker                               |
| FINAL-002 | P2                   | docs still described unimplemented DEV-5 and blocked Docker                                  | README.md, docs/\*                                                                                        | reconcile actual source/results and retain historical sections as history               | evidence/trace matrix reviewed                                        |
| FINAL-003 | P1                   | stock list/summary omitted products never received; adjustment could not initialize zero row | Product internal controller; Inventory domain/client/StockService/repository                              | authenticated catalog merge with zero defaults; transactional adjustment initialization | stock unit specs, A05/R02/D02/U02                                     |
| FINAL-004 | P0 data-loss risk    | retry publisher confirm alone can ACK an unroutable retry                                    | report/infrastructure/rabbitmq.consumer.ts                                                                | mandatory publish, return detection, reconnect without ACK original on failure          | F05 deletes retry queue during real DB fault; recovered sale projects |
| FINAL-005 | P2                   | missing SALE actor/correlation propagation; Builder accepted blank snapshots/large quantity  | Sales orchestrator/stock port/client/Builder; Inventory commit; auth LiveSessionGuard and Product clients | propagate cashier/correlation; validate Int32/nonblank fields                           | unit, A17, D01, F09                                                   |
| FINAL-006 | P2                   | Gateway OpenAPI lacked write/query/payment/idempotency schema and checkout status metadata   | api-gateway/src/openapi.ts/main/controllers; shared bootstrap                                             | complete public request/error/envelope docs; HTTP 200 checkout metadata                 | R03, captured OpenAPI, browser Swagger                                |
| FINAL-007 | P2                   | recovery exhaustion unclear; mobile picker title/cart overflow                               | InvoiceSummary, ProductPicker, CartPanel, styles.css                                                      | show reconciliation notice, local table scroll and mobile header wrapping               | U03–U08, reviewed actual screenshots                                  |
| FINAL-008 | P2 quality gate      | 4 health specs construct Prisma without test DATABASE_URL                                    | Product/Inventory/Sales/Report health specs                                                               | override Prisma port while retaining HTTP health assertion                              | all 24 suites PASS; actual DB health separately R01                   |
| FINAL-009 | P1 test isolation    | DEV-6 faults used default Compose project/origin                                             | scripts/verification/dev6/http.mjs, faults.mjs                                                            | honor named project/env/web origin                                                      | DEV-6 on minimart-final; no unrelated service stopped                 |
| FINAL-010 | P1 build reliability | Web installs whole workspace but Node slim lacks OpenSSL for Prisma postinstall              | apps/web/Dockerfile                                                                                       | add OpenSSL/CA in build stage                                                           | docker-web-fixed.log exit 0, final Web UI                             |
| FINAL-011 | P2 test harness      | virtual Select options outside viewport / intercepted pointer                                | final/browser.mjs                                                                                         | filter searchable options and choose with keyboard; keep backend/UI assertions          | final 8 browser cases exit 0                                          |

## Environment and recovery history

macOS arm64 / Apple M1 Pro, 10 CPU, host RAM 32 GiB; Docker 10 CPU / 8,319,438,848 bytes. Node 22.22.2, pnpm 10.32.1, Docker Engine/CLI 29.9.3, Compose 5.7.0, Buildx 0.38.1, PostgreSQL 17.7, RabbitMQ 4.2.1, Google Chrome headless via Playwright 1.57.0.

Docker Desktop was installed but stopped. Started it; registry auth/download and Compose Bake NFC/NFD filesystem errors were handled. Parallel installs stalled; sequential build succeeded. Desktop then hung all container starts (including minimal node/none-network probe); soft restart timed out, stopped eventually, reopening restored startup. Images and volumes preserved. Final only 9 expected healthy containers remain, no fault proxy. This environment incident is not a product PASS inferred from native checks.

Port 3000 belongs to another user project and was not touched. Local demo: **http://localhost:3300/login**, Gateway/Swagger **http://localhost:8080/docs**. Test env /tmp/minimart-final.env, project minimart-final, own named volumes. Only Web and Gateway publish ports. Root/user `.env` was not overwritten. Docker remains running for review.

## Files and review groups

Exact created/modified inventory: [changed-files.md](changed-files.md) and evidence/final/changed-files.json. Groups: dependencies/build; catalog/stock; Saga/messaging/audit; Gateway/shared API; UI; unit/harness; documentation/evidence. Initial tree was clean and `pnpm format` was explicitly required, so broad Prettier normalization is retained; review it separately from semantic fixes. No schema/migration structure change or original report edit.

## Residual risks / limits

- P2: local single store/replica only; recovery/publisher workers have no multi-replica lease. Database-wide advisory locks trade throughput for correctness. No HA claim.
- P2: after recovery limit, no dedicated operator console/DLQ replay UI. Same-key recovery is verified, but operator must preserve original key/payload and reconcile before retry; never collect twice or manually alter stock.
- P2: no production HTTPS/Secure-cookie deployment, full dependency security audit, backup/restore or physical printer verification. Bank transfer is manual confirmation.
- P2: benchmark covers 2 protected READ endpoints on a small dataset (46 products/12 categories at measurement), not all writes or a production SLA. Bundle >500KB warning remains.
- P2: multi-tab refresh coordination not implemented; replay/lost response can require login. Rate limiter is per process.
- P2: catalog-wide low-stock/summary scans pages over REST, linear cost; no atomic catalog+stock snapshot across services. Suitable for coursework dataset, not large-scale reporting.
- P2 documentation: original DOCX groups requirement IDs; the 88-row matrix is an explicitly identified decomposition. Confirm numbering and render/synchronize UML at FINAL-3. Source report remains unchanged.

No unresolved P0/P1 observed in accepted local flows. Controlled invalid events remain in DLQ as fault evidence; every valid completed sale reconciles and all real outbox rows are SENT. No fake completed invoices/report facts were seeded. Timezone fixtures changed timestamps of genuinely checked-out sales while broker was offline. Retry exhaustion fixture sets attempts=19 to test threshold behavior, not a fabricated 20-attempt duration.
