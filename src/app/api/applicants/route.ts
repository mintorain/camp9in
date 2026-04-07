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
  created_at: string;
  updated_at: string;
}

interface RelationRow {
  applicant_id: number;
  school_id?: string;
  subject_id?: string;
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
      "SELECT applicant_id, subject_id FROM applicant_subjects"
    );

    let result = applicants.map((a) => ({
      ...a,
      applicant_schools: schoolRows
        .filter((s) => s.applicant_id === a.id)
        .map((s) => ({ school_id: s.school_id })),
      applicant_subjects: subjectRows
        .filter((s) => s.applicant_id === a.id)
        .map((s) => ({ subject_id: s.subject_id })),
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
