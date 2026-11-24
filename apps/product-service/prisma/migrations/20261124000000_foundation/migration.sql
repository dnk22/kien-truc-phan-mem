CREATE TABLE "foundation_metadata" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "foundation_metadata_pkey" PRIMARY KEY ("key")
);
