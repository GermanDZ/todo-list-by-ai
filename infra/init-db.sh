#!/bin/bash
set -e

# When POSTGRES_USER is set, that user is the superuser
# Grant all permissions to ensure migrations work
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Ensure the user owns the database
    ALTER DATABASE $POSTGRES_DB OWNER TO $POSTGRES_USER;
    -- Grant all privileges on the public schema
    GRANT ALL ON SCHEMA public TO $POSTGRES_USER;
    -- Set default privileges for future tables and sequences
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $POSTGRES_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $POSTGRES_USER;
    -- Grant usage and create on the schema
    GRANT USAGE, CREATE ON SCHEMA public TO $POSTGRES_USER;
EOSQL

