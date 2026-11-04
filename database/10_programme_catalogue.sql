-- =============================================================================
-- Crestwood University academic catalogue
-- 104 programmes · 6 credential levels · 5 schools
-- =============================================================================
USE usims;

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS credential_level
        ENUM('Certificate', 'Diploma', 'Advanced Diploma', 'Bachelor', 'Master', 'Doctorate')
        NOT NULL DEFAULT 'Bachelor'
        AFTER credits;

CREATE INDEX IF NOT EXISTS idx_courses_credential ON courses (credential_level);

UPDATE courses SET credential_level = 'Bachelor'
 WHERE course_code IN ('CS101','CS210','CS305','EE120','EE240','BA110','BA220','HS150','HS210');
UPDATE courses SET credential_level = 'Diploma'
 WHERE course_code IN ('HT101','HT210');

INSERT IGNORE INTO courses
    (course_code, course_name, credits, credential_level, department_id, lecturer_id, semester, academic_year)
VALUES
-- School of Business and Education (department_id 3, lecturer 4)
('BE-C01', 'Certificate in Business Administration', 2, 'Certificate', 3, 4, '1', '2025/2026'),
('BE-C02', 'Certificate in Accounting and Bookkeeping', 2, 'Certificate', 3, 4, '1', '2025/2026'),
('BE-C03', 'Certificate in Human Resource Practice', 2, 'Certificate', 3, 4, '2', '2025/2026'),
('BE-C04', 'Certificate in Sales and Marketing', 2, 'Certificate', 3, 4, '1', '2025/2026'),
('BE-C05', 'Certificate in Entrepreneurship', 2, 'Certificate', 3, 4, '2', '2025/2026'),
('BE-C06', 'Certificate in Early Childhood Education', 2, 'Certificate', 3, 4, '1', '2025/2026'),
('BE-C07', 'Certificate in Office Administration', 2, 'Certificate', 3, 4, '2', '2025/2026'),
('BE-C08', 'Certificate in Procurement and Supplies', 2, 'Certificate', 3, 4, '1', '2025/2026'),
('BE-D01', 'Diploma in Business Management', 3, 'Diploma', 3, 4, '1', '2025/2026'),
('BE-D02', 'Diploma in Accounting and Finance', 3, 'Diploma', 3, 4, '1', '2025/2026'),
('BE-D03', 'Diploma in Human Resource Management', 3, 'Diploma', 3, 4, '2', '2025/2026'),
('BE-D04', 'Diploma in Education (Arts)', 3, 'Diploma', 3, 4, '1', '2025/2026'),
('BE-D05', 'Diploma in Marketing Management', 3, 'Diploma', 3, 4, '2', '2025/2026'),
('BE-A01', 'Advanced Diploma in Business Administration', 3, 'Advanced Diploma', 3, 4, '1', '2025/2026'),
('BE-B01', 'Bachelor of Commerce', 4, 'Bachelor', 3, 4, '1', '2025/2026'),
('BE-B02', 'Bachelor of Business Administration', 4, 'Bachelor', 3, 4, '1', '2025/2026'),
('BE-B03', 'Bachelor of Economics', 4, 'Bachelor', 3, 4, '2', '2025/2026'),
('BE-B04', 'Bachelor of Accounting', 4, 'Bachelor', 3, 4, '1', '2025/2026'),
('BE-B05', 'Bachelor of Human Resource Management', 4, 'Bachelor', 3, 4, '2', '2025/2026'),
('BE-B06', 'Bachelor of Education (Arts)', 4, 'Bachelor', 3, 4, '1', '2025/2026'),
('BE-M01', 'Master of Business Administration', 4, 'Master', 3, 4, '1', '2025/2026'),

