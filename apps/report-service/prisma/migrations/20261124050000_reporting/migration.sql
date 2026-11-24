CREATE TYPE "ReportPaymentMethod" AS ENUM ('CASH','BANK_TRANSFER');
CREATE TABLE processed_events (event_id UUID PRIMARY KEY, processed_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE sales_facts (invoice_id UUID PRIMARY KEY, invoice_code TEXT NOT NULL, cashier_id UUID NOT NULL, total_amount BIGINT NOT NULL CHECK(total_amount>0), payment_method "ReportPaymentMethod" NOT NULL, completed_at TIMESTAMPTZ(3) NOT NULL);
CREATE INDEX sales_facts_completed_at_idx ON sales_facts(completed_at);
CREATE TABLE sales_item_facts (invoice_id UUID NOT NULL REFERENCES sales_facts(invoice_id) ON DELETE RESTRICT ON UPDATE CASCADE, product_id UUID NOT NULL, product_name TEXT NOT NULL, quantity INTEGER NOT NULL CHECK(quantity>0), unit_price BIGINT NOT NULL CHECK(unit_price>0), subtotal BIGINT NOT NULL CHECK(subtotal=quantity::bigint*unit_price), PRIMARY KEY(invoice_id,product_id));
CREATE INDEX sales_item_facts_product_id_idx ON sales_item_facts(product_id);
