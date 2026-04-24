import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSchools, getSubjects } from "@/lib/data";
import { verifyAdmin } from "@/lib/auth-server";

interface ApplicantRow {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  birth_date: string;
  payment_name: string | null;
  resident_id: string | null;
  payment_address: string | null;
  bank_name: string | null;
  bank_account: string | null;
  payment_amount: number | null;
  payment_date: string | null;
  payment_submitted_at: string | null;
}

interface AssignmentRow {
  applicant_id: number;
  school_id: string;
  subject_id: string;
  grade: string | null;
}

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin(request.headers.get("authorization"));
  if (!isAdmin) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  try {
    const [applicants, assignmentRows, SCHOOLS, SUBJECTS] = await Promise.all([
      query<ApplicantRow>(
        `SELECT id, name, phone, email, address,
                DATE_FORMAT(birth_date, '%Y-%m-%d') as birth_date,
                payment_name, resident_id, payment_address,
                bank_name, bank_account, payment_amount,
                DATE_FORMAT(payment_date, '%Y-%m-%d') as payment_date,
                payment_submitted_at
         FROM applicants
         WHERE status = 'accepted'
         ORDER BY name ASC`
      ),
      query<AssignmentRow>(
        "SELECT applicant_id, school_id, subject_id, grade FROM applicant_assignments ORDER BY id ASC"
      ),
      getSchools(),
      getSubjects(),
    ]);

    const BOM = "\uFEFF";
    const headers = [
      "이름", "연락처", "이메일", "주소", "생년월일",
      "배정학교", "배정과목", "배정학년",
      "지급성명", "주민등록번호", "지급주소", "은행명", "계좌번호",
      "강사료(총액)", "사업소득세(3%)", "지방소득세(0.3%)", "원천징수합계(3.3%)", "실수령액",
      "입금일자", "지급정보제출",
    ];

    const rows = applicants.map((a, idx) => {
      const assignments = assignmentRows.filter((r) => r.applicant_id === a.id);
      const schools = assignments
        .map((r) => SCHOOLS.find((s) => s.id === r.school_id)?.shortName || r.school_id)
        .join(", ");
      const subjects = assignments
        .map((r) => SUBJECTS.find((s) => s.id === r.subject_id)?.name || r.subject_id)
        .join(", ");
      const grades = assignments
        .map((r) => r.grade || "")
        .join(", ");

      const amount = a.payment_amount || 0;
      const incomeTax = Math.floor(amount * 0.03);
      const localTax = Math.floor(amount * 0.003);
      const totalTax = incomeTax + localTax;
      const netAmount = amount - totalTax;

      // 주민번호 마스킹: 뒷자리 첫 1자리만 노출
      const maskedResidentId = a.resident_id
        ? a.resident_id.length >= 7
          ? `${a.resident_id.slice(0, 6)}-${a.resident_id[6]}******`
          : a.resident_id
        : "";

      // CSV row number (1-based, excluding header)
      const rowNum = idx + 2;

      return [
        a.name,
        a.phone,
        a.email,
        a.address,
        a.birth_date,
        schools,
        subjects,
        grades,
        a.payment_name || "",
        maskedResidentId,
        a.payment_address || "",
        a.bank_name || "",
        a.bank_account || "",
        amount > 0 ? amount.toString() : "",
        // 사업소득세 수식: =ROUND(N{row}*0.03,0)
        amount > 0 ? `=ROUND(N${rowNum}*0.03,0)` : "",
        // 지방소득세 수식: =ROUND(N{row}*0.003,0)
        amount > 0 ? `=ROUND(N${rowNum}*0.003,0)` : "",
        // 원천징수합계: =O{row}+P{row}
        amount > 0 ? `=O${rowNum}+P${rowNum}` : "",
        // 실수령액: =N{row}-Q{row}
        amount > 0 ? `=N${rowNum}-Q${rowNum}` : "",
        a.payment_date || "",
        a.payment_submitted_at ? "제출완료" : "미제출",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });

    const csv = BOM + headers.join(",") + "\n" + rows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="payment_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error("Payment CSV export error:", err);
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
  }
}
