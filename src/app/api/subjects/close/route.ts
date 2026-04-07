import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

interface ClosedRow {
  subject_id: string;
}

export async function GET() {
  try {
    const rows = await query<ClosedRow>(
      "SELECT subject_id FROM closed_subjects"
    );
    const closedIds = rows.map((r) => r.subject_id);
    return NextResponse.json({ data: closedIds });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin(request.headers.get("authorization"));
  if (!isAdmin) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { subjectId, closed } = await request.json();

  if (!subjectId) {
    return NextResponse.json({ error: "과목 ID가 필요합니다" }, { status: 422 });
  }

  try {
    if (closed) {
      await insert(
        "INSERT IGNORE INTO closed_subjects (subject_id) VALUES (?)",
        [subjectId]
      );
    } else {
      await query("DELETE FROM closed_subjects WHERE subject_id = ?", [
        subjectId,
      ]);
    }

    return NextResponse.json({
      message: closed ? "마감 처리되었습니다" : "마감 해제되었습니다",
    });
  } catch {
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}
