#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MYSQL_BIN="${MYSQL_BIN:-mysql}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_INSTALL_USER="${DB_INSTALL_USER:-root}"

if ! command -v "$MYSQL_BIN" >/dev/null 2>&1; then
  echo "MySQL/MariaDB client '$MYSQL_BIN' was not found. Install it or set MYSQL_BIN." >&2
  exit 1
fi

MYSQL_ARGS=(--host="$DB_HOST" --port="$DB_PORT" --user="$DB_INSTALL_USER")
if [[ -n "${DB_INSTALL_PASSWORD:-}" ]]; then
  export MYSQL_PWD="$DB_INSTALL_PASSWORD"
fi

run_sql() {
  local file="$1"
  echo "Applying $file"
  "$MYSQL_BIN" "${MYSQL_ARGS[@]}" < "$ROOT_DIR/$file"
}

echo "Installing USIMS schema, database objects, and demonstration data."
echo "Target: $DB_HOST:$DB_PORT (database: usims)"
run_sql "database/01_schema.sql"
run_sql "database/02_indexes.sql"
run_sql "database/03_views.sql"
run_sql "database/04_procedures.sql"
run_sql "database/05_triggers.sql"
run_sql "database/07_sample_data.sql"
run_sql "database/10_programme_catalogue.sql"

if [[ "${INSTALL_DB_GRANTS:-false}" == "true" ]]; then
  echo "Applying database grants. Required accounts must already exist."
  run_sql "database/06_security.sql"
else
  echo "Database grants were skipped."
  echo "Create sims_app, sims_admin, and sims_lecturer with unique passwords,"
  echo "then run: mysql -h $DB_HOST -P $DB_PORT -u $DB_INSTALL_USER -p < database/06_security.sql"
fi

unset MYSQL_PWD || true
echo "USIMS database installation completed."
