import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface ApplicantRow {
  id: number;
  name: string;
  status: string;
  created_at: string;
}

interface RelationRow {
  applicant_id: number;
  school_id?: string;
  subject_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { name, phone } = await request.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: "이름과 연락처를 입력해주세요" },
        { status: 400 }
      );
    }

    const applicants = await query<ApplicantRow>(
      "SELECT id, name, status, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_at FROM applicants WHERE name = ? AND phone = ? ORDER BY created_at DESC",
      [name, phone]
    );

    if (applicants.length === 0) {
      return NextResponse.json(
        { error: "조회 결과가 없습니다. 이름과 연락처를 확인해주세요." },
        { status: 404 }
      );
    }

    const schoolRows = await query<RelationRow>(
      "SELECT applicant_id, school_id FROM applicant_schools WHERE applicant_id IN (" +
        applicants.map(() => "?").join(",") +
        ") ORDER BY id ASC",
      applicants.map((a) => a.id)
    );

    const subjectRows = await query<RelationRow>(
      "SELECT applicant_id, subject_id FROM applicant_subjects WHERE applicant_id IN (" +
        applicants.map(() => "?").join(",") +
        ") ORDER BY id ASC",
      applicants.map((a) => a.id)
    );

    const result = applicants.map((a) => ({
      name: a.name,
      status: a.status,
      created_at: a.created_at,
      schools: schoolRows
        .filter((s) => s.applicant_id === a.id)
        .map((s) => s.school_id),
      subjects: subjectRows
        .filter((s) => s.applicant_id === a.id)
        .map((s) => s.subject_id),
    }));

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("Status check error:", err);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
