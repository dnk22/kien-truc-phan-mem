# API index

Base: http://localhost:8080/api/v1. Standard success/data/meta or error code/message/meta. Auth bearer JWT; cookie auth actions require CSRF header and trusted origin. Internal service credential not exposed in browser.
| Area | Public paths | Roles |
|---|---|---|
| Identity | /auth/login, /auth/refresh, /auth/logout, /auth/me, /auth/change-password | authenticated as applicable |
| Users | /users | ADMIN |
| Catalog | /categories, /products | read MANAGER/CASHIER/WAREHOUSE; write MANAGER |
| Suppliers | /suppliers | MANAGER, WAREHOUSE active read |
| Receipts | /purchase-receipts | MANAGER/WAREHOUSE; confirm MANAGER |
| Stock | /inventory | MANAGER/WAREHOUSE/CASHIER |
| Movements and adjustments | /inventory/movements, /inventory/adjustments | MANAGER/WAREHOUSE; confirm MANAGER |
| Checkout | /sales/checkout | CASHIER |
| Invoices | /invoices | MANAGER all; CASHIER own |
| Reports | /reports/revenue, /reports/inventory | MANAGER |

Detailed contracts: [DEV-2](dev2-api.md), [DEV-3](dev3-api.md), [DEV-4](dev4-api.md), [DEV-5](dev5-api.md). Gateway Swagger /docs and /docs-json; verify schemas and status codes in runtime.

## FINAL contract additions

- Gateway `POST /sales/checkout/prepare`, `/:invoiceId/confirm`, `/:invoiceId/cancel` return HTTP 200 from upstream. Duplicate prepare/confirm with the same key and payload reuses the original result; a different payload conflicts (409).
- OpenAPI generation in `apps/api-gateway/src/openapi.ts` documents public write schemas, pagination/filter parameters, path UUIDs, payment variants, Idempotency-Key and envelope responses. `/docs-json` is captured as actual evidence after startup.
- Private `GET /internal/v1/products?page=&pageSize=&search=` supplies catalog pages to Inventory. The endpoint requires service credential and is never Gateway-forwarded. Stock includes zero rows and current product metadata without cross-database access.
- Private stock commit optionally receives `actorId` (UUID). Sales supplies invoice.cashierId to preserve movement history actor; credentials remain server-side.
