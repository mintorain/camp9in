import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

// 페이지뷰 기록 (클라이언트에서 호출)
export async function POST(request: NextRequest) {
  try {
    const { page, sessionId } = await request.json();

    if (!page || !sessionId) {
      return NextResponse.json({ error: "필수값 누락" }, { status: 422 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "";

    await insert(
      "INSERT INTO page_views (page, session_id, ip, user_agent) VALUES (?, ?, ?, ?)",
      [page, sessionId, ip, userAgent.slice(0, 500)]
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "기록 실패" }, { status: 500 });
  }
}

// 통계 조회 (관리자용)
export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin(request.headers.get("authorization"));
  if (!isAdmin) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    // 1. 실시간 접속자 (최근 5분 이내 고유 세션)
    const realtimeRows = await query<{ cnt: number }>(
      "SELECT COUNT(DISTINCT session_id) as cnt FROM page_views WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)"
    );

    // 2. 오늘 방문자
    const todayRows = await query<{ visitors: number; views: number }>(
      "SELECT COUNT(DISTINCT session_id) as visitors, COUNT(*) as views FROM page_views WHERE DATE(created_at) = CURDATE()"
    );

    // 3. 최근 7일 일별 통계
    const dailyRows = await query<{ date: string; visitors: number; views: number }>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date,
              COUNT(DISTINCT session_id) as visitors,
              COUNT(*) as views
       FROM page_views
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    );

    // 4. 페이지별 조회 수 (오늘)
    const pageRows = await query<{ page: string; views: number; visitors: number }>(
      `SELECT page,
              COUNT(*) as views,
              COUNT(DISTINCT session_id) as visitors
       FROM page_views
       WHERE DATE(created_at) = CURDATE()
       GROUP BY page
       ORDER BY views DESC`
    );

    // 5. 전체 누적
    const totalRows = await query<{ visitors: number; views: number }>(
      "SELECT COUNT(DISTINCT session_id) as visitors, COUNT(*) as views FROM page_views"
    );

    return NextResponse.json({
      realtime: realtimeRows[0]?.cnt || 0,
      today: todayRows[0] || { visitors: 0, views: 0 },
      daily: dailyRows,
      pages: pageRows,
      total: totalRows[0] || { visitors: 0, views: 0 },
    });
  } catch (err) {
    console.error("Analytics error:", err);
    return NextResponse.json({ error: "통계 조회 실패" }, { status: 500 });
  }
}
