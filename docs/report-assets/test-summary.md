# Test summary để dùng Chương5

Đây là review kết quả lịch sử FINAL-2 (24/11/2026), không phải chạy lại suites tại fe96c3e hoặc working tree FINAL-3. 44 unique case IDs được tổng hợp latest-result; full invocation41 + browser final8 + D01/D02 + A18 có overlap, không cộng thành tổng lượt test. Source/logs được kiểm tra tồn tại và đối chiếu nội dung. R01 health thật độc lập với6 health specs mocked Prisma.

| Nhóm                             | Suites | Cases/groups         | Passed | Failed | Skipped | Nguồn                                    |
| -------------------------------- | ------ | -------------------- | ------ | ------ | ------- | ---------------------------------------- |
| Jest pure unit                   | 18     | 59                   | 59     | 0      | 0       | quality-gates.log; health specs excluded |
| Jest HTTP health (mock DB ports) | 6      | 6                    | 6      | 0      | 0       | 6 health.spec.ts; not DB integration     |
| Real API/runtime/SQL             | —      | 23                   | 23     | 0      | 0       | R01–03,A01–18,D01–02                     |
| Fault injection (real DB/broker) | —      | 12                   | 12     | 0      | 0       | F01–12                                   |
| Browser E2E                      | —      | 8                    | 8      | 0      | 0       | U01–08                                   |
| Benchmark                        | —      | 1                    | 1      | 0      | 0       | P01                                      |
| DEV-6 regression                 | —      | 5 overlapping groups | PASS   | 0      | 0       | dev6.log; not added to44                 |

## Quality gates

| Command                        | Exit | Result | Log                                 |
| ------------------------------ | ---- | ------ | ----------------------------------- |
| pnpm install --frozen-lockfile | 0    | PASS   | ../evidence/final/quality-gates.log |
| pnpm db:generate               | 0    | PASS   | ../evidence/final/quality-gates.log |
| pnpm format                    | 0    | PASS   | ../evidence/final/quality-gates.log |
| pnpm build                     | 0    | PASS   | ../evidence/final/quality-gates.log |
| pnpm lint                      | 0    | PASS   | ../evidence/final/quality-gates.log |
| pnpm typecheck                 | 0    | PASS   | ../evidence/final/quality-gates.log |
| pnpm test                      | 0    | PASS   | ../evidence/final/quality-gates.log |
| pnpm format:check              | 0    | PASS   | ../evidence/final/quality-gates.log |

##44 IDs và labels thực tế