-- School of Health Sciences (department_id 5, lecturer 6)
('HS-C01', 'Certificate in Community Health', 2, 'Certificate', 5, 6, '1', '2025/2026'),
('HS-C02', 'Certificate in Nursing Aide', 2, 'Certificate', 5, 6, '1', '2025/2026'),
('HS-C03', 'Certificate in Medical Records', 2, 'Certificate', 5, 6, '2', '2025/2026'),
('HS-C04', 'Certificate in First Aid and Emergency Care', 2, 'Certificate', 5, 6, '1', '2025/2026'),
('HS-C05', 'Certificate in Nutrition and Dietetics Support', 2, 'Certificate', 5, 6, '2', '2025/2026'),
('HS-C06', 'Certificate in Pharmacy Support', 2, 'Certificate', 5, 6, '1', '2025/2026'),
('HS-C07', 'Certificate in Public Health Promotion', 2, 'Certificate', 5, 6, '2', '2025/2026'),
('HS-D01', 'Diploma in Nursing', 3, 'Diploma', 5, 6, '1', '2025/2026'),
('HS-D02', 'Diploma in Clinical Medicine', 3, 'Diploma', 5, 6, '1', '2025/2026'),
('HS-D03', 'Diploma in Medical Laboratory Science', 3, 'Diploma', 5, 6, '2', '2025/2026'),
('HS-D04', 'Diploma in Public Health', 3, 'Diploma', 5, 6, '1', '2025/2026'),
('HS-D05', 'Diploma in Pharmaceutical Technology', 3, 'Diploma', 5, 6, '2', '2025/2026'),
('HS-A01', 'Advanced Diploma in Clinical Medicine', 3, 'Advanced Diploma', 5, 6, '1', '2025/2026'),
('HS-B01', 'Bachelor of Science in Nursing', 4, 'Bachelor', 5, 6, '1', '2025/2026'),
('HS-B02', 'Bachelor of Clinical Medicine', 4, 'Bachelor', 5, 6, '1', '2025/2026'),
('HS-B03', 'Bachelor of Forensic Science', 4, 'Bachelor', 5, 6, '2', '2025/2026'),
('HS-B04', 'Bachelor of Medical Biotechnology', 4, 'Bachelor', 5, 6, '1', '2025/2026'),
('HS-B05', 'Bachelor of Public Health', 4, 'Bachelor', 5, 6, '2', '2025/2026'),
('HS-B06', 'Bachelor of Medical Laboratory Science', 4, 'Bachelor', 5, 6, '1', '2025/2026'),
('HS-M01', 'Master of Public Health', 4, 'Master', 5, 6, '1', '2025/2026'),
('HS-P01', 'Doctor of Philosophy in Health Sciences', 6, 'Doctorate', 5, 6, '1', '2025/2026'),

-- School of Engineering and Technology (department_id 2, lecturer 3)
('ET-C01', 'Certificate in Electrical Installation', 2, 'Certificate', 2, 3, '1', '2025/2026'),
('ET-C02', 'Certificate in Welding and Fabrication', 2, 'Certificate', 2, 3, '1', '2025/2026'),
('ET-C03', 'Certificate in Automotive Technology', 2, 'Certificate', 2, 3, '2', '2025/2026'),
('ET-C04', 'Certificate in Plumbing Technology', 2, 'Certificate', 2, 3, '1', '2025/2026'),
('ET-C05', 'Certificate in Solar PV Installation', 2, 'Certificate', 2, 3, '2', '2025/2026'),
('ET-C06', 'Certificate in Telecommunication Support', 2, 'Certificate', 2, 3, '1', '2025/2026'),
('ET-C07', 'Certificate in Computer Hardware Maintenance', 2, 'Certificate', 2, 3, '2', '2025/2026'),
('ET-D01', 'Diploma in Electrical Engineering', 3, 'Diploma', 2, 3, '1', '2025/2026'),
('ET-D02', 'Diploma in Mechanical Engineering', 3, 'Diploma', 2, 3, '1', '2025/2026'),
('ET-D03', 'Diploma in Civil Engineering', 3, 'Diploma', 2, 3, '2', '2025/2026'),
('ET-D04', 'Diploma in Telecommunication Engineering', 3, 'Diploma', 2, 3, '1', '2025/2026'),
('ET-D05', 'Diploma in Renewable Energy Technology', 3, 'Diploma', 2, 3, '2', '2025/2026'),
('ET-A01', 'Advanced Diploma in Electrical Engineering', 3, 'Advanced Diploma', 2, 3, '1', '2025/2026'),
('ET-B01', 'Bachelor of Civil Engineering', 4, 'Bachelor', 2, 3, '1', '2025/2026'),
('ET-B02', 'Bachelor of Electrical Engineering', 4, 'Bachelor', 2, 3, '1', '2025/2026'),
('ET-B03', 'Bachelor of Mechanical Engineering', 4, 'Bachelor', 2, 3, '2', '2025/2026'),
('ET-B04', 'Bachelor of Telecommunication Engineering', 4, 'Bachelor', 2, 3, '1', '2025/2026'),
('ET-B05', 'Bachelor of Chemical Engineering', 4, 'Bachelor', 2, 3, '2', '2025/2026'),
('ET-B06', 'Bachelor of Renewable Energy Engineering', 4, 'Bachelor', 2, 3, '1', '2025/2026'),
('ET-M01', 'Master of Engineering', 4, 'Master', 2, 3, '1', '2025/2026'),

