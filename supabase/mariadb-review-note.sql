-- =============================================
-- 지원자 검토 비고 컬럼 추가 (합격/불합격 사유)
-- =============================================

USE camp9in;

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 이미 존재하면 건너뜀 (idempotent)
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'camp9in'
    AND TABLE_NAME = 'applicants'
    AND COLUMN_NAME = 'review_note'
);

SET @sql := IF(@col_exists = 0,
  'ALTER TABLE applicants ADD COLUMN review_note VARCHAR(500) DEFAULT NULL AFTER status',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
