import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { SCHOOLS, SUBJECTS, STATUS_OPTIONS } from "@/lib/constants";

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
  status: string;
  created_at: string;
}

interface RelationRow {
  applicant_id: number;
  school_id?: string;
  subject_id?: string;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const applicants = await query<ApplicantRow>(
      "SELECT *, DATE_FORMAT(birth_date, '%Y-%m-%d') as birth_date, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at FROM applicants ORDER BY created_at DESC"
    );
    const schoolRows = await query<RelationRow>(
      "SELECT applicant_id, school_id FROM applicant_schools"
    );
    const subjectRows = await query<RelationRow>(
      "SELECT applicant_id, subject_id FROM applicant_subjects"
    );

    const BOM = "\uFEFF";
    const headers = [
      "이름", "연락처", "이메일", "주소", "생년월일",
      "지원학교", "지원과목", "학력", "전공", "경력",
      "자격사항", "상태", "지원일",
    ];

    const rows = applicants.map((a) => {
      const schools = schoolRows
        .filter((s) => s.applicant_id === a.id)
        .map((s) => SCHOOLS.find((sc) => sc.id === s.school_id)?.shortName || s.school_id)
        .join(", ");
      const subjects = subjectRows
        .filter((s) => s.applicant_id === a.id)
        .map((s) => SUBJECTS.find((sub) => sub.id === s.subject_id)?.name || s.subject_id)
        .join(", ");
      const statusLabel =
        STATUS_OPTIONS.find((s) => s.value === a.status)?.label || a.status;

      return [
        a.name, a.phone, a.email, a.address, a.birth_date,
        schools, subjects, a.education, a.major || "",
        (a.experience || "").replace(/\n/g, " "),
        (a.qualifications || "").replace(/\n/g, " "),
        statusLabel,
        new Date(a.created_at).toLocaleDateString("ko-KR"),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });

    const csv = BOM + headers.join(",") + "\n" + rows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="applicants_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
  }
}
