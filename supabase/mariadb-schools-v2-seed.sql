-- =============================================
-- 기존 SCHOOLS/SUBJECTS 상수 → DB Seed
-- Idempotent: 여러 번 실행해도 안전 (ON DUPLICATE KEY UPDATE)
-- =============================================

USE camp9in;

-- ============ 과목 Seed ============
INSERT INTO subjects (id, name, description, skills, icon, sort_order) VALUES
  ('vibe-coding',    '바이브코딩',       'AI와 함께 나만의 게임 만들기 코딩 체험',  '코딩교육, 게임개발 경험',      '🎮', 10),
  ('ai-story',       'AI 동화 만들기',   '구글 제미나이로 상상을 동화책으로 제작',   'AI도구 활용, 스토리텔링',      '📖', 20),
  ('turtle-bot',     '터틀봇 조종하기',  '음성 명령으로 로봇 제어 활동',             '로봇교육, 터틀봇 운용',        '🐢', 30),
  ('dash-robot',     '대시로봇 조종하기','로봇 조종하며 미션 클리어',                '로봇교육, 대시로봇 운용',      '🤖', 40),
  ('ai-orchestra',   '구글AI오페라(음악)', 'AI 지휘로 음악 창작 체험',               '음악교육, AI도구 활용',        '🎵', 50),
  ('reactive-robot', '로봇킷트 조립',    '로봇킷트 조립하여 로봇 조종하기',          '메이커교육, 로봇 조립/조종',   '⚙️', 60),
  ('ai-image',       'AI 이미지·영상 생성', '상상을 그림과 영상으로 창작',           'AI 이미지/영상 생성 도구',     '🎨', 70),
  ('ai-cooking',     'AI 요리체험',      'AI 레시피로 나만의 요리 레시피 작성하기',  'AI 챗봇 활용',                 '🍔', 80),
  ('cooking',        'AI활용 햄버거 만들기', 'AI활용 햄버거 만들기 체험',            '조리자격, 아동 요리교육',      '🍳', 90),
  ('drone',          '드론 체험',        '드론 기초 이해 및 조종 실습, 미션 수행',   '드론교육, 드론 조종 경험',     '🚁', 100),
  ('ai-art',         'AI 그림 생성',     '프롬프트 작성을 통한 AI 이미지 생성 체험', 'AI 이미지 생성, 프롬프트 작성','🖼️', 110)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  skills = VALUES(skills),
  icon = VALUES(icon),
  sort_order = VALUES(sort_order);

-- ============ 학교 Seed ============
INSERT INTO schools (id, name, short_name, start_date, end_date, date_label, time_label, location, target, capacity_per_subject, camp_type, sort_order) VALUES
  ('migeum',
   '성남 미금초등학교', '미금초',
   '2026-04-20', '2026-04-24',
   '2026년 4월 20일~24일',
   '오전 9:00 ~ 12:20',
   '미금초등학교 교실 및 강당',
   NULL, 8, 'hybrid', 10),
  ('jeonglim',
   '화성 정림초등학교', '정림초',
   '2026-04-29', '2026-04-29',
   '2026년 4월 29일 (수)',
   '오전 9:00 ~ 12:00',
   '정림초등학교 강당',
   '전교생 대상', 8, 'rotation', 20),
  ('cheongwon',
   '화성 청원초등학교', '청원초',
   '2026-06-12', '2026-06-12',
   '2026년 6월 12일 (금)',
   '오전 9:00 ~ 12:00',
   '청원초등학교 강당',
   '전교생 대상', 8, 'rotation', 30)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  short_name = VALUES(short_name),
  start_date = VALUES(start_date),
  end_date = VALUES(end_date),
  date_label = VALUES(date_label),
  time_label = VALUES(time_label),
  location = VALUES(location),
  target = VALUES(target),
  capacity_per_subject = VALUES(capacity_per_subject),
  camp_type = VALUES(camp_type),
  sort_order = VALUES(sort_order);

-- ============ 학년 Seed (idempotent을 위해 DELETE 후 INSERT) ============
-- school_grades는 school_id + sort_order로 자연 키 조합, 복잡하므로 school별로 교체
DELETE sgs FROM school_grade_subjects sgs
  INNER JOIN school_grades sg ON sg.id = sgs.grade_id
  WHERE sg.school_id IN ('migeum','jeonglim','cheongwon');
