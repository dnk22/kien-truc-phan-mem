# Implementation architecture – FINAL review

Client-server: React/Vite web -> Nest API Gateway -> five business services. Each service has its own PostgreSQL database/user in one instance; no cross-DB FK or queries. Public REST /api/v1; internal /internal/v1 credential-protected, not forwarded. Only web (WEB_PORT default 3000) and gateway (GATEWAY_PORT default 8080) published; acceptance web uses 3300. Identity 3001, Product 3002, Inventory 3003, Sales 3004, Report 3005. RabbitMQ durable direct exchange, report queue, retry and DLQ.
Layered backend: presentation -> application -> domain ports; infrastructure adapters implement ports via DI. Feature-based frontend with shared table/form/query utilities. JWT and live session verification; availability depends on Identity. Sales calls Product and Inventory synchronously; Inventory calls Product; Report reads Inventory summary. Sales completes invoice/payment/stock orchestration and writes outbox; Report projects asynchronously.
See [patterns](design-patterns.md) and [API index](api-index.md).

## Deviations / trade-offs to reconcile with original report

- Invoice READY and RECOVERY plus persisted saga intent; payment recorded before stock commit, no automatic payment rollback.
- Single-store advisory lock serializes writers, not per-row locking. Single replica workers; no multi-replica lease.
- Inventory lists/summary read the catalog over authenticated internal REST and merge stock rows; new products are included with zero stock. Low-stock scans catalog pages; this has linear cost and is intended for the single-store coursework dataset.
- Snapshot product data at receipt draft, cross-service validation not transactional.
- No external bank gateway, no automatic reservation expiration, no DLQ replay UI. Dashboard updatedAt is latest processed event, not proof backlog empty.
- Runtime performance results are recorded in evidence/final/performance.json when executed. Gateway OpenAPI now includes body/query/idempotency/envelope documentation; runtime schemas remain governed by service validators.
- AMQP lockfile synchronized; current acceptance results in final-review-progress.md. Preserve source DOCX until FINAL-4. Current diagrams/package: [FINAL-3](final3-progress.md), [UML](uml/README.md), [architecture summary](report-assets/architecture-summary.md).

Report retry publishes with mandatory routing and publisher confirm before acknowledging the source. If retry routing fails, close the consumer connection and redeliver the unacknowledged original; delivery remains at-least-once with idempotent projection. SALE movement records the cashier actor; correlation ID is forwarded through live-session, product and inventory HTTP calls.
