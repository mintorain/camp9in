import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  if (body.status) {
    const validStatuses = ["pending", "reviewing", "accepted", "rejected"];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: "올바르지 않은 상태값입니다" },
        { status: 422 }
      );
    }

    try {
      await query("UPDATE applicants SET status = ? WHERE id = ?", [
        body.status,
        id,
      ]);
    } catch {
      return NextResponse.json(
        { error: "상태 변경에 실패했습니다" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ message: "수정되었습니다" });
}
