#!/bin/bash
set -euo pipefail

ROOT="/workspace"
SOCKET="/run/mysqld/mysqld.sock"

if [ ! -f "${ROOT}/.env" ]; then
  echo "Missing ${ROOT}/.env. Copy .env.example to .env and configure credentials."
  exit 1
fi
set -a
# shellcheck disable=SC1091
source "${ROOT}/.env"
set +a

mkdir -p /run/mysqld
chown mysql:mysql /run/mysqld 2>/dev/null || true

if ! mysqladmin ping --socket="${SOCKET}" --silent 2>/dev/null; then
  mysqld --user=mysql --datadir=/var/lib/mysql \
    --socket="${SOCKET}" --pid-file=/run/mysqld/mysqld.pid \
    --bind-address=127.0.0.1 >/tmp/mysqld.log 2>&1 &
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if mysqladmin ping --socket="${SOCKET}" --silent 2>/dev/null; then
      break
    fi
    sleep 1
  done
fi

cd "${ROOT}/backend"
node server.js &
BACKEND_PID=$!

cd "${ROOT}/frontend"
npm run dev

trap "kill ${BACKEND_PID} 2>/dev/null || true" EXIT
