-- =============================================================================
-- Triggers
-- Required: reject examination marks outside 0-100
-- Additional: auto-assign letter grade
-- =============================================================================
USE usims;

DELIMITER $$

DROP TRIGGER IF EXISTS trg_exam_marks_before_insert $$
CREATE TRIGGER trg_exam_marks_before_insert
BEFORE INSERT ON examinations
FOR EACH ROW
BEGIN
    IF NEW.marks < 0 OR NEW.marks > 100 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Examination marks must be between 0 and 100.';
    END IF;

    SET NEW.grade = CASE
        WHEN NEW.marks >= 80 THEN 'A'
        WHEN NEW.marks >= 70 THEN 'B'
        WHEN NEW.marks >= 60 THEN 'C'
        WHEN NEW.marks >= 50 THEN 'D'
        ELSE 'F'
    END;
END $$

DROP TRIGGER IF EXISTS trg_exam_marks_before_update $$
CREATE TRIGGER trg_exam_marks_before_update
BEFORE UPDATE ON examinations
FOR EACH ROW
BEGIN
    IF NEW.marks < 0 OR NEW.marks > 100 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Examination marks must be between 0 and 100.';
    END IF;

    SET NEW.grade = CASE
        WHEN NEW.marks >= 80 THEN 'A'
        WHEN NEW.marks >= 70 THEN 'B'
        WHEN NEW.marks >= 60 THEN 'C'
        WHEN NEW.marks >= 50 THEN 'D'
        ELSE 'F'
    END;
END $$

DROP TRIGGER IF EXISTS trg_student_number_format $$
CREATE TRIGGER trg_student_number_format
BEFORE INSERT ON students
FOR EACH ROW
BEGIN
    IF NEW.student_number NOT REGEXP '^CU[0-9]{7}$' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Student number must match CU followed by 7 digits (e.g. CU2024001).';
    END IF;
END $$

DROP TRIGGER IF EXISTS trg_student_number_format_before_update $$
CREATE TRIGGER trg_student_number_format_before_update
BEFORE UPDATE ON students
FOR EACH ROW
BEGIN
    IF NEW.student_number NOT REGEXP '^CU[0-9]{7}$' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Student number must match CU followed by 7 digits (e.g. CU2024001).';
    END IF;
END $$

DELIMITER ;
