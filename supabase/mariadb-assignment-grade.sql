-- 배정에 학년/일정 정보 추가
ALTER TABLE applicant_assignments ADD COLUMN grade VARCHAR(50) DEFAULT NULL AFTER subject_id;
-- 기존 유니크 키 삭제 후 grade 포함하여 재생성
ALTER TABLE applicant_assignments DROP INDEX uk_assignment;
ALTER TABLE applicant_assignments ADD UNIQUE KEY uk_assignment (applicant_id, school_id, subject_id, grade);
