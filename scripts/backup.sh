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
BACKUP_DIR="${SCRIPT_DIR}/backups"
STAMP="$(date +%Y%m%d_%H%M%S)"
FILE="${BACKUP_DIR}/usims_${STAMP}.sql"

mkdir -p "${BACKUP_DIR}"
export MYSQL_PWD="${DB_ADMIN_PASSWORD}"

mysqldump --host="${DB_HOST}" --port="${DB_PORT}" --user="${DB_ADMIN_USER}" \
  --single-transaction --routines --triggers --events --databases "${DB_NAME}" > "${FILE}"

unset MYSQL_PWD
echo "Backup written to ${FILE}"
ls -lh "${FILE}"
