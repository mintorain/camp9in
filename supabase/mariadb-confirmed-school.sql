-- 지원자 최종 확정 학교 컬럼 추가
ALTER TABLE applicants ADD COLUMN confirmed_school VARCHAR(50) DEFAULT NULL AFTER confirmed_subject;
CREATE INDEX idx_applicants_confirmed_school ON applicants(confirmed_school);
