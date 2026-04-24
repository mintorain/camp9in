import { NextResponse } from "next/server";
import { getSchools } from "@/lib/data";

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