-- School of Pure and Applied Sciences (department_id 1, lecturers 1 and 2)
('PAS-C01', 'Certificate in Information Technology', 2, 'Certificate', 1, 2, '1', '2025/2026'),
('PAS-C02', 'Certificate in Computer Applications', 2, 'Certificate', 1, 1, '1', '2025/2026'),
('PAS-C03', 'Certificate in Data Entry and Analytics', 2, 'Certificate', 1, 2, '2', '2025/2026'),
('PAS-C04', 'Certificate in Web Design', 2, 'Certificate', 1, 1, '1', '2025/2026'),
('PAS-C05', 'Certificate in Applied Mathematics', 2, 'Certificate', 1, 2, '2', '2025/2026'),
('PAS-C06', 'Certificate in Cybersecurity Fundamentals', 2, 'Certificate', 1, 1, '1', '2025/2026'),
('PAS-D01', 'Diploma in Computer Science', 3, 'Diploma', 1, 1, '1', '2025/2026'),
('PAS-D02', 'Diploma in Information Technology', 3, 'Diploma', 1, 2, '1', '2025/2026'),
('PAS-D03', 'Diploma in Applied Statistics', 3, 'Diploma', 1, 2, '2', '2025/2026'),
('PAS-D04', 'Diploma in Software Development', 3, 'Diploma', 1, 1, '1', '2025/2026'),
('PAS-B01', 'Bachelor of Computer Science', 4, 'Bachelor', 1, 1, '1', '2025/2026'),
('PAS-B02', 'Bachelor of Information Technology', 4, 'Bachelor', 1, 2, '1', '2025/2026'),
('PAS-B03', 'Bachelor of Actuarial Science', 4, 'Bachelor', 1, 2, '2', '2025/2026'),
('PAS-B04', 'Bachelor of Applied Statistics', 4, 'Bachelor', 1, 2, '1', '2025/2026'),
('PAS-B05', 'Bachelor of Mathematics', 4, 'Bachelor', 1, 1, '2', '2025/2026'),
('PAS-B06', 'Bachelor of Data Science', 4, 'Bachelor', 1, 1, '1', '2025/2026'),

-- School of Hospitality and Textile Technology (department_id 4, lecturer 5)
('HTT-C01', 'Certificate in Food Production', 2, 'Certificate', 4, 5, '1', '2025/2026'),
('HTT-C02', 'Certificate in Housekeeping Operations', 2, 'Certificate', 4, 5, '1', '2025/2026'),
('HTT-C03', 'Certificate in Front Office Operations', 2, 'Certificate', 4, 5, '2', '2025/2026'),
('HTT-C04', 'Certificate in Cosmetology', 2, 'Certificate', 4, 5, '1', '2025/2026'),
('HTT-C05', 'Certificate in Fashion Illustration', 2, 'Certificate', 4, 5, '2', '2025/2026'),
('HTT-C06', 'Certificate in Travel Consultancy', 2, 'Certificate', 4, 5, '1', '2025/2026'),
('HTT-C07', 'Certificate in Interior Decoration', 2, 'Certificate', 4, 5, '2', '2025/2026'),
('HTT-D01', 'Diploma in Hospitality Management', 3, 'Diploma', 4, 5, '1', '2025/2026'),
('HTT-D02', 'Diploma in Fashion Design', 3, 'Diploma', 4, 5, '1', '2025/2026'),
('HTT-D03', 'Diploma in Travel and Tourism', 3, 'Diploma', 4, 5, '2', '2025/2026'),
('HTT-D04', 'Diploma in Cosmetology and Beauty Therapy', 3, 'Diploma', 4, 5, '1', '2025/2026'),
('HTT-B01', 'Bachelor of Hospitality Management', 4, 'Bachelor', 4, 5, '1', '2025/2026'),
('HTT-B02', 'Bachelor of Fashion Design', 4, 'Bachelor', 4, 5, '1', '2025/2026'),
('HTT-B03', 'Bachelor of Travel and Tourism Management', 4, 'Bachelor', 4, 5, '2', '2025/2026'),
('HTT-B04', 'Bachelor of Interior Design', 4, 'Bachelor', 4, 5, '1', '2025/2026');
