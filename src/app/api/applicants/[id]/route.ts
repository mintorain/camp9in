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

    if (body.payment_amount !== undefined) {
      await query("UPDATE applicants SET payment_amount = ? WHERE id = ?", [
        body.payment_amount,
        id,
      ]);
    }

    if (body.payment_date !== undefined) {
      await query("UPDATE applicants SET payment_date = ? WHERE id = ?", [
        body.payment_date || null,
        id,
      ]);
    }

    // 배정별 강사료 저장
    if (body.assignment_payments && Array.isArray(body.assignment_payments)) {
      for (const ap of body.assignment_payments) {
        try {
          await query(
            `UPDATE applicant_assignments SET payment_amount = ?
             WHERE applicant_id = ? AND school_id = ? AND subject_id = ?`,
            [ap.payment_amount, id, ap.school_id, ap.subject_id]
          );
        } catch {
          // payment_amount 컬럼이 없으면 무시
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
