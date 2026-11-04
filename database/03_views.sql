-- =============================================================================
-- Views
-- =============================================================================
USE usims;

-- Primary academic view: student examination results (required deliverable)
CREATE OR REPLACE VIEW vw_student_exam_results AS
SELECT
    s.student_number,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    d.department_name,
    c.course_code,
    c.course_name,
    c.credits,
    c.academic_year,
    c.semester,
    e.exam_type,
    e.marks,
    e.grade,
    e.exam_date,
    CONCAT(l.first_name, ' ', l.last_name) AS lecturer_name
FROM examinations e
JOIN registrations r ON r.registration_id = e.registration_id
JOIN students s      ON s.student_id = r.student_id
JOIN courses c       ON c.course_id = r.course_id
JOIN departments d   ON d.department_id = s.department_id
LEFT JOIN lecturers l ON l.lecturer_id = c.lecturer_id;

-- Course enrolment summary
CREATE OR REPLACE VIEW vw_course_enrolment AS
SELECT
    c.course_code,
    c.course_name,
    c.credits,
    c.credential_level,
    c.academic_year,
    c.semester,
    d.department_name,
    d.faculty,
    CONCAT(l.first_name, ' ', l.last_name) AS lecturer_name,
    COUNT(r.registration_id) AS enrolled_count
FROM courses c
JOIN departments d ON d.department_id = c.department_id
LEFT JOIN lecturers l ON l.lecturer_id = c.lecturer_id
LEFT JOIN registrations r
       ON r.course_id = c.course_id AND r.status = 'Registered'
GROUP BY
    c.course_id, c.course_code, c.course_name, c.credits, c.credential_level,
    c.academic_year, c.semester, d.department_name, d.faculty,
    l.first_name, l.last_name;

-- Student fee summary
CREATE OR REPLACE VIEW vw_student_fee_summary AS
SELECT
    s.student_number,
    CONCAT(s.first_name, ' ', s.last_name) AS student_name,
    d.department_name,
    f.academic_year,
    f.semester,
    SUM(CASE WHEN f.status = 'Paid' THEN f.amount ELSE 0 END) AS total_paid,
    SUM(CASE WHEN f.status = 'Pending' THEN f.amount ELSE 0 END) AS total_pending,
    COUNT(f.payment_id) AS payment_count
FROM students s
JOIN departments d ON d.department_id = s.department_id
LEFT JOIN fees f ON f.student_id = s.student_id
GROUP BY
    s.student_id, s.student_number, s.first_name, s.last_name,
    d.department_name, f.academic_year, f.semester;
