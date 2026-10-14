#!/bin/sh
set -eu

psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v dbname="$POSTGRES_DB" \
  -v migrator_pw="$(cat /run/secrets/pg_migrator_password)" \
  -v app_pw="$(cat /run/secrets/pg_app_password)" \
  -v ro_pw="$(cat /run/secrets/pg_readonly_password)" <<'EOSQL'

-- lock down defaults
REVOKE ALL ON DATABASE :"dbname" FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- roles
CREATE ROLE jusstudy_migrator LOGIN PASSWORD :'migrator_pw';
CREATE ROLE jusstudy_app      LOGIN PASSWORD :'app_pw'  CONNECTION LIMIT 50;
CREATE ROLE jusstudy_readonly LOGIN PASSWORD :'ro_pw'   CONNECTION LIMIT 5;

-- migrator owns the schema; CREATE on db lets drizzle make its "drizzle" schema
GRANT CONNECT, CREATE ON DATABASE :"dbname" TO jusstudy_migrator;
ALTER SCHEMA public OWNER TO jusstudy_migrator;

GRANT CONNECT ON DATABASE :"dbname" TO jusstudy_app, jusstudy_readonly;
GRANT USAGE ON SCHEMA public TO jusstudy_app, jusstudy_readonly;

-- every table/sequence the migrator creates later is automatically usable
ALTER DEFAULT PRIVILEGES FOR ROLE jusstudy_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO jusstudy_app;
ALTER DEFAULT PRIVILEGES FOR ROLE jusstudy_migrator IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO jusstudy_app;
ALTER DEFAULT PRIVILEGES FOR ROLE jusstudy_migrator IN SCHEMA public
  GRANT SELECT ON TABLES TO jusstudy_readonly;
EOSQL
