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
  payment_amount: number | null;
  payment_date: string | null;
}

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin(request.headers.get("authorization"));
  if (!isAdmin) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const schoolFilter = searchParams.get("school"); // 특정 학교만 다운로드 (없으면 전체)

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
        `SELECT applicant_id, school_id, subject_id, grade,
                payment_amount,
                DATE_FORMAT(payment_date, '%Y-%m-%d') as payment_date
         FROM applicant_assignments
         ORDER BY id ASC`
      ),
      getSchools(),
      getSubjects(),
    ]);

    const BOM = "﻿";
    // 학교(A) 이름(B) 연락처(C) 이메일(D) 주소(E) 생년월일(F)
    // 배정과목(G) 배정학년(H)
    // 지급성명(I) 주민(J) 지급주소(K) 은행(L) 계좌(M)
    // 강사료(N) 사업소득세(O) 지방소득세(P) 원천합계(Q) 실수령(R)
    // 입금일자(S) 지급정보제출(T)
    const headers = [
      "학교", "이름", "연락처", "이메일", "주소", "생년월일",
      "배정과목", "배정학년",
      "지급성명", "주민등록번호", "지급주소", "은행명", "계좌번호",
      "강사료", "사업소득세(3%)", "지방소득세(0.3%)", "원천징수합계(3.3%)", "실수령액",
      "입금일자", "지급정보제출",
    ];

    const applicantById = new Map<number, ApplicantRow>();
    for (const a of applicants) applicantById.set(a.id, a);

    const schoolOrder = new Map<string, number>();
    SCHOOLS.forEach((s, idx) => schoolOrder.set(s.id, idx));
    const schoolName = (id: string) =>
      SCHOOLS.find((s) => s.id === id)?.shortName || id;
    const subjectName = (id: string) =>
      SUBJECTS.find((s) => s.id === id)?.name || id;

    type Item = {
      kind: "row";
      schoolId: string;
      applicant: ApplicantRow;
      assignment: AssignmentRow | null; // null = 합격했지만 배정 없음
    };

    // 합격자만 대상 — 학교 → 강사명 → 배정 ID 순으로 정렬
    // schoolFilter가 있으면 해당 학교의 배정만 포함 (미배정 합격자도 제외)
    const items: Item[] = [];
    for (const a of applicants) {
      const myAssigns = assignmentRows.filter(
        (r) =>
          r.applicant_id === a.id &&
          (schoolFilter ? r.school_id === schoolFilter : true)
      );
      if (myAssigns.length === 0) {
        if (!schoolFilter) {
          items.push({ kind: "row", schoolId: "__none__", applicant: a, assignment: null });
        }
        // schoolFilter가 있으면 해당 학교 배정 없는 강사는 스킵
      } else {
        for (const asn of myAssigns) {
          items.push({ kind: "row", schoolId: asn.school_id, applicant: a, assignment: asn });
        }
      }
    }

    items.sort((x, y) => {
      const sx = schoolOrder.get(x.schoolId) ?? 9999;
      const sy = schoolOrder.get(y.schoolId) ?? 9999;
      if (sx !== sy) return sx - sy;
      // 학교 내 강사명 가나다 순
      const nx = x.applicant.name || "";
      const ny = y.applicant.name || "";
      const cmp = nx.localeCompare(ny, "ko");
      if (cmp !== 0) return cmp;
      // 같은 강사 내에서는 과목명 → 학년 순으로
      const subX = x.assignment ? subjectName(x.assignment.subject_id) : "";
      const subY = y.assignment ? subjectName(y.assignment.subject_id) : "";
      const subCmp = subX.localeCompare(subY, "ko");
      if (subCmp !== 0) return subCmp;
      const gX = x.assignment?.grade || "";
      const gY = y.assignment?.grade || "";
      return gX.localeCompare(gY, "ko");
    });

    const csvLine = (cells: (string | number)[]) =>
      cells.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");

    const lines: string[] = [];
    lines.push(csvLine(headers));

    let currentSchoolId: string | null = null;
    let schoolSubtotal = 0;
    let schoolCount = 0;
    let grandTotal = 0;
    let grandCount = 0;
    let rowCursor = 1; // header is line 1, next data row will be 2

    const flushSchoolSubtotal = () => {
      if (currentSchoolId === null) return;
      if (schoolCount === 0) return;
      const incomeTax = Math.floor(schoolSubtotal * 0.03);
      const localTax = Math.floor(schoolSubtotal * 0.003);
      const totalTax = incomeTax + localTax;
      const net = schoolSubtotal - totalTax;
      const label =
        currentSchoolId === "__none__"
          ? `소계 (미배정 ${schoolCount}건)`
          : `${schoolName(currentSchoolId)} 소계 (${schoolCount}건)`;
      lines.push(
        csvLine([
          label, "", "", "", "", "", "", "", "", "", "", "", "",
          schoolSubtotal > 0 ? schoolSubtotal : "",
          schoolSubtotal > 0 ? incomeTax : "",
          schoolSubtotal > 0 ? localTax : "",
          schoolSubtotal > 0 ? totalTax : "",
          schoolSubtotal > 0 ? net : "",
          "", "",
        ])
      );
      rowCursor += 1;
    };

    for (const it of items) {
      if (currentSchoolId !== null && it.schoolId !== currentSchoolId) {
        flushSchoolSubtotal();
        // reset
        schoolSubtotal = 0;
        schoolCount = 0;
      }
      currentSchoolId = it.schoolId;

      const a = it.applicant;
      const asn = it.assignment;
      const amount = asn?.payment_amount ?? 0;
      const paymentDate = asn?.payment_date || "";

      // 세금 신고용 — 주민등록번호 전체 노출 (000000-0000000 형식으로 정규화)
      // 앞에 ' 접두사 추가 → 스프레드시트에서 텍스트로 인식되어 선두 0/하이픈 보존
      const rid = a.resident_id || "";
      const ridDigits = rid.replace(/\D/g, "");
      const fullResidentId =
        ridDigits.length >= 13
          ? `'${ridDigits.slice(0, 6)}-${ridDigits.slice(6, 13)}`
          : rid
            ? `'${rid}`
            : "";

      rowCursor += 1;
      const rowNum = rowCursor; // current row's spreadsheet row number

      lines.push(
        csvLine([
          it.schoolId === "__none__" ? "(미배정)" : schoolName(it.schoolId),
          a.name,
          a.phone,
          a.email,
          a.address,
          a.birth_date,
          asn ? subjectName(asn.subject_id) : "",
          asn?.grade || "",
          a.payment_name || "",
          fullResidentId,
          a.payment_address || "",
          a.bank_name || "",
          // 계좌번호: 앞에 ' 를 붙여 Excel/스프레드시트에서 텍스트로 인식되게 함 (선두 0 보존, 지수 표기 방지)
          a.bank_account ? `'${a.bank_account}` : "",
          amount > 0 ? amount.toString() : "",
          // 사업소득세 =ROUND(N{row}*0.03,0)
          amount > 0 ? `=ROUND(N${rowNum}*0.03,0)` : "",
          // 지방소득세 =ROUND(N{row}*0.003,0)
          amount > 0 ? `=ROUND(N${rowNum}*0.003,0)` : "",
          // 원천징수합계 =O+P
          amount > 0 ? `=O${rowNum}+P${rowNum}` : "",
          // 실수령 =N-Q
          amount > 0 ? `=N${rowNum}-Q${rowNum}` : "",
          paymentDate,
          a.payment_submitted_at ? "제출완료" : "미제출",
        ])
      );

      schoolSubtotal += amount;
      schoolCount += 1;
      grandTotal += amount;
      grandCount += 1;
    }

    // 마지막 학교 소계
    flushSchoolSubtotal();

    // 전체 합계
    if (grandCount > 0) {
      const incomeTax = Math.floor(grandTotal * 0.03);
      const localTax = Math.floor(grandTotal * 0.003);
      const totalTax = incomeTax + localTax;
      const net = grandTotal - totalTax;
      lines.push(
        csvLine([
          `전체 합계 (${grandCount}건)`, "", "", "", "", "", "", "", "", "", "", "", "",
          grandTotal > 0 ? grandTotal : "",
          grandTotal > 0 ? incomeTax : "",
          grandTotal > 0 ? localTax : "",
          grandTotal > 0 ? totalTax : "",
          grandTotal > 0 ? net : "",
          "", "",
        ])
      );
    }

    const csv = BOM + lines.join("\n");

    const dateStr = new Date().toISOString().slice(0, 10);
    const schoolSlug = schoolFilter
      ? `_${(SCHOOLS.find((s) => s.id === schoolFilter)?.shortName || schoolFilter).replace(/\s+/g, "")}`
      : "";
    const fileBase = `payment${schoolSlug}_${dateStr}.csv`;
    // RFC 5987: filename* with UTF-8 한글 보존 + ASCII fallback
    const asciiFallback = `payment${schoolFilter ? "_" + schoolFilter : ""}_${dateStr}.csv`;
    const dispo = `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileBase)}`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": dispo,
      },
    });
  } catch (err) {
    console.error("Payment CSV export error:", err);
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
  }
}
