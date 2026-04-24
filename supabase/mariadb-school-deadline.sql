-- =============================================
-- 학교별 모집 마감일 컬럼 추가
-- recruit_deadline: 강사 지원 접수 마감일 (end_date 캠프 종료일과 별개)
-- =============================================

USE camp9in;

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'camp9in'
    AND TABLE_NAME = 'schools'
    AND COLUMN_NAME = 'recruit_deadline'
);

SET @sql := IF(@col_exists = 0,
  'ALTER TABLE schools ADD COLUMN recruit_deadline DATE DEFAULT NULL AFTER end_date',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