| ID  | Nội dung                                                                                    | Kết quả |
| --- | ------------------------------------------------------------------------------------------- | ------- |
| R01 | nine healthy containers; only Web/Gateway host ports; internal health endpoints             | PASS    |
| R02 | five migrations replay and Prisma schema diff; seed preserves edits and identities          | PASS    |
| R03 | durable broker topology and Gateway OpenAPI public schemas                                  | PASS    |
| A01 | wrong password and login for four roles                                                     | PASS    |
| A02 | locked account and revoked sessions rejected by business services                           | PASS    |
| A03 | backend role matrix and internal API isolation                                              | PASS    |
| A04 | product/category unique constraints, nullable barcode and category state                    | PASS    |
| A05 | zero-stock catalog is included in stock listing and low-stock report                        | PASS    |
| A06 | receipt draft/cancel/replay and role restrictions                                           | PASS    |
| A07 | suppliers active-only lookup, history and receipt draft update                              | PASS    |
| A08 | insufficient stock and multi-product reservation rollback                                   | PASS    |
| A09 | concurrent purchase of last unit, idempotent release and transition rules                   | PASS    |
| A10 | prepare/confirm replay, payload conflict, cash change and price snapshot                    | PASS    |
| A11 | invoice ownership across two cashiers                                                       | PASS    |
| A12 | confirm/cancel race cannot leave paid stock released                                        | PASS    |
| A13 | stale stock adjustment and counted below reservation are rejected                           | PASS    |
| A14 | database constraints and five database credential isolation                                 | PASS    |
| A15 | Identity regression: CRUD/roles/password, refresh rotation/replay, logout, unique username  | PASS    |
| A16 | Supplier edit/search and catalog inactive product cannot sell                               | PASS    |
| A17 | Correlation and structured logging propagate through Gateway and business calls             | PASS    |
| F01 | Report down does not block checkout and backlog catches up                                  | PASS    |
| F02 | broker outage preserves pending outbox and publisher reconnects                             | PASS    |
| F03 | duplicate event/invoice remain idempotent through real RabbitMQ                             | PASS    |
| F04 | poison event is dead-lettered without creating report facts                                 | PASS    |
| F05 | transient DB failure retries; missing retry queue cannot lose a sale                        | PASS    |
| F06 | retry budget sends failed delivery to DLQ, retained original later projects                 | PASS    |
| F07 | timeout before-reserve reconciles reservation safely                                        | PASS    |
| F08 | timeout after-reserve reconciles reservation safely                                         | PASS    |
| F09 | Sales restart after remote commit completes once after reconciliation                       | PASS    |
| F10 | failed local completion after remote commit preserves payment and recovers                  | PASS    |
| F11 | exhausted recovery retains payment/reservation; same-key operator retry is safe             | PASS    |
| F12 | GMT+7 day boundaries reflect real checkout source transactions                              | PASS    |
| P01 | representative protected CRUD reads, 20 concurrent clients, p95 <= 500ms                    | PASS    |
| U01 | Manager creates category, product, supplier through production UI                           | PASS    |
| U02 | Warehouse drafts receipt; Manager confirms; real inventory increases                        | PASS    |
| U03 | Cashier cart, READY refresh, cash/change, invoice print and stock decrease                  | PASS    |
| U04 | Manual bank transfer, interrupted prepare reuses original key and cancels safely            | PASS    |
| U05 | Dashboard/report, role guards, empty/error/retry, mobile and session refresh                | PASS    |
| U06 | Admin user create/edit/lock/unlock/role via UI                                              | PASS    |
| U07 | Logout and second cashier cannot reuse previous actor cart/checkout                         | PASS    |
| U08 | Interrupted payment preserves confirm key across refresh and retries once                   | PASS    |
| D01 | SQL invariants: stock, payments, reservations, invoice totals and projection                | PASS    |
| D02 | SQL reconciles report quantities/top/payment/low-stock; completed invoice cannot be deleted | PASS    |
| A18 | Direct service JWT/RBAC plus CORS custom headers and CSRF rejection                         | PASS    |

## TC01–15 trong DOCX block213

| Original TC | Actual refs |
| ----------- | ----------- |
| TC01        | A01         |
| TC02        | A03,A18     |
| TC03        | A04         |
| TC04        | A06,U02     |
| TC05        | A06         |
| TC06        | A08         |
| TC07        | A09         |
| TC08        | A10,U04,U08 |
| TC09        | A10         |
| TC10        | F01         |
| TC11        | F01         |
| TC12        | F02         |
| TC13        | F02         |
| TC14        | F03         |
| TC15        | A10         |

## Benchmark (READ only)

Hardware: Apple M1 Pro, 10CPU, 34359738368 bytes host; cpus=10 memory=8319438848. macOS arm64, Nodev22.22.2. Dataset {'products': 46, 'categories': 12}. Protected Gateway with live-session checks.

| Endpoint                       | Clients | Requests | Seconds | P50 ms | P95 ms | Max ms | Error rate |
| ------------------------------ | ------- | -------- | ------- | ------ | ------ | ------ | ---------- |
| /products?page=1&pageSize=20   | 20      | 400      | 0.58    | 26.13  | 43.94  | 87.22  | 0          |
| /categories?page=1&pageSize=20 | 20      | 400      | 0.47    | 22.45  | 31.79  | 53.72  | 0          |

## Data consistency

| Snapshot           | Invoices total | COMPLETED | Payments                | Facts | SENT outbox | Reservation/movement                           |
| ------------------ | -------------- | --------- | ----------------------- | ----- | ----------- | ---------------------------------------------- |
| FINAL-2 historical | 55             | 34        | One per completed (D01) | 34    | 34          | COMMITTED; actor/quantity/stock reconcile      |
| FINAL-3 read-only  | 55             | 34        | 34                      | 34    | 34          | See runtime-current.json; no new sales created |

Current read-only snapshot time: 2026-11-25T14:09:14.641726+00:00. Auth captures may create refresh-session metadata only. No data changed to preserve34. Runtime files contain9 healthy containers; historical20 cross-DB denials A14; durable main/retry/dead queues and basic-return failure F05. No physical printer, production HTTPS/HA/backup-restore tests.
