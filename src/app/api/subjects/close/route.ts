import { NextRequest, NextResponse } from "next/server";
import { getSupabase, getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// 마감된 과목 목록 조회 (누구나)
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("closed_subjects")
      .select("subject_id");

    if (error) {
      return NextResponse.json({ data: [] });
    }

    const closedIds = (data || []).map((r) => r.subject_id);
    return NextResponse.json({ data: closedIds });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

// 과목 마감/해제 (관리자만)
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { subjectId, closed } = await request.json();

  if (!subjectId) {
    return NextResponse.json({ error: "과목 ID가 필요합니다" }, { status: 422 });
  }

  const serviceSupabase = getServiceSupabase();

  if (closed) {
    // 마감 처리
    const { error } = await serviceSupabase
      .from("closed_subjects")
      .upsert({ subject_id: subjectId }, { onConflict: "subject_id" });

    if (error) {
      console.error("Close subject error:", error);
      return NextResponse.json({ error: "마감 처리 실패" }, { status: 500 });
    }
  } else {
    // 마감 해제
    const { error } = await serviceSupabase
      .from("closed_subjects")
      .delete()
      .eq("subject_id", subjectId);

    if (error) {
      console.error("Open subject error:", error);
      return NextResponse.json({ error: "마감 해제 실패" }, { status: 500 });
    }
  }

  return NextResponse.json({ message: closed ? "마감 처리되었습니다" : "마감 해제되었습니다" });
}
