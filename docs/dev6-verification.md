# DEV-6 verification runbook

Status: source-only implementation; no runtime test results on this branch.

## Local quality gate
1. Use Node 22 and pnpm 10.32.1. Run pnpm install --no-frozen-lockfile to regenerate the DEV-5 AMQP lockfile. Review and commit the lockfile. Run pnpm install --frozen-lockfile.
2. Run pnpm format, pnpm build, pnpm lint, pnpm typecheck, pnpm test, pnpm format:check. Fix failures; do not suppress checks.
3. Use a disposable local Compose project with demo environment and fresh volumes. Copy .env.example to .env only if absent. Run docker compose config and docker compose up --build -d. Check docker compose ps and service health. Seed demo accounts explicitly if required by existing README.
4. Run VERIFY_DISPOSABLE=true pnpm verify:dev6. Run VERIFY_DISPOSABLE=true VERIFY_FAULTS=true pnpm verify:dev6 for outage tests on the same isolated stack, with no other users or traffic. Scripts create test records and stop/restart Report and RabbitMQ; do not use on a shared or production stack. Capture stdout/stderr.
5. Test browser login/role menus, product, receipt, stock adjustment, POS cash/transfer, invoice print, dashboard and reports, desktop/mobile. Capture actual evidence, not fabricated screenshots.

## Acceptance matrix
| Case | Evidence expected | Status |
|---|---|---|
| Product unique code, role restrictions | verify:dev6 | NOT RUN |
| Receipt confirm replay | verify:dev6 | NOT RUN |
| Prepare/confirm replay and payload conflict | verify:dev6 | NOT RUN |
| Cash validation, old invoice price snapshot | verify:dev6 | NOT RUN |
| Competing reservation, release | verify:dev6 | NOT RUN |
| Report offline, backlog catch-up | VERIFY_FAULTS=true | NOT RUN |
| Broker offline, publisher catch-up | VERIFY_FAULTS=true | NOT RUN |
| Remote commit succeeded but local write failed | Jest mock fault test | NOT RUN |
| Duplicate event and duplicate invoice ID | Real RabbitMQ republish and report DB assertions | NOT RUN; manual |
| Invalid event / retry / DLQ | Real RabbitMQ injection and queue checks | NOT RUN; manual |
| Restart Sales after remote commit before completion | fault proxy + process restart + DB assertions | NOT RUN; manual |
| Confirm/cancel concurrent and multi-item rollback | real PostgreSQL/API race tests | NOT RUN; manual |
| Stale stock adjustment, reserved floor | API and PostgreSQL assertions | NOT RUN; manual |
| Cashier ownership across two accounts, token revoke | API assertions | NOT RUN; manual |
| P95 CRUD, 20 concurrent users | timed isolated benchmark | NOT RUN; manual |
| Migration from empty DB, five DB users cannot cross-connect | Compose/SQL assertions | NOT RUN; manual |
| Browser E2E, screenshots | actual browser | NOT RUN; manual |

Tests assume API gateway on localhost:8080, origin localhost:3000, four seeded accounts and a quiet test stack. The integration script verifies HTTP results, not direct DB invariants beyond stock response. JWT expiry, date rollover, top-ten report ranking and timeout behavior can affect runs; use a fresh stack and investigate rather than relaxing assertions. Do not report PASS for unexecuted tests.

## Review findings fixed in source
- Sales and Report used production NODE_ENV with local-demo JWT secret: align with APP_NODE_ENV as other services; production still rejects demo secret.
- Saga single-flight follower now checks latest persisted intent before advancing again.
- Publisher closes previous connection before opening replacement; consumer rejects negative retry counters.
- Added a mocked local completion failure after remote commit test.

Remaining: AMQP lockfile, compile/format checks for DEV-2–6, real broker and DB tests, worker leasing if multi-replica, DLQ replay procedure, manual recovery after exhausted Saga retries, zero-stock catalog coverage, complete Swagger DTOs. No release claim.
