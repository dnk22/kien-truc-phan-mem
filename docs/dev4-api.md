# DEV-4 Sales API

All endpoints require bearer JWT and live session. Checkout CASHIER only; invoice read MANAGER all / CASHIER own. No DELETE.

| Method | Path                               | Input                                                                |
| ------ | ---------------------------------- | -------------------------------------------------------------------- |
| POST   | /api/v1/sales/checkout/prepare     | Idempotency-Key, items [{productId,quantity}]                        |
| POST   | /api/v1/sales/checkout/:id/confirm | Idempotency-Key, CASH amountReceived or BANK_TRANSFER confirmed=true |
| POST   | /api/v1/sales/checkout/:id/cancel  | no body                                                              |
| GET    | /api/v1/invoices                   | page,pageSize,status,search                                          |
| GET    | /api/v1/invoices/:id               | —                                                                    |

All return existing success/data/meta envelope; prepare 409 on insufficient stock. Duplicate product IDs rejected; prices come from Product internal batch lookup, not frontend. PENDING persists before reserve. READY means stock reserved and official total accepted by cashier before accepting payment. Confirm persists payment and COMMIT intent atomically. CANCEL only prior to payment, currently READY or repeated RELEASE/CANCELLED. Invoice states PENDING, READY, PROCESSING, RECOVERY, COMPLETED, FAILED, CANCELLED.

Recovery worker scans every five seconds, retries up to 20 with exponential backoff capped at 60 seconds. It checks reservation by invoice ID before retry; after exhaustion RECOVERY remains visible for manual reconciliation. Same prepare or confirm key replays existing result, distinct payload rejected. Cancellation is state-idempotent by invoice ID. Single Sales replica V1; in-process single-flight plus database transition lock. No cross-service transaction or HTTP inside a DB transaction. Multi-replica worker leasing is not implemented. No payment gateway: cash and transfer recording only.

COMPLETED and outbox event sale.completed.v1 stored atomically in sales_db. Publisher and Report consumer implemented in DEV-5. UI supports invoice history, detail and browser print. Runtime results: FINAL acceptance.json (A08–A13, F07–F12, U03–U04, D01). Public prepare/confirm/cancel return HTTP 200.
