import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSchools, getSubjects } from "@/lib/data";
import { verifyAdmin } from "@/lib/auth-server";
import ExcelJS from "exceljs";

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

// 셀 타입: 텍스트/강제텍스트(주민·계좌)/숫자/엑셀수식
type Cell =
  | { kind: "plain"; v: string }
  | { kind: "forceText"; v: string } // 스프레드시트가 숫자로 해석하지 않도록
  | { kind: "number"; v: number; fmt?: string }
  | { kind: "formula"; formula: string; result: number; fmt?: string }
  | { kind: "empty" };

type Row = { style: "header" | "data" | "subtotal" | "grand"; cells: Cell[] };

const NUM_FMT = "#,##0";

function emptyN(n: number): Cell[] {
  return Array.from({ length: n }, () => ({ kind: "empty" } as Cell));
}

export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdmin(request.headers.get("authorization"));
  if (!isAdmin) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const schoolFilter = searchParams.get("school"); // 학교 필터 (없으면 전체)
  const format = (searchParams.get("format") || "csv").toLowerCase(); // csv | xlsx
  const group = (searchParams.get("group") || "").toLowerCase(); // ""(배정별, 기본) | "instructor"(학교×강사 합계)

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

    // 컬럼 정의 (그룹 모드에 따라 다름)
    // 배정별 (기본): 학교(A) 이름(B) 연락처(C) 이메일(D) 주소(E) 생년월일(F)
    //   배정과목(G) 배정학년(H) 지급성명(I) 주민(J) 지급주소(K) 은행(L) 계좌(M)
    //   강사료(N) 사업소득세(O) 지방소득세(P) 원천합계(Q) 실수령(R) 입금일자(S) 지급정보제출(T)
    // 강사 합계 (group=instructor): 학교(A) 강사명(B) 주민(C) 연락처(D) 주소(E) 지급성명(F)
    //   지급주소(G) 은행(H) 계좌(I) 배정건수(J) 강사료합계(K) 사업소득세(L) 지방소득세(M)
    //   원천합계(N) 실수령(O) 입금일자(P) 지급정보제출(Q)
    const headers =
      group === "instructor"
        ? [
            "학교", "강사명", "주민등록번호", "연락처", "주소",
            "지급성명", "지급주소", "은행명", "계좌번호",
            "배정 건수", "강사료 합계", "사업소득세(3%)", "지방소득세(0.3%)",
            "원천징수합계(3.3%)", "실수령액", "입금일자", "지급정보제출",
          ]
        : [
            "학교", "이름", "연락처", "이메일", "주소", "생년월일",
            "배정과목", "배정학년",
            "지급성명", "주민등록번호", "지급주소", "은행명", "계좌번호",
            "강사료", "사업소득세(3%)", "지방소득세(0.3%)", "원천징수합계(3.3%)", "실수령액",
            "입금일자", "지급정보제출",
          ];
    // 강사 합계 모드에서 합계 컬럼 위치 (K=11번째)
    const AMT_COL_LETTER = group === "instructor" ? "K" : "N";
    const TAX1_COL = group === "instructor" ? "L" : "O";
    const TAX2_COL = group === "instructor" ? "M" : "P";
    const TAXSUM_COL = group === "instructor" ? "N" : "Q";

    const schoolOrder = new Map<string, number>();
    SCHOOLS.forEach((s, idx) => schoolOrder.set(s.id, idx));
    const schoolName = (id: string) =>
      SCHOOLS.find((s) => s.id === id)?.shortName || id;
    const subjectName = (id: string) =>
      SUBJECTS.find((s) => s.id === id)?.name || id;

    type Item = {
      schoolId: string;
      applicant: ApplicantRow;
      assignment: AssignmentRow | null;
    };

    const items: Item[] = [];
    for (const a of applicants) {
      const myAssigns = assignmentRows.filter(
        (r) => r.applicant_id === a.id && (schoolFilter ? r.school_id === schoolFilter : true)
      );
      if (myAssigns.length === 0) {
        if (!schoolFilter) {
          items.push({ schoolId: "__none__", applicant: a, assignment: null });
        }
      } else {
        for (const asn of myAssigns) {
          items.push({ schoolId: asn.school_id, applicant: a, assignment: asn });
        }
      }
    }

    items.sort((x, y) => {
      const sx = schoolOrder.get(x.schoolId) ?? 9999;
      const sy = schoolOrder.get(y.schoolId) ?? 9999;
      if (sx !== sy) return sx - sy;
      const cmp = (x.applicant.name || "").localeCompare(y.applicant.name || "", "ko");
      if (cmp !== 0) return cmp;
      const subX = x.assignment ? subjectName(x.assignment.subject_id) : "";
      const subY = y.assignment ? subjectName(y.assignment.subject_id) : "";
      const subCmp = subX.localeCompare(subY, "ko");
      if (subCmp !== 0) return subCmp;
      return (x.assignment?.grade || "").localeCompare(y.assignment?.grade || "", "ko");
    });

    // 행 데이터 생성
    const rows: Row[] = [];
    rows.push({
      style: "header",
      cells: headers.map((h) => ({ kind: "plain", v: h }) as Cell),
    });

    // 주민등록번호 정규화 헬퍼
    const normalizeRid = (r: string | null): string => {
      const rid = r || "";
      const ridDigits = rid.replace(/\D/g, "");
      return ridDigits.length >= 13 ? `${ridDigits.slice(0, 6)}-${ridDigits.slice(6, 13)}` : rid;
    };

    let currentSchoolId: string | null = null;
    let schoolSubtotal = 0;
    let schoolCount = 0;
    let grandTotal = 0;
    let grandCount = 0;
    let rowCursor = 1; // 헤더가 row 1

    // 모드별 소계/합계 행 셀 빌더
    const buildTotalRow = (
      label: string,
      sumAmount: number,
      itemCount: number
    ): Cell[] => {
      const incomeTax = Math.floor(sumAmount * 0.03);
      const localTax = Math.floor(sumAmount * 0.003);
      const totalTax = incomeTax + localTax;
      const net = sumAmount - totalTax;
      const numOrEmpty = (n: number): Cell =>
        sumAmount > 0 ? { kind: "number", v: n, fmt: NUM_FMT } : { kind: "empty" };
      if (group === "instructor") {
        // [학교][강사명][주민][연락처][주소][지급성명][지급주소][은행][계좌][건수][합계][세1][세2][세합][실수령][입금일][제출]
        return [
          { kind: "plain", v: label },
          ...emptyN(8),
          { kind: "number", v: itemCount },
          numOrEmpty(sumAmount),
          numOrEmpty(incomeTax),
          numOrEmpty(localTax),
          numOrEmpty(totalTax),
          numOrEmpty(net),
          { kind: "empty" },
          { kind: "empty" },
        ];
      }
      // 배정별 모드 (기본)
      return [
        { kind: "plain", v: label },
        ...emptyN(12),
        numOrEmpty(sumAmount),
        numOrEmpty(incomeTax),
        numOrEmpty(localTax),
        numOrEmpty(totalTax),
        numOrEmpty(net),
        { kind: "empty" },
        { kind: "empty" },
      ];
    };

    const flushSubtotal = () => {
      if (currentSchoolId === null || schoolCount === 0) return;
      const label =
        currentSchoolId === "__none__"
          ? `소계 (미배정 ${schoolCount}건)`
          : `${schoolName(currentSchoolId)} 소계 (${schoolCount}건)`;
      rows.push({ style: "subtotal", cells: buildTotalRow(label, schoolSubtotal, schoolCount) });
      rowCursor += 1;
    };

    if (group === "instructor") {
      // 강사 합계 모드: 학교 × (강사명 + 주민번호) 단위로 집계
      type Bucket = {
        schoolId: string;
        applicant: ApplicantRow;
        rid: string; // 정규화된 주민등록번호 (또는 빈 문자열)
        amountSum: number;
        count: number;
        // 입금일은 모두 동일하면 그 날짜, 다르면 "혼재"
        firstDate: string | null;
        mixedDates: boolean;
      };
      const bucketKey = (schoolId: string, name: string, rid: string) =>
        `${schoolId}${name}${rid}`;
      const buckets = new Map<string, Bucket>();

      for (const it of items) {
        const a = it.applicant;
        const rid = normalizeRid(a.resident_id);
        const key = bucketKey(it.schoolId, a.name || "", rid);
        let b = buckets.get(key);
        if (!b) {
          b = {
            schoolId: it.schoolId,
            applicant: a,
            rid,
            amountSum: 0,
            count: 0,
            firstDate: null,
            mixedDates: false,
          };
          buckets.set(key, b);
        }
        const amt = it.assignment?.payment_amount ?? 0;
        b.amountSum += amt;
        b.count += 1;
        const d = it.assignment?.payment_date || "";
        if (d) {
          if (b.firstDate === null) b.firstDate = d;
          else if (b.firstDate !== d) b.mixedDates = true;
        }
      }

      // 정렬 (학교 → 강사명)
      const bucketArr = Array.from(buckets.values()).sort((x, y) => {
        const sx = schoolOrder.get(x.schoolId) ?? 9999;
        const sy = schoolOrder.get(y.schoolId) ?? 9999;
        if (sx !== sy) return sx - sy;
        return (x.applicant.name || "").localeCompare(y.applicant.name || "", "ko");
      });

      for (const b of bucketArr) {
        if (currentSchoolId !== null && b.schoolId !== currentSchoolId) {
          flushSubtotal();
          schoolSubtotal = 0;
          schoolCount = 0;
        }
        currentSchoolId = b.schoolId;

        const a = b.applicant;
        const amount = b.amountSum;
        const paymentDateLabel = b.mixedDates ? "혼재" : (b.firstDate || "");

        rowCursor += 1;
        const rn = rowCursor;

        const incomeTax = Math.floor(amount * 0.03);
        const localTax = Math.floor(amount * 0.003);
        const totalTax = incomeTax + localTax;
        const net = amount - totalTax;

        // [학교][강사명][주민][연락처][주소][지급성명][지급주소][은행][계좌][배정건수][강사료합계][세1][세2][세합][실수령][입금일][제출]
        const cells: Cell[] = [
          { kind: "plain", v: b.schoolId === "__none__" ? "(미배정)" : schoolName(b.schoolId) },
          { kind: "plain", v: a.name || "" },
          { kind: "forceText", v: b.rid },
          { kind: "forceText", v: a.phone || "" },
          { kind: "plain", v: a.address || "" },
          { kind: "plain", v: a.payment_name || "" },
          { kind: "plain", v: a.payment_address || "" },
          { kind: "plain", v: a.bank_name || "" },
          { kind: "forceText", v: a.bank_account || "" },
          { kind: "number", v: b.count },
          amount > 0 ? { kind: "number", v: amount, fmt: NUM_FMT } : { kind: "empty" },
          amount > 0
            ? { kind: "formula", formula: `ROUND(${AMT_COL_LETTER}${rn}*0.03,0)`, result: incomeTax, fmt: NUM_FMT }
            : { kind: "empty" },
          amount > 0
            ? { kind: "formula", formula: `ROUND(${AMT_COL_LETTER}${rn}*0.003,0)`, result: localTax, fmt: NUM_FMT }
            : { kind: "empty" },
          amount > 0
            ? { kind: "formula", formula: `${TAX1_COL}${rn}+${TAX2_COL}${rn}`, result: totalTax, fmt: NUM_FMT }
            : { kind: "empty" },
          amount > 0
            ? { kind: "formula", formula: `${AMT_COL_LETTER}${rn}-${TAXSUM_COL}${rn}`, result: net, fmt: NUM_FMT }
            : { kind: "empty" },
          { kind: "forceText", v: paymentDateLabel },
          { kind: "plain", v: a.payment_submitted_at ? "제출완료" : "미제출" },
        ];
        rows.push({ style: "data", cells });

        schoolSubtotal += amount;
        schoolCount += 1;
        grandTotal += amount;
        grandCount += 1;
      }
      flushSubtotal();
    } else {
      // 기본 (배정별)
      for (const it of items) {
        if (currentSchoolId !== null && it.schoolId !== currentSchoolId) {
          flushSubtotal();
          schoolSubtotal = 0;
          schoolCount = 0;
        }
        currentSchoolId = it.schoolId;

        const a = it.applicant;
        const asn = it.assignment;
        const amount = asn?.payment_amount ?? 0;
        const paymentDate = asn?.payment_date || "";
        const fullRid = normalizeRid(a.resident_id);

        rowCursor += 1;
        const rn = rowCursor;

        const incomeTax = Math.floor(amount * 0.03);
        const localTax = Math.floor(amount * 0.003);
        const totalTax = incomeTax + localTax;
        const net = amount - totalTax;

        const cells: Cell[] = [
          { kind: "plain", v: it.schoolId === "__none__" ? "(미배정)" : schoolName(it.schoolId) },
          { kind: "plain", v: a.name || "" },
          { kind: "forceText", v: a.phone || "" },
          { kind: "plain", v: a.email || "" },
          { kind: "plain", v: a.address || "" },
          { kind: "forceText", v: a.birth_date || "" },
          { kind: "plain", v: asn ? subjectName(asn.subject_id) : "" },
          { kind: "plain", v: asn?.grade || "" },
          { kind: "plain", v: a.payment_name || "" },
          { kind: "forceText", v: fullRid },
          { kind: "plain", v: a.payment_address || "" },
          { kind: "plain", v: a.bank_name || "" },
          { kind: "forceText", v: a.bank_account || "" },
          amount > 0 ? { kind: "number", v: amount, fmt: NUM_FMT } : { kind: "empty" },
          amount > 0
            ? { kind: "formula", formula: `ROUND(N${rn}*0.03,0)`, result: incomeTax, fmt: NUM_FMT }
            : { kind: "empty" },
          amount > 0
            ? { kind: "formula", formula: `ROUND(N${rn}*0.003,0)`, result: localTax, fmt: NUM_FMT }
            : { kind: "empty" },
          amount > 0
            ? { kind: "formula", formula: `O${rn}+P${rn}`, result: totalTax, fmt: NUM_FMT }
            : { kind: "empty" },
          amount > 0
            ? { kind: "formula", formula: `N${rn}-Q${rn}`, result: net, fmt: NUM_FMT }
            : { kind: "empty" },
          { kind: "forceText", v: paymentDate },
          { kind: "plain", v: a.payment_submitted_at ? "제출완료" : "미제출" },
        ];
        rows.push({ style: "data", cells });

        schoolSubtotal += amount;
        schoolCount += 1;
        grandTotal += amount;
        grandCount += 1;
      }
      flushSubtotal();
    }

    if (grandCount > 0) {
      rows.push({
        style: "grand",
        cells: buildTotalRow(`전체 합계 (${grandCount}건)`, grandTotal, grandCount),
      });
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const schoolSlug = schoolFilter
      ? `_${(SCHOOLS.find((s) => s.id === schoolFilter)?.shortName || schoolFilter).replace(/\s+/g, "")}`
      : "";
    const groupSlug = group === "instructor" ? "_summary" : "";

    if (format === "xlsx") {
      const wb = new ExcelJS.Workbook();
      wb.creator = "camp9in";
      wb.created = new Date();
      const ws = wb.addWorksheet(group === "instructor" ? "강사료 합계" : "강사료");

      // 컬럼 너비 (모드별)
      const widths =
        group === "instructor"
          ? [10, 12, 18, 14, 32, 12, 30, 12, 18, 10, 14, 12, 12, 14, 14, 14, 12]
          : [10, 10, 14, 24, 32, 12, 10, 10, 10, 18, 30, 12, 18, 12, 12, 12, 14, 12, 12, 12];
      ws.columns = widths.map((w) => ({ width: w }));

      for (const r of rows) {
        const xrow = ws.addRow([]);
        r.cells.forEach((c, i) => {
          const cell = xrow.getCell(i + 1);
          switch (c.kind) {
            case "plain":
              cell.value = c.v;
              break;
            case "forceText":
              cell.numFmt = "@";
              cell.value = c.v;
              break;
            case "number":
              cell.value = c.v;
              if (c.fmt) cell.numFmt = c.fmt;
              break;
            case "formula":
              cell.value = { formula: c.formula, result: c.result };
              if (c.fmt) cell.numFmt = c.fmt;
              break;
            case "empty":
              break;
          }
        });

        if (r.style === "header") {
          xrow.font = { bold: true };
          xrow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE5E7EB" },
          };
        } else if (r.style === "subtotal") {
          xrow.font = { bold: true };
          xrow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFECFDF5" },
          };
        } else if (r.style === "grand") {
          xrow.font = { bold: true };
          xrow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE0E7FF" },
          };
        }
      }

      // 헤더 고정
      ws.views = [{ state: "frozen", ySplit: 1 }];

      const buf = await wb.xlsx.writeBuffer();
      const fileBase = `payment${schoolSlug}${groupSlug}_${dateStr}.xlsx`;
      const asciiFallback = `payment${schoolFilter ? "_" + schoolFilter : ""}${groupSlug}_${dateStr}.xlsx`;
      const dispo = `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileBase)}`;
      return new NextResponse(Buffer.from(buf as ArrayBuffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": dispo,
        },
      });
    }

    // ===== CSV =====
    const csvCell = (c: Cell): string => {
      const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
      switch (c.kind) {
        case "plain":
          return escape(c.v);
        case "forceText":
          // 빈값은 그대로, 값이 있을 때만 ' 접두사로 텍스트 인식 유도
          return escape(c.v ? `'${c.v}` : "");
        case "number":
          return escape(c.v.toString());
        case "formula":
          return escape(`=${c.formula}`);
        case "empty":
          return `""`;
      }
    };

    const BOM = "﻿";
    const lines = rows.map((r) => r.cells.map(csvCell).join(","));
    const csv = BOM + lines.join("\n");

    const fileBase = `payment${schoolSlug}${groupSlug}_${dateStr}.csv`;
    const asciiFallback = `payment${schoolFilter ? "_" + schoolFilter : ""}${groupSlug}_${dateStr}.csv`;
    const dispo = `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileBase)}`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": dispo,
      },
    });
  } catch (err) {
    console.error("Payment export error:", err);
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
  }
}
