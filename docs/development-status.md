# Camp9in - AI캠프 강사 모집 시스템 개발 현황

**프로젝트**: camp9in (AI캠프 강사 모집 플랫폼)
**운영 주체**: 두온교육(주) 캠프사업부
**배포 URL**: https://camp9in.duonedu.net/
**최종 업데이트**: 2026-04-16

---

## 1. 기술 스택

| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 16.2.2 (App Router, Turbopack) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| DB | MariaDB 10 (시놀로지 NAS) |
| 서버 | 시놀로지 NAS + PM2 |
| 배포 | deploy.sh (git pull → build → PM2 restart) |

---

## 2. 페이지 구조

### 사용자 페이지
| 경로 | 설명 |
|------|------|
| `/` | 메인 페이지 (모집 안내) |
| `/apply` | 강사 지원서 작성 |
| `/apply/complete` | 지원 완료 |
| `/result` | 합격 조회 + 강사료 지급 정보 입력 |
| `/status` | 지원 현황 |
| `/privacy` | 개인정보처리방침 |
| `/terms` | 이용약관 |

### 관리자 페이지
| 경로 | 설명 |
|------|------|
| `/admin` | 관리자 로그인 |
| `/admin/applicants` | 지원자 목록 / 상태 관리 |
| `/admin/assigned` | 강사 배정 관리 / 강사료 설정 |
| `/admin/dashboard` | 대시보드 (통계) |

---

## 3. API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/applicants` | 지원서 제출 |
| GET | `/api/applicants` | 지원자 목록 조회 (관리자) |
| PATCH | `/api/applicants/[id]` | 지원자 상태/배정/강사료 수정 (관리자) |
| DELETE | `/api/applicants/[id]` | 지원자 삭제 (관리자) |
| GET | `/api/applicants/counts` | 상태별 지원자 수 |
| GET | `/api/applicants/check` | 지원서 중복 체크 |
| GET | `/api/applicants/export` | 지원자 CSV 내보내기 |
| GET | `/api/applicants/export-payment` | 강사료 지급 CSV 내보내기 |
| PATCH | `/api/applicants/status` | 상태 일괄 변경 |
| POST | `/api/result` | 합격 조회 (이름+연락처) |
| PATCH | `/api/result` | 강사료 지급 정보 제출 (합격자) |
| POST | `/api/auth` | 관리자 로그인 |
| GET | `/api/settings` | 설정 조회/수정 |
| POST | `/api/schools/close` | 학교 마감 관리 |
| POST | `/api/subjects/close` | 과목 마감 관리 |
| GET | `/api/analytics` | 방문 통계 |
| GET | `/api/version` | 버전 정보 |

---

## 4. 데이터베이스 스키마

### applicants (지원자)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT PK | 자동 증가 |
| name | VARCHAR(20) | 이름 |
| phone | VARCHAR(15) | 연락처 |
| email | VARCHAR(100) | 이메일 |
| address | VARCHAR(100) | 주소 |
| birth_date | DATE | 생년월일 |
| education | VARCHAR(20) | 학력 |
| major | VARCHAR(50) | 전공 |
| experience | TEXT | 경력 |
| qualifications | TEXT | 자격증 |
| introduction | TEXT | 자기소개 |
| privacy_agreed | TINYINT | 개인정보 동의 |
| status | VARCHAR(20) | 상태 (pending/reviewing/accepted/rejected) |
| confirmed_subject | VARCHAR(50) | (레거시) 확정 과목 |
| confirmed_school | VARCHAR(50) | (레거시) 확정 학교 |
| payment_name | VARCHAR(50) | 강사료 지급 성명 |
| resident_id | VARCHAR(255) | 주민등록번호 (암호화) |
| payment_address | VARCHAR(500) | 주소 |
| bank_name | VARCHAR(50) | 은행명 |
| bank_account | VARCHAR(100) | 계좌번호 |
| payment_submitted_at | DATETIME | 지급정보 제출일 |
| payment_amount | INT | 강사료 총액 |
| payment_date | DATE | 입금일 |
| created_at | DATETIME | 생성일 |
| updated_at | DATETIME | 수정일 |

