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
  Eye,
  Activity,
  TrendingUp,
  Monitor,
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
  const [analytics, setAnalytics] = useState<{
    realtime: number;
    today: { visitors: number; views: number };
    daily: { date: string; visitors: number; views: number }[];
    pages: { page: string; views: number; visitors: number }[];
    total: { visitors: number; views: number };
  } | null>(null);

  const [showCounts, setShowCounts] = useState(true);
  const [togglingCounts, setTogglingCounts] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  async function handleChangePassword() {
    setPasswordError("");
    setPasswordSuccess("");
    if (newPassword.length < 4) {
      setPasswordError("비밀번호는 4자 이상이어야 합니다");
      return;
    }
    try {
      const res = await adminFetch("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "change-password", newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPasswordError(data.error || "변경 실패");
        return;
      }
      setPasswordSuccess("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
      sessionStorage.setItem("admin_token", newPassword);
      setTimeout(() => {
        setShowPasswordModal(false);
        setNewPassword("");
        setPasswordSuccess("");
      }, 2000);
    } catch {
      setPasswordError("변경에 실패했습니다");
    }
  }

  useEffect(() => {
    if (!getAdminToken()) {
      router.push("/admin");
      return;
    }
    fetchData();
    fetchClosedSubjects();
    fetchAnalytics();
    fetchSettings();
    // 실시간 접속자 30초마다 갱신
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
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

  async function fetchAnalytics() {
    try {
      const res = await adminFetch("/api/analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch {
      /* ignore */
    }
  }

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      const { data } = await res.json();
      if (data?.show_counts !== undefined) {
        setShowCounts(data.show_counts !== "false");
      }
    } catch {
      /* ignore */
    }
  }

  async function toggleShowCounts() {
    setTogglingCounts(true);
    const newValue = !showCounts;
    try {
      await adminFetch("/api/settings", {
        method: "POST",
        body: JSON.stringify({ key: "show_counts", value: String(newValue) }),
      });
      setShowCounts(newValue);
    } catch {
      /* ignore */
    } finally {
      setTogglingCounts(false);
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
              onClick={() => setShowPasswordModal(true)}
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              비밀번호 변경
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

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPasswordModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">관리자 비밀번호 변경</h2>
            <input
              type="password"
              placeholder="새 비밀번호 (4자 이상)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm mb-3 focus:ring-2 focus:ring-primary focus:border-primary"
            />
            {passwordError && <p className="text-red-500 text-sm mb-3">{passwordError}</p>}
            {passwordSuccess && <p className="text-green-500 text-sm mb-3">{passwordSuccess}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* 접속자 현황 */}
        {analytics && (
          <section aria-labelledby="analytics-heading">
            <h2
              id="analytics-heading"
              className="text-lg font-bold text-gray-900 mb-4"
            >
              접속자 현황
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="w-5 h-5 text-green-500" aria-hidden="true" />
                  <span className="text-sm text-gray-500">실시간 접속</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {analytics.realtime}
                  <span className="text-sm font-normal text-gray-400 ml-1">명</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">최근 5분</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Eye className="w-5 h-5 text-blue-500" aria-hidden="true" />
                  <span className="text-sm text-gray-500">오늘 방문자</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {analytics.today.visitors}
                  <span className="text-sm font-normal text-gray-400 ml-1">명</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  페이지뷰 {analytics.today.views}회
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" aria-hidden="true" />
                  <span className="text-sm text-gray-500">누적 방문자</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {analytics.total.visitors}
                  <span className="text-sm font-normal text-gray-400 ml-1">명</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  총 {analytics.total.views}회 조회
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Monitor className="w-5 h-5 text-amber-500" aria-hidden="true" />
                  <span className="text-sm text-gray-500">지원서 페이지</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {analytics.pages.find((p) => p.page === "/apply")?.views || 0}
                  <span className="text-sm font-normal text-gray-400 ml-1">회</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  오늘 {analytics.pages.find((p) => p.page === "/apply")?.visitors || 0}명 방문
                </p>
              </div>
            </div>

            {/* 일별 통계 + 페이지별 조회 */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* 최근 7일 통계 */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-700 mb-3">최근 7일 방문 현황</h3>
                {analytics.daily.length === 0 ? (
                  <p className="text-sm text-gray-400">데이터 없음</p>
                ) : (
                  <div className="space-y-2">
                    {analytics.daily.map((day) => {
                      const maxViews = Math.max(...analytics.daily.map((d) => d.views), 1);
                      return (
                        <div key={day.date} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-20 shrink-0">
                            {day.date.slice(5)}
                          </span>
                          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${(day.views / maxViews) * 100}%`, minWidth: day.views > 0 ? "1rem" : "0" }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 w-16 text-right">
                            {day.visitors}명/{day.views}뷰
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 페이지별 조회 수 */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-bold text-gray-700 mb-3">오늘 페이지별 조회 수</h3>
                {analytics.pages.length === 0 ? (
                  <p className="text-sm text-gray-400">데이터 없음</p>
                ) : (
                  <div className="space-y-2">
                    {analytics.pages.map((p) => {
                      const pageName =
                        p.page === "/" ? "메인페이지" :
                        p.page === "/apply" ? "지원서 작성" :
                        p.page === "/apply/complete" ? "지원 완료" :
                        p.page;
                      return (
                        <div key={p.page} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                          <span className="text-sm text-gray-700">{pageName}</span>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-gray-500">{p.visitors}명</span>
                            <span className="font-bold text-gray-900">{p.views}뷰</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

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
          <div className="flex items-center justify-between mb-4">
            <h2
              id="subject-heading"
              className="text-lg font-bold text-gray-900"
            >
              과목별 지원 현황 및 마감 관리
            </h2>
            <button
              onClick={toggleShowCounts}
              disabled={togglingCounts}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                showCounts
                  ? "bg-primary text-white hover:bg-primary-dark"
                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
              } ${togglingCounts ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Eye className="w-4 h-4" aria-hidden="true" />
              {togglingCounts ? "..." : showCounts ? "인원수 공개중" : "인원수 비공개"}
            </button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-3">
              {SUBJECTS.map((subject) => {
                const count = countBySubject(subject.id);
                const maxCount = Math.max(
                  ...SUBJECTS.map((s) => countBySubject(s.id)),
                  1
                );
                const isClosed = closedIds.includes(subject.id);
                const isAutoClose = count >= SUBJECT_CLOSE_THRESHOLD && !isClosed;
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
                    <button
                      onClick={() => toggleSubjectClose(subject.id)}
                      disabled={isToggling}
                      className={`text-xs px-2 py-1 rounded-full font-medium w-20 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                        isClosed
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : isAutoClose
                            ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      } ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {isToggling
                        ? "..."
                        : isClosed
                          ? "마감중"
                          : isAutoClose
                            ? "자동마감"
                            : "모집중"}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              * {SUBJECT_CLOSE_THRESHOLD}명 이상 지원 시 자동 마감 · 모든 과목 버튼 클릭으로 마감/해제 가능 (자동마감도 해제 가능)
            </p>
          </div>
        </section>

        {/* 학교별 과목 지원 현황 */}
        <section aria-labelledby="school-subject-heading">
          <h2
            id="school-subject-heading"
            className="text-lg font-bold text-gray-900 mb-4"
          >
            학교별 과목 지원 현황
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {SCHOOLS.map((school) => {
              const schoolApplicants = applicants.filter((a) =>
                a.applicant_schools?.some((s) => s.school_id === school.id)
              );
              const schoolSubjects = SUBJECTS.filter((sub) =>
                school.subjects.includes(sub.id)
              );

              return (
                <div
                  key={school.id}
                  className="bg-white rounded-xl border border-gray-200 p-5"
                >
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
                    <span>{school.shortName}</span>
                    <span className="text-xs font-normal text-gray-400">
                      총 {schoolApplicants.length}명
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {schoolSubjects.map((subject) => {
                      const count = schoolApplicants.filter((a) =>
                        a.applicant_subjects?.some(
                          (s) => s.subject_id === subject.id
                        )
                      ).length;
                      const capacity = school.capacityPerSubject;
                      const isFull = count >= capacity;

                      return (
                        <div
                          key={subject.id}
                          className="flex items-center gap-2"
                        >
                          <span className="text-xs w-24 shrink-0 text-gray-600 truncate">
                            {subject.icon} {subject.name}
                          </span>
                          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isFull ? "bg-red-400" : count > 0 ? "bg-primary" : ""
                              }`}
                              style={{
                                width: `${Math.min((count / capacity) * 100, 100)}%`,
                                minWidth: count > 0 ? "1rem" : "0",
                              }}
                            />
                          </div>
                          <span
                            className={`text-xs font-bold w-12 text-right ${
                              isFull ? "text-red-600" : "text-gray-700"
                            }`}
                          >
                            {count}/{capacity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