DELETE FROM school_grades WHERE school_id IN ('migeum','jeonglim','cheongwon');

-- 미금초 (복합: 반별 + 순환)
INSERT INTO school_grades (school_id, grade, period, grade_type, capacity, sort_order) VALUES
  ('migeum', '1학년',    '4/20(월)~4/21(화)', '교실수업',      1, 10),
  ('migeum', '2학년',    '4/23(목)~4/24(금)', '교실수업',      1, 20),
  ('migeum', '3학년',    '4/20(월)~4/21(화)', '교실수업',      1, 30),
  ('migeum', '4학년',    '4/22(수)~4/23(목)', '교실수업',      1, 40),
  ('migeum', '5~6학년',  '4/21(화)',          '강당 체험부스', 2, 50);

-- 미금초 학년별 과목 매핑
INSERT INTO school_grade_subjects (grade_id, subject_id, sort_order)
  SELECT sg.id, 'dash-robot', 0 FROM school_grades sg WHERE sg.school_id='migeum' AND sg.grade='1학년';
INSERT INTO school_grade_subjects (grade_id, subject_id, sort_order)
  SELECT sg.id, 'turtle-bot', 0 FROM school_grades sg WHERE sg.school_id='migeum' AND sg.grade='2학년';
INSERT INTO school_grade_subjects (grade_id, subject_id, sort_order)
  SELECT sg.id, 'drone', 0 FROM school_grades sg WHERE sg.school_id='migeum' AND sg.grade='3학년';
INSERT INTO school_grade_subjects (grade_id, subject_id, sort_order)
  SELECT sg.id, 'dash-robot', 0 FROM school_grades sg WHERE sg.school_id='migeum' AND sg.grade='4학년';
INSERT INTO school_grade_subjects (grade_id, subject_id, sort_order)
  SELECT sg.id, 'ai-art', 10 FROM school_grades sg WHERE sg.school_id='migeum' AND sg.grade='5~6학년';
INSERT INTO school_grade_subjects (grade_id, subject_id, sort_order)
  SELECT sg.id, 'vibe-coding', 20 FROM school_grades sg WHERE sg.school_id='migeum' AND sg.grade='5~6학년';
INSERT INTO school_grade_subjects (grade_id, subject_id, sort_order)
  SELECT sg.id, 'turtle-bot', 30 FROM school_grades sg WHERE sg.school_id='migeum' AND sg.grade='5~6학년';

-- 정림초 (순환 - 전학년 동시 체험부스 8개)
INSERT INTO school_grades (school_id, grade, period, grade_type, capacity, sort_order) VALUES
  ('jeonglim', '전학년', '4/29(수)', '강당 체험부스', 1, 10);

INSERT INTO school_grade_subjects (grade_id, subject_id, sort_order)
  SELECT sg.id, s.id, s.sort_order FROM school_grades sg, subjects s
  WHERE sg.school_id='jeonglim' AND sg.grade='전학년'
    AND s.id IN ('vibe-coding','ai-story','turtle-bot','dash-robot','ai-orchestra','reactive-robot','ai-image','cooking');

-- 청원초 (순환 - 정림초와 동일)
INSERT INTO school_grades (school_id, grade, period, grade_type, capacity, sort_order) VALUES
  ('cheongwon', '전학년', '6/12(금)', '강당 체험부스', 1, 10);

INSERT INTO school_grade_subjects (grade_id, subject_id, sort_order)
  SELECT sg.id, s.id, s.sort_order FROM school_grades sg, subjects s
  WHERE sg.school_id='cheongwon' AND sg.grade='전학년'
    AND s.id IN ('vibe-coding','ai-story','turtle-bot','dash-robot','ai-orchestra','reactive-robot','ai-image','cooking');

-- ============ 기존 closed_schools / closed_subjects 플래그 마이그레이션 ============
-- 기존 수동 마감 레코드가 있으면 is_closed = 1로 반영
UPDATE schools s
  SET s.is_closed = 1
  WHERE EXISTS (SELECT 1 FROM closed_schools cs WHERE cs.school_id = s.id);

UPDATE subjects sb
  SET sb.is_closed = 1
  WHERE EXISTS (SELECT 1 FROM closed_subjects cs WHERE cs.subject_id = sb.id);
