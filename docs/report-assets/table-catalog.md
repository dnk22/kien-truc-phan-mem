# Table catalog — dữ liệu sẵn để chèn DOCX

Số bảng là đề xuất, FINAL-4 dùng Word captions chính thức. Các nguồn lịch sử giữ ngày/provenance, không gán cho HEAD mới. Các bảng test, TC, consistency và benchmark hoàn chỉnh nằm trong [test-summary](test-summary.md), được xem là phần tiếp nối của catalog này.

## Bảng2.1 — Microservices và database ownership

Nguồn: compose.yaml, Prisma schemas. Ch2.

| Service   | Internal port | DB / owner                    | Trách nhiệm                     |
| --------- | ------------- | ----------------------------- | ------------------------------- |
| Identity  | 3001          | identity_db / identity_user   | Tài khoản, JWT/session          |
| Product   | 3002          | product_db / product_user     | Danh mục, giá và barcode        |
| Inventory | 3003          | inventory_db / inventory_user | NCC/phiếu/tồn/reservation       |
| Sales     | 3004          | sales_db / sales_user         | Checkout/payment/invoice/outbox |
| Report    | 3005          | report_db / report_user       | Projection/doanh thu            |

Gateway8080 không DB; Web3000 nội bộ/Nginx. Chỉ publish WEB_PORT(default3000, test3300) và GATEWAY_PORT(default8080). PostgreSQL1 instance,5 DB credentials riêng, chỉ FKs trong từng DB.

## Bảng5.1 — Technology versions

Nguồn: manifests/lockfile/compose và environment log.

| Công nghệ               | Phiên bản                        |
| ----------------------- | -------------------------------- |
| Node                    | 22.22.2                          |
| pnpm                    | 10.32.1                          |
| react                   | 19.2.0                           |
| vite                    | 7.3.1                            |
| antd                    | 5.29.1                           |
| @tanstack/react-query   | 5.90.11                          |
| zustand                 | 5.0.8                            |
| axios                   | 1.13.2                           |
| @nestjs/core            | 11.1.24                          |
| prisma                  | 6.19.3                           |
| @prisma/client          | 6.19.3                           |
| amqplib                 | 0.10.9                           |
| PostgreSQL              | 17.7-bookworm                    |
| RabbitMQ                | 4.2.1-management-alpine          |
| PlantUML tool (FINAL-3) | 1.2025.10 / Java17.0.18; Smetana |

## Bảng1.1 — RBAC thực tế

Nguồn: docs/actor-permissions.md + guards/navigation.

| Capability                       | ADMIN | MANAGER    | CASHIER  | WAREHOUSE       |
| -------------------------------- | ----- | ---------- | -------- | --------------- |
| Login, logout, profile, password | Yes   | Yes        | Yes      | Yes             |
| User and role management         | Yes   | No         | No       | No              |
| Category/product API read        | No    | Yes        | Yes      | Yes             |
| Category/product write           | No    | Yes        | No       | No              |
| Suppliers                        | No    | Read/write | No       | Active read API |
| Receipt draft create/edit/cancel | No    | Yes        | No       | Yes             |
| Receipt confirmation             | No    | Yes        | No       | No              |
| Stock read                       | No    | Yes        | Yes      | Yes             |
| Movement read, adjustment draft  | No    | Yes        | No       | Yes             |
| Adjustment confirm               | No    | Yes        | No       | No              |
| Checkout                         | No    | No         | Yes      | No              |
| Invoice read                     | No    | All        | Own only | No              |
| Reports/dashboard                | No    | Yes        | No       | No              |

Source: gateway and service guards, ownership rules, web navigation. Category and supplier standalone web screens are Manager-only; read access for other roles is used by relevant workflows. UI guards do not replace backend checks. Runtime results: acceptance cases A02/A03/A06/A07/A11/A13 and U02/U05; consult acceptance.json for actual outcome, not source presence.

## Bảng4.1 — GoF và class

| Pattern        | Actual classes                                                                     | Test                     |
| -------------- | ---------------------------------------------------------------------------------- | ------------------------ |
| Factory Method | PaymentCreator; CashPaymentCreator; BankTransferPaymentCreator                     | payment-patterns.spec.ts |
| Strategy       | PaymentStrategy; CashPaymentStrategy; BankTransferStrategy; context PaymentService | payment-patterns.spec.ts |
| Builder        | InvoiceBuilder → InvoiceDraft; client InvoiceService                               | invoice.builder.spec.ts  |
| Facade         | CheckoutFacade → InvoiceService/PaymentService/CheckoutOrchestrator                | checkout.facade.spec.ts  |

## Bảng5.2–5.6 — Quality/test/TC/data/performance

Các bảng đầy đủ trong [test-summary](test-summary.md), nguồn quality-gates.json/log, acceptance.json, data-invariants.json, performance.json, runtime-current.json.

## Bảng1.2 — Requirement coverage

| Nhóm | Dòng đề xuất | Runtime supported | Partial | Unit only | Source only |
| ---- | ------------ | ----------------- | ------- | --------- | ----------- |
| FR   | 57           | 53                | 4       | 0         | 0           |
| BR   | 21           | 19                | 1       | 1         | 0           |
| NFR  | 10           | 7                 | 2       | 0         | 1           |

71 ID NEEDS_CONFIRMATION,17 có anchor. Không gọi88 runtime PASS; xem requirement-id-reconciliation.md.

## Bảng5.7 — Hạn chế

| Giới hạn                                          | Ảnh hưởng                                                      | Nguồn                                     |
| ------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------- |
| Single store/replica; global advisory locks       | No HA/multi-replica SLA                                        | architecture-current, code                |
| Two READ benchmarks only                          | No full CRUD/write latency claim                               | performance.json                          |
| Manual transfer, browser PDF                      | No real bank or physical printer                               | Strategy/U03                              |
| No operator/DLQ UI; recovery20                    | Reconcile original key/payment/reservation                     | F11/runbook                               |
| Multi-tab refresh, in-process rate limit          | May require login; not distributed                             | auth contract                             |
| Original grouped IDs, no old source hash manifest | Numbering review; limited commit provenance                    | reconciliation/provenance                 |
| StockMetrics text stale                           | Label says initialized rows though catalog-wide48 vs10 DB rows | source StockMetrics; read-only screenshot |
