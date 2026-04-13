import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth-server";

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
    if (body.status) {
      const validStatuses = ["pending", "reviewing", "accepted", "rejected"];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: "올바르지 않은 상태값입니다" },
          { status: 422 }
        );
      }
      await query("UPDATE applicants SET status = ? WHERE id = ?", [
        body.status,
        id,
      ]);
    }

    if (body.assignments !== undefined) {
      await query(
        "DELETE FROM applicant_assignments WHERE applicant_id = ?",
        [id]
      );
      for (const a of body.assignments) {
        if (a.school_id && a.subject_id) {
          await insert(
            "INSERT INTO applicant_assignments (applicant_id, school_id, subject_id, grade) VALUES (?, ?, ?, ?)",
            [id, a.school_id, a.subject_id, a.grade || null]
          );
        }
      }
    }
  } catch {
    return NextResponse.json(
      { error: "수정에 실패했습니다" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "수정되었습니다" });
}

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
    await query("DELETE FROM applicants WHERE id = ?", [id]);
    return NextResponse.json({ message: "삭제되었습니다" });
  } catch {
    return NextResponse.json(
      { error: "삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}
