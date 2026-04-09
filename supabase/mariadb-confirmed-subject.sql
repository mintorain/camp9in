-- 지원자 최종 확정 과목 컬럼 추가
ALTER TABLE applicants ADD COLUMN confirmed_subject VARCHAR(50) DEFAULT NULL AFTER status;
CREATE INDEX idx_applicants_confirmed_subject ON applicants(confirmed_subject);
