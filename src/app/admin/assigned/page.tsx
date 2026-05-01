"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, X, UserPlus, Download, DollarSign, Calendar } from "lucide-react";
import { useCampData } from "@/lib/useCampData";
import { adminFetch, getAdminToken } from "@/lib/admin";

interface Applicant {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  payment_name: string | null;
  resident_id: string | null;
  bank_name: string | null;
  bank_account: string | null;
  payment_amount: number | null;
  payment_date: string | null;
  payment_submitted_at: string | null;
  applicant_schools: { school_id: string }[];
  applicant_subjects: { subject_id: string }[];
  assignments: { school_id: string; subject_id: string; grade: string | null; payment_amount?: number | null; payment_date?: string | null }[];
}

interface SlotTarget {
  schoolId: string;
  subjectId: string;
  grade: string;
}

export default function AssignedPage() {
  const router = useRouter();
  const { schools: SCHOOLS, subjects: SUBJECTS } = useCampData();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [allApplicants, setAllApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalSlot, setModalSlot] = useState<SlotTarget | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const [paymentTarget, setPaymentTarget] = useState<Applicant | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [paymentDates, setPaymentDates] = useState<Record<string, string>>({});
  const [paymentDate, setPaymentDate] = useState("");
  const [viewMode, setViewMode] = useState<"school" | "instructor">("school");
  const [bulkSchoolDate, setBulkSchoolDate] = useState<Record<string, string>>({});
  const [bulkSchoolApplying, setBulkSchoolApplying] = useState<string | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const paymentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!getAdminToken()) {
      router.push("/admin");
      return;
    }
    fetchData();
  }, [router]);

  async function fetchData() {
    try {
      const [acceptedRes, allRes] = await Promise.all([
        adminFetch("/api/applicants?status=accepted"),
        adminFetch("/api/applicants"),
      ]);
      const { data: accepted } = await acceptedRes.json();
      const { data: all } = await allRes.json();
      setApplicants(accepted || []);
      setAllApplicants(all || []);
    } catch {
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  }

  // 모달 외부 클릭 시 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setModalSlot(null);
        setSearch("");
      }
    }
    if (modalSlot) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [modalSlot]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setModalSlot(null);
        setSearch("");
      }
    }
    if (modalSlot) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [modalSlot]);

  // 강사료 모달 열기
  function openPaymentModal(applicant: Applicant) {
    setPaymentTarget(applicant);
    setPaymentDate(applicant.payment_date || "");
    // 배정별 금액/입금일 초기화
    const amounts: Record<string, string> = {};
    const dates: Record<string, string> = {};
    applicant.assignments.forEach((a, i) => {
      const key = `${a.school_id}_${a.subject_id}_${i}`;
      amounts[key] = a.payment_amount?.toString() || "";
      // 배정별 payment_date가 있으면 그것, 없으면 applicant 레벨 fallback
      dates[key] = a.payment_date || applicant.payment_date || "";
    });
    setPaymentAmounts(amounts);
    setPaymentDates(dates);
    // 총액은 배정별 합계로 계산
    const total = applicant.assignments.reduce((sum, a) => sum + (a.payment_amount || 0), 0);
    setPaymentAmount(total > 0 ? total.toString() : (applicant.payment_amount?.toString() || ""));
  }

  // 강사료/입금일 저장
  async function savePayment() {
    if (!paymentTarget) return;
    setSavingPayment(true);
    try {
      // 배정별 금액 + 입금일 저장
      const assignmentPayments = paymentTarget.assignments.map((a, i) => {
        const key = `${a.school_id}_${a.subject_id}_${i}`;
        const amt = paymentAmounts[key] ? parseInt(paymentAmounts[key], 10) : null;
        const date = paymentDates[key] || null;
        return {
          school_id: a.school_id,
          subject_id: a.subject_id,
          grade: a.grade,
          payment_amount: amt,
          payment_date: date,
        };
      });

      // 총액 계산
      const total = assignmentPayments.reduce((sum, a) => sum + (a.payment_amount || 0), 0);

      const body: Record<string, unknown> = {};
      body.payment_amount = total > 0 ? total : null;
      body.payment_date = paymentDate || null;
      body.assignment_payments = assignmentPayments;

      const res = await adminFetch(`/api/applicants/${paymentTarget.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        alert("저장에 실패했습니다");
        return;
      }
      await fetchData();
      setPaymentTarget(null);
    } catch {
      alert("저장 중 오류가 발생했습니다");
    } finally {
      setSavingPayment(false);
    }
  }

  // 학교별 입금일 일괄 적용 — 해당 학교의 모든 배정 payment_date를 동일하게 설정
  async function applyBulkSchoolDate(schoolId: string) {
    const date = bulkSchoolDate[schoolId];
    if (!date) {
      alert("입금일을 선택해주세요");
      return;
    }
    const targets = applicants.filter((a) =>
      a.assignments.some((asn) => asn.school_id === schoolId)
    );
    if (targets.length === 0) {
      alert("이 학교에 배정된 강사가 없습니다");
      return;
    }
    const schoolName =
      SCHOOLS.find((s) => s.id === schoolId)?.shortName || schoolId;
    if (!confirm(`${schoolName} 배정 ${targets.length}명의 입금일을 ${date}로 일괄 설정하시겠습니까?`)) {
      return;
    }

    setBulkSchoolApplying(schoolId);
    let success = 0;
    let failed = 0;
    try {
      for (const a of targets) {
        const assignmentPayments = a.assignments
          .filter((asn) => asn.school_id === schoolId)
          .map((asn) => ({
            school_id: asn.school_id,
            subject_id: asn.subject_id,
            grade: asn.grade,
            payment_amount: asn.payment_amount ?? null,
            payment_date: date,
          }));

        try {
          const res = await adminFetch(`/api/applicants/${a.id}`, {
            method: "PATCH",
            body: JSON.stringify({ assignment_payments: assignmentPayments }),
          });
          if (res.ok) success++;
          else failed++;
        } catch {
          failed++;
        }
      }
      await fetchData();
      if (failed === 0) {
        alert(`${success}명 일괄 적용 완료`);
      } else {
        alert(`완료: ${success}명 / 실패: ${failed}명`);
      }
    } finally {
      setBulkSchoolApplying(null);
    }
  }

  // 선발 강사 강사료 다운로드 (전체 또는 특정 학교, csv 또는 xlsx)
  async function handlePaymentExport(schoolId?: string, format: "csv" | "xlsx" = "csv") {
    const token = getAdminToken();
    const params = new URLSearchParams();
    if (schoolId) params.set("school", schoolId);
    if (format === "xlsx") params.set("format", "xlsx");
    const qs = params.toString();
    const url = `/api/applicants/export-payment${qs ? "?" + qs : ""}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    const schoolSlug = schoolId
      ? `_${SCHOOLS.find((s) => s.id === schoolId)?.shortName || schoolId}`
      : "";
    a.download = `payment${schoolSlug}_${new Date().toISOString().slice(0, 10)}.${format}`;
    a.click();
    URL.revokeObjectURL(objectUrl);
  }

  // 슬롯에 지원자 배정
  async function assignApplicant(applicant: Applicant, slot: SlotTarget) {
    setAssigning(applicant.id);
    try {
      // 기존 assignments에 새 배정 추가
      const existingAssignments = applicant.assignments || [];
      const newAssignments = [
        ...existingAssignments,
        { school_id: slot.schoolId, subject_id: slot.subjectId, grade: slot.grade },
      ];

      // 배정 업데이트 + 상태를 accepted로 변경
      const body: Record<string, unknown> = { assignments: newAssignments };
      if (applicant.status !== "accepted") {
        body.status = "accepted";
      }

      const res = await adminFetch(`/api/applicants/${applicant.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "배정에 실패했습니다");
        return;
      }

      // 데이터 새로고침
      await fetchData();
      setModalSlot(null);
      setSearch("");
    } catch {
      alert("배정 중 오류가 발생했습니다");
    } finally {
      setAssigning(null);
    }
  }

  // 배정 해제
  async function unassignApplicant(applicant: Applicant, slot: SlotTarget) {
    if (!confirm(`${applicant.name} 강사의 ${slot.grade} 배정을 해제하시겠습니까?`)) return;

    try {
      const updatedAssignments = (applicant.assignments || []).filter(
        (a) =>
          !(a.school_id === slot.schoolId && a.subject_id === slot.subjectId && a.grade === slot.grade)
      );

      const res = await adminFetch(`/api/applicants/${applicant.id}`, {
        method: "PATCH",
        body: JSON.stringify({ assignments: updatedAssignments }),
      });

      if (!res.ok) {
        alert("배정 해제에 실패했습니다");
        return;
      }

      await fetchData();
    } catch {
      alert("배정 해제 중 오류가 발생했습니다");
    }
  }

  // 해당 슬롯에 배정 가능한 지원자 필터
  function getCandidates(slot: SlotTarget): Applicant[] {
    return allApplicants.filter((a) => {
      // 이미 이 슬롯에 배정된 사람은 제외
      const alreadyAssigned = a.assignments?.some(
        (asn) =>
          asn.school_id === slot.schoolId &&
          asn.subject_id === slot.subjectId &&
          asn.grade === slot.grade
      );
      if (alreadyAssigned) return false;

      // 해당 과목에 지원한 사람 우선, 나머지도 표시
      // 검색 필터
      if (search) {
        const q = search.toLowerCase();
        if (!a.name.toLowerCase().includes(q) && !a.phone.includes(q)) return false;
      }

      return true;
    });
  }

  // 해당 과목에 지원했는지 여부
  function appliedForSubject(applicant: Applicant, subjectId: string): boolean {
    return applicant.applicant_subjects?.some((s) => s.subject_id === subjectId) ?? false;
  }

  // 해당 학교에 지원했는지 여부
  function appliedForSchool(applicant: Applicant, schoolId: string): boolean {
    return applicant.applicant_schools?.some((s) => s.school_id === schoolId) ?? false;
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  const statusLabel: Record<string, string> = {
    pending: "대기",
    reviewing: "검토중",
    accepted: "선발",
    rejected: "탈락",
  };
  const statusColor: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    reviewing: "bg-blue-100 text-blue-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="text-gray-500 hover:text-gray-900 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="대시보드로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">학교별 배정 강사 명단</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">합격자 {applicants.length}명</span>
            <button
              onClick={() => handlePaymentExport()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <Download className="w-3.5 h-3.5" />
              강사료 CSV
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* 강사료 관리 요약 */}
        {applicants.length > 0 && (() => {
          // 1인 × 학교 = 1행으로 분리 (배정이 없으면 단일 행으로 "-" 표기)
          type PaymentRow = {
            applicant: Applicant;
            assignment: Applicant["assignments"][number] | null;
            rowSpan: number; // 같은 지원자의 첫 행에만 값; 이후 행은 0
          };
          const paymentRows: PaymentRow[] = [];
          for (const a of applicants) {
            if (a.assignments.length === 0) {
              paymentRows.push({ applicant: a, assignment: null, rowSpan: 1 });
            } else {
              a.assignments.forEach((asn, idx) => {
                paymentRows.push({
                  applicant: a,
                  assignment: asn,
                  rowSpan: idx === 0 ? a.assignments.length : 0,
                });
              });
            }
          }

          return (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              강사료 관리
              <span className="ml-1 text-[11px] font-normal text-gray-400">(학교별 분리 표시)</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th scope="col" className="text-left px-3 py-2 font-medium text-gray-600">이름</th>
                    <th scope="col" className="text-left px-3 py-2 font-medium text-gray-600">연락처</th>
                    <th scope="col" className="text-left px-3 py-2 font-medium text-gray-600">학교</th>
                    <th scope="col" className="text-left px-3 py-2 font-medium text-gray-600">과목 / 학년</th>
                    <th scope="col" className="text-left px-3 py-2 font-medium text-gray-600">지급정보</th>
                    <th scope="col" className="text-right px-3 py-2 font-medium text-gray-600">강사료</th>
                    <th scope="col" className="text-right px-3 py-2 font-medium text-gray-600">원천징수(3.3%)</th>
                    <th scope="col" className="text-right px-3 py-2 font-medium text-gray-600">실수령액</th>
                    <th scope="col" className="text-center px-3 py-2 font-medium text-gray-600">입금일</th>
                    <th scope="col" className="text-center px-3 py-2 font-medium text-gray-600">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRows.map((row, rowIdx) => {
                    const a = row.applicant;
                    const asn = row.assignment;
                    const school = asn ? SCHOOLS.find((s) => s.id === asn.school_id) : null;
                    const subject = asn ? SUBJECTS.find((s) => s.id === asn.subject_id) : null;
                    const amount = (asn?.payment_amount ?? 0) || 0;
                    const tax = Math.floor(amount * 0.033);
                    const net = amount - tax;
                    const showGroupCols = row.rowSpan > 0;
                    // 같은 지원자 마지막 행인지 확인 → 다음 행이 다른 지원자면 테두리 강조
                    const nextRow = paymentRows[rowIdx + 1];
                    const isLastOfApplicant = !nextRow || nextRow.applicant.id !== a.id;
                    return (
                      <tr
                        key={`${a.id}-${rowIdx}`}
                        className={`border-gray-100 ${isLastOfApplicant ? "border-b" : "border-b border-dashed border-gray-50"}`}
                      >
                        {showGroupCols ? (
                          <td rowSpan={row.rowSpan} className="px-3 py-2.5 font-medium text-gray-900 align-top">{a.name}</td>
                        ) : null}
                        {showGroupCols ? (
                          <td rowSpan={row.rowSpan} className="px-3 py-2.5 text-gray-500 text-xs align-top">{a.phone}</td>
                        ) : null}
                        <td className="px-3 py-2.5 text-gray-700 text-xs">
                          {school ? school.shortName : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="px-3 py-2.5 text-gray-700 text-xs">
                          {subject ? (
                            <>
                              <span className="mr-1">{subject.icon}</span>
                              {subject.name}
                              {asn?.grade && (
                                <span className="ml-1 text-gray-400">· {asn.grade}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        {showGroupCols ? (
                          <td rowSpan={row.rowSpan} className="px-3 py-2.5 align-top">
                            {a.payment_submitted_at ? (
                              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">제출완료</span>
                            ) : (
                              <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">미제출</span>
                            )}
                          </td>
                        ) : null}
                        <td className="px-3 py-2.5 text-right font-mono text-gray-900">
                          {amount > 0 ? amount.toLocaleString() : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-red-500 text-xs">
                          {amount > 0 ? `-${tax.toLocaleString()}` : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-700">
                          {amount > 0 ? net.toLocaleString() : "-"}
                        </td>
                        {showGroupCols ? (
                          <td rowSpan={row.rowSpan} className="px-3 py-2.5 text-center text-xs align-top">
                            {a.payment_date ? (
                              <span className="text-emerald-600 font-medium">{a.payment_date}</span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        ) : null}
                        {showGroupCols ? (
                          <td rowSpan={row.rowSpan} className="px-3 py-2.5 text-center align-top">
                            <button
                              type="button"
                              onClick={() => openPaymentModal(a)}
                              className="text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium transition-colors"
                            >
                              설정
                            </button>
                          </td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          );
        })()}

        {/* 뷰 모드 토글 */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
          <span className="text-sm font-semibold text-gray-700">배정 현황</span>
          <div className="ml-auto inline-flex rounded-lg bg-gray-100 p-1 text-sm">
            <button
              type="button"
              onClick={() => setViewMode("school")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === "school"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              학교별 보기
            </button>
            <button
              type="button"
              onClick={() => setViewMode("instructor")}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === "instructor"
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              강사별 보기
            </button>
          </div>
        </div>

        {viewMode === "school" && SCHOOLS.map((school) => {
          const schoolApplicants = applicants.filter((a) =>
            a.assignments?.some((asn) => asn.school_id === school.id)
          );

          return (
            <section key={school.id}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-gray-900">
                  {school.name}
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    {schoolApplicants.length}명 배정
                  </span>
                </h2>
                <span className="text-xs text-gray-400">{school.dateLabel}</span>
              </div>
              {/* 학교별 입금일 일괄 적용 */}
              {schoolApplicants.length > 0 && (
                <div className="mb-3 flex items-center gap-2 bg-emerald-50/60 border border-emerald-200 rounded-lg px-3 py-2">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-medium text-emerald-800 shrink-0">
                    이 학교 입금일 일괄 적용
                  </span>
                  <input
                    type="date"
                    aria-label={`${school.shortName} 입금일`}
                    value={bulkSchoolDate[school.id] || ""}
                    onChange={(e) =>
                      setBulkSchoolDate({ ...bulkSchoolDate, [school.id]: e.target.value })
                    }
                    disabled={bulkSchoolApplying === school.id}
                    className="text-xs border border-emerald-200 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => applyBulkSchoolDate(school.id)}
                    disabled={
                      !bulkSchoolDate[school.id] ||
                      bulkSchoolApplying === school.id
                    }
                    className="text-xs px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {bulkSchoolApplying === school.id ? "적용중..." : "전체 적용"}
                  </button>
                  <span className="ml-auto text-[11px] text-emerald-700/70">
                    {schoolApplicants.length}명에 적용
                  </span>
                </div>
              )}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th scope="col" className="text-left px-4 py-3 font-medium text-gray-600 w-44">
                        일정 / 과목
                      </th>
                      <th scope="col" className="text-left px-4 py-3 font-medium text-gray-600 w-16">
                        인원
                      </th>
                      <th scope="col" className="text-left px-4 py-3 font-medium text-gray-600">
                        배정 강사
                      </th>
                      <th scope="col" className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                        연락처
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {school.gradeSchedule.flatMap((gs) =>
                      gs.subjects.map((subId) => {
                        const sub = SUBJECTS.find((s) => s.id === subId);
                        if (!sub) return null;
                        const assigned = applicants.filter((a) =>
                          a.assignments?.some(
                            (asn) =>
                              asn.school_id === school.id &&
                              asn.subject_id === subId &&
                              asn.grade === gs.grade
                          )
                        );
                        const isFull = assigned.length >= gs.capacity;
                        const slot: SlotTarget = {
                          schoolId: school.id,
                          subjectId: subId,
                          grade: gs.grade,
                        };

                        return (
                          <tr
                            key={`${gs.grade}-${subId}`}
                            className="border-b border-gray-100 last:border-0"
                          >
                            <td className="px-4 py-3 align-top">
                              <p className="font-medium text-gray-900">
                                <span className="text-base mr-1">{sub.icon}</span>
                                {sub.name}
                              </p>
                              <p className="text-[11px] text-gray-400">
                                {gs.grade} · {gs.period} · {gs.type}
                              </p>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <span className={`text-xs font-bold ${isFull ? "text-green-600" : "text-amber-600"}`}>
                                {assigned.length}/{gs.capacity}
                              </span>
                            </td>
                            <td className="px-4 py-3 align-top">
                              <div className="flex flex-wrap items-start gap-2">
                                {assigned.map((a) => {
                                  const thisAsn = a.assignments?.find(
                                    (asn) =>
                                      asn.school_id === school.id &&
                                      asn.subject_id === subId &&
                                      asn.grade === gs.grade
                                  );
                                  const amt = thisAsn?.payment_amount;
                                  const pd = thisAsn?.payment_date;
                                  return (
                                    <div key={a.id} className="inline-flex flex-col items-start">
                                      <button
                                        type="button"
                                        onClick={() => unassignApplicant(a, slot)}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium hover:bg-red-100 hover:text-red-700 transition-colors group ${
                                          pd ? "bg-emerald-100 text-emerald-800" : "bg-green-100 text-green-800"
                                        }`}
                                        title={`${a.name} 배정 해제`}
                                      >
                                        {a.name}
                                        <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </button>
                                      {(amt != null && amt > 0) && (
                                        <span className="text-[10px] font-mono mt-0.5 ml-1">
                                          <span className={pd ? "text-emerald-600" : "text-gray-500"}>
                                            {amt.toLocaleString()}원
                                          </span>
                                          {pd && (
                                            <span className="ml-1 text-emerald-600">
                                              · {pd.slice(5)} 지급
                                            </span>
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                                {!isFull && (
                                  <button
                                    type="button"
                                    onClick={() => { setModalSlot(slot); setSearch(""); }}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-gray-300 text-gray-400 text-xs hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors self-center"
                                  >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    {assigned.length === 0 ? "미배정" : "추가"}
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500 align-top hidden md:table-cell">
                              {assigned.map((a) => (
                                <p key={a.id} className="text-xs">{a.phone}</p>
                              ))}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}

        {/* 강사별 보기 */}
        {viewMode === "instructor" && (
          <section className="space-y-3">
            {applicants.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                배정된 강사가 없습니다.
              </div>
            ) : (
              applicants.map((a) => {
                const total = a.assignments.reduce(
                  (sum, asn) => sum + (asn.payment_amount || 0),
                  0
                );
                const tax = Math.floor(total * 0.033);
                const net = total - tax;
                return (
                  <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-bold text-gray-900">{a.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{a.phone}</p>
                        {a.payment_submitted_at ? (
                          <span className="inline-block mt-1 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">지급정보 제출완료</span>
                        ) : (
                          <span className="inline-block mt-1 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">지급정보 미제출</span>
                        )}
                      </div>
                      <div className="text-right">
                        {total > 0 && (
                          <>
                            <p className="text-xs text-gray-500">총 강사료</p>
                            <p className="text-lg font-mono font-bold text-gray-900">{total.toLocaleString()}원</p>
                            <p className="text-[11px] text-emerald-700 font-mono">실지급 {net.toLocaleString()} <span className="text-red-400">(-{tax.toLocaleString()})</span></p>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => openPaymentModal(a)}
                          className="mt-1.5 text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium transition-colors"
                        >
                          강사료 설정
                        </button>
                      </div>
                    </div>
                    <ul className="space-y-1.5">
                      {a.assignments.length === 0 ? (
                        <li className="text-xs text-gray-400">배정 없음</li>
                      ) : (
                        a.assignments.map((asn, i) => {
                          const school = SCHOOLS.find((s) => s.id === asn.school_id);
                          const subject = SUBJECTS.find((s) => s.id === asn.subject_id);
                          return (
                            <li
                              key={i}
                              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                                asn.payment_date ? "bg-emerald-50" : "bg-gray-50"
                              }`}
                            >
                              <span className="font-semibold text-gray-900 w-16 shrink-0">{school?.shortName || asn.school_id}</span>
                              <span className="text-gray-700">{subject?.icon} {subject?.name || asn.subject_id}</span>
                              {asn.grade && <span className="text-xs text-gray-400">{asn.grade}</span>}
                              <div className="ml-auto flex items-center gap-3 text-xs">
                                {asn.payment_amount != null && asn.payment_amount > 0 ? (
                                  <span className="font-mono font-semibold text-gray-900">
                                    {asn.payment_amount.toLocaleString()}원
                                  </span>
                                ) : (
                                  <span className="text-gray-300">금액 미설정</span>
                                )}
                                {asn.payment_date ? (
                                  <span className="text-emerald-700 font-medium">{asn.payment_date} 지급</span>
                                ) : (
                                  <span className="text-amber-600">대기</span>
                                )}
                              </div>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                );
              })
            )}
          </section>
        )}

        {/* 학교별 지급 총액 요약 */}
        {applicants.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              학교별 지급 총액 요약
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th scope="col" className="text-left px-3 py-2 font-medium text-gray-600">학교</th>
                    <th scope="col" className="text-right px-3 py-2 font-medium text-gray-600">배정 강사</th>
                    <th scope="col" className="text-right px-3 py-2 font-medium text-gray-600">총 강사료</th>
                    <th scope="col" className="text-right px-3 py-2 font-medium text-gray-600">원천징수(3.3%)</th>
                    <th scope="col" className="text-right px-3 py-2 font-medium text-gray-600">실지급액</th>
                    <th scope="col" className="text-right px-3 py-2 font-medium text-gray-600">입금 완료</th>
                    <th scope="col" className="text-center px-3 py-2 font-medium text-gray-600">입금일 일괄</th>
                    <th scope="col" className="text-center px-3 py-2 font-medium text-gray-600">다운로드</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const schoolRows = SCHOOLS.map((school) => {
                      const assignmentsForSchool = applicants.flatMap((a) =>
                        a.assignments.filter((asn) => asn.school_id === school.id)
                      );
                      const instructorIds = new Set(
                        applicants
                          .filter((a) => a.assignments.some((asn) => asn.school_id === school.id))
                          .map((a) => a.id)
                      );
                      const total = assignmentsForSchool.reduce((s, asn) => s + (asn.payment_amount || 0), 0);
                      const paidAmount = assignmentsForSchool
                        .filter((asn) => asn.payment_date)
                        .reduce((s, asn) => s + (asn.payment_amount || 0), 0);
                      const tax = Math.floor(total * 0.033);
                      const net = total - tax;
                      return { school, instructorCount: instructorIds.size, total, tax, net, paidAmount };
                    }).filter((r) => r.instructorCount > 0 || r.total > 0);

                    const grandTotal = schoolRows.reduce((s, r) => s + r.total, 0);
                    const grandTax = Math.floor(grandTotal * 0.033);
                    const grandNet = grandTotal - grandTax;
                    const grandPaid = schoolRows.reduce((s, r) => s + r.paidAmount, 0);
                    const grandInstructors = new Set(applicants.filter((a) => a.assignments.length > 0).map((a) => a.id)).size;

                    if (schoolRows.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="px-3 py-4 text-center text-sm text-gray-400">아직 배정 데이터가 없습니다.</td>
                        </tr>
                      );
                    }

                    return (
                      <>
                        {schoolRows.map((r) => (
                          <tr key={r.school.id} className="border-b border-gray-100">
                            <td className="px-3 py-2.5 font-medium text-gray-900">{r.school.shortName}</td>
                            <td className="px-3 py-2.5 text-right text-gray-700">{r.instructorCount}명</td>
                            <td className="px-3 py-2.5 text-right font-mono text-gray-900">
                              {r.total > 0 ? r.total.toLocaleString() : "-"}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-red-500 text-xs">
                              {r.total > 0 ? `-${r.tax.toLocaleString()}` : "-"}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-700">
                              {r.total > 0 ? r.net.toLocaleString() : "-"}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-xs">
                              {r.paidAmount > 0 ? (
                                <span className="text-emerald-700">{r.paidAmount.toLocaleString()}원</span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                <input
                                  type="date"
                                  aria-label={`${r.school.shortName} 입금일 일괄 적용 날짜`}
                                  value={bulkSchoolDate[r.school.id] || ""}
                                  onChange={(e) =>
                                    setBulkSchoolDate({ ...bulkSchoolDate, [r.school.id]: e.target.value })
                                  }
                                  disabled={bulkSchoolApplying === r.school.id}
                                  className="text-xs border border-emerald-200 rounded px-1.5 py-1 bg-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 disabled:opacity-50"
                                />
                                <button
                                  type="button"
                                  onClick={() => applyBulkSchoolDate(r.school.id)}
                                  disabled={
                                    !bulkSchoolDate[r.school.id] ||
                                    bulkSchoolApplying === r.school.id
                                  }
                                  className="text-[11px] px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                  title={`${r.school.shortName} 모든 배정에 입금일 일괄 적용`}
                                >
                                  {bulkSchoolApplying === r.school.id ? "..." : "적용"}
                                </button>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handlePaymentExport(r.school.id, "csv")}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                  aria-label={`${r.school.shortName} 강사료 CSV 다운로드`}
                                  title={`${r.school.shortName} 강사료 CSV 다운로드`}
                                >
                                  <Download className="w-3 h-3" />
                                  CSV
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePaymentExport(r.school.id, "xlsx")}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-800 hover:bg-green-200 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                                  aria-label={`${r.school.shortName} 강사료 엑셀 다운로드`}
                                  title={`${r.school.shortName} 강사료 엑셀(XLSX) 다운로드`}
                                >
                                  <Download className="w-3 h-3" />
                                  XLSX
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-indigo-50 font-bold">
                          <td className="px-3 py-3 text-indigo-900">전체 합계</td>
                          <td className="px-3 py-3 text-right text-indigo-900">{grandInstructors}명</td>
                          <td className="px-3 py-3 text-right font-mono text-indigo-900">
                            {grandTotal > 0 ? grandTotal.toLocaleString() : "-"}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-red-600">
                            {grandTotal > 0 ? `-${grandTax.toLocaleString()}` : "-"}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-emerald-700">
                            {grandTotal > 0 ? grandNet.toLocaleString() : "-"}
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-emerald-700">
                            {grandPaid > 0 ? grandPaid.toLocaleString() : "-"}
                          </td>
                          <td className="px-3 py-3 text-center text-[11px] text-indigo-400">—</td>
                          <td className="px-3 py-3 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handlePaymentExport(undefined, "csv")}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                aria-label="전체 강사료 CSV 다운로드"
                                title="전체 강사료 CSV 다운로드"
                              >
                                <Download className="w-3 h-3" />
                                CSV
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePaymentExport(undefined, "xlsx")}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-700 hover:bg-green-800 text-white text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                                aria-label="전체 강사료 엑셀 다운로드"
                                title="전체 강사료 엑셀(XLSX) 다운로드"
                              >
                                <Download className="w-3 h-3" />
                                XLSX
                              </button>
                            </div>
                          </td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">* 원천징수 3.3% 공제 후 실지급액 · 입금 완료는 입금일이 설정된 배정의 합계</p>
          </section>
        )}

        <div className="flex gap-3">
          <Link
            href="/admin/applicants"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            지원자 관리
          </Link>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            대시보드
          </Link>
        </div>
      </main>

      {/* 지원자 선택 모달 */}
      {modalSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-label="강사 배정">
          <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            {/* 모달 헤더 */}
            <div className="px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-gray-900">강사 배정</h3>
                <button
                  type="button"
                  onClick={() => { setModalSlot(null); setSearch(""); }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* 슬롯 정보 */}
              <div className="flex flex-wrap gap-2 text-xs mb-3">
                <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-medium">
                  {SCHOOLS.find((s) => s.id === modalSlot.schoolId)?.shortName}
                </span>
                <span className="bg-violet-50 text-violet-700 px-2 py-1 rounded-lg font-medium">
                  {SUBJECTS.find((s) => s.id === modalSlot.subjectId)?.icon}{" "}
                  {SUBJECTS.find((s) => s.id === modalSlot.subjectId)?.name}
                </span>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">
                  {modalSlot.grade}
                </span>
              </div>
              {/* 검색 */}
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이름 또는 연락처로 검색..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-300"
                autoFocus
              />
            </div>

            {/* 지원자 목록 */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {(() => {
                const candidates = getCandidates(modalSlot);
                // 해당 학교+과목 지원자를 상위에 정렬
                const sorted = [...candidates].sort((a, b) => {
                  const aMatch =
                    (appliedForSchool(a, modalSlot.schoolId) ? 2 : 0) +
                    (appliedForSubject(a, modalSlot.subjectId) ? 4 : 0) +
                    (a.status === "accepted" ? 1 : 0);
                  const bMatch =
                    (appliedForSchool(b, modalSlot.schoolId) ? 2 : 0) +
                    (appliedForSubject(b, modalSlot.subjectId) ? 4 : 0) +
                    (b.status === "accepted" ? 1 : 0);
                  return bMatch - aMatch;
                });

                if (sorted.length === 0) {
                  return (
                    <p className="text-center text-gray-400 py-8 text-sm">
                      {search ? "검색 결과가 없습니다" : "배정 가능한 지원자가 없습니다"}
                    </p>
                  );
                }

                // 해당 과목 지원자 / 기타 지원자 분리
                const applied = sorted.filter((a) => appliedForSubject(a, modalSlot.subjectId));
                const others = sorted.filter((a) => !appliedForSubject(a, modalSlot.subjectId));

                return (
                  <>
                    {applied.length > 0 && (
                      <>
                        <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-2">
                          해당 과목 지원자 ({applied.length}명)
                        </p>
                        <ul className="space-y-1.5 mb-4">
                          {applied.map((a) => (
                            <CandidateRow
                              key={a.id}
                              applicant={a}
                              slot={modalSlot}
                              assigning={assigning}
                              onAssign={assignApplicant}
                              statusLabel={statusLabel}
                              statusColor={statusColor}
                              highlight
                              subjectsCatalog={SUBJECTS}
                            />
                          ))}
                        </ul>
                      </>
                    )}
                    {others.length > 0 && (
                      <>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                          기타 지원자 ({others.length}명)
                        </p>
                        <ul className="space-y-1.5">
                          {others.map((a) => (
                            <CandidateRow
                              key={a.id}
                              applicant={a}
                              slot={modalSlot}
                              assigning={assigning}
                              onAssign={assignApplicant}
                              statusLabel={statusLabel}
                              statusColor={statusColor}
                              highlight={false}
                              subjectsCatalog={SUBJECTS}
                            />
                          ))}
                        </ul>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 강사료 설정 모달 */}
      {paymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-label="강사료 설정">
          <div ref={paymentRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                강사료 설정
              </h3>
              <button
                type="button"
                onClick={() => setPaymentTarget(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* 강사 정보 */}
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-bold text-gray-900">{paymentTarget.name}</p>
                <p className="text-xs text-gray-500">{paymentTarget.phone}</p>
                {paymentTarget.payment_submitted_at ? (
                  <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                    <p>지급성명: {paymentTarget.payment_name || "-"}</p>
                    <p>은행: {paymentTarget.bank_name || "-"} {paymentTarget.bank_account || ""}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-amber-600">지급정보 미제출</p>
                )}
              </div>

              {/* 배정별 강사료 + 입금일 입력 */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">배정별 강사료 & 입금일</p>
                <div className="space-y-2">
                  {paymentTarget.assignments.map((a, i) => {
                    const school = SCHOOLS.find((s) => s.id === a.school_id);
                    const subject = SUBJECTS.find((s) => s.id === a.subject_id);
                    const key = `${a.school_id}_${a.subject_id}_${i}`;
                    return (
                      <div key={key} className="border border-gray-100 rounded-lg p-2.5 bg-gray-50/50">
                        <div className="text-xs text-gray-700 mb-2">
                          <span className="font-semibold">{school?.shortName || a.school_id}</span>
                          <span className="text-gray-400"> · </span>
                          <span>{subject?.name || a.subject_id}</span>
                          {a.grade && <span className="text-gray-400"> · {a.grade}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={paymentAmounts[key] || ""}
                            onChange={(e) => {
                              const newAmounts = { ...paymentAmounts, [key]: e.target.value };
                              setPaymentAmounts(newAmounts);
                              const total = Object.values(newAmounts).reduce(
                                (sum, v) => sum + (v ? parseInt(v, 10) || 0 : 0), 0
                              );
                              setPaymentAmount(total > 0 ? total.toString() : "");
                            }}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                            placeholder="금액 (원)"
                          />
                          <input
                            type="date"
                            value={paymentDates[key] || ""}
                            onChange={(e) => {
                              setPaymentDates({ ...paymentDates, [key]: e.target.value });
                            }}
                            className="border border-gray-200 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                            title="입금일"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 총액 + 세금 계산 */}
              {(() => {
                const total = Object.values(paymentAmounts).reduce(
                  (sum, v) => sum + (v ? parseInt(v, 10) || 0 : 0), 0
                );
                if (total <= 0) return null;
                const incomeTax = Math.floor(total * 0.03);
                const localTax = Math.floor(total * 0.003);
                const totalTax = incomeTax + localTax;
                const net = total - totalTax;
                return (
                  <div className="bg-emerald-50 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-800">강사료 합계</span>
                      <span className="font-mono font-bold text-gray-900">{total.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">사업소득세 (3%)</span>
                      <span className="font-mono text-red-500">-{incomeTax.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">지방소득세 (0.3%)</span>
                      <span className="font-mono text-red-500">-{localTax.toLocaleString()}원</span>
                    </div>
                    <div className="border-t border-emerald-200 pt-1 flex justify-between">
                      <span className="text-gray-600">원천징수 합계 (3.3%)</span>
                      <span className="font-mono text-red-600 font-semibold">-{totalTax.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-emerald-800">실수령액</span>
                      <span className="font-mono font-bold text-emerald-700">{net.toLocaleString()}원</span>
                    </div>
                  </div>
                );
              })()}

              {/* 입금일자 일괄 적용 */}
              <div className="border-t pt-3">
                <label htmlFor="pay-date" className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  입금일 일괄 적용 (모든 배정에 같은 날짜로 설정)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="pay-date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!paymentDate || !paymentTarget) return;
                      const next: Record<string, string> = {};
                      paymentTarget.assignments.forEach((a, i) => {
                        const key = `${a.school_id}_${a.subject_id}_${i}`;
                        next[key] = paymentDate;
                      });
                      setPaymentDates(next);
                    }}
                    disabled={!paymentDate}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-xs font-medium rounded-lg text-gray-700"
                  >
                    일괄 적용
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">배정별로 다른 날짜가 필요하면 위 배정 카드에서 개별 설정</p>
              </div>

              {/* 저장 버튼 */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentTarget(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={savePayment}
                  disabled={savingPayment}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {savingPayment ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "저장"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CandidateRow({
  applicant,
  slot,
  assigning,
  onAssign,
  statusLabel,
  statusColor,
  highlight,
  subjectsCatalog,
}: {
  applicant: Applicant;
  slot: SlotTarget;
  assigning: string | null;
  onAssign: (a: Applicant, s: SlotTarget) => void;
  statusLabel: Record<string, string>;
  statusColor: Record<string, string>;
  highlight: boolean;
  subjectsCatalog: { id: string; name: string; icon: string }[];
}) {
  const isAssigning = assigning === applicant.id;
  const subjects = applicant.applicant_subjects
    ?.map((s) => subjectsCatalog.find((sub) => sub.id === s.subject_id))
    .filter(Boolean);

  return (
    <li
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        highlight
          ? "border-indigo-200 bg-indigo-50/30"
          : "border-gray-100 bg-white"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-900">{applicant.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColor[applicant.status] || "bg-gray-100 text-gray-600"}`}>
            {statusLabel[applicant.status] || applicant.status}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{applicant.phone}</p>
        {subjects && subjects.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {subjects.map((sub) =>
              sub ? (
                <span
                  key={sub.id}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    sub.id === slot.subjectId
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {sub.icon} {sub.name}
                </span>
              ) : null
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        disabled={isAssigning}
        onClick={() => onAssign(applicant, slot)}
        className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        {isAssigning ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Plus className="w-3.5 h-3.5" />
        )}
        배정
      </button>
    </li>
  );
}