### applicant_schools (지원 학교)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT PK | 자동 증가 |
| applicant_id | INT FK | 지원자 ID |
| school_id | VARCHAR(50) | 학교 ID |

### applicant_subjects (지원 과목)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT PK | 자동 증가 |
| applicant_id | INT FK | 지원자 ID |
| subject_id | VARCHAR(50) | 과목 ID |

### applicant_assignments (강사 배정)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT PK | 자동 증가 |
| applicant_id | INT | 지원자 ID |
| school_id | VARCHAR(50) | 배정 학교 |
| subject_id | VARCHAR(50) | 배정 과목 |
| grade | VARCHAR(50) | 배정 학년 |
| payment_amount | INT | 배정별 강사료 |
| created_at | DATETIME | 생성일 |

### closed_subjects / closed_schools (마감 관리)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT PK | 자동 증가 |
| subject_id / school_id | VARCHAR(50) UNIQUE | 과목/학교 ID |
| closed_at | DATETIME | 마감일 |

---

## 5. 대상 학교

| ID | 학교명 | 일정 | 시간 | 장소 |
|----|--------|------|------|------|
| migeum | 성남 미금초등학교 | 4/20~4/24 | 오전 9:00~12:20 | 교실 및 강당 |
| jeonglim | 화성 정림초등학교 | 4/29(수) | 오전 9:00~12:00 | 강당 |
| cheongwon | 화성 청원초등학교 | 6/12(금) | 오전 9:00~12:00 | 강당 |

---

## 6. 모집 과목 (11개)

| ID | 과목명 | 아이콘 |
|----|--------|--------|
| vibe-coding | 바이브코딩 | 🎮 |
| ai-story | AI 동화 만들기 | 📖 |
| turtle-bot | 터틀봇 조종하기 | 🐢 |
| dash-robot | 대시로봇 조종하기 | 🤖 |
| ai-orchestra | 구글AI오페라(음악) | 🎵 |
| reactive-robot | 로봇킷트 조립 | ⚙️ |
| ai-image | AI 이미지·영상 생성 | 🎨 |
| ai-cooking | AI 요리체험 | 🍔 |
| cooking | AI활용 햄버거 만들기 | 🍳 |
| drone | 드론 체험 | 🚁 |
| ai-art | AI 그림 생성 | 🖼️ |

---

## 7. 주요 기능 현황

### 완료된 기능

| 기능 | 설명 | 커밋 |
|------|------|------|
| 지원서 작성 | 이름/연락처/학력/경력/학교/과목 선택, 자동 저장 | 923c673 |
| 지원서 중복 체크 | 동일 이름+연락처 지원 방지 | ebb1a73 |
| 관리자 로그인 | 비밀번호 인증 (DB settings 또는 환경변수) | - |
| 지원자 관리 | 목록/상태변경/삭제/CSV내보내기 | - |
| 강사 배정 | 학교+과목+학년별 배정 (다중 배정 지원) | 610fc7a, 98bdd08 |
| 합격 조회 | 이름+연락처로 합격여부 확인 | f5f20a7 |
| 배정 정보 표시 | 합격자에게 학교/과목/강의일/시간/장소 표시 | 5b68edf |
| 강사료 지급 정보 입력 | 합격자가 성함/주민번호/주소/은행/계좌 입력 | ebb1a73 |
| 배정별 강사료 | 학교/과목별 금액 입력 + 총액 표시 | 74e7ff7 |
| 강사료 세금 계산 | 사업소득세 3% + 지방소득세 0.3% 자동 계산 | ebb1a73 |
| 강사료 CSV 내보내기 | 관리자용 지급 내역 CSV 다운로드 | ebb1a73 |
| 과목/학교 마감 | 관리자가 모집 마감 처리 | 3cacf83 |
| 파비콘/OG 이미지 | 사이트 아이콘 및 SNS 공유 이미지 | 05545f3 |
| 개인정보처리방침/이용약관 | 법적 문서 페이지 | ebfd06a |
| 두온교육 공식 푸터 | 사업자 정보, 연락처, SNS 링크 | ebfd06a |
| PM2 배포 | crash 복구, 자동 재시작, 로그 관리 | 904d9fd |

