#!/usr/bin/env sh
# Loads the demo data set (src/main/resources/db/seed/demo-seed.sql) into the LOCAL database.
#
# Reads the same environment variables as the application:
#   DB_URL       optional, default jdbc:postgresql://localhost:5432/p02_training
#   DB_USERNAME  optional, default postgres
#   DB_PASSWORD  required
#   PSQL         optional, path to psql when it is not on PATH
# The schema must already exist (start the application once so Flyway applies V1).
# Safe to run again: it resets the demo data to today's dates (see the header of demo-seed.sql).
#
# Usage:  DB_PASSWORD=... ./scripts/seed-demo.sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
SEED_FILE="$ROOT/src/main/resources/db/seed/demo-seed.sql"
[ -f "$SEED_FILE" ] || { echo "Seed file not found: $SEED_FILE" >&2; exit 1; }

URL=${DB_URL:-jdbc:postgresql://localhost:5432/p02_training}
DB_USER=${DB_USERNAME:-postgres}
[ -n "${DB_PASSWORD:-}" ] || { echo "DB_PASSWORD is not set." >&2; exit 1; }

# jdbc:postgresql://host[:port]/database[?params]
case "$URL" in
    jdbc:postgresql://*) ;;
    *) echo "DB_URL is not a jdbc:postgresql URL: $URL" >&2; exit 1 ;;
esac
REST=${URL#jdbc:postgresql://}
HOSTPORT=${REST%%/*}
DB_NAME=${REST#*/}
DB_NAME=${DB_NAME%%\?*}
DB_HOST=${HOSTPORT%%:*}
if [ "$HOSTPORT" = "$DB_HOST" ]; then DB_PORT=5432; else DB_PORT=${HOSTPORT#*:}; fi

PSQL_BIN=${PSQL:-}
if [ -z "$PSQL_BIN" ]; then
    if command -v psql >/dev/null 2>&1; then
        PSQL_BIN=psql
    else
        # Git Bash on Windows: newest PostgreSQL installation.
        PSQL_BIN=$(ls -d "/c/Program Files/PostgreSQL/"*/bin/psql.exe 2>/dev/null | sort -V | tail -n 1 || true)
    fi
fi
[ -n "$PSQL_BIN" ] || { echo "psql not found: add it to PATH or set PSQL=/path/to/psql" >&2; exit 1; }

echo "Seeding demo data into $DB_NAME on $DB_HOST:$DB_PORT as $DB_USER ..."
PGPASSWORD=$DB_PASSWORD PGCLIENTENCODING=UTF8 \
    "$PSQL_BIN" -X -q -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SEED_FILE"
echo "Done. Demo accounts: admin, admin2, manager, gv01-gv05, sv01-sv30 / Demo@123"
