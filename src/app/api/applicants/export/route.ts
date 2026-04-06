import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { SCHOOLS, SUBJECTS, STATUS_OPTIONS } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const serviceSupabase = getServiceSupabase();

  const { data, error } = await serviceSupabase
    .from("applicants")
    .select(`
      *,
      applicant_schools(school_id),
      applicant_subjects(subject_id)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
  }

  const BOM = "\uFEFF";
  const headers = [
    "이름",
    "연락처",
    "이메일",
    "주소",
    "생년월일",
    "지원학교",
    "지원과목",
    "학력",
    "전공",
    "경력",
    "자격사항",
    "상태",
    "지원일",
  ];

  const rows = (data || []).map((a: Record<string, unknown>) => {
    const schools = (a.applicant_schools as { school_id: string }[])
      ?.map((s) => SCHOOLS.find((sc) => sc.id === s.school_id)?.shortName || s.school_id)
      .join(", ");
    const subjects = (a.applicant_subjects as { subject_id: string }[])
      ?.map((s) => SUBJECTS.find((sub) => sub.id === s.subject_id)?.name || s.subject_id)
      .join(", ");
    const statusLabel =
      STATUS_OPTIONS.find((s) => s.value === a.status)?.label || a.status;

    return [
      a.name,
      a.phone,
      a.email,
      a.address,
      a.birth_date,
      schools,
      subjects,
      a.education,
      a.major || "",
      (a.experience as string || "").replace(/\n/g, " "),
      (a.qualifications as string || "").replace(/\n/g, " "),
      statusLabel,
      new Date(a.created_at as string).toLocaleDateString("ko-KR"),
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
}
