"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Banknote,
  Info,
} from "lucide-react";
import { useCampData } from "@/lib/useCampData";
import DuonFooter from "@/components/DuonFooter";

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function formatResidentId(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 6) return digits;
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

interface ResultData {
  id: number;
  name: string;
  status: string;
  assignments: {
    school_id: string;
    subject_id: string;
    grade: string | null;
    paymentAmount?: number | null;
    paymentDate?: string | null;
  }[];
  paymentSubmitted: boolean;
  paymentName?: string;
  paymentAddress?: string;
  bankName?: string;
  bankAccount?: string;
  paymentAmount?: number | null;
  paymentDate?: string | null;
}

const STATUS_MAP: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  accepted: {
    label: "합격",
    color: "text-green-600 bg-green-50 border-green-200",
    icon: CheckCircle,
  },
  rejected: {
    label: "불합격",
    color: "text-red-600 bg-red-50 border-red-200",
    icon: XCircle,
  },
  pending: {
    label: "접수완료 (심사 대기중)",
    color: "text-blue-600 bg-blue-50 border-blue-200",
    icon: Clock,
  },
  reviewing: {
    label: "검토중",
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
    icon: Clock,
  },
};

export default function ResultPage() {
  const { schools: SCHOOLS, subjects: SUBJECTS } = useCampData();
  const [lookupName, setLookupName] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);

  // 강사료 지급 정보
  const [paymentName, setPaymentName] = useState("");
  const [residentId, setResidentId] = useState("");
  const [paymentAddress, setPaymentAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!lookupName.trim() || !lookupPhone.trim()) {
      setError("이름과 연락처를 입력해주세요");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: lookupName.trim(), phone: lookupPhone }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "조회에 실패했습니다");
        return;
      }

      setResult(json.data);
      if (json.data.paymentSubmitted) {
        setSubmitted(true);
        setPaymentName(json.data.paymentName || "");
        setPaymentAddress(json.data.paymentAddress || "");
        setBankName(json.data.bankName || "");
        setBankAccount(json.data.bankAccount || "");
      }
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentName.trim() || !residentId.trim() || !paymentAddress.trim() || !bankName.trim() || !bankAccount.trim()) {
      setError("모든 항목을 입력해주세요");
      return;
    }

    const rawDigits = residentId.replace(/-/g, "");
    if (rawDigits.length !== 13) {
      setError("주민등록번호 13자리를 정확히 입력해주세요");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/result", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: result!.id,
          name: lookupName.trim(),
          phone: lookupPhone,
          paymentName: paymentName.trim(),
          residentId: residentId.replace(/-/g, ""),
          paymentAddress: paymentAddress.trim(),
          bankName: bankName.trim(),
          bankAccount: bankAccount.trim(),
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "저장에 실패했습니다");
        return;
      }

      setSubmitted(true);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  const statusInfo = result ? STATUS_MAP[result.status] || STATUS_MAP.pending : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <nav className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-900 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="홈으로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">합격 조회</h1>
        </nav>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {/* 조회 폼 */}
        {!result && (
          <>
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3" role="note">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm leading-relaxed text-amber-900">
              <p className="font-semibold mb-1">합격자 안내</p>
              <p>
                합격하신 분께는 <strong>강사료 지급을 위한 개인정보</strong>(예금주·은행·계좌번호,
                주민등록번호 등)를 추가로 요청드립니다. 입력하신 정보는 강사료 지급 및 원천징수 신고
                목적으로만 사용되며, 관계 법령에 따라 안전하게 관리됩니다.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Search className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">지원 결과 조회</h2>
              <p className="text-sm text-gray-500 mt-1">
                지원 시 입력한 이름과 연락처로 조회합니다
              </p>
            </div>

            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label
                  htmlFor="lookup-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  이름
                </label>
                <input
                  id="lookup-name"
                  type="text"
                  value={lookupName}
                  onChange={(e) => setLookupName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label
                  htmlFor="lookup-phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  연락처
                </label>
                <input
                  id="lookup-phone"
                  type="tel"
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(formatPhone(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="010-1234-5678"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "조회하기"
                )}
              </button>
            </form>
          </div>
          </>
        )}

        {/* 결과 표시 */}
        {result && statusInfo && (
          <div className="space-y-6">
            {/* 합격/불합격 상태 카드 */}
            <div
              className={`rounded-2xl border p-6 text-center ${statusInfo.color}`}
            >
              <statusInfo.icon className="w-12 h-12 mx-auto mb-3" />
              <p className="text-2xl font-bold">{statusInfo.label}</p>
              <p className="text-sm mt-1 opacity-80">
                {result.name}님의 지원 결과입니다
              </p>
            </div>

            {/* 배정 정보 (합격자만) */}
            {result.status === "accepted" && result.assignments.length > 0 && (() => {
              const assignmentTotal = result.assignments.reduce((sum, a) => sum + (a.paymentAmount || 0), 0);
              return (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3">
                  배정 학교 / 과목
                </h3>
                <div className="space-y-2">
                  {result.assignments.map((a, i) => {
                    const school = SCHOOLS.find((s) => s.id === a.school_id);
                    const subject = SUBJECTS.find((s) => s.id === a.subject_id);
                    return (
                      <div
                        key={i}
                        className="bg-green-50 rounded-lg px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{subject?.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-gray-900">
                              {school?.name || a.school_id}
                            </p>
                            <p className="text-xs text-gray-600">
                              {subject?.name || a.subject_id}
                              {a.grade && (
                                <span className="text-gray-400">
                                  {" "}&middot; {a.grade}
                                </span>
                              )}
                            </p>
                          </div>
                          {a.paymentAmount != null && a.paymentAmount > 0 && (
                            <span className="text-sm font-mono font-semibold text-emerald-700">
                              {a.paymentAmount.toLocaleString()}원
                            </span>
                          )}
                        </div>
                        {school && (() => {
                          const gs = school.gradeSchedule.find(
                            (g) => g.grade === a.grade && (g.subjects as readonly string[]).includes(a.subject_id)
                          );
                          return (
                            <div className="mt-2 ml-8 text-xs text-gray-500 space-y-0.5">
                              {gs && <p>📅 강의일: {gs.period}</p>}
                              <p>🕐 강의시간: {school.time}</p>
                              <p>📍 장소: {school.location}</p>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>

                {/* 배정별 금액 총액 */}
                {assignmentTotal > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">강사료 합계</span>
                      <span className="text-lg font-mono font-bold text-emerald-700">
                        {assignmentTotal.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                )}
              </div>
              );
            })()}

            {/* 학교별 강사료 지급 상태 (합격자 + 지급 금액 설정된 배정) */}
            {result.status === "accepted" && result.assignments.some((a) => (a.paymentAmount ?? 0) > 0) && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  학교별 강사료 지급 상태
                </h3>
                <div className="space-y-2">
                  {result.assignments
                    .filter((a) => (a.paymentAmount ?? 0) > 0)
                    .map((a, i) => {
                      const school = SCHOOLS.find((s) => s.id === a.school_id);
                      const schoolName = school?.name || a.school_id;
                      const amt = a.paymentAmount || 0;
                      const incomeTax = Math.floor(amt * 0.03);
                      const localTax = Math.floor(amt * 0.003);
                      const net = amt - (incomeTax + localTax);
                      const paid = !!a.paymentDate;
                      const dateStr = a.paymentDate
                        ? (() => {
                            const d = new Date(a.paymentDate);
                            return `${d.getMonth() + 1}월 ${d.getDate()}일`;
                          })()
                        : null;
                      return (
                        <div
                          key={`${a.school_id}_${a.subject_id}_${i}`}
                          className={`rounded-xl p-4 border ${paid ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}
                        >
                          <div className="flex items-start gap-3">
                            {paid ? (
                              <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <Clock className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              {paid ? (
                                <p className="text-sm font-bold text-emerald-800 leading-relaxed">
                                  {schoolName}는 <span className="underline">{dateStr}</span> 강사료 입금이 완료되었습니다.
                                </p>
                              ) : (
                                <p className="text-sm font-bold text-amber-800">
                                  {schoolName} 강사료 입금 대기중
                                </p>
                              )}
                              <div className="mt-2 text-xs grid grid-cols-3 gap-1 font-mono">
                                <div>
                                  <span className="text-gray-500">강사료 </span>
                                  <span className="text-gray-800">{amt.toLocaleString()}원</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">원천징수 </span>
                                  <span className="text-red-500">-{(incomeTax + localTax).toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">실수령 </span>
                                  <span className={paid ? "text-emerald-700 font-bold" : "text-gray-800"}>{net.toLocaleString()}원</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 강사료 지급 정보 입력 (합격자만) — 언제든 수정 가능 */}
            {result.status === "accepted" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-1 gap-3">
                  <h3 className="text-sm font-bold text-gray-700">
                    사업소득 강사료 지급 정보
                  </h3>
                  {submitted && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                      제출완료
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  {submitted
                    ? "이미 제출하신 정보입니다. 필요하면 아래에서 언제든 수정할 수 있습니다."
                    : "강사료 지급을 위해 아래 정보를 입력해주세요. 입력된 정보는 강사료 지급 목적으로만 사용됩니다."}
                </p>
                {justSaved && (
                  <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    저장되었습니다
                  </div>
                )}

                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="payment-name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        성함 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="payment-name"
                        type="text"
                        value={paymentName}
                        onChange={(e) => setPaymentName(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="실명 입력"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="resident-id"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        주민등록번호 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="resident-id"
                        type="password"
                        inputMode="numeric"
                        value={residentId}
                        onChange={(e) =>
                          setResidentId(formatResidentId(e.target.value))
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="000000-0000000"
                        autoComplete="off"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">
                        사업소득 원천징수를 위해 필요합니다. 암호화되어 안전하게 보관됩니다.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="payment-address"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        주소 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="payment-address"
                        type="text"
                        value={paymentAddress}
                        onChange={(e) => setPaymentAddress(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="주소 입력"
                      />
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                      <div className="col-span-2">
                        <label
                          htmlFor="bank-name"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          은행명 <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="bank-name"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="">선택</option>
                          {[
                            "KB국민", "신한", "하나", "우리", "NH농협",
                            "IBK기업", "카카오뱅크", "토스뱅크", "케이뱅크",
                            "SC제일", "씨티", "대구", "부산", "경남",
                            "광주", "전북", "제주", "수협", "신협",
                            "우체국", "새마을금고",
                          ].map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <label
                          htmlFor="bank-account"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          계좌번호 <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="bank-account"
                          type="text"
                          inputMode="numeric"
                          value={bankAccount}
                          onChange={(e) =>
                            setBankAccount(
                              e.target.value.replace(/[^0-9-]/g, "")
                            )
                          }
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                          placeholder="계좌번호 입력 (- 없이)"
                        />
                      </div>
                    </div>

                    {error && (
                      <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : submitted ? (
                        "계좌 정보 수정 저장"
                      ) : (
                        "제출하기"
                      )}
                    </button>
                  </form>
              </div>
            )}

            {/* 다시 조회 */}
            <button
              onClick={() => {
                setResult(null);
                setError("");
                setSubmitted(false);
                setPaymentName("");
                setResidentId("");
                setPaymentAddress("");
                setBankName("");
                setBankAccount("");
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              다시 조회
            </button>
          </div>
        )}
      </main>

      <DuonFooter />
    </div>
  );
}
