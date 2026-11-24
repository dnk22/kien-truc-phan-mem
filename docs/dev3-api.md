# DEV-3 inventory contract

All public endpoints use the existing envelope and live JWT session verification. Manager manages suppliers and confirms documents; warehouse reads active suppliers and creates/edits/cancels drafts; cashier reads stock only.

- GET/POST /api/v1/suppliers, GET/PATCH /api/v1/suppliers/:id, PATCH /api/v1/suppliers/:id/status.
- GET/POST /api/v1/purchase-receipts, GET/PATCH /api/v1/purchase-receipts/:id, POST /api/v1/purchase-receipts/:id/confirm or /cancel.
- Receipt input: supplierId, items [{productId,quantity,unitCost}]. PATCH replaces draft items. List filters supplierId/status.
- GET /api/v1/inventory (page/pageSize/search/productId/lowStock), GET /api/v1/inventory/:productId.
- GET /api/v1/inventory/movements (productId/page/pageSize).
- GET/POST /api/v1/inventory/adjustments, POST /api/v1/inventory/adjustments/:id/confirm or /cancel.
- Adjustment input: productId, expectedVersion, counted, reason.

## Internal Sales/Report contract

Require x-service-credential. Not exposed through Gateway.

| Method | Path                                                  |
| ------ | ----------------------------------------------------- |
| POST   | /internal/v1/stock/reservations                       |
| GET    | /internal/v1/stock/reservations/:id                   |
| GET    | /internal/v1/stock/reservations/by-invoice/:invoiceId |
| POST   | /internal/v1/stock/reservations/:id/commit            |
| POST   | /internal/v1/stock/reservations/:id/release           |
| GET    | /internal/v1/stock/summary                            |

Reserve body: { "invoiceId": "UUID", "items": [{ "productId": "UUID", "quantity": 1 }] }. Reject duplicate products; 1–100 items. Same invoice and same items returns existing reservation and current state, including terminal states. Different payload returns 409. Sales must inspect state before proceeding. Commit/release are idempotent for the same terminal state; opposite transition returns 409. No automatic expiration. Stock list/summary merges all catalog products via Product internal REST, including never-received products with zero quantities and current product metadata. Commit body optionally carries actorId UUID for SALE history. No cross-database access.

## Concurrency design

All inventory writes take one transaction-scoped PostgreSQL advisory lock (single-store V1). This serializes writers instead of per-product locks; trade-off is throughput. Database constraints enforce 0 <= reserved <= onHand. Reservation, stock changes and movement writes are atomic. Version increments on any quantity/reservation change. Product lookup happens before receipt create/update, outside local transaction; snapshot at draft time, not cross-service transactional validation.

## Remaining verification

Current actual results in final-review-progress.md and acceptance.json (R02, A05–A14, D01). Products never received appear as zero without materializing a DB row; adjustment creation can initialize zero row transactionally. Demo seed creates suppliers only; establish stock via confirmed receipts.
