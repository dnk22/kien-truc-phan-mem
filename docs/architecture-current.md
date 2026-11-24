# Implementation architecture – DEV-7 candidate

Client-server: React/Vite web -> Nest API Gateway -> five business services. Each service has its own PostgreSQL database/user in one instance; no cross-DB FK or queries. Public REST /api/v1; internal /internal/v1 credential-protected, not forwarded. Only web 3000 and gateway 8080 published. Identity 3001, Product 3002, Inventory 3003, Sales 3004, Report 3005. RabbitMQ durable direct exchange, report queue, retry and DLQ.
Layered backend: presentation -> application -> domain ports; infrastructure adapters implement ports via DI. Feature-based frontend with shared table/form/query utilities. JWT and live session verification; availability depends on Identity. Sales calls Product and Inventory synchronously; Inventory calls Product; Report reads Inventory summary. Sales completes invoice/payment/stock orchestration and writes outbox; Report projects asynchronously.
See [patterns](design-patterns.md) and [API index](api-index.md).

## Deviations / trade-offs to reconcile with original report
- Invoice READY and RECOVERY plus persisted saga intent; payment recorded before stock commit, no automatic payment rollback.
- Single-store advisory lock serializes writers, not per-row locking. Single replica workers; no multi-replica lease.
- Inventory list/summary only initialized stock rows, missing individual stock returns zero; full zero-stock catalog report pending.
- Snapshot product data at receipt draft, cross-service validation not transactional.
- No external bank gateway, no automatic reservation expiration, no DLQ replay UI. Dashboard updatedAt is latest processed event, not proof backlog empty.
- Runtime performance target p95 500ms/20 users not measured. Swagger request schemas incomplete.
- DEV-5 lockfile pending; DEV-2–7 acceptance not run. Update report after verification, not before.
