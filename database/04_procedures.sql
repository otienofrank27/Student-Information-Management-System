-- =============================================================================
-- Stored procedures
-- =============================================================================
USE usims;

DELIMITER $$

-- Required: retrieve full student details by student number or name fragment
DROP PROCEDURE IF EXISTS sp_get_student_details $$
CREATE PROCEDURE sp_get_student_details(IN p_query VARCHAR(100))
BEGIN
    SELECT
        s.student_id,
        s.student_number,
        s.first_name,
        s.last_name,
        s.email,
        s.phone,
        s.date_of_birth,
        s.gender,
        s.address,
        s.enrollment_date,
        s.status,
        d.department_id,
        d.department_code,
        d.department_name,
        d.faculty
    FROM students s
    JOIN departments d ON d.department_id = s.department_id
    WHERE p_query IS NULL
       OR p_query = ''
       OR s.student_number LIKE CONCAT('%', p_query, '%')
       OR s.first_name LIKE CONCAT('%', p_query, '%')
       OR s.last_name LIKE CONCAT('%', p_query, '%')
       OR s.email LIKE CONCAT('%', p_query, '%')
    ORDER BY s.last_name, s.first_name;
END $$

DROP PROCEDURE IF EXISTS sp_register_student $$
CREATE PROCEDURE sp_register_student(
    IN  p_student_number  VARCHAR(20),
    IN  p_first_name      VARCHAR(50),
    IN  p_last_name       VARCHAR(50),
    IN  p_email           VARCHAR(100),
    IN  p_phone           VARCHAR(20),
    IN  p_date_of_birth   DATE,
    IN  p_gender          VARCHAR(10),
    IN  p_address         VARCHAR(255),
    IN  p_department_id   INT UNSIGNED,
    IN  p_enrollment_date DATE,
    OUT p_new_id          INT UNSIGNED
)
BEGIN
    INSERT INTO students (
        student_number, first_name, last_name, email, phone,
        date_of_birth, gender, address, department_id, enrollment_date
    ) VALUES (
        p_student_number, p_first_name, p_last_name, p_email, p_phone,
        p_date_of_birth, p_gender, p_address, p_department_id, p_enrollment_date
    );
    SET p_new_id = LAST_INSERT_ID();
END $$

DROP PROCEDURE IF EXISTS sp_update_student $$
CREATE PROCEDURE sp_update_student(
    IN p_student_id      INT UNSIGNED,
    IN p_first_name      VARCHAR(50),
    IN p_last_name       VARCHAR(50),
    IN p_email           VARCHAR(100),
    IN p_phone           VARCHAR(20),
    IN p_date_of_birth   DATE,
    IN p_gender          VARCHAR(10),
    IN p_address         VARCHAR(255),
    IN p_department_id   INT UNSIGNED,
    IN p_status          VARCHAR(20)
)
BEGIN
    UPDATE students
    SET first_name = p_first_name,
        last_name = p_last_name,
        email = p_email,
        phone = p_phone,
        date_of_birth = p_date_of_birth,
        gender = p_gender,
        address = p_address,
        department_id = p_department_id,
        status = p_status
    WHERE student_id = p_student_id;
END $$

DROP PROCEDURE IF EXISTS sp_register_course $$
CREATE PROCEDURE sp_register_course(
    IN  p_student_id INT UNSIGNED,
    IN  p_course_id  INT UNSIGNED,
    OUT p_new_id     INT UNSIGNED
)
BEGIN
    DECLARE v_status VARCHAR(20);

    SELECT status INTO v_status FROM students WHERE student_id = p_student_id;
    IF v_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Student not found.';
    END IF;
    IF v_status <> 'Active' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only active students may register for courses.';
    END IF;

    INSERT INTO registrations (student_id, course_id, registration_date, status)
    VALUES (p_student_id, p_course_id, CURDATE(), 'Registered');
    SET p_new_id = LAST_INSERT_ID();
END $$

DROP PROCEDURE IF EXISTS sp_record_exam $$
CREATE PROCEDURE sp_record_exam(
    IN  p_registration_id INT UNSIGNED,
    IN  p_exam_type       VARCHAR(10),
    IN  p_marks           DECIMAL(5,2),
    IN  p_exam_date       DATE,
    IN  p_remarks         VARCHAR(255),
    OUT p_new_id          INT UNSIGNED
)
BEGIN
    INSERT INTO examinations (
        registration_id, exam_type, marks, exam_date, remarks
    ) VALUES (
        p_registration_id, p_exam_type, p_marks, p_exam_date, p_remarks
    );
    SET p_new_id = LAST_INSERT_ID();
END $$

DROP PROCEDURE IF EXISTS sp_record_payment $$
CREATE PROCEDURE sp_record_payment(
    IN  p_student_id     INT UNSIGNED,
    IN  p_amount         DECIMAL(10,2),
    IN  p_payment_date   DATE,
    IN  p_payment_method VARCHAR(20),
    IN  p_academic_year  VARCHAR(9),
    IN  p_semester       VARCHAR(1),
    IN  p_status         VARCHAR(10),
    OUT p_new_id         INT UNSIGNED
)
BEGIN
    DECLARE v_receipt VARCHAR(30);
    SET v_receipt = CONCAT('RCPT-', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'), '-', LPAD(FLOOR(RAND() * 999), 3, '0'));

    INSERT INTO fees (
        student_id, amount, payment_date, payment_method,
        academic_year, semester, receipt_number, status
    ) VALUES (
        p_student_id, p_amount, p_payment_date, p_payment_method,
        p_academic_year, p_semester, v_receipt, p_status
    );
    SET p_new_id = LAST_INSERT_ID();
END $$

DROP PROCEDURE IF EXISTS sp_dashboard_stats $$
CREATE PROCEDURE sp_dashboard_stats()
BEGIN
    SELECT
        (SELECT COUNT(*) FROM students WHERE status = 'Active') AS active_students,
        (SELECT COUNT(*) FROM students) AS total_students,
        (SELECT COUNT(*) FROM courses) AS total_courses,
        (SELECT COUNT(*) FROM lecturers) AS total_lecturers,
        (SELECT COUNT(*) FROM registrations WHERE status = 'Registered') AS active_registrations,
        (SELECT COUNT(*) FROM examinations) AS exam_records,
        (SELECT COALESCE(SUM(amount), 0) FROM fees WHERE status = 'Paid') AS total_fees_paid,
        (SELECT COUNT(*) FROM departments) AS total_departments;
END $$

DELIMITER ;