### 미적용 DB 마이그레이션

시놀로지에서 아래 SQL을 실행해야 배정별 강사료 기능이 활성화됩니다:

```sql
ALTER TABLE applicant_assignments ADD COLUMN payment_amount INT DEFAULT NULL;
```

---

## 8. 배포 환경

### 서버 정보
- **호스트**: 시놀로지 NAS (duonedu.net)
- **프로젝트 경로**: `/volume3/web/camp9in`
- **Windows 마운트**: `I:\camp9in`
- **PM2 프로세스**: camp9in (포트 3900)
- **DB**: MariaDB (localhost:4006, camp9in)

### 배포 절차
```bash
cd /volume3/web/camp9in
rm -rf .next          # 캐시 삭제 (코드 변경 시 필수)
bash deploy.sh        # git pull → build → static 복사 → PM2 restart
```

### 환경 변수
| 변수 | 값 |
|------|------|
| DB_HOST | localhost |
| DB_PORT | 4006 |
| DB_USER | root |
| DB_NAME | camp9in |
| PORT | 3900 |

---

## 9. 커밋 히스토리 (최근 20건)

```
74e7ff7 feat: 배정별(학교/과목) 강사료 금액 입력 및 총액 표시
5b68edf feat: 합격 조회 시 강의일, 강의시간, 장소 표시 추가
3fb666a fix: result API에서 payment_amount/payment_date 컬럼 없을 때 fallback 처리
ebb1a73 feat: 합격자 강사료 지급 정보 입력 및 관리 기능 추가
05545f3 feat: 파비콘 및 OG 썸네일 이미지 추가
0248ac5 fix: 배정 추가 버튼 동작 수정 (로컬 상태 관리)
2e89d4a fix: 정림초·청원초 gradeSchedule에 type 필드 추가 (빌드 에러)
98bdd08 feat: 일정별 강사 배정 기능 (학년/날짜/인원 기반)
a1626d7 fix: 관리자 모달에 주민등록번호 표시 추가
f5f20a7 feat: 합격 조회 + 강사료 지급 정보 입력 페이지 (/result)
610fc7a feat: 강사 다중 학교 배정 기능 (applicant_assignments 테이블)
95d2673 feat: 강사 배정 시 학교+과목 선택 기능 + 미금초 3개 과목 마감
3cacf83 fix: 구글 AI 오케스트라 → 구글AI오페라(음악) 명칭 변경
904d9fd fix: DB 연결 끊김 시 segfault 방지 + PM2 배포 스크립트 적용
ebfd06a feat: 두온교육 공식 푸터 적용 + 개인정보처리방침/이용약관 페이지
923c673 feat: 지원서 작성 중단 시 자동 저장 및 복원
76c4343 fix: 미금초 5~6학년 강사료에 운영 시간 추가
0be9838 docs: 개발 진행 보고서 및 개발 기획서 작성
```

---

## 10. 알려진 이슈 및 주의사항

1. **빌드 캐시**: 코드 변경 후 배포 시 반드시 `rm -rf .next` 실행 후 빌드해야 함. Next.js Turbopack 캐시가 구 버전을 재사용하는 문제 있음.
2. **Windows 빌드 불가**: `I:\camp9in`은 시놀로지 네트워크 드라이브이므로 Windows에서 `npm run build` 불가. 반드시 시놀로지 SSH에서 빌드.
3. **DB 마이그레이션**: 새 컬럼 추가 시 API에서 fallback 쿼리를 함께 작성하여 마이그레이션 미적용 환경에서도 동작하도록 처리.
4. **주민등록번호**: `resident_id` 컬럼에 저장. 현재 평문 저장 상태이며 추후 암호화 적용 필요.
