import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";
import { getSubjects } from "@/lib/data";
import { verifyAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const subjects = await getSubjects();
    return NextResponse.json({ data: subjects });
  } catch (err) {
    console.error("[GET /api/subjects]", err);
    return NextResponse.json({ data: [], error: "조회 실패" }, { status: 500 });
  }
}

/**
 * 관리자: 과목 신규 추가
 */
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin(request.headers.get("authorization"));
  if (!isAdmin) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "id가 필요합니다" }, { status: 422 });
    }
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "name이 필요합니다" }, { status: 422 });
    }
    if (!/^[a-z0-9-]+$/.test(body.id)) {
      return NextResponse.json(
        { error: "id는 영소문자/숫자/하이픈만 허용됩니다" },
        { status: 422 }
      );
    }

    const existing = await query<{ id: string }>(
      "SELECT id FROM subjects WHERE id = ?",
      [body.id]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "이미 존재하는 과목 ID입니다" },
        { status: 409 }
      );
    }

    await insert(
      `INSERT INTO subjects (id, name, description, skills, icon, is_closed, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        body.id,
        body.name,
        body.description || null,
        body.skills || null,
        body.icon || null,
        body.isClosed ? 1 : 0,
        Number(body.sortOrder) || 100,
      ]
    );

    return NextResponse.json(
      { message: "과목이 추가되었습니다", data: { id: body.id } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/subjects]", err);
    return NextResponse.json({ error: "추가 실패" }, { status: 500 });
  }
}
