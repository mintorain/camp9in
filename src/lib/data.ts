/**
 * Schools / Subjects 데이터 조회 헬퍼
 * - DB에서 읽어 기존 constants.ts의 SCHOOLS/SUBJECTS 구조와 동일한 형태로 반환
 * - 하위 호환 유지: 기존 코드가 `s.subjects`, `s.gradeSchedule` 등에 의존
 */

import { query } from "@/lib/db";

// ============ 타입 정의 (기존 constants.ts 구조와 호환) ============

export interface Subject {
  id: string;
  name: string;
  description: string;
  skills: string;
  icon: string;
  closed: boolean;
  sortOrder: number;
}

export interface GradeSchedule {
  grade: string;
  period: string;
  subjects: string[]; // subject ids
  type?: string;
  capacity: number;
}

export type CampType = "class" | "rotation" | "hybrid";

export interface School {
  id: string;
  name: string;
  shortName: string;
  date: string;        // start_date (YYYY-MM-DD) — 기존 구조 호환
  endDate: string;     // YYYY-MM-DD
  recruitDeadline: string | null; // 강사 지원 마감일 (YYYY-MM-DD) — null이면 미설정
  dateLabel: string;
  time: string;
  location: string;
  target?: string;
  capacityPerSubject: number;
  subjects: string[];  // 이 학교에서 운영되는 과목 id 유니크 목록
  gradeSchedule: GradeSchedule[];
  campType: CampType;
  hideName: boolean;           // 학교명만 비공개
  hideScheduleCard: boolean;   // 일정 카드 숨김
  isClosed: boolean;           // 수동 마감
  sortOrder: number;
}

// ============ DB Row 타입 ============

interface SchoolRow {
  id: string;
  name: string;
  short_name: string;
  start_date: Date | string;
  end_date: Date | string;
  recruit_deadline: Date | string | null;
  date_label: string | null;
  time_label: string | null;
  location: string | null;
  target: string | null;
  capacity_per_subject: number;
  camp_type: CampType;
  hide_name: number;
  hide_schedule_card: number;
  is_closed: number;
  sort_order: number;
}

interface SubjectRow {
  id: string;
  name: string;
  description: string | null;
  skills: string | null;
  icon: string | null;
  is_closed: number;
  sort_order: number;
}

interface GradeRow {
  id: number;
  school_id: string;
  grade: string;
  period: string | null;
  grade_type: string | null;
  capacity: number;
  sort_order: number;
}

interface GradeSubjectRow {
  grade_id: number;
  subject_id: string;
  sort_order: number;
}

// ============ 유틸 ============

function toIsoDate(d: Date | string): string {
  if (typeof d === "string") {
    // MariaDB가 "2026-04-20" 형태 문자열을 돌려주면 그대로 사용
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
    return new Date(d).toISOString().slice(0, 10);
  }
  // Date 객체인 경우 KST 기준 날짜 유지
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ============ 공개 API ============

export async function getSubjects(): Promise<Subject[]> {
  const rows = await query<SubjectRow>(
    `SELECT id, name, description, skills, icon, is_closed, sort_order
     FROM subjects
     ORDER BY sort_order ASC, id ASC`
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description || "",
    skills: r.skills || "",
    icon: r.icon || "",
    closed: Boolean(r.is_closed),
    sortOrder: r.sort_order,
  }));
}

export async function getSchools(): Promise<School[]> {
  let schoolRows: SchoolRow[];
  try {
    schoolRows = await query<SchoolRow>(
      `SELECT id, name, short_name, start_date, end_date, recruit_deadline,
              date_label, time_label,
              location, target, capacity_per_subject, camp_type,
              hide_name, hide_schedule_card, is_closed, sort_order
       FROM schools
       ORDER BY sort_order ASC, id ASC`
    );
  } catch {
    // recruit_deadline 컬럼이 아직 없는 경우 (마이그레이션 전)
    schoolRows = await query<SchoolRow>(
      `SELECT id, name, short_name, start_date, end_date, NULL as recruit_deadline,
              date_label, time_label,
              location, target, capacity_per_subject, camp_type,
              hide_name, hide_schedule_card, is_closed, sort_order
       FROM schools
       ORDER BY sort_order ASC, id ASC`
    );
  }

  const gradeRows = await query<GradeRow>(
    `SELECT id, school_id, grade, period, grade_type, capacity, sort_order
     FROM school_grades
     ORDER BY school_id, sort_order ASC, id ASC`
  );

  const gradeSubjectRows = await query<GradeSubjectRow>(
    `SELECT grade_id, subject_id, sort_order
     FROM school_grade_subjects
     ORDER BY grade_id, sort_order ASC, subject_id ASC`
  );

  // grade_id → subject_ids
  const subjectsByGrade = new Map<number, string[]>();
  for (const r of gradeSubjectRows) {
    const list = subjectsByGrade.get(r.grade_id) ?? [];
    list.push(r.subject_id);
    subjectsByGrade.set(r.grade_id, list);
  }

  // school_id → grades
  const gradesBySchool = new Map<string, GradeSchedule[]>();
  for (const g of gradeRows) {
    const subs = subjectsByGrade.get(g.id) ?? [];
    const list = gradesBySchool.get(g.school_id) ?? [];
    list.push({
      grade: g.grade,
      period: g.period || "",
      subjects: subs,
      ...(g.grade_type ? { type: g.grade_type } : {}),
      capacity: g.capacity,
    });
    gradesBySchool.set(g.school_id, list);
  }

  return schoolRows.map((r) => {
    const gradeSchedule = gradesBySchool.get(r.id) ?? [];
    const schoolSubjects = Array.from(
      new Set(gradeSchedule.flatMap((g) => g.subjects))
    );
    return {
      id: r.id,
      name: r.name,
      shortName: r.short_name,
      date: toIsoDate(r.start_date),
      endDate: toIsoDate(r.end_date),
      recruitDeadline: r.recruit_deadline ? toIsoDate(r.recruit_deadline) : null,
      dateLabel: r.date_label || "",
      time: r.time_label || "",
      location: r.location || "",
      ...(r.target ? { target: r.target } : {}),
      capacityPerSubject: r.capacity_per_subject,
      subjects: schoolSubjects,
      gradeSchedule,
      campType: r.camp_type,
      hideName: Boolean(r.hide_name),
      hideScheduleCard: Boolean(r.hide_schedule_card),
      isClosed: Boolean(r.is_closed),
      sortOrder: r.sort_order,
    };
  });
}

/** 공개 API용 — 숨김/마감/자동 마감 반영해서 지원자에게 노출할 데이터만 반환 */
export async function getPublicSchools(): Promise<School[]> {
  const all = await getSchools();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  return all.filter((s) => {
    if (s.isClosed) return false;
    if (s.endDate < today) return false; // 자동 마감
    return true;
  });
}
