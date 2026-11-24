# DEV-2 catalog API

All public endpoints use the existing API envelope and bearer token.
Read: MANAGER, CASHIER, WAREHOUSE. Write: MANAGER only.
Product Service checks live identity session through GET /api/v1/auth/me.

| Method | Path | Body |
| --- | --- | --- |
| GET | /api/v1/categories | — |
| GET | /api/v1/categories/:id | — |
| POST | /api/v1/categories | code, name, description? |
| PATCH | /api/v1/categories/:id | partial create fields |
| PATCH | /api/v1/categories/:id/status | status |
| GET | /api/v1/products | — |
| GET | /api/v1/products/:id | — |
| POST | /api/v1/products | code, name, categoryId, unit, sellingPrice, barcode?, imageUrl?, description? |
| PATCH | /api/v1/products/:id | partial create fields |
| PATCH | /api/v1/products/:id/status | status |
| PATCH | /api/v1/products/:id/price | sellingPrice |

List query: page, pageSize (max 100), search, status. Products also support categoryId, sortBy (name/sellingPrice/createdAt), sortOrder (asc/desc). Search is case-insensitive; accent-insensitive search is not implemented.

## Internal contract

- GET /internal/v1/products/:id
- POST /internal/v1/products/batch with { "productIds": ["UUID"] } (1–100 IDs).
- Require x-service-credential; not routed by public Gateway.
- Batch response data contains items and missingIds; IDs are deduplicated.
- Product fields include id, code, name, barcode, categoryId, unit, sellingPrice, status. Inactive records are retained for historical use and caller validation.

Database transaction serializes catalog writes with advisory lock. Only Product Service owns product_db. No inventory columns or cross-database access.
