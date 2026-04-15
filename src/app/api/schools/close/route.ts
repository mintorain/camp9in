import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

interface ClosedRow {
  school_id: string;
}

export async function GET() {
  try {
    // 테이블이 없으면 빈 배열 반환
    const rows = await query<ClosedRow>(
      "SELECT school_id FROM closed_schools"
    );
    const closedIds = rows.map((r) => r.school_id);
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

  const { schoolId, closed } = await request.json();

  if (!schoolId) {
    return NextResponse.json({ error: "학교 ID가 필요합니다" }, { status: 422 });
  }

  try {
    if (closed) {
      await insert(
        "INSERT IGNORE INTO closed_schools (school_id) VALUES (?)",
        [schoolId]
      );
    } else {
      await query("DELETE FROM closed_schools WHERE school_id = ?", [
        schoolId,
      ]);
    }

    return NextResponse.json({
      message: closed ? "마감 처리되었습니다" : "마감 해제되었습니다",
    });
  } catch {
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}
