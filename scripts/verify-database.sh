#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi
MYSQL_BIN="${MYSQL_BIN:-mysql}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-usims}"
DB_USER="${DB_ADMIN_USER:-${DB_USER:-root}}"

if ! command -v "$MYSQL_BIN" >/dev/null 2>&1; then
  echo "MySQL/MariaDB client '$MYSQL_BIN' was not found." >&2
  exit 1
fi
MYSQL_ARGS=(--host="$DB_HOST" --port="$DB_PORT" --user="$DB_USER" "$DB_NAME")
if [[ -n "${DB_ADMIN_PASSWORD:-${DB_PASSWORD:-}}" ]]; then
  export MYSQL_PWD="${DB_ADMIN_PASSWORD:-$DB_PASSWORD}"
fi

query() { "$MYSQL_BIN" "${MYSQL_ARGS[@]}" --batch --skip-column-names -e "$1"; }
expect_at_least() {
  local label="$1" sql="$2" minimum="$3" actual
  actual="$(query "$sql")"
  if [[ ! "$actual" =~ ^[0-9]+$ ]] || (( actual < minimum )); then
    echo "FAIL: $label (expected at least $minimum, found ${actual:-no result})" >&2
    exit 1
  fi
  echo "PASS: $label ($actual)"
}

cd "$ROOT_DIR"
expect_at_least "Seven required base tables" "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE'" 7
expect_at_least "Required views" "SELECT COUNT(*) FROM information_schema.views WHERE table_schema=DATABASE() AND table_name IN ('vw_student_exam_results','vw_course_enrolment','vw_student_fee_summary')" 3
expect_at_least "Required stored procedures" "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema=DATABASE() AND routine_type='PROCEDURE' AND routine_name IN ('sp_get_student_details','sp_register_student','sp_update_student','sp_register_course','sp_record_exam','sp_record_payment','sp_dashboard_stats')" 7
expect_at_least "Required triggers" "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema=DATABASE() AND trigger_name IN ('trg_exam_marks_before_insert','trg_exam_marks_before_update','trg_student_number_format','trg_student_number_format_before_update')" 4
expect_at_least "Student-search indexes" "SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='students' AND index_name IN ('idx_students_last_name','idx_students_full_name','idx_students_email')" 3
expect_at_least "Demonstration registrations" "SELECT COUNT(*) FROM registrations" 1

registration_id="$(query "SELECT r.registration_id FROM registrations r LEFT JOIN examinations e ON e.registration_id=r.registration_id AND e.exam_type='CA' WHERE e.exam_id IS NULL ORDER BY r.registration_id LIMIT 1")"
if [[ -z "$registration_id" || "$registration_id" == "NULL" ]]; then
  echo "FAIL: no registration without a CA result is available for the insert-trigger test" >&2
  exit 1
fi
for operation in insert update; do
  if [[ "$operation" == "insert" ]]; then
    sql="START TRANSACTION; INSERT INTO examinations (registration_id, exam_type, marks, exam_date) VALUES ($registration_id, 'CA', 101, CURRENT_DATE()); ROLLBACK"
  else
    exam_id="$(query 'SELECT MIN(exam_id) FROM examinations')"
    if [[ -z "$exam_id" || "$exam_id" == "NULL" ]]; then
      echo "FAIL: no examination row available for update-trigger test" >&2
      exit 1
    fi
    sql="START TRANSACTION; UPDATE examinations SET marks=101 WHERE exam_id=$exam_id; ROLLBACK"
  fi
  if query "$sql" >/dev/null 2>&1; then
    echo "FAIL: $operation trigger accepted an invalid mark of 101" >&2
    exit 1
  fi
  echo "PASS: $operation trigger rejected an invalid mark of 101"
done

student_id="$(query 'SELECT MIN(student_id) FROM students')"
if [[ -z "$student_id" || "$student_id" == "NULL" ]]; then
  echo "FAIL: no student row available for the student-number trigger test" >&2
  exit 1
fi
sql="START TRANSACTION; UPDATE students SET student_number='INVALID' WHERE student_id=$student_id; ROLLBACK"
if query "$sql" >/dev/null 2>&1; then
  echo "FAIL: student-number update trigger accepted an invalid identifier" >&2
  exit 1
fi
echo "PASS: student-number update trigger rejected an invalid identifier"

unset MYSQL_PWD || true
echo "Database verification passed."
