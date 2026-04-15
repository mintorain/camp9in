import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

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
  status: string;
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
      `SELECT id, name, phone, email, address, DATE_FORMAT(birth_date, '%Y-%m-%d') as birth_date,
              education, major, experience, qualifications, introduction, status
       FROM applicants WHERE name = ? AND phone = ? ORDER BY created_at DESC LIMIT 1`,
      [name, phone]
    );

    if (applicants.length === 0) {
      return NextResponse.json({ data: null });
    }

    const applicant = applicants[0];

    const schoolRows = await query<RelationRow>(
      "SELECT applicant_id, school_id FROM applicant_schools WHERE applicant_id = ? ORDER BY id ASC",
      [applicant.id]
    );

    const subjectRows = await query<RelationRow>(
      "SELECT applicant_id, subject_id FROM applicant_subjects WHERE applicant_id = ? ORDER BY id ASC",
      [applicant.id]
    );

    const assignmentRows = await query<AssignmentRow>(
      "SELECT applicant_id, school_id, subject_id, grade FROM applicant_assignments WHERE applicant_id = ? ORDER BY id ASC",
      [applicant.id]
    );

    return NextResponse.json({
      data: {
        id: applicant.id,
        name: applicant.name,
        phone: applicant.phone,
        email: applicant.email,
        address: applicant.address,
        birthDate: applicant.birth_date,
        education: applicant.education,
        major: applicant.major,
        experience: applicant.experience,
        qualifications: applicant.qualifications,
        introduction: applicant.introduction,
        status: applicant.status,
        schools: schoolRows.map((s) => s.school_id),
        subjects: subjectRows.map((s) => s.subject_id),
        assignments: assignmentRows.map((a) => ({
          school_id: a.school_id,
          subject_id: a.subject_id,
          grade: a.grade,
        })),
      },
    });
  } catch (err) {
    console.error("Check existing applicant error:", err);
    return NextResponse.json(
      { error: "조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
