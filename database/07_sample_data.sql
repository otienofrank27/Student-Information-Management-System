-- =============================================================================
-- Sample data for demonstration and screenshots
-- =============================================================================
USE usims;

INSERT INTO departments (department_code, department_name, faculty) VALUES
('PAS', 'Computer Science',                    'School of Pure and Applied Sciences'),
('ET',  'Electrical and Electronic Engineering','School of Engineering and Technology'),
('BE',  'Business Administration',             'School of Business and Education'),
('HTT', 'Hospitality and Fashion Design',      'School of Hospitality and Textile Technology'),
('HS',  'Nursing and Clinical Sciences',       'School of Health Sciences');

INSERT INTO lecturers (staff_number, first_name, last_name, email, phone, title, department_id, hire_date) VALUES
('STF1001', 'Amara',  'Okello',  'amara.okello@usims.edu',  '+256700111001', 'Senior Lecturer', 1, '2016-02-01'),
('STF1002', 'Daniel', 'Mensah',  'daniel.mensah@usims.edu', '+256700111002', 'Lecturer',        1, '2019-08-15'),
('STF1003', 'Fatima', 'Hassan',  'fatima.hassan@usims.edu', '+256700111003', 'Professor',       2, '2012-01-10'),
('STF1004', 'Peter',  'Njoroge', 'peter.njoroge@usims.edu', '+256700111004', 'Lecturer',        3, '2020-03-20'),
('STF1005', 'Grace',  'Banda',   'grace.banda@usims.edu',   '+256700111005', 'Senior Lecturer', 4, '2015-09-01'),
('STF1006', 'Lillian','Adeyemi', 'lillian.adeyemi@usims.edu','+256700111006','Lecturer',        5, '2018-11-12');

INSERT INTO students (
    student_number, first_name, last_name, email, phone, date_of_birth,
    gender, address, department_id, enrollment_date, status
) VALUES
('CU2024001', 'James',  'Kato',     'james.kato@student.usims.edu',     '+256701000001', '2003-04-12', 'Male',   '12 Makerere Hill, Kampala', 1, '2024-08-20', 'Active'),
('CU2024002', 'Amina',  'Suleiman', 'amina.suleiman@student.usims.edu', '+256701000002', '2004-01-08', 'Female', '45 Entebbe Road, Kampala', 1, '2024-08-20', 'Active'),
('CU2024003', 'Brian',  'Mwangi',   'brian.mwangi@student.usims.edu',   '+256701000003', '2002-11-23', 'Male',   '8 Industrial Area, Nairobi', 2, '2023-08-18', 'Active'),
('CU2024004', 'Chipo',  'Dube',     'chipo.dube@student.usims.edu',     '+256701000004', '2003-07-30', 'Female', '22 Samora Ave, Harare',     3, '2024-08-20', 'Active'),
('CU2024005', 'Kwame',  'Asante',   'kwame.asante@student.usims.edu',   '+256701000005', '2001-09-14', 'Male',   '3 Independence Ave, Accra', 2, '2022-08-16', 'Active'),
('CU2024006', 'Naledi', 'Mokoena',  'naledi.mokoena@student.usims.edu', '+256701000006', '2004-03-02', 'Female', '19 Church Street, Pretoria',4, '2024-08-20', 'Active'),
('CU2024007', 'Omar',   'Farouk',   'omar.farouk@student.usims.edu',    '+256701000007', '2003-12-19', 'Male',   '7 Nile Avenue, Khartoum',   5, '2023-08-18', 'Active'),
('CU2024008', 'Wanjiku','Kamau',    'wanjiku.kamau@student.usims.edu',  '+256701000008', '2002-05-27', 'Female', '31 Ngong Road, Nairobi',    1, '2022-08-16', 'Graduated'),
('CU2024009', 'Tunde',  'Balogun',  'tunde.balogun@student.usims.edu',  '+256701000009', '2004-06-11', 'Male',   '14 Marina, Lagos',          3, '2024-08-20', 'Active'),
('CU2024010', 'Zainab', 'Ibrahim',  'zainab.ibrahim@student.usims.edu', '+256701000010', '2003-02-05', 'Female', '9 Independence Way, Kano',  5, '2023-08-18', 'Active');

