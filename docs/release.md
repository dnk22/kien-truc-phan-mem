# DEV-7 – Local release runbook

Status: candidate, not accepted. Single store, single Sales publisher/recovery replica. Node 22, pnpm 10.32.1, Docker Compose V2. Use a disposable local stack.

## Preflight
- Verify branch contains DEV-2 through DEV-7; inspect git status and commit. Preserve source DOCX and master prompt.
- Resolve AMQP dependency lockfile: pnpm install --no-frozen-lockfile, inspect and commit lockfile, then pnpm install --frozen-lockfile.
- Run pnpm format, pnpm build, pnpm lint, pnpm typecheck, pnpm test, pnpm format:check. Stop on failure; do not disable tests.
- Copy .env.example to .env only if absent. Use local demo credentials only. Keep secrets out of Git and evidence.

## Start
```sh
docker compose config --quiet
docker compose up --build -d
docker compose ps
docker compose exec -e DEMO_SEED_ENABLED=true identity-service pnpm db:seed
docker compose exec -e DEMO_SEED_ENABLED=true product-service pnpm db:seed
docker compose exec -e DEMO_SEED_ENABLED=true inventory-service pnpm db:seed
```
Wait for healthy services before seed. Seed is intended to be idempotent; confirm on real DB. No stock is fabricated: create and confirm receipt. Login at http://localhost:3000/login; Swagger http://localhost:8080/docs. Four usernames admin, manager, cashier, warehouse; password from DEMO_PASSWORD.

## Verify
Run VERIFY_DISPOSABLE=true pnpm verify:dev6; optional VERIFY_FAULTS=true on isolated stack only. See dev6-verification.md for cases still manual. Check actual business APIs, migration parity, health, role/ownership, E2E and faults. Capture logs with secrets redacted. Gateway readiness alone does not prove all services or RabbitMQ healthy.

## Stop/reset
docker compose down preserves named volumes. Only for a confirmed disposable stack, after explicit decision to destroy ALL local data, docker compose down -v resets DB and broker. Never use on shared/production volumes. Rebuild and seed to restore demo.

## Troubleshooting
Frozen lockfile mismatch: regenerate and commit; do not weaken Dockerfile. 401: verify APP_NODE_ENV, JWT secret, session, cookie and clock. 503: inspect service logs and dependencies. Pending checkout: use invoice history and reconcile reservation; never collect twice or manually decrement stock. Pending outbox: restore broker, inspect pending rows and queue; do not mark SENT manually. DLQ: inspect event and fix cause before controlled replay using original eventId; never invent a sale. No automated DLQ replay or operator recovery UI is implemented.

Release gate: all mandatory acceptance cases pass with evidence; document residual risks. Only then create release tag if requested. Production HTTPS, secret rotation, backup/restore and multi-replica leasing are outside validated demo scope.
