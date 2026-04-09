"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Loader2, CheckCircle, Clock, XCircle, FileText } from "lucide-react";
import { SCHOOLS, SUBJECTS, STATUS_OPTIONS } from "@/lib/constants";

interface StatusResult {
  name: string;
  status: string;
  created_at: string;
  schools: string[];
  subjects: string[];
}

const STATUS_DISPLAY: Record<string, { icon: React.ReactNode; label: string; color: string; description: string }> = {
  pending: {
    icon: <FileText className="w-8 h-8" />,
    label: "접수완료",
    color: "text-blue-600 bg-blue-50 border-blue-200",
    description: "지원서가 정상적으로 접수되었습니다. 검토까지 잠시 기다려주세요.",
  },
  reviewing: {
    icon: <Clock className="w-8 h-8" />,
    label: "검토중",
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
    description: "지원서를 검토하고 있습니다. 결과는 개별 안내드리겠습니다.",
  },
  accepted: {
    icon: <CheckCircle className="w-8 h-8" />,
    label: "합격",
    color: "text-green-600 bg-green-50 border-green-200",
    description: "축하합니다! 최종 합격되었습니다. 상세 안내는 이메일/문자로 발송됩니다.",
  },
  rejected: {
    icon: <XCircle className="w-8 h-8" />,
    label: "불합격",
    color: "text-red-600 bg-red-50 border-red-200",
    description: "아쉽지만 이번에는 선발되지 못했습니다. 다음 기회에 다시 지원해주세요.",
  },
};

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function StatusPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [results, setResults] = useState<StatusResult[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("이름과 연락처를 모두 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const res = await fetch("/api/applicants/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "조회에 실패했습니다.");
        return;
      }

      setResults(data.data);
    } catch {
      setError("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-white border-b border-gray-200">
        <nav className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-900 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="메인으로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">지원 결과 조회</h1>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            합격 여부를 확인하세요
          </h2>
          <p className="text-gray-500">
            지원 시 입력한 이름과 연락처를 입력하면 진행 상태를 확인할 수 있습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <label htmlFor="status-name" className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <input
                id="status-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="status-phone" className="block text-sm font-medium text-gray-700 mb-1">
                연락처
              </label>
              <input
                id="status-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="010-0000-0000"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-3 bg-red-50 px-3 py-2 rounded-lg" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            {loading ? "조회중..." : "결과 조회"}
          </button>
        </form>

        {/* 조회 결과 */}
        {results && results.length > 0 && (
          <div className="mt-8 space-y-4">
            {results.map((result, idx) => {
              const statusInfo = STATUS_DISPLAY[result.status] || STATUS_DISPLAY.pending;
              const schoolNames = result.schools
                .map((sid) => SCHOOLS.find((s) => s.id === sid)?.shortName || sid)
                .join(", ");
              const subjectNames = result.subjects
                .map((sid) => {
                  const sub = SUBJECTS.find((s) => s.id === sid);
                  return sub ? `${sub.icon} ${sub.name}` : sid;
                })
                .join(", ");

              return (
                <div
                  key={idx}
                  className={`rounded-2xl border-2 p-6 ${statusInfo.color}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 mt-1">
                      {statusInfo.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold">{result.name}님</h3>
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-white/80">
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm opacity-80 mb-4">
                        {statusInfo.description}
                      </p>
                      <div className="bg-white/60 rounded-xl p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">지원 학교</span>
                          <span className="font-medium">{schoolNames}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">지원 과목</span>
                          <span className="font-medium">{subjectNames}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">접수일</span>
                          <span className="font-medium">{result.created_at}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
