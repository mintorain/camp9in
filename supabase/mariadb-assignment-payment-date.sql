-- =============================================
-- 배정별 강사료 입금일 컬럼 추가
-- 기존: applicants.payment_date (1인당 단일 날짜)
-- 변경: applicant_assignments.payment_date (학교별 개별 날짜)
-- =============================================

USE camp9in;

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- idempotent
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'camp9in'
    AND TABLE_NAME = 'applicant_assignments'
    AND COLUMN_NAME = 'payment_date'
);

SET @sql := IF(@col_exists = 0,
  'ALTER TABLE applicant_assignments ADD COLUMN payment_date DATE DEFAULT NULL AFTER payment_amount',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 기존 applicants.payment_date 값이 있는 경우 → 해당 지원자의 모든 배정에 복사 (마이그레이션)
-- 배정별 입금일이 아직 없는 경우만 반영
UPDATE applicant_assignments aa
  INNER JOIN applicants a ON a.id = aa.applicant_id
SET aa.payment_date = a.payment_date
WHERE aa.payment_date IS NULL
  AND a.payment_date IS NOT NULL;
