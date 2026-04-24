import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSchools } from "@/lib/data";

export const dynamic = "force-dynamic";

// KST 기준 오늘 날짜를 YYYY-MM-DD로 반환
function todayKST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

interface CountRow {
  subject_id: string;
  cnt: number;
}

interface ClosedRow {
  subject_id: string;
}

interface LegacyClosedSchoolRow {
  school_id: string;
}

export async function GET() {
  try {
    const countRows = await query<CountRow>(
      "SELECT subject_id, COUNT(*) as cnt FROM applicant_subjects GROUP BY subject_id"
    );

    const closedRows = await query<ClosedRow>(
      "SELECT subject_id FROM closed_subjects"
    );

    // legacy closed_schools 테이블 (기존 경로 호환)
    let legacyClosedIds: string[] = [];
    try {
      const legacyRows = await query<LegacyClosedSchoolRow>(
        "SELECT school_id FROM closed_schools"
      );
      legacyClosedIds = legacyRows.map((r) => r.school_id);
    } catch {
      // 테이블 미존재 시 무시
    }

    // DB schools 기반으로 마감 판정 (수동 + 캠프 종료일 + 접수 마감일)
    const today = todayKST();
    let dbClosedIds: string[] = [];
    try {
      const schools = await getSchools();
      dbClosedIds = schools
        .filter((s) => {
          if (s.isClosed) return true;
          if (s.endDate && s.endDate < today) return true;
          if (s.recruitDeadline && s.recruitDeadline < today) return true;
          return false;
        })
        .map((s) => s.id);
    } catch {
      // DB schools 조회 실패 시 legacy만 사용
    }

    const closedSchoolIds = Array.from(
      new Set([...legacyClosedIds, ...dbClosedIds])
    );

    const counts: Record<string, number> = {};
    for (const row of countRows) {
      counts[row.subject_id] = row.cnt;
    }

    const closedIds = closedRows.map((r) => r.subject_id);

    return NextResponse.json({ data: counts, closedIds, closedSchoolIds });
  } catch {
    return NextResponse.json({
      data: {},
      closedIds: [],
      closedSchoolIds: [],
    });
  }
}
