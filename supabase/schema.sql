-- AI캠프 강사 모집 데이터베이스 스키마

-- 지원자 테이블
CREATE TABLE IF NOT EXISTS applicants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(20) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  email VARCHAR(100) NOT NULL,
  address VARCHAR(100) NOT NULL,
  birth_date DATE NOT NULL,
  education VARCHAR(20) NOT NULL,
  major VARCHAR(50),
  experience TEXT NOT NULL,
  qualifications TEXT,
  introduction TEXT,
  privacy_agreed BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 지원 학교 테이블
CREATE TABLE IF NOT EXISTS applicant_schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  school_id VARCHAR(50) NOT NULL
);

-- 지원 과목 테이블
CREATE TABLE IF NOT EXISTS applicant_subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id UUID NOT NULL REFERENCES applicants(id) ON DELETE CASCADE,
  subject_id VARCHAR(50) NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_applicants_status ON applicants(status);
CREATE INDEX IF NOT EXISTS idx_applicants_created_at ON applicants(created_at);
CREATE INDEX IF NOT EXISTS idx_applicant_schools_applicant_id ON applicant_schools(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applicant_schools_school_id ON applicant_schools(school_id);
CREATE INDEX IF NOT EXISTS idx_applicant_subjects_applicant_id ON applicant_subjects(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applicant_subjects_subject_id ON applicant_subjects(subject_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_applicants_updated_at
  BEFORE UPDATE ON applicants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS 정책
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicant_subjects ENABLE ROW LEVEL SECURITY;

-- 누구나 지원서를 제출할 수 있도록 INSERT 허용
CREATE POLICY "Anyone can insert applicants"
  ON applicants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert applicant_schools"
  ON applicant_schools FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can insert applicant_subjects"
  ON applicant_subjects FOR INSERT
  WITH CHECK (true);

-- SELECT/UPDATE/DELETE는 service_role만 가능 (관리자 API 라우트에서 사용)
CREATE POLICY "Service role can read applicants"
  ON applicants FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can update applicants"
  ON applicants FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can read applicant_schools"
  ON applicant_schools FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can read applicant_subjects"
  ON applicant_subjects FOR SELECT
  USING (auth.role() = 'service_role');
