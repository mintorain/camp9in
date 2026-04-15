-- 배정별 강사료 금액 컬럼 추가
ALTER TABLE applicant_assignments ADD COLUMN payment_amount INT DEFAULT NULL;
