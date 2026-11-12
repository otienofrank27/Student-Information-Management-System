#!/bin/bash
set -euo pipefail

: "${MARIADB_ROOT_PASSWORD:?Missing MariaDB root password}"
: "${DB_PASSWORD:?Missing application database password}"
: "${DB_ADMIN_PASSWORD:?Missing database administrator password}"
: "${DB_LECTURER_PASSWORD:?Missing lecturer database password}"
DB_NAME="${DB_NAME:-usims}"
DB_USER="${DB_USER:-sims_app}"
DB_ADMIN_USER="${DB_ADMIN_USER:-sims_admin}"
if [[ "$DB_NAME" != "usims" || "$DB_USER" != "sims_app" || "$DB_ADMIN_USER" != "sims_admin" ]]; then
  echo "This database initializer expects DB_NAME=usims, DB_USER=sims_app, and DB_ADMIN_USER=sims_admin." >&2
  exit 1
fi

# The Docker network is private; the database port is not published to the host.
# Passwords are generated as hex strings so they are safe in these SQL literals.
export MYSQL_PWD="$MARIADB_ROOT_PASSWORD"
mariadb --user=root <<SQL
CREATE USER IF NOT EXISTS '$DB_USER'@'%' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER IF NOT EXISTS '$DB_USER'@'127.0.0.1' IDENTIFIED BY '$DB_PASSWORD';
CREATE USER IF NOT EXISTS '$DB_ADMIN_USER'@'%' IDENTIFIED BY '$DB_ADMIN_PASSWORD';
CREATE USER IF NOT EXISTS '$DB_ADMIN_USER'@'localhost' IDENTIFIED BY '$DB_ADMIN_PASSWORD';
CREATE USER IF NOT EXISTS '$DB_ADMIN_USER'@'127.0.0.1' IDENTIFIED BY '$DB_ADMIN_PASSWORD';
CREATE USER IF NOT EXISTS 'sims_lecturer'@'%' IDENTIFIED BY '$DB_LECTURER_PASSWORD';
CREATE USER IF NOT EXISTS 'sims_lecturer'@'localhost' IDENTIFIED BY '$DB_LECTURER_PASSWORD';
CREATE USER IF NOT EXISTS 'sims_lecturer'@'127.0.0.1' IDENTIFIED BY '$DB_LECTURER_PASSWORD';
SQL

for file in 01_schema.sql 02_indexes.sql 03_views.sql 04_procedures.sql 05_triggers.sql 07_sample_data.sql 10_programme_catalogue.sql 06_security.sql; do
  echo "Installing USIMS database object: $file"
  mariadb --user=root < "/seed/$file"
done

unset MYSQL_PWD
echo "USIMS database schema and least-privilege accounts installed."
