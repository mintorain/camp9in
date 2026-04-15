import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";
import { applicantSchema } from "@/lib/schema";
import { verifyAdmin } from "@/lib/auth-server";

interface ApplicantRow {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  birth_date: string;
  education: string;
  major: string | null;
  experience: string;
  qualifications: string | null;
  introduction: string | null;
  privacy_agreed: number;
  status: string;
  confirmed_subject: string | null;
  confirmed_school: string | null;
  payment_name: string | null;
  resident_id: string | null;
  payment_address: string | null;
  bank_name: string | null;
  bank_account: string | null;
  payment_submitted_at: string | null;
  payment_amount: number | null;
  payment_date: string | null;
  created_at: string;
  updated_at: string;
}

interface RelationRow {
  applicant_id: number;
  school_id?: string;
  subject_id?: string;
}

interface AssignmentRow {
  applicant_id: number;
  school_id: string;
  subject_id: string;
  grade: string | null;
  payment_amount: number | null;
}

interface ExistingApplicant {
  id: number;
}

interface ConfirmedAssignment {
  school_id: string;
  subject_id: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = applicantSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "입력값이 올바르지 않습니다", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const data = parsed.data;

    // 기존 지원자 확인 (이름 + 연락처 동일)
    const existing = await query<ExistingApplicant>(
      "SELECT id FROM applicants WHERE name = ? AND phone = ? ORDER BY created_at DESC LIMIT 1",
      [data.name, data.phone]
    );

    if (existing.length > 0) {
      // 수정 모드: 기존 지원서 업데이트
      const applicantId = existing[0].id;

      // 관리자가 확정한 과목 조회
      const confirmedAssignments = await query<ConfirmedAssignment>(
        "SELECT school_id, subject_id FROM applicant_assignments WHERE applicant_id = ?",
        [applicantId]
      );

      // 확정된 과목이 제출 데이터에서 빠져있으면 차단
      for (const confirmed of confirmedAssignments) {
        if (!data.subjects.includes(confirmed.subject_id)) {
          return NextResponse.json(
            {
              error: `확정된 과목은 삭제할 수 없습니다.`,
            },
            { status: 422 }
          );
        }
      }

      // 기본 정보 업데이트
      await query(
        `UPDATE applicants SET email = ?, address = ?, birth_date = ?, education = ?,
         major = ?, experience = ?, qualifications = ?, introduction = ?,
         privacy_agreed = ?, updated_at = NOW() WHERE id = ?`,
        [
          data.email,
          data.address,
          data.birthDate,
          data.education,
          data.major || null,
          data.experience,
          data.qualifications || null,
          data.introduction || null,
          data.privacyAgreed ? 1 : 0,
          applicantId,
        ]
      );

      // 학교 관계 재설정
      await query(
        "DELETE FROM applicant_schools WHERE applicant_id = ?",
        [applicantId]
      );
      for (const schoolId of data.schools) {
        await insert(
          "INSERT INTO applicant_schools (applicant_id, school_id) VALUES (?, ?)",
          [applicantId, schoolId]
        );
      }

      // 과목 관계 재설정 (확정된 과목 포함하여 전체 재설정)
      await query(
        "DELETE FROM applicant_subjects WHERE applicant_id = ?",
        [applicantId]
      );
      for (const subjectId of data.subjects) {
        await insert(
          "INSERT INTO applicant_subjects (applicant_id, subject_id) VALUES (?, ?)",
          [applicantId, subjectId]
        );
      }

      return NextResponse.json(
        { data: { id: applicantId }, message: "지원서가 수정되었습니다" },
        { status: 200 }
      );
    }

    // 신규 지원자
    const result = await insert(
      `INSERT INTO applicants (name, phone, email, address, birth_date, education, major, experience, qualifications, introduction, privacy_agreed, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        data.name,
        data.phone,
        data.email,
        data.address,
        data.birthDate,
        data.education,
        data.major || null,
        data.experience,
        data.qualifications || null,
        data.introduction || null,
        data.privacyAgreed ? 1 : 0,
      ]
    );

    const applicantId = result.insertId;

    for (const schoolId of data.schools) {
      await insert(
        "INSERT INTO applicant_schools (applicant_id, school_id) VALUES (?, ?)",
        [applicantId, schoolId]
      );
    }

    for (const subjectId of data.subjects) {
      await insert(
        "INSERT INTO applicant_subjects (applicant_id, subject_id) VALUES (?, ?)",
        [applicantId, subjectId]
      );
    }

    return NextResponse.json(
      { data: { id: applicantId }, message: "지원서가 접수되었습니다" },
      { status: 201 }
    );
  } catch (err) {
    console.error("Applicant insert error:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin(request.headers.get("authorization"));
  if (!isAdmin) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const school = searchParams.get("school");
  const subject = searchParams.get("subject");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let sql = "SELECT *, DATE_FORMAT(birth_date, '%Y-%m-%d') as birth_date, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at FROM applicants WHERE 1=1";
  const params: (string | number | boolean | null)[] = [];

  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }
  if (search) {
    sql += " AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += " ORDER BY created_at DESC";

  try {
    const applicants = await query<ApplicantRow>(sql, params);

    const schoolRows = await query<RelationRow>(
      "SELECT applicant_id, school_id FROM applicant_schools"
    );
    const subjectRows = await query<RelationRow>(
      "SELECT applicant_id, subject_id FROM applicant_subjects ORDER BY id ASC"
    );
    let assignmentRows: AssignmentRow[];
    try {
      assignmentRows = await query<AssignmentRow>(
        "SELECT applicant_id, school_id, subject_id, grade, payment_amount FROM applicant_assignments ORDER BY id ASC"
      );
    } catch {
      assignmentRows = await query<AssignmentRow>(
        "SELECT applicant_id, school_id, subject_id, grade, NULL as payment_amount FROM applicant_assignments ORDER BY id ASC"
      );
    }

    let result = applicants.map((a) => ({
      ...a,
      applicant_schools: schoolRows
        .filter((s) => s.applicant_id === a.id)
        .map((s) => ({ school_id: s.school_id })),
      applicant_subjects: subjectRows
        .filter((s) => s.applicant_id === a.id)
        .map((s) => ({ subject_id: s.subject_id })),
      assignments: assignmentRows
        .filter((s) => s.applicant_id === a.id)
        .map((s) => ({ school_id: s.school_id, subject_id: s.subject_id, grade: s.grade, payment_amount: s.payment_amount })),
    }));

    if (school) {
      result = result.filter((a) =>
        a.applicant_schools.some((s) => s.school_id === school)
      );
    }
    if (subject) {
      result = result.filter((a) =>
        a.applicant_subjects.some((s) => s.subject_id === subject)
      );
    }

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("Fetch applicants error:", err);
    return NextResponse.json(
      { error: "지원자 목록을 불러오지 못했습니다" },
      { status: 500 }
    );
  }
}
