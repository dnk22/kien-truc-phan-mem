CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING','READY','PROCESSING','RECOVERY','COMPLETED','FAILED','CANCELLED');
CREATE TYPE "SagaIntent" AS ENUM ('RESERVE','COMMIT','RELEASE','NONE');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH','BANK_TRANSFER');
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING','SENT');
CREATE TABLE invoices (
 id UUID PRIMARY KEY, code TEXT NOT NULL UNIQUE, cashier_id UUID NOT NULL,
 status "InvoiceStatus" NOT NULL DEFAULT 'PENDING', saga_intent "SagaIntent" NOT NULL DEFAULT 'RESERVE',
 total_amount BIGINT NOT NULL CHECK(total_amount>0 AND total_amount<=9007199254740991),
 reservation_id UUID UNIQUE, prepare_key VARCHAR(128) NOT NULL, prepare_hash TEXT NOT NULL,
 confirm_key VARCHAR(128), confirm_hash TEXT, attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0),
 next_attempt_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, last_error TEXT,
 created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ(3) NOT NULL,
 completed_at TIMESTAMPTZ(3), UNIQUE(cashier_id,prepare_key), UNIQUE(cashier_id,confirm_key)
);
CREATE INDEX invoices_status_next_attempt_at_idx ON invoices(status,next_attempt_at);
CREATE INDEX invoices_cashier_id_created_at_idx ON invoices(cashier_id,created_at);
CREATE TABLE invoice_items (
 id UUID PRIMARY KEY, invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT ON UPDATE CASCADE,
 product_id UUID NOT NULL, product_code TEXT NOT NULL, product_name TEXT NOT NULL, unit TEXT NOT NULL,
 quantity INTEGER NOT NULL CHECK(quantity>0), unit_price BIGINT NOT NULL CHECK(unit_price>0),
 subtotal BIGINT NOT NULL CHECK(subtotal>0 AND subtotal<=9007199254740991 AND subtotal=quantity::bigint*unit_price),
 UNIQUE(invoice_id,product_id)
);
CREATE TABLE payments (
 id UUID PRIMARY KEY, invoice_id UUID NOT NULL UNIQUE REFERENCES invoices(id) ON DELETE RESTRICT ON UPDATE CASCADE,
 method "PaymentMethod" NOT NULL, amount_received BIGINT NOT NULL CHECK(amount_received>0 AND amount_received<=9007199254740991),
 change_amount BIGINT NOT NULL CHECK(change_amount>=0 AND change_amount<=amount_received),
 created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE outbox_events (
 id UUID PRIMARY KEY, event_type TEXT NOT NULL, payload JSONB NOT NULL, status "OutboxStatus" NOT NULL DEFAULT 'PENDING',
 attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, sent_at TIMESTAMPTZ(3)
);
CREATE INDEX outbox_events_status_next_attempt_at_idx ON outbox_events(status,next_attempt_at);
