#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -f "${SCRIPT_DIR}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/.env"
  set +a
fi

: "${DB_ADMIN_USER:?Set DB_ADMIN_USER in .env or the environment}"
: "${DB_ADMIN_PASSWORD:?Set DB_ADMIN_PASSWORD in .env or the environment}"
DB_NAME="${DB_NAME:-usims}"
DB_HOST="${DB_ADMIN_HOST:-${DB_HOST:-127.0.0.1}}"
DB_PORT="${DB_PORT:-3306}"
FILE="${1:-}"

if [ -z "${FILE}" ]; then
  echo "Usage: $0 /path/to/backup.sql"
  exit 1
fi

if [ ! -f "${FILE}" ]; then
  echo "Backup file not found: ${FILE}"
  exit 1
fi

export MYSQL_PWD="${DB_ADMIN_PASSWORD}"
mysql --host="${DB_HOST}" --port="${DB_PORT}" --user="${DB_ADMIN_USER}" "${DB_NAME}" < "${FILE}"
unset MYSQL_PWD
echo "Restored database from ${FILE}"
