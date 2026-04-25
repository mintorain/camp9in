import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

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

  const fieldMap: Record<string, { col: string; transform?: (v: unknown) => unknown }> = {
    name: { col: "name" },
    description: { col: "description" },
    skills: { col: "skills" },
    icon: { col: "icon" },
    isClosed: { col: "is_closed", transform: (v) => (v ? 1 : 0) },
    sortOrder: { col: "sort_order", transform: (v) => Number(v) || 100 },
  };

  const sets: string[] = [];
  const values: (string | number | null)[] = [];

  for (const key of Object.keys(body)) {
    const m = fieldMap[key];
    if (!m) continue;
    const val = m.transform ? m.transform(body[key]) : body[key];
    sets.push(`${m.col} = ?`);
    values.push(val as string | number | null);
  }

  if (sets.length === 0) {
    return NextResponse.json({ message: "변경 사항이 없습니다" });
  }

  values.push(id);

  try {
    await query(`UPDATE subjects SET ${sets.join(", ")} WHERE id = ?`, values);
    return NextResponse.json({ message: "수정되었습니다" });
  } catch (err) {
    console.error("[PATCH /api/subjects/[id]]", err);
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}

/**
 * 관리자: 과목 삭제
 * 지원/배정 외래 참조 있으면 삭제 거부.
 * school_grade_subjects는 cascade로 자동 삭제됨.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await verifyAdmin(request.headers.get("authorization"));
  if (!isAdmin) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const refs = await query<{ cnt: number }>(
      `SELECT
         (SELECT COUNT(*) FROM applicant_subjects WHERE subject_id = ?) +
         (SELECT COUNT(*) FROM applicant_assignments WHERE subject_id = ?) AS cnt`,
      [id, id]
    );
    const refCount = refs[0]?.cnt || 0;
    if (refCount > 0) {
      return NextResponse.json(
        { error: `이 과목에 연결된 지원/배정이 ${refCount}건 있어 삭제할 수 없습니다.` },
        { status: 409 }
      );
    }

    await query("DELETE FROM subjects WHERE id = ?", [id]);
    return NextResponse.json({ message: "삭제되었습니다" });
  } catch (err) {
    console.error("[DELETE /api/subjects/[id]]", err);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
