#!/usr/bin/env bash
set -euo pipefail
pg_isready -U "$POSTGRES_USER" -d postgres >/dev/null
for service in identity product inventory sales report; do
  variable="${service^^}_DB_PASSWORD"
  PGPASSWORD="${!variable}" psql -h 127.0.0.1 -U "${service}_user" -d "${service}_db" -v ON_ERROR_STOP=1 -tAc 'SELECT 1' >/dev/null
done
