import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";
import { getSchools } from "@/lib/data";
import { verifyAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

/**
 * 학교 목록 전체 반환 (관리/표시용)
 * - 지원자용 필터링은 클라이언트에서 (hideName/hideScheduleCard/isClosed/endDate) 처리
 *   → 한 페이지에서 여러 용도로 써야 하므로 전체를 주고 클라이언트가 판단
 */
export async function GET() {
  try {
    const schools = await getSchools();
    return NextResponse.json({ data: schools });
  } catch (err) {
    console.error("[GET /api/schools]", err);
    return NextResponse.json({ data: [], error: "조회 실패" }, { status: 500 });
  }
}

/**
 * 관리자: 학교 신규 추가
 */
export async function POST(request: NextRequest) {
  const isAdmin = await verifyAdmin(request.headers.get("authorization"));
  if (!isAdmin) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // 필수 필드 검증
    const required = ["id", "name", "shortName", "startDate", "endDate"];
    for (const k of required) {
      if (!body[k] || typeof body[k] !== "string") {
        return NextResponse.json(
          { error: `필수값 누락: ${k}` },
          { status: 422 }
        );
      }
    }

    // id 슬러그 검증 (영소문자, 숫자, 하이픈만)
    if (!/^[a-z0-9-]+$/.test(body.id)) {
      return NextResponse.json(
        { error: "id는 영소문자/숫자/하이픈만 허용됩니다" },
        { status: 422 }
      );
    }

    // 중복 체크
    const existing = await query<{ id: string }>(
      "SELECT id FROM schools WHERE id = ?",
      [body.id]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "이미 존재하는 학교 ID입니다" },
        { status: 409 }
      );
    }

    const campType =
      body.campType === "rotation" || body.campType === "hybrid"
        ? body.campType
        : "class";

    await insert(
      `INSERT INTO schools
       (id, name, short_name, start_date, end_date, recruit_deadline,
        date_label, time_label, location, target, capacity_per_subject,
        camp_type, hide_name, hide_schedule_card, is_closed, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.id,
        body.name,
        body.shortName,
        body.startDate,
        body.endDate,
        body.recruitDeadline || null,
        body.dateLabel || null,
        body.time || null,
        body.location || null,
        body.target || null,
        Number(body.capacityPerSubject) || 8,
        campType,
        body.hideName ? 1 : 0,
        body.hideScheduleCard ? 1 : 0,
        body.isClosed ? 1 : 0,
        Number(body.sortOrder) || 100,
      ]
    );

    return NextResponse.json(
      { message: "학교가 추가되었습니다", data: { id: body.id } },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/schools]", err);
    return NextResponse.json({ error: "추가 실패" }, { status: 500 });
  }
}
