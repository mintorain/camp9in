import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface ApplicantResult {
  id: number;
  name: string;
  phone: string;
  status: string;
  payment_name: string | null;
  payment_address: string | null;
  bank_name: string | null;
  bank_account: string | null;
  payment_submitted_at: string | null;
  payment_amount: number | null;
  payment_date: string | null;
}

interface RelationRow {
  applicant_id: number;
  school_id?: string;
  subject_id?: string;
}

interface AssignmentRow {
  applicant_id: number;
  school_id: string;
  subject_id: string;
  grade: string | null;
  payment_amount: number | null;
}

// 합격 조회
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "이름과 연락처를 입력해주세요" },
        { status: 422 }
      );
    }

    const normalizedPhone = phone.replace(/-/g, "");

    let rows: ApplicantResult[];
    try {
      rows = await query<ApplicantResult>(
        `SELECT id, name, phone, status, payment_name, payment_address, bank_name, bank_account,
                payment_submitted_at, payment_amount, DATE_FORMAT(payment_date, '%Y-%m-%d') as payment_date
         FROM applicants
         WHERE name = ? AND REPLACE(phone, '-', '') = ?`,
        [name.trim(), normalizedPhone]
      );
    } catch {
      // payment_amount/payment_date 컬럼이 없는 경우 fallback
      rows = await query<ApplicantResult>(
        `SELECT id, name, phone, status, payment_name, payment_address, bank_name, bank_account,
                payment_submitted_at, NULL as payment_amount, NULL as payment_date
         FROM applicants
         WHERE name = ? AND REPLACE(phone, '-', '') = ?`,
        [name.trim(), normalizedPhone]
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "해당 정보로 조회된 지원서가 없습니다" },
        { status: 404 }
      );
    }

    const applicant = rows[0];

    if (applicant.status !== "accepted") {
      return NextResponse.json({
        data: {
          id: applicant.id,
          name: applicant.name,
          status: applicant.status,
          assignments: [],
          paymentSubmitted: false,
        },
      });
    }

    // 합격자만 배정 정보 조회 (배정별 금액 포함)
    let assignments: AssignmentRow[];
    try {
      assignments = await query<AssignmentRow>(
        "SELECT school_id, subject_id, grade, payment_amount FROM applicant_assignments WHERE applicant_id = ?",
        [applicant.id]
      );
    } catch {
      assignments = await query<AssignmentRow>(
        "SELECT school_id, subject_id, grade, NULL as payment_amount FROM applicant_assignments WHERE applicant_id = ?",
        [applicant.id]
      );
    }

    // 배정별 금액 합계 또는 applicants 테이블의 금액
    const assignmentTotal = assignments.reduce((sum, a) => sum + (a.payment_amount || 0), 0);
    const totalAmount = assignmentTotal > 0 ? assignmentTotal : applicant.payment_amount;

    return NextResponse.json({
      data: {
        id: applicant.id,
        name: applicant.name,
        status: applicant.status,
        assignments: assignments.map((a) => ({
          school_id: a.school_id,
          subject_id: a.subject_id,
          grade: a.grade,
          paymentAmount: a.payment_amount,
        })),
        paymentSubmitted: !!applicant.payment_submitted_at,
        paymentName: applicant.payment_name,
        paymentAddress: applicant.payment_address,
        bankName: applicant.bank_name,
        bankAccount: applicant.bank_account,
        paymentAmount: totalAmount,
        paymentDate: applicant.payment_date,
      },
    });
  } catch (err) {
    console.error("Result lookup error:", err);
    return NextResponse.json(
      { error: "조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

// 강사료 지급 정보 제출
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, phone, paymentName, residentId, paymentAddress, bankName, bankAccount } = body;

    if (!id || !name || !phone || !paymentName || !residentId || !paymentAddress || !bankName || !bankAccount) {
      return NextResponse.json(
        { error: "모든 항목을 입력해주세요" },
        { status: 422 }
      );
    }

    // 본인 확인
    const normalizedPhone = phone.replace(/-/g, "");
    const rows = await query<ApplicantResult>(
      `SELECT id, status FROM applicants
       WHERE id = ? AND name = ? AND REPLACE(phone, '-', '') = ? AND status = 'accepted'`,
      [id, name.trim(), normalizedPhone]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "본인 확인에 실패했습니다" },
        { status: 403 }
      );
    }

    await query(
      `UPDATE applicants
       SET payment_name = ?, resident_id = ?, payment_address = ?, bank_name = ?, bank_account = ?, payment_submitted_at = NOW()
       WHERE id = ?`,
      [paymentName.trim(), residentId.trim(), paymentAddress.trim(), bankName.trim(), bankAccount.trim(), id]
    );

    return NextResponse.json({ message: "강사료 지급 정보가 저장되었습니다" });
  } catch (err) {
    console.error("Payment info submit error:", err);
    return NextResponse.json(
      { error: "저장에 실패했습니다" },
      { status: 500 }
    );
  }
}
