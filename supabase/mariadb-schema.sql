-- =============================================
-- AI캠프 강사 모집 - MariaDB 스키마
-- 시놀로지 NAS MariaDB 10에서 실행
-- =============================================

CREATE DATABASE IF NOT EXISTS camp9in
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE camp9in;

-- 지원자 테이블
CREATE TABLE IF NOT EXISTS applicants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  email VARCHAR(100) NOT NULL,
  address VARCHAR(100) NOT NULL,
  birth_date DATE NOT NULL,
  education VARCHAR(20) NOT NULL,
  major VARCHAR(50) DEFAULT NULL,
  experience TEXT NOT NULL,
  qualifications TEXT DEFAULT NULL,
  introduction TEXT DEFAULT NULL,
  privacy_agreed TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_applicants_status (status),
  INDEX idx_applicants_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 지원 학교 테이블
CREATE TABLE IF NOT EXISTS applicant_schools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  applicant_id INT NOT NULL,
  school_id VARCHAR(50) NOT NULL,
  INDEX idx_schools_applicant (applicant_id),
  INDEX idx_schools_school (school_id),
  FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 지원 과목 테이블
CREATE TABLE IF NOT EXISTS applicant_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  applicant_id INT NOT NULL,
  subject_id VARCHAR(50) NOT NULL,
  INDEX idx_subjects_applicant (applicant_id),
  INDEX idx_subjects_subject (subject_id),
  FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 과목 마감 관리 테이블
CREATE TABLE IF NOT EXISTS closed_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject_id VARCHAR(50) NOT NULL UNIQUE,
  closed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_by VARCHAR(50) DEFAULT 'admin'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DB 사용자 생성 (필요 시)
-- CREATE USER 'camp9in'@'localhost' IDENTIFIED BY 'your_password_here';
-- GRANT ALL PRIVILEGES ON camp9in.* TO 'camp9in'@'localhost';
-- FLUSH PRIVILEGES;
