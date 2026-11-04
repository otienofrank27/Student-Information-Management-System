-- =============================================================================
-- Indexing: accelerate student searches and common join/filter paths
-- =============================================================================
USE usims;

-- Student record searches (name, number, email, status)
CREATE INDEX idx_students_last_name     ON students (last_name);
CREATE INDEX idx_students_full_name     ON students (last_name, first_name);
CREATE INDEX idx_students_email         ON students (email);
CREATE INDEX idx_students_status        ON students (status);
CREATE INDEX idx_students_department    ON students (department_id);

-- Course and registration lookups
CREATE INDEX idx_courses_department     ON courses (department_id);
CREATE INDEX idx_courses_lecturer       ON courses (lecturer_id);
CREATE INDEX idx_courses_year_sem       ON courses (academic_year, semester);
CREATE INDEX idx_courses_credential     ON courses (credential_level);
CREATE INDEX idx_reg_student            ON registrations (student_id);
CREATE INDEX idx_reg_course             ON registrations (course_id);
CREATE INDEX idx_reg_status             ON registrations (status);

-- Examination and fee retrieval
CREATE INDEX idx_exam_registration      ON examinations (registration_id);
CREATE INDEX idx_exam_date              ON examinations (exam_date);
CREATE INDEX idx_fees_student           ON fees (student_id);
CREATE INDEX idx_fees_year_sem          ON fees (academic_year, semester);
CREATE INDEX idx_fees_status            ON fees (status);
