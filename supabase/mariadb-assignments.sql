-- 강사 다중 배정 테이블 생성
CREATE TABLE IF NOT EXISTS applicant_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  applicant_id INT NOT NULL,
  school_id VARCHAR(50) NOT NULL,
  subject_id VARCHAR(50) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_assignment (applicant_id, school_id, subject_id),
  INDEX idx_assignments_applicant (applicant_id),
  INDEX idx_assignments_school (school_id)
);

-- 기존 confirmed_school/confirmed_subject 데이터 마이그레이션
INSERT IGNORE INTO applicant_assignments (applicant_id, school_id, subject_id)
SELECT id, confirmed_school, confirmed_subject
FROM applicants
WHERE confirmed_school IS NOT NULL AND confirmed_subject IS NOT NULL;
