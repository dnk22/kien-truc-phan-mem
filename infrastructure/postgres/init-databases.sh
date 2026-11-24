#!/usr/bin/env bash
set -euo pipefail
# psql variables and format(%I/%L) quote identifiers/passwords safely.
for service in identity product inventory sales report; do
  variable="${service^^}_DB_PASSWORD"
  password="${!variable:?Missing database password}"
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres \
    --set=owner="${service}_user" --set=db="${service}_db" --set=password="$password" <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION', :'owner', :'password') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'db', :'owner') \gexec
SELECT format('REVOKE ALL ON DATABASE %I FROM PUBLIC', :'db') \gexec
SQL
done
# Every owning role can connect only to its database; also close default databases.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname postgres <<'SQL'
REVOKE CONNECT ON DATABASE postgres FROM PUBLIC;
REVOKE CONNECT ON DATABASE template1 FROM PUBLIC;
SQL
