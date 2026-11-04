-- =============================================================================
-- USIMS database grants
--
-- SECURITY: This file intentionally contains no passwords.
-- Provision the three accounts out-of-band with unique, randomly generated
-- passwords before running this script. Supply those credentials to the
-- application through DB_PASSWORD and DB_ADMIN_PASSWORD.
--
-- Example account names: sims_app, sims_admin, sims_lecturer.
-- Do not commit credential-bearing SQL dumps or local environment files.
-- =============================================================================
USE usims;

-- Application account: DML and routine execution only.
GRANT SELECT, INSERT, UPDATE, DELETE ON usims.* TO 'sims_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON usims.* TO 'sims_app'@'127.0.0.1';
GRANT EXECUTE ON usims.* TO 'sims_app'@'localhost';
GRANT EXECUTE ON usims.* TO 'sims_app'@'127.0.0.1';
GRANT SHOW VIEW ON usims.* TO 'sims_app'@'localhost';
GRANT SHOW VIEW ON usims.* TO 'sims_app'@'127.0.0.1';

-- Administrator account: full privileges limited to the USIMS database.
GRANT ALL PRIVILEGES ON usims.* TO 'sims_admin'@'localhost';
GRANT ALL PRIVILEGES ON usims.* TO 'sims_admin'@'127.0.0.1';

-- Lecturer account: academic read access and examination write access only.
GRANT SELECT ON usims.students TO 'sims_lecturer'@'localhost', 'sims_lecturer'@'127.0.0.1';
GRANT SELECT ON usims.departments TO 'sims_lecturer'@'localhost', 'sims_lecturer'@'127.0.0.1';
GRANT SELECT ON usims.courses TO 'sims_lecturer'@'localhost', 'sims_lecturer'@'127.0.0.1';
GRANT SELECT ON usims.lecturers TO 'sims_lecturer'@'localhost', 'sims_lecturer'@'127.0.0.1';
GRANT SELECT ON usims.registrations TO 'sims_lecturer'@'localhost', 'sims_lecturer'@'127.0.0.1';
GRANT SELECT, INSERT, UPDATE ON usims.examinations TO 'sims_lecturer'@'localhost', 'sims_lecturer'@'127.0.0.1';
GRANT SELECT ON usims.vw_student_exam_results TO 'sims_lecturer'@'localhost', 'sims_lecturer'@'127.0.0.1';
GRANT SELECT ON usims.vw_course_enrolment TO 'sims_lecturer'@'localhost', 'sims_lecturer'@'127.0.0.1';
GRANT EXECUTE ON PROCEDURE usims.sp_get_student_details TO 'sims_lecturer'@'localhost';
GRANT EXECUTE ON PROCEDURE usims.sp_get_student_details TO 'sims_lecturer'@'127.0.0.1';
GRANT EXECUTE ON PROCEDURE usims.sp_record_exam TO 'sims_lecturer'@'localhost';
GRANT EXECUTE ON PROCEDURE usims.sp_record_exam TO 'sims_lecturer'@'127.0.0.1';

FLUSH PRIVILEGES;
