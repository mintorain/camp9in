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
  EyeOff,
  Activity,
  TrendingUp,
  Monitor,
  Settings,
  ClipboardList,
  UserCheck,
  LayoutDashboard,
  Lock,
  X,
  ChevronRight,
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
  const [closedSchoolIds, setClosedSchoolIds] = useState<string[]>([]);
  const [togglingSubject, setTogglingSubject] = useState<string | null>(null);
  const [togglingSchool, setTogglingSchool] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<{
    realtime: number;
    today: { visitors: number; views: number };
    daily: { date: string; visitors: number; views: number }[];
    pages: { page: string; views: number; visitors: number }[];
    total: { visitors: number; views: number };
  } | null>(null);

  const [showCounts, setShowCounts] = useState(true);
  const [togglingCounts, setTogglingCounts] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showSettings, setShowSettings] = useState(false);

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
      setPasswordSuccess("비밀번호가 변경되었습니다.");
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
    fetchClosedSchools();
    fetchAnalytics();
    fetchSettings();
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
    } catch { /* ignore */ }
  }

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      const { data } = await res.json();
      if (data?.show_counts !== undefined) setShowCounts(data.show_counts !== "false");
      if (data?.show_status !== undefined) setShowStatus(data.show_status === "true");
    } catch { /* ignore */ }
  }

  async function toggleShowCounts() {
    setTogglingCounts(true);
    const v = !showCounts;
    try {
      await adminFetch("/api/settings", { method: "POST", body: JSON.stringify({ key: "show_counts", value: String(v) }) });
      setShowCounts(v);
    } catch { /* ignore */ } finally { setTogglingCounts(false); }
  }

  async function toggleShowStatus() {
    setTogglingStatus(true);
    const v = !showStatus;
    try {
      await adminFetch("/api/settings", { method: "POST", body: JSON.stringify({ key: "show_status", value: String(v) }) });
      setShowStatus(v);
    } catch { /* ignore */ } finally { setTogglingStatus(false); }
  }

  async function fetchClosedSubjects() {
    try {
      const res = await fetch("/api/subjects/close");
      const { data } = await res.json();
      setClosedIds(data || []);
    } catch { /* ignore */ }
  }

  async function toggleSubjectClose(subjectId: string) {
    setTogglingSubject(subjectId);
    const isClosed = closedIds.includes(subjectId);
    try {
      await adminFetch("/api/subjects/close", { method: "POST", body: JSON.stringify({ subjectId, closed: !isClosed }) });
      await fetchClosedSubjects();
    } catch { /* ignore */ } finally { setTogglingSubject(null); }
  }

  async function fetchClosedSchools() {
    try {
      const res = await fetch("/api/schools/close");
      const { data } = await res.json();
      setClosedSchoolIds(data || []);
    } catch { /* ignore */ }
  }

  async function toggleSchoolClose(schoolId: string) {
    setTogglingSchool(schoolId);
    const isClosed = closedSchoolIds.includes(schoolId);
    try {
      await adminFetch("/api/schools/close", { method: "POST", body: JSON.stringify({ schoolId, closed: !isClosed }) });
      await fetchClosedSchools();
    } catch { /* ignore */ } finally { setTogglingSchool(null); }
  }

  async function handleExport() {
    const token = getAdminToken();
    const res = await fetch("/api/applicants/export", { headers: { Authorization: `Bearer ${token}` } });
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
    return applicants.filter((a) => a.applicant_schools?.some((s) => s.school_id === schoolId)).length;
  }
  function countBySubject(subjectId: string) {
    return applicants.filter((a) => a.applicant_subjects?.some((s) => s.subject_id === subjectId)).length;
  }
  function countByStatus(status: string) {
    return applicants.filter((a) => a.status === status).length;
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 사이드바 */}
      <aside className="hidden lg:flex w-60 bg-slate-900 text-white flex-col fixed inset-y-0 left-0 z-40">
        <div className="p-5 border-b border-white/10">
          <h1 className="text-sm font-bold tracking-wide text-indigo-300">AI캠프 관리</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">두온교육(주)</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/10 text-white text-sm font-medium">
            <LayoutDashboard className="w-4 h-4" /> 대시보드
          </Link>
          <Link href="/admin/applicants" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white text-sm transition-colors">
            <ClipboardList className="w-4 h-4" /> 지원자 목록
          </Link>
          <Link href="/admin/assigned" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white text-sm transition-colors">
            <UserCheck className="w-4 h-4" /> 배정 강사 명단
          </Link>
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <button onClick={handleExport} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-xs w-full transition-colors">
            <Download className="w-3.5 h-3.5" /> CSV 내보내기
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white text-xs w-full transition-colors">
            <Settings className="w-3.5 h-3.5" /> 설정
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-red-300 text-xs w-full transition-colors">
            <LogOut className="w-3.5 h-3.5" /> 로그아웃
          </button>
        </div>
      </aside>

      {/* 모바일 헤더 */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <h1 className="text-sm font-bold text-indigo-300">AI캠프 관리</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/applicants" className="p-2 rounded-lg hover:bg-white/10"><ClipboardList className="w-4 h-4" /></Link>
          <Link href="/admin/assigned" className="p-2 rounded-lg hover:bg-white/10"><UserCheck className="w-4 h-4" /></Link>
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-white/10"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 lg:ml-60 pt-16 lg:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

          {/* 설정 패널 */}
          {showSettings && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">공개 설정</h2>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={toggleShowCounts} disabled={togglingCounts}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${showCounts ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"} ${togglingCounts ? "opacity-50" : ""}`}>
                  {showCounts ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {togglingCounts ? "..." : showCounts ? "인원수 공개중" : "인원수 비공개"}
                </button>
                <button onClick={toggleShowStatus} disabled={togglingStatus}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${showStatus ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"} ${togglingStatus ? "opacity-50" : ""}`}>
                  {showStatus ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {togglingStatus ? "..." : showStatus ? "합격조회 공개중" : "합격조회 비공개"}
                </button>
                <button onClick={() => setShowPasswordModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                  <Lock className="w-4 h-4" /> 비밀번호 변경
                </button>
              </div>
            </div>
          )}

          {/* 비밀번호 모달 */}
          {showPasswordModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
              <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h2 className="text-lg font-bold text-slate-900 mb-4">비밀번호 변경</h2>
                <input type="password" placeholder="새 비밀번호 (4자 이상)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm mb-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                {passwordError && <p className="text-red-500 text-sm mb-3">{passwordError}</p>}
                {passwordSuccess && <p className="text-emerald-500 text-sm mb-3">{passwordSuccess}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setShowPasswordModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium">취소</button>
                  <button onClick={handleChangePassword} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">변경</button>
                </div>
              </div>
            </div>
          )}

          {/* 실시간 현황 바 */}
          {analytics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: <Activity className="w-4 h-4" />, color: "text-emerald-500", bg: "bg-emerald-50", label: "실시간", value: analytics.realtime, unit: "명", sub: "최근 5분" },
                { icon: <Eye className="w-4 h-4" />, color: "text-blue-500", bg: "bg-blue-50", label: "오늘 방문", value: analytics.today.visitors, unit: "명", sub: `${analytics.today.views}뷰` },
                { icon: <TrendingUp className="w-4 h-4" />, color: "text-violet-500", bg: "bg-violet-50", label: "누적 방문", value: analytics.total.visitors, unit: "명", sub: `${analytics.total.views}뷰` },
                { icon: <Monitor className="w-4 h-4" />, color: "text-amber-500", bg: "bg-amber-50", label: "지원서 조회", value: analytics.pages.find((p) => p.page === "/apply")?.views || 0, unit: "회", sub: `${analytics.pages.find((p) => p.page === "/apply")?.visitors || 0}명` },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-lg ${item.bg} ${item.color} flex items-center justify-center`}>{item.icon}</div>
                    <span className="text-xs text-slate-500">{item.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{item.value}<span className="text-xs font-normal text-slate-400 ml-1">{item.unit}</span></p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* 지원 요약 + 상태 */}
          <div className="grid md:grid-cols-5 gap-3">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-4 text-white shadow-md shadow-indigo-200">
              <Users className="w-5 h-5 mb-2 opacity-70" />
              <p className="text-2xl font-bold">{applicants.length}</p>
              <p className="text-xs text-indigo-200">전체 지원자</p>
            </div>
            {SCHOOLS.map((school) => {
              const isClosed = closedSchoolIds.includes(school.id);
              const isToggling = togglingSchool === school.id;
              return (
                <div key={school.id} className={`bg-white rounded-xl border p-4 shadow-sm ${isClosed ? "border-red-200" : "border-slate-200/80"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <School className={`w-4 h-4 ${isClosed ? "text-red-400" : "text-indigo-400"}`} />
                    <button onClick={() => toggleSchoolClose(school.id)} disabled={isToggling}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-all ${isClosed ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"} ${isToggling ? "opacity-40" : ""}`}>
                      {isToggling ? "..." : isClosed ? "마감" : "모집중"}
                    </button>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{countBySchool(school.id)}</p>
                  <p className="text-xs text-slate-400">{school.shortName}</p>
                </div>
              );
            })}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
              <BarChart3 className="w-4 h-4 text-emerald-400 mb-2" />
              <p className="text-2xl font-bold text-slate-900">{countByStatus("accepted")}</p>
              <p className="text-xs text-slate-400">선발 완료</p>
            </div>
          </div>

          {/* 상태별 + 일별 통계 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4">상태별 현황</h3>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <div key={s.value} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${s.color}`}>{s.label}</span>
                    <span className="text-lg font-bold text-slate-900 ml-auto">{countByStatus(s.value)}</span>
                  </div>
                ))}
              </div>
            </div>
            {analytics && (
              <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">최근 7일 방문</h3>
                {analytics.daily.length === 0 ? (
                  <p className="text-sm text-slate-400">데이터 없음</p>
                ) : (
                  <div className="space-y-2">
                    {analytics.daily.map((day) => {
                      const maxViews = Math.max(...analytics.daily.map((d) => d.views), 1);
                      return (
                        <div key={day.date} className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-400 w-14 shrink-0">{day.date.slice(5)}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all" style={{ width: `${(day.views / maxViews) * 100}%`, minWidth: day.views > 0 ? "0.75rem" : "0" }} />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-600 w-16 text-right">{day.visitors}명 {day.views}뷰</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 과목별 현황 + 마감 관리 */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4">과목별 지원 현황 및 마감 관리</h3>
            <div className="space-y-2.5">
              {SUBJECTS.map((subject) => {
                const count = countBySubject(subject.id);
                const maxCount = Math.max(...SUBJECTS.map((s) => countBySubject(s.id)), 1);
                const isClosed = closedIds.includes(subject.id);
                const isAutoClose = count >= SUBJECT_CLOSE_THRESHOLD && !isClosed;
                const isToggling = togglingSubject === subject.id;
                return (
                  <div key={subject.id} className="flex items-center gap-3 group">
                    <span className="text-sm w-32 shrink-0 text-slate-700 truncate">{subject.icon} {subject.name}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${isClosed || isAutoClose ? "bg-red-400" : "bg-gradient-to-r from-indigo-500 to-violet-500"}`}
                        style={{ width: `${(count / maxCount) * 100}%`, minWidth: count > 0 ? "1.25rem" : "0" }} />
                    </div>
                    <span className="text-sm font-bold text-slate-800 w-7 text-right">{count}</span>
                    <button onClick={() => toggleSubjectClose(subject.id)} disabled={isToggling}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-semibold w-18 text-center transition-all ${isClosed ? "bg-red-100 text-red-600 hover:bg-red-200" : isAutoClose ? "bg-orange-100 text-orange-600 hover:bg-orange-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"} ${isToggling ? "opacity-40" : ""}`}>
                      {isToggling ? "..." : isClosed ? "마감" : isAutoClose ? "자동" : "모집중"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 학교별 과목 지원 현황 */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3">학교별 과목 지원 현황</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {SCHOOLS.map((school) => {
                const schoolApplicants = applicants.filter((a) => a.applicant_schools?.some((s) => s.school_id === school.id));
                const schoolSubjects = SUBJECTS.filter((sub) => (school.subjects as readonly string[]).includes(sub.id));
                const hasGradeSchedule = "gradeSchedule" in school;
                const gradeSchedule = hasGradeSchedule
                  ? (school as typeof school & { gradeSchedule: { grade: string; period: string; subjects: string[] }[] }).gradeSchedule
                  : null;

                return (
                  <div key={school.id} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-slate-900">{school.shortName}</h4>
                      <span className="text-[11px] text-slate-400">{schoolApplicants.length}명</span>
                    </div>
                    {gradeSchedule ? (
                      <div className="space-y-3">
                        {gradeSchedule.map((gs) => {
                          const gradeSubjects = SUBJECTS.filter((sub) => (gs.subjects as readonly string[]).includes(sub.id));
                          return (
                            <div key={gs.grade}>
                              <p className="text-[11px] font-semibold text-slate-500 mb-1">{gs.grade} <span className="font-normal text-slate-400">({gs.period})</span></p>
                              <div className="space-y-1">
                                {gradeSubjects.map((subject) => {
                                  const count = schoolApplicants.filter((a) => a.applicant_subjects?.some((s) => s.subject_id === subject.id)).length;
                                  const capacity = school.capacityPerSubject;
                                  return (
                                    <div key={subject.id} className="flex items-center gap-2">
                                      <span className="text-[11px] text-slate-600 w-20 shrink-0 truncate">{subject.icon} {subject.name}</span>
                                      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                        <div className={`h-full rounded-full ${count >= capacity ? "bg-red-400" : count > 0 ? "bg-indigo-400" : ""}`}
                                          style={{ width: `${Math.min((count / capacity) * 100, 100)}%`, minWidth: count > 0 ? "0.5rem" : "0" }} />
                                      </div>
                                      <span className={`text-[11px] font-bold w-9 text-right ${count >= capacity ? "text-red-500" : "text-slate-600"}`}>{count}/{capacity}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {schoolSubjects.map((subject) => {
                          const count = schoolApplicants.filter((a) => a.applicant_subjects?.some((s) => s.subject_id === subject.id)).length;
                          const capacity = school.capacityPerSubject;
                          return (
                            <div key={subject.id} className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-600 w-24 shrink-0 truncate">{subject.icon} {subject.name}</span>
                              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                                <div className={`h-full rounded-full ${count >= capacity ? "bg-red-400" : count > 0 ? "bg-indigo-400" : ""}`}
                                  style={{ width: `${Math.min((count / capacity) * 100, 100)}%`, minWidth: count > 0 ? "0.75rem" : "0" }} />
                              </div>
                              <span className={`text-[11px] font-bold w-10 text-right ${count >= capacity ? "text-red-500" : "text-slate-600"}`}>{count}/{capacity}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 빠른 이동 */}
          <div className="grid md:grid-cols-2 gap-3">
            <Link href="/admin/applicants" className="group flex items-center justify-between bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600"><ClipboardList className="w-5 h-5" /></div>
                <div><p className="text-sm font-bold text-slate-900">지원자 목록</p><p className="text-xs text-slate-400">{applicants.length}명 관리</p></div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
            </Link>
            <Link href="/admin/assigned" className="group flex items-center justify-between bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><UserCheck className="w-5 h-5" /></div>
                <div><p className="text-sm font-bold text-slate-900">배정 강사 명단</p><p className="text-xs text-slate-400">{countByStatus("accepted")}명 선발</p></div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-400 transition-colors" />
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
