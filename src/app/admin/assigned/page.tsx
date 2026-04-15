"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, X, UserPlus, Download, DollarSign, Calendar } from "lucide-react";
import { SCHOOLS, SUBJECTS } from "@/lib/constants";
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
  assignments: { school_id: string; subject_id: string; grade: string | null; payment_amount?: number | null }[];
}

interface SlotTarget {
  schoolId: string;
  subjectId: string;
  grade: string;
}

export default function AssignedPage() {
  const router = useRouter();
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
  const [paymentDate, setPaymentDate] = useState("");
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
    // 배정별 금액 초기화
    const amounts: Record<string, string> = {};
    applicant.assignments.forEach((a, i) => {
      const key = `${a.school_id}_${a.subject_id}_${i}`;
      amounts[key] = a.payment_amount?.toString() || "";
    });
    setPaymentAmounts(amounts);
    // 총액은 배정별 합계로 계산
    const total = applicant.assignments.reduce((sum, a) => sum + (a.payment_amount || 0), 0);
    setPaymentAmount(total > 0 ? total.toString() : (applicant.payment_amount?.toString() || ""));
  }

  // 강사료/입금일 저장
  async function savePayment() {
    if (!paymentTarget) return;
    setSavingPayment(true);
    try {
      // 배정별 금액 저장
      const assignmentPayments = paymentTarget.assignments.map((a, i) => {
        const key = `${a.school_id}_${a.subject_id}_${i}`;
        const amt = paymentAmounts[key] ? parseInt(paymentAmounts[key], 10) : null;
        return { school_id: a.school_id, subject_id: a.subject_id, grade: a.grade, payment_amount: amt };
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

  // 선발 강사 CSV 다운로드
  async function handlePaymentExport() {
    const token = getAdminToken();
    const res = await fetch("/api/applicants/export-payment", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
              onClick={handlePaymentExport}
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
        {applicants.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              강사료 관리
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th scope="col" className="text-left px-3 py-2 font-medium text-gray-600">이름</th>
                    <th scope="col" className="text-left px-3 py-2 font-medium text-gray-600">연락처</th>
                    <th scope="col" className="text-left px-3 py-2 font-medium text-gray-600">지급정보</th>
                    <th scope="col" className="text-right px-3 py-2 font-medium text-gray-600">강사료</th>
                    <th scope="col" className="text-right px-3 py-2 font-medium text-gray-600">원천징수(3.3%)</th>
                    <th scope="col" className="text-right px-3 py-2 font-medium text-gray-600">실수령액</th>
                    <th scope="col" className="text-center px-3 py-2 font-medium text-gray-600">입금일</th>
                    <th scope="col" className="text-center px-3 py-2 font-medium text-gray-600">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((a) => {
                    const amount = a.payment_amount || 0;
                    const tax = Math.floor(amount * 0.033);
                    const net = amount - tax;
                    return (
                      <tr key={a.id} className="border-b border-gray-100 last:border-0">
                        <td className="px-3 py-2.5 font-medium text-gray-900">{a.name}</td>
                        <td className="px-3 py-2.5 text-gray-500 text-xs">{a.phone}</td>
                        <td className="px-3 py-2.5">
                          {a.payment_submitted_at ? (
                            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">제출완료</span>
                          ) : (
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">미제출</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-gray-900">
                          {amount > 0 ? amount.toLocaleString() : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-red-500 text-xs">
                          {amount > 0 ? `-${tax.toLocaleString()}` : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-700">
                          {amount > 0 ? net.toLocaleString() : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs">
                          {a.payment_date ? (
                            <span className="text-emerald-600 font-medium">{a.payment_date}</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => openPaymentModal(a)}
                            className="text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium transition-colors"
                          >
                            설정
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {SCHOOLS.map((school) => {
          const schoolApplicants = applicants.filter((a) =>
            a.assignments?.some((asn) => asn.school_id === school.id)
          );

          return (
            <section key={school.id}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {school.name}
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    {schoolApplicants.length}명 배정
                  </span>
                </h2>
                <span className="text-xs text-gray-400">{school.dateLabel}</span>
              </div>
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
                              <div className="flex flex-wrap items-center gap-1">
                                {assigned.map((a) => (
                                  <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => unassignApplicant(a, slot)}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-medium hover:bg-red-100 hover:text-red-700 transition-colors group"
                                    title={`${a.name} 배정 해제`}
                                  >
                                    {a.name}
                                    <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </button>
                                ))}
                                {!isFull && (
                                  <button
                                    type="button"
                                    onClick={() => { setModalSlot(slot); setSearch(""); }}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-dashed border-gray-300 text-gray-400 text-xs hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
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

              {/* 배정별 강사료 입력 */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">배정별 강사료 (원)</p>
                <div className="space-y-2">
                  {paymentTarget.assignments.map((a, i) => {
                    const school = SCHOOLS.find((s) => s.id === a.school_id);
                    const subject = SUBJECTS.find((s) => s.id === a.subject_id);
                    const key = `${a.school_id}_${a.subject_id}_${i}`;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <div className="flex-1 text-xs text-gray-700">
                          <span className="font-semibold">{school?.shortName || a.school_id}</span>
                          <span className="text-gray-400"> · </span>
                          <span>{subject?.name || a.subject_id}</span>
                        </div>
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
                          className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="금액"
                        />
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

              {/* 입금일자 */}
              <div>
                <label htmlFor="pay-date" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  입금일자
                </label>
                <input
                  id="pay-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
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
}: {
  applicant: Applicant;
  slot: SlotTarget;
  assigning: string | null;
  onAssign: (a: Applicant, s: SlotTarget) => void;
  statusLabel: Record<string, string>;
  statusColor: Record<string, string>;
  highlight: boolean;
}) {
  const isAssigning = assigning === applicant.id;
  const subjects = applicant.applicant_subjects
    ?.map((s) => SUBJECTS.find((sub) => sub.id === s.subject_id))
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
