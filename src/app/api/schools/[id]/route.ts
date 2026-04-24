import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

/**
 * 관리자: 학교 필드 수정 (현재는 recruit_deadline만 지원)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin(request.headers.get("authorization"));
  if (!isAdmin) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    if (body.recruitDeadline !== undefined) {
      // 빈 문자열/null이면 NULL 저장 (마감일 해제)
      const deadline =
        typeof body.recruitDeadline === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.recruitDeadline)
          ? body.recruitDeadline
          : null;
      await query(
        "UPDATE schools SET recruit_deadline = ? WHERE id = ?",
        [deadline, id]
      );
    }

    if (body.hideName !== undefined) {
      await query(
        "UPDATE schools SET hide_name = ? WHERE id = ?",
        [body.hideName ? 1 : 0, id]
      );
    }

    if (body.hideScheduleCard !== undefined) {
      await query(
        "UPDATE schools SET hide_schedule_card = ? WHERE id = ?",
        [body.hideScheduleCard ? 1 : 0, id]
      );
    }

    if (body.isClosed !== undefined) {
      await query(
        "UPDATE schools SET is_closed = ? WHERE id = ?",
        [body.isClosed ? 1 : 0, id]
      );
    }

    return NextResponse.json({ message: "수정되었습니다" });
  } catch (err) {
    console.error("[PATCH /api/schools/[id]]", err);
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}
