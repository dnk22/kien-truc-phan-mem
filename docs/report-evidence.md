# Report evidence and traceability – candidate

No new runtime evidence captured. All rows below refer to implementation candidates; mark PASS only after execution on the final commit.

| Requirement group | Source | Verification |
|---|---|---|
| FR01–09 identity/users | identity-service modules, web auth/users | verify:dev1 regression, role UI |
| FR10–19 catalog | product-service catalog, web categories/products | verify:dev6, search/filter/status/price |
| FR20–25 suppliers | inventory supplier repository/controller, web suppliers | verify:dev6 + history/disable |
| FR26–36 inventory | receipt/stock/reservation repositories, web inventory | confirm replay, stock invariant, adjustment version |
| FR37–49 sales | sales module, web pos/sales | prepare/confirm replay, concurrent reserve, payment/print |
| FR50–57 reporting | outbox/report modules, web reports | outage/catch-up, duplicate event, GMT+7 |
| BR01–03 | Identity unique/lock/RBAC | auth regression |
| BR04–06,11,20 | Catalog constraints/status | duplicate, inactive product, historical reference |
| BR07–10,12,17–18 | Inventory constraints/transactions | positive qty, receipt confirm, insufficient stock, movement/threshold |
| BR13–16,21 | Sales builder/payment/state/idempotency | total/change/snapshot/replay |
| BR19 | report projection completed event | revenue reconciliation |
| NFR01 | CRUD latency | 20 concurrent users, p95 measured; target 500ms |
| NFR02–04 | auth, service separation, layered DI | RBAC, DB isolation, source review |
| NFR05–06 | reservation, saga, outbox | retry/race/fault injection |
| NFR07–08 | shared UI and test suites | desktop/mobile, unit/API/E2E |
| NFR09–10 | Compose, health, correlation/logger | compose ps, health, trace |

Evidence collection after local verification (suggested filenames under docs/evidence/final/):
- 01-login, 02-users-role, 03-products, 04-receipt, 05-stock, 06-pos-ready, 07-payment, 08-invoice-print, 09-dashboard, 10-reports (actual screenshots).
- 11-compose-ps.txt, 12-swagger.png, 13-quality-gates.log, 14-integration.log, 15-outage-recovery.log, 16-db-invariants.log, 17-performance.log.
- manifest.md: exact git commit, date/time/timezone, Node/pnpm/Docker versions, command, result PASS/FAIL/NOT RUN/BLOCKED, evidence path. Redact JWT, cookies, DB credentials, personal data. No generated placeholder screenshot should be represented as actual UI.

Update DOCX chapters 2–5 with actual architecture, UML, class/file references, screenshots and test results only after Codex review. Keep original cover and source report unchanged until explicitly editing.
