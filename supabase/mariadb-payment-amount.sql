-- 강사료 금액 및 입금일자 컬럼 추가
ALTER TABLE applicants ADD COLUMN payment_amount INT DEFAULT NULL;
ALTER TABLE applicants ADD COLUMN payment_date DATE DEFAULT NULL;
