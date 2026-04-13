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
} from "lucide-react";
import { SCHOOLS, SUBJECTS } from "@/lib/constants";
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
  assignments: { school_id: string; subject_id: string; grade: string | null }[];
  paymentSubmitted: boolean;
  paymentName?: string;
  paymentAddress?: string;
  bankName?: string;
  bankAccount?: string;
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
            {result.status === "accepted" && result.assignments.length > 0 && (
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
                        className="flex items-center gap-3 bg-green-50 rounded-lg px-4 py-3"
                      >
                        <span className="text-lg">{subject?.icon}</span>
                        <div>
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
                            {school && (() => {
                              const gs = school.gradeSchedule.find(
                                (g) => g.grade === a.grade && (g.subjects as readonly string[]).includes(a.subject_id)
                              );
                              return gs ? (
                                <span className="text-gray-400"> &middot; {gs.period}</span>
                              ) : null;
                            })()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 강사료 지급 정보 입력 (합격자만) */}
            {result.status === "accepted" && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-sm font-bold text-gray-700 mb-1">
                  사업소득 강사료 지급 정보
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  강사료 지급을 위해 아래 정보를 입력해주세요. 입력된 정보는 강사료 지급 목적으로만 사용됩니다.
                </p>

                {submitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-green-700">
                      강사료 지급 정보가 제출되었습니다
                    </p>
                    <div className="mt-3 text-xs text-green-600 space-y-1">
                      <p>성함: {paymentName}</p>
                      <p>주소: {paymentAddress}</p>
                      <p>은행: {bankName} {bankAccount}</p>
                    </div>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="mt-3 text-xs text-green-600 underline hover:text-green-800 focus:outline-none"
                    >
                      수정하기
                    </button>
                  </div>
                ) : (
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
                      ) : (
                        "제출하기"
                      )}
                    </button>
                  </form>
                )}
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
