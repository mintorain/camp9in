-- 과목 마감 관리 테이블
CREATE TABLE IF NOT EXISTS closed_subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id VARCHAR(50) NOT NULL UNIQUE,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_by VARCHAR(50) DEFAULT 'admin'
);

-- RLS 정책
ALTER TABLE closed_subjects ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능 (마감 여부 표시용)
CREATE POLICY "Anyone can read closed_subjects"
  ON closed_subjects FOR SELECT
  USING (true);

-- INSERT/DELETE는 service_role만
CREATE POLICY "Service role can insert closed_subjects"
  ON closed_subjects FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can delete closed_subjects"
  ON closed_subjects FOR DELETE
  USING (auth.role() = 'service_role');
