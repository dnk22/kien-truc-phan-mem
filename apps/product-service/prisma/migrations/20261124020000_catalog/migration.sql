CREATE TYPE "CatalogStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TABLE categories (
 id UUID PRIMARY KEY, code VARCHAR(64) NOT NULL UNIQUE CHECK (btrim(code) <> ''),
 name VARCHAR(200) NOT NULL CHECK (btrim(name) <> ''), description TEXT,
 status "CatalogStatus" NOT NULL DEFAULT 'ACTIVE',
 created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ(3) NOT NULL
);
CREATE TABLE products (
 id UUID PRIMARY KEY, category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
 code VARCHAR(64) NOT NULL UNIQUE CHECK (btrim(code) <> ''),
 barcode VARCHAR(64) UNIQUE CHECK (barcode IS NULL OR btrim(barcode) <> ''),
 name VARCHAR(200) NOT NULL CHECK (btrim(name) <> ''),
 unit VARCHAR(50) NOT NULL CHECK (btrim(unit) <> ''),
 selling_price INTEGER NOT NULL CHECK (selling_price > 0),
 image_url TEXT, description TEXT, status "CatalogStatus" NOT NULL DEFAULT 'ACTIVE',
 created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ(3) NOT NULL
);
CREATE INDEX categories_status_idx ON categories(status);
CREATE INDEX products_category_id_status_idx ON products(category_id,status);
CREATE INDEX products_status_idx ON products(status);
