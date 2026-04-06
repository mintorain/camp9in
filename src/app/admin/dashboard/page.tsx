"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  School,
  BookOpen,
  Download,
  LogOut,
  Loader2,
  BarChart3,
} from "lucide-react";
import { SCHOOLS, SUBJECTS, STATUS_OPTIONS, SUBJECT_CLOSE_THRESHOLD } from "@/lib/constants";
import { adminFetch, getAdminToken } from "@/lib/admin";

interface Applicant {
  id: string;
  name: string;
  status: string;
  created_at: string;
  applicant_schools: { school_id: string }[];
  applicant_subjects: { subject_id: string }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [closedIds, setClosedIds] = useState<string[]>([]);
  const [togglingSubject, setTogglingSubject] = useState<string | null>(null);

  useEffect(() => {
    if (!getAdminToken()) {
      router.push("/admin");
      return;
    }
    fetchData();
    fetchClosedSubjects();
  }, [router]);

  async function fetchData() {
    try {
      const res = await adminFetch("/api/applicants");
      const { data } = await res.json();
      setApplicants(data || []);
    } catch {
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  }

  async function fetchClosedSubjects() {
    try {
      const res = await fetch("/api/subjects/close");
      const { data } = await res.json();
      setClosedIds(data || []);
    } catch {
      /* ignore */
    }
  }

  async function toggleSubjectClose(subjectId: string) {
    setTogglingSubject(subjectId);
    const isClosed = closedIds.includes(subjectId);
    try {
      await adminFetch("/api/subjects/close", {
        method: "POST",
        body: JSON.stringify({ subjectId, closed: !isClosed }),
      });
      await fetchClosedSubjects();
    } catch {
      /* ignore */
    } finally {
      setTogglingSubject(null);
    }
  }

  async function handleExport() {
    const token = getAdminToken();
    const res = await fetch("/api/applicants/export", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applicants_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_token");
    router.push("/admin");
  }

  function countBySchool(schoolId: string) {
    return applicants.filter((a) =>
      a.applicant_schools?.some((s) => s.school_id === schoolId)
    ).length;
  }

  function countBySubject(subjectId: string) {
    return applicants.filter((a) =>
      a.applicant_subjects?.some((s) => s.subject_id === subjectId)
    ).length;
  }

  function countByStatus(status: string) {
    return applicants.filter((a) => a.status === status).length;
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">
            AI캠프 강사 모집 관리
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              CSV 내보내기
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              로그아웃
            </button>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* 요약 카드 */}
        <section aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="sr-only">
            전체 요약
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <Users
                  className="w-5 h-5 text-primary"
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-500">전체 지원자</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {applicants.length}
              </p>
            </div>
            {SCHOOLS.map((school) => (
              <div
                key={school.id}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <School
                    className="w-5 h-5 text-indigo-500"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-gray-500">
                    {school.shortName}
                  </span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {countBySchool(school.id)}
                </p>
              </div>
            ))}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3
                  className="w-5 h-5 text-green-500"
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-500">선발 완료</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {countByStatus("accepted")}
              </p>
            </div>
          </div>
        </section>

        {/* 상태별 현황 */}
        <section aria-labelledby="status-heading">
          <h2
            id="status-heading"
            className="text-lg font-bold text-gray-900 mb-4"
          >
            상태별 현황
          </h2>
          <div className="flex flex-wrap gap-3">
            {STATUS_OPTIONS.map((s) => (
              <div
                key={s.value}
                className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3"
              >
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${s.color}`}
                >
                  {s.label}
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {countByStatus(s.value)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 과목별 현황 + 마감 관리 */}
        <section aria-labelledby="subject-heading">
          <h2
            id="subject-heading"
            className="text-lg font-bold text-gray-900 mb-4"
          >
            과목별 지원 현황 및 마감 관리
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-3">
              {SUBJECTS.map((subject) => {
                const count = countBySubject(subject.id);
                const maxCount = Math.max(
                  ...SUBJECTS.map((s) => countBySubject(s.id)),
                  1
                );
                const isClosed = closedIds.includes(subject.id);
                const isAutoClose = count >= SUBJECT_CLOSE_THRESHOLD;
                const isToggling = togglingSubject === subject.id;

                return (
                  <div key={subject.id} className="flex items-center gap-3">
                    <span className="text-sm w-36 shrink-0 text-gray-700">
                      {subject.icon} {subject.name}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isClosed || isAutoClose ? "bg-red-400" : "bg-primary"
                        }`}
                        style={{
                          width: `${(count / maxCount) * 100}%`,
                          minWidth: count > 0 ? "1.5rem" : "0",
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8 text-right">
                      {count}
                    </span>
                    {isAutoClose && !isClosed ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium w-20 text-center">
                        자동마감
                      </span>
                    ) : (
                      <button
                        onClick={() => toggleSubjectClose(subject.id)}
                        disabled={isToggling}
                        className={`text-xs px-2 py-1 rounded-full font-medium w-20 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                          isClosed
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        } ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {isToggling
                          ? "..."
                          : isClosed
                            ? "마감중"
                            : "모집중"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              * {SUBJECT_CLOSE_THRESHOLD}명 이상 지원 시 자동 마감 · 버튼 클릭으로 수동 마감/해제 가능
            </p>
          </div>
        </section>

        {/* 지원자 목록 바로가기 */}
        <section>
          <Link
            href="/admin/applicants"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <BookOpen className="w-5 h-5" aria-hidden="true" />
            지원자 목록 보기
          </Link>
        </section>
      </main>
    </div>
  );
}
