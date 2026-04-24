-- =============================================
-- Schools / Subjects v2 스키마 (하드코딩 상수 → DB 이관)
-- 기존 테이블 유지, 새 테이블만 추가
-- =============================================

USE camp9in;

-- 학교 마스터
CREATE TABLE IF NOT EXISTS schools (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  date_label VARCHAR(100),
  time_label VARCHAR(100),
  location VARCHAR(200),
  target VARCHAR(50) DEFAULT NULL,
  capacity_per_subject INT NOT NULL DEFAULT 8,
  camp_type ENUM('class','rotation','hybrid') NOT NULL DEFAULT 'class',
  hide_name TINYINT(1) NOT NULL DEFAULT 0,         -- 학교명만 비공개 (카드는 유지)
  hide_schedule_card TINYINT(1) NOT NULL DEFAULT 0,-- 캠프일정 카드 숨김
  is_closed TINYINT(1) NOT NULL DEFAULT 0,         -- 수동 마감 (closed_schools 대체)
  sort_order INT NOT NULL DEFAULT 100,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_schools_end_date (end_date),
  INDEX idx_schools_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 과목 마스터
CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(300) DEFAULT NULL,
  skills VARCHAR(200) DEFAULT NULL,
  icon VARCHAR(20) DEFAULT NULL,
  is_closed TINYINT(1) NOT NULL DEFAULT 0,         -- 수동 마감 (closed_subjects 대체)
  sort_order INT NOT NULL DEFAULT 100,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subjects_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학교별 학년/세션 배정
CREATE TABLE IF NOT EXISTS school_grades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id VARCHAR(50) NOT NULL,
  grade VARCHAR(50) NOT NULL,                      -- "1학년", "5~6학년", "전학년"
  period VARCHAR(100) DEFAULT NULL,                -- "4/20(월)~4/21(화)"
  grade_type VARCHAR(50) DEFAULT NULL,             -- "교실수업", "강당 체험부스"
  capacity INT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_grades_school (school_id, sort_order),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학년-과목 배정 (N:N, 반별은 1행 / 순환은 여러 행)
CREATE TABLE IF NOT EXISTS school_grade_subjects (
  grade_id INT NOT NULL,
  subject_id VARCHAR(50) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (grade_id, subject_id),
  INDEX idx_sgs_subject (subject_id),
  FOREIGN KEY (grade_id) REFERENCES school_grades(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