INSERT INTO courses (course_code, course_name, credits, credential_level, department_id, lecturer_id, semester, academic_year) VALUES
('CS101', 'Introduction to Programming',     4, 'Bachelor', 1, 1, '1', '2025/2026'),
('CS210', 'Database Systems',                4, 'Bachelor', 1, 2, '1', '2025/2026'),
('CS305', 'Software Engineering',            3, 'Bachelor', 1, 1, '2', '2025/2026'),
('EE120', 'Circuit Theory',                  4, 'Bachelor', 2, 3, '1', '2025/2026'),
('EE240', 'Digital Electronics',             3, 'Bachelor', 2, 3, '2', '2025/2026'),
('BA110', 'Principles of Management',        3, 'Bachelor', 3, 4, '1', '2025/2026'),
('BA220', 'Financial Accounting',            4, 'Bachelor', 3, 4, '1', '2025/2026'),
('HT101', 'Food and Beverage Operations',    3, 'Diploma',  4, 5, '1', '2025/2026'),
('HT210', 'Textile Science and Apparel',     3, 'Diploma',  4, 5, '2', '2025/2026'),
('HS150', 'Human Anatomy',                   4, 'Bachelor', 5, 6, '1', '2025/2026'),
('HS210', 'Clinical Nursing Practice',       4, 'Bachelor', 5, 6, '2', '2025/2026');

INSERT INTO registrations (student_id, course_id, registration_date, status) VALUES
(1, 1, '2025-08-25', 'Registered'),
(1, 2, '2025-08-25', 'Registered'),
(2, 1, '2025-08-26', 'Registered'),
(2, 2, '2025-08-26', 'Registered'),
(2, 3, '2025-08-26', 'Registered'),
(3, 4, '2025-08-24', 'Registered'),
(3, 5, '2025-08-24', 'Registered'),
(4, 6, '2025-08-27', 'Registered'),
(4, 7, '2025-08-27', 'Registered'),
(5, 4, '2025-08-23', 'Registered'),
(5, 5, '2025-08-23', 'Completed'),
(6, 8, '2025-08-28', 'Registered'),
(6, 9, '2025-08-28', 'Registered'),
(7, 10,'2025-08-22', 'Registered'),
(7, 11,'2025-08-22', 'Registered'),
(9, 6, '2025-08-29', 'Registered'),
(9, 7, '2025-08-29', 'Registered'),
(10,10,'2025-08-21', 'Registered'),
(10,11,'2025-08-21', 'Registered');

INSERT INTO examinations (registration_id, exam_type, marks, exam_date, remarks) VALUES
(1,  'CA',      78.50, '2025-10-15', 'Solid understanding of control structures'),
(1,  'Midterm', 72.00, '2025-11-20', NULL),
(2,  'CA',      85.00, '2025-10-16', 'Excellent SQL practical'),
(3,  'CA',      91.00, '2025-10-15', 'Outstanding'),
(3,  'Midterm', 88.50, '2025-11-20', NULL),
(4,  'CA',      67.00, '2025-10-16', 'Needs more practice on normalisation'),
(6,  'CA',      74.00, '2025-10-18', NULL),
(6,  'Final',   69.50, '2026-01-12', NULL),
(8,  'CA',      81.00, '2025-10-14', NULL),
(10, 'CA',      58.00, '2025-10-18', 'Borderline; recommended extra tutorials'),
(12, 'CA',      76.50, '2025-10-17', 'Strong service sequence'),
(13, 'CA',      71.00, '2025-10-21', 'Good grasp of fibre properties'),
(14, 'CA',      83.00, '2025-10-19', NULL),
(16, 'CA',      64.00, '2025-10-14', NULL),
(18, 'CA',      89.00, '2025-10-19', 'Excellent lab performance');

INSERT INTO fees (student_id, amount, payment_date, payment_method, academic_year, semester, receipt_number, status) VALUES
(1,  1250000.00, '2025-08-10', 'Bank Transfer', '2025/2026', '1', 'RCPT-20250810001', 'Paid'),
(1,   350000.00, '2025-09-05', 'Mobile Money',  '2025/2026', '1', 'RCPT-20250905002', 'Paid'),
(2,  1250000.00, '2025-08-12', 'Bank Transfer', '2025/2026', '1', 'RCPT-20250812003', 'Paid'),
(3,  1400000.00, '2025-08-08', 'Cash',          '2025/2026', '1', 'RCPT-20250808004', 'Paid'),
(4,  1100000.00, '2025-08-15', 'Bank Transfer', '2025/2026', '1', 'RCPT-20250815005', 'Paid'),
(5,  1400000.00, '2025-08-05', 'Cheque',        '2025/2026', '1', 'RCPT-20250805006', 'Paid'),
(6,   950000.00, '2025-08-18', 'Mobile Money',  '2025/2026', '1', 'RCPT-20250818007', 'Paid'),
(7,  1500000.00, '2025-08-09', 'Bank Transfer', '2025/2026', '1', 'RCPT-20250809008', 'Paid'),
(9,  1100000.00, '2025-08-20', 'Mobile Money',  '2025/2026', '1', 'RCPT-20250820009', 'Pending'),
(10, 1500000.00, '2025-08-07', 'Bank Transfer', '2025/2026', '1', 'RCPT-20250807010', 'Paid');
