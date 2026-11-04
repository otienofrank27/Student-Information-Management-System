-- =============================================================================
-- University Student Information Management System (USIMS) (USIMS)
-- Schema: 7 tables in Third Normal Form (3NF)
-- Engine: InnoDB | Charset: utf8mb4
-- =============================================================================

DROP DATABASE IF EXISTS usims;
CREATE DATABASE usims CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE usims;

-- -----------------------------------------------------------------------------
-- Table 1: departments
-- Independent entity. No repeating groups, no partial or transitive deps.
-- -----------------------------------------------------------------------------
CREATE TABLE departments (
    department_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    department_code VARCHAR(10)  NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    faculty         VARCHAR(100) NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_department_code UNIQUE (department_code),
    CONSTRAINT uq_department_name UNIQUE (department_name)
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Table 2: lecturers
-- Depends on departments only. Personal attributes depend solely on lecturer_id.
-- -----------------------------------------------------------------------------
CREATE TABLE lecturers (
    lecturer_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    staff_number   VARCHAR(20)  NOT NULL,
    first_name     VARCHAR(50)  NOT NULL,
    last_name      VARCHAR(50)  NOT NULL,
    email          VARCHAR(100) NOT NULL,
    phone          VARCHAR(20)  NULL,
    title          VARCHAR(50)  NOT NULL DEFAULT 'Lecturer',
    department_id  INT UNSIGNED NOT NULL,
    hire_date      DATE         NOT NULL,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_lecturer_staff UNIQUE (staff_number),
    CONSTRAINT uq_lecturer_email UNIQUE (email),
    CONSTRAINT fk_lecturer_department
        FOREIGN KEY (department_id) REFERENCES departments (department_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Table 3: students
-- Depends on departments only. Contact and identity attributes depend on PK.
-- -----------------------------------------------------------------------------
CREATE TABLE students (
    student_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_number   VARCHAR(20)  NOT NULL,
    first_name       VARCHAR(50)  NOT NULL,
    last_name        VARCHAR(50)  NOT NULL,
    email            VARCHAR(100) NOT NULL,
    phone            VARCHAR(20)  NULL,
    date_of_birth    DATE         NOT NULL,
    gender           ENUM('Male', 'Female', 'Other') NOT NULL,
    address          VARCHAR(255) NULL,
    department_id    INT UNSIGNED NOT NULL,
    enrollment_date  DATE         NOT NULL,
    status           ENUM('Active', 'Inactive', 'Graduated', 'Suspended')
                     NOT NULL DEFAULT 'Active',
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_number UNIQUE (student_number),
    CONSTRAINT uq_student_email  UNIQUE (email),
    CONSTRAINT fk_student_department
        FOREIGN KEY (department_id) REFERENCES departments (department_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Table 4: courses
-- Course catalogue. Department and lecturer are referenced, not duplicated.
-- -----------------------------------------------------------------------------
CREATE TABLE courses (
    course_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_code    VARCHAR(20)  NOT NULL,
    course_name    VARCHAR(150) NOT NULL,
    credits           TINYINT UNSIGNED NOT NULL,
    credential_level  ENUM('Certificate', 'Diploma', 'Advanced Diploma', 'Bachelor', 'Master', 'Doctorate')
                      NOT NULL DEFAULT 'Bachelor',
    department_id     INT UNSIGNED NOT NULL,
    lecturer_id       INT UNSIGNED NULL,
    semester          ENUM('1', '2') NOT NULL,
    academic_year     VARCHAR(9)   NOT NULL,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_course_code UNIQUE (course_code),
    CONSTRAINT ck_course_credits CHECK (credits BETWEEN 1 AND 6),
    CONSTRAINT fk_course_department
        FOREIGN KEY (department_id) REFERENCES departments (department_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_course_lecturer
        FOREIGN KEY (lecturer_id) REFERENCES lecturers (lecturer_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Table 5: registrations
-- Associative entity resolving the M:N relationship students <-> courses.
-- -----------------------------------------------------------------------------
CREATE TABLE registrations (
    registration_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id        INT UNSIGNED NOT NULL,
    course_id         INT UNSIGNED NOT NULL,
    registration_date DATE         NOT NULL,
    status            ENUM('Registered', 'Dropped', 'Completed')
                      NOT NULL DEFAULT 'Registered',
    created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_course UNIQUE (student_id, course_id),
    CONSTRAINT fk_reg_student
        FOREIGN KEY (student_id) REFERENCES students (student_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_reg_course
        FOREIGN KEY (course_id) REFERENCES courses (course_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Table 6: examinations
-- Results stored against a registration (student+course), not duplicated names.
-- Marks range is enforced by trigger trg_exam_marks_before_insert/update.
-- -----------------------------------------------------------------------------
CREATE TABLE examinations (
    exam_id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    registration_id  INT UNSIGNED NOT NULL,
    exam_type        ENUM('CA', 'Midterm', 'Final') NOT NULL,
    marks            DECIMAL(5,2) NOT NULL,
    grade            CHAR(2)      NULL,
    exam_date        DATE         NOT NULL,
    remarks          VARCHAR(255) NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_reg_exam_type UNIQUE (registration_id, exam_type),
    CONSTRAINT fk_exam_registration
        FOREIGN KEY (registration_id) REFERENCES registrations (registration_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -----------------------------------------------------------------------------
-- Table 7: fees
-- Payment records. Student identity is referenced; no duplicated student data.
-- -----------------------------------------------------------------------------
CREATE TABLE fees (
    payment_id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id      INT UNSIGNED NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    payment_date    DATE          NOT NULL,
    payment_method  ENUM('Cash', 'Bank Transfer', 'Mobile Money', 'Cheque')
                    NOT NULL,
    academic_year   VARCHAR(9)    NOT NULL,
    semester        ENUM('1', '2') NOT NULL,
    receipt_number  VARCHAR(30)   NOT NULL,
    status          ENUM('Paid', 'Pending', 'Refunded') NOT NULL DEFAULT 'Paid',
    created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_receipt UNIQUE (receipt_number),
    CONSTRAINT ck_fee_amount CHECK (amount > 0),
    CONSTRAINT fk_fee_student
        FOREIGN KEY (student_id) REFERENCES students (student_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;
