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

    // 검토 비고 (합격/불합격 사유 등)
    if (body.reviewNote !== undefined) {
      const note =
        typeof body.reviewNote === "string" && body.reviewNote.trim()
          ? body.reviewNote.trim().slice(0, 500)
          : null;
      try {
        await query("UPDATE applicants SET review_note = ? WHERE id = ?", [
          note,
          id,
        ]);
      } catch {
        // 컬럼이 아직 없으면 조용히 무시 (마이그레이션 전 상태)
      }
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

    // 배정별 강사료 및 입금일 저장
    // 같은 (applicant_id, school_id, subject_id) 안에 학년만 다른 행이 여러 개일 수 있어
    // grade까지 WHERE에 포함해야 한 행씩 정확히 업데이트됨 (<=>는 NULL-safe equality).
    if (body.assignment_payments && Array.isArray(body.assignment_payments)) {
      for (const ap of body.assignment_payments) {
        const grade = ap.grade ?? null;
        try {
          await query(
            `UPDATE applicant_assignments SET payment_amount = ?, payment_date = ?
             WHERE applicant_id = ? AND school_id = ? AND subject_id = ? AND grade <=> ?`,
            [ap.payment_amount, ap.payment_date || null, id, ap.school_id, ap.subject_id, grade]
          );
        } catch {
          // payment_date 컬럼이 아직 없는 구버전 DB: payment_amount만
          try {
            await query(
              `UPDATE applicant_assignments SET payment_amount = ?
               WHERE applicant_id = ? AND school_id = ? AND subject_id = ? AND grade <=> ?`,
              [ap.payment_amount, id, ap.school_id, ap.subject_id, grade]
            );
          } catch {
            // payment_amount 컬럼도 없으면 무시
          }
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
