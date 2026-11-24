# DEV-5 Event-Driven Reporting

## Public API

Manager only, bearer JWT plus live session, normal API envelope.

- GET /api/v1/reports/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD: inclusive local calendar dates, max 366 days, GMT+7. Returns revenue, invoiceCount, quantitySold, zero-filled daily trend, paymentMethods, topProducts (10 by quantity), updatedAt (latest processed event globally).
- GET /api/v1/reports/inventory: live Inventory internal summary, independently fails if inventory unavailable. Counts all catalog products including zero-stock through Inventory internal summary.

## Delivery

Exchange minimart.sales (direct, durable), routing key sale.completed.v1, queue minimart.report.sale-completed.v1 (durable). Sales declares topology before publishing, even when Report is offline. Outbox worker polls every 2 seconds, sends persistent mandatory message, awaits broker confirm and then marks SENT. Failures retain PENDING with capped backoff. Single publisher replica V1. Crash after confirm before SENT may deliver duplicates. Report stores processed event and invoice/item facts in one local transaction; duplicate eventId or invoiceId is ignored. ACK after transaction. Invalid event goes to dead-letter queue; transient failures republish to durable 10-second retry queue with mandatory routing/return detection and confirm before acknowledging original, up to five retries, then dead-letter. Consumer reconnects after disconnect. No cross-DB read. Delivery is at-least-once, not exactly-once.

## Dependency gate

Pinned amqplib 0.10.9 and @types/amqplib 0.10.7 in Sales/Report are synchronized with pnpm-lock.yaml. Frozen install/build and Jest pass; actual broker results in FINAL acceptance.json and logs. No commit created by the review.

Known limitations: shared topology definitions duplicated between producer and consumer; no broker-specific readiness metric, no DLQ replay UI, no publisher lease for multiple replicas, no automatic replay of dead-letter messages. A projection timestamp is not proof that backlog is empty.
