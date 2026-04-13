"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Filter,
  Loader2,
  ChevronDown,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { SCHOOLS, SUBJECTS, STATUS_OPTIONS } from "@/lib/constants";
import { adminFetch, getAdminToken } from "@/lib/admin";

interface Applicant {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  birth_date: string;
  education: string;
  major: string | null;
  experience: string;
  qualifications: string | null;
  introduction: string | null;
  status: string;
  confirmed_subject: string | null;
  confirmed_school: string | null;
  payment_name: string | null;
  resident_id: string | null;
  payment_address: string | null;
  bank_name: string | null;
  bank_account: string | null;
  payment_submitted_at: string | null;
  created_at: string;
  applicant_schools: { school_id: string }[];
  applicant_subjects: { subject_id: string }[];
  assignments: { school_id: string; subject_id: string; grade: string | null }[];
}

export default function ApplicantsPage() {
  const router = useRouter();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSchool, setFilterSchool] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDuplicate, setFilterDuplicate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingAssignments, setEditingAssignments] = useState<
    { school_id: string; subject_id: string; grade: string | null }[] | null
  >(null);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (filterSchool) params.set("school", filterSchool);
      if (filterSubject) params.set("subject", filterSubject);
      if (filterStatus) params.set("status", filterStatus);

      const res = await adminFetch(`/api/applicants?${params}`);
      const { data } = await res.json();
      setApplicants(data || []);
    } catch {
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterSchool, filterSubject, filterStatus, router]);

  useEffect(() => {
    if (!getAdminToken()) {
      router.push("/admin");
      return;
    }
    fetchData();
  }, [fetchData, router]);

  async function updateStatus(id: string, status: string) {
    await adminFetch(`/api/applicants/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    fetchData();
  }

  async function saveAssignments(
    id: string,
    assignments: { school_id: string; subject_id: string; grade: string | null }[]
  ) {
    await adminFetch(`/api/applicants/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ assignments }),
    });
    setEditingAssignments(null);
    fetchData();
  }

  // 중복 지원자 감지 (같은 이름+전화번호 또는 같은 전화번호)
  const duplicatePhones = new Set<string>();
  const phoneCounts = new Map<string, number>();
  applicants.forEach((a) => {
    const phone = a.phone.replace(/-/g, "");
    phoneCounts.set(phone, (phoneCounts.get(phone) || 0) + 1);
  });
  phoneCounts.forEach((count, phone) => {
    if (count > 1) duplicatePhones.add(phone);
  });

  const isDuplicate = (a: Applicant) =>
    duplicatePhones.has(a.phone.replace(/-/g, ""));

  const duplicateCount = applicants.filter(isDuplicate).length;

  const filteredApplicants = filterDuplicate
    ? applicants.filter(isDuplicate)
    : applicants;

  const selectedApplicant = applicants.find((a) => a.id === selectedId);
  const currentAssignments = editingAssignments ?? selectedApplicant?.assignments ?? [];

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
          <h1 className="text-lg font-bold text-gray-900">지원자 목록</h1>
          <span className="ml-auto text-sm text-gray-500">
            {filterDuplicate ? `중복 ${filteredApplicants.length}명 / ` : ""}총 {applicants.length}명
          </span>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 필터 영역 */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                aria-hidden="true"
              />
              <label htmlFor="search-input" className="sr-only">
                이름, 연락처, 이메일 검색
              </label>
              <input
                id="search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="이름, 연락처, 이메일 검색"
              />
            </div>
            <label htmlFor="filter-school" className="sr-only">
              학교 필터
            </label>
            <select
              id="filter-school"
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary"
            >
              <option value="">전체 학교</option>
              {SCHOOLS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shortName}
                </option>
              ))}
            </select>
            <label htmlFor="filter-subject" className="sr-only">
              과목 필터
            </label>
            <select
              id="filter-subject"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary"
            >
              <option value="">전체 과목</option>
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <label htmlFor="filter-status" className="sr-only">
              상태 필터
            </label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary"
            >
              <option value="">전체 상태</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {duplicateCount > 0 && (
              <button
                onClick={() => setFilterDuplicate(!filterDuplicate)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                  filterDuplicate
                    ? "bg-amber-500 text-white"
                    : "border border-amber-400 text-amber-600 hover:bg-amber-50"
                }`}
              >
                중복 {duplicateCount}명
              </button>
            )}
          </div>
        </div>

        {/* 학교별·과목별 지원 현황 요약 */}
        {!loading && applicants.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700">학교별·과목별 지원 현황</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {SCHOOLS.map((school) => {
                const schoolApps = applicants.filter((a) =>
                  a.applicant_schools?.some((s) => s.school_id === school.id)
                );
                const schoolSubjects = SUBJECTS.filter((sub) =>
                  (school.subjects as readonly string[]).includes(sub.id)
                );
                return (
                  <div key={school.id} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-gray-900 mb-2 flex justify-between">
                      <span>{school.shortName}</span>
                      <span className="text-gray-400 font-normal">{schoolApps.length}명</span>
                    </p>
                    <div className="space-y-1">
                      {schoolSubjects.map((sub) => {
                        const cnt = schoolApps.filter((a) =>
                          a.applicant_subjects?.some((s) => s.subject_id === sub.id)
                        ).length;
                        return (
                          <div key={sub.id} className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-600 w-28 shrink-0 truncate">
                              {sub.icon} {sub.name}
                            </span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${cnt > 0 ? "bg-primary" : ""}`}
                                style={{ width: `${Math.min((cnt / Math.max(school.capacityPerSubject, 1)) * 100, 100)}%`, minWidth: cnt > 0 ? "0.5rem" : "0" }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-gray-700 w-8 text-right">
                              {cnt}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : applicants.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">지원자가 없습니다</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th
                      scope="col"
                      className="text-left px-4 py-3 font-medium text-gray-600"
                    >
                      이름
                    </th>
                    <th
                      scope="col"
                      className="text-left px-4 py-3 font-medium text-gray-600"
                    >
                      연락처
                    </th>
                    <th
                      scope="col"
                      className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell"
                    >
                      지원 학교
                    </th>
                    <th
                      scope="col"
                      className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell"
                    >
                      지원 과목
                    </th>
                    <th
                      scope="col"
                      className="text-left px-4 py-3 font-medium text-gray-600"
                    >
                      상태
                    </th>
                    <th
                      scope="col"
                      className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell"
                    >
                      지원일
                    </th>
                    <th scope="col" className="px-4 py-3">
                      <span className="sr-only">액션</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplicants.map((applicant) => {
                    const schools = applicant.applicant_schools
                      ?.map(
                        (s) =>
                          SCHOOLS.find((sc) => sc.id === s.school_id)
                            ?.shortName || s.school_id
                      )
                      .join(", ");
                    const subjects = applicant.applicant_subjects
                      ?.map((s) =>
                        SUBJECTS.find((sub) => sub.id === s.subject_id)?.name || s.subject_id
                      )
                      .join(", ");
                    const statusOption = STATUS_OPTIONS.find(
                      (s) => s.value === applicant.status
                    );
                    const duplicate = isDuplicate(applicant);

                    return (
                      <tr
                        key={applicant.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 ${duplicate ? "bg-amber-50" : ""}`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {duplicate && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-800 mr-1.5">중복</span>
                          )}
                          {applicant.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {applicant.phone}
                        </td>
                        <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                          {schools}
                        </td>
                        <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                          {applicant.assignments?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {applicant.assignments.map((a, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                                  {SCHOOLS.find((s) => s.id === a.school_id)?.shortName}/{SUBJECTS.find((s) => s.id === a.subject_id)?.name}{a.grade ? `(${a.grade})` : ""}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="line-clamp-1">{subjects}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusOption?.color || ""}`}
                          >
                            {statusOption?.label || applicant.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">
                          {new Date(applicant.created_at).toLocaleDateString("ko-KR")}
                          <br />
                          <span className="text-gray-400">
                            {new Date(applicant.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedId(applicant.id)}
                            className="text-primary hover:text-primary-dark text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
                          >
                            상세
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
      </main>

      {/* 상세 모달 */}
      {selectedApplicant && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-heading"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => { setSelectedId(null); setEditingAssignments(null); }}
          />
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2
                id="detail-heading"
                className="text-lg font-bold text-gray-900"
              >
                {selectedApplicant.name} 지원서
              </h2>
              <button
                onClick={() => { setSelectedId(null); setEditingAssignments(null); }}
                className="p-1 text-gray-400 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">이름</p>
                  <p className="font-medium">{selectedApplicant.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">연락처</p>
                  <p className="font-medium">{selectedApplicant.phone}</p>
                </div>
                <div>
                  <p className="text-gray-500">이메일</p>
                  <p className="font-medium">{selectedApplicant.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">생년월일</p>
                  <p className="font-medium">{selectedApplicant.birth_date}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">주소</p>
                  <p className="font-medium">{selectedApplicant.address}</p>
                </div>
              </div>

              <hr />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">지원 학교</p>
                  <p className="font-medium">
                    {selectedApplicant.applicant_schools
                      ?.map(
                        (s) =>
                          SCHOOLS.find((sc) => sc.id === s.school_id)
                            ?.shortName || s.school_id
                      )
                      .join(", ")}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">지원 과목</p>
                  <div className="space-y-1 mt-1">
                    {selectedApplicant.applicant_subjects?.map((s) => {
                      const sub = SUBJECTS.find((sub) => sub.id === s.subject_id);
                      return (
                        <p key={s.subject_id} className="font-medium flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                            {sub?.icon} {sub?.name || s.subject_id}
                          </span>
                        </p>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">최종 학력</p>
                  <p className="font-medium">{selectedApplicant.education}</p>
                </div>
                <div>
                  <p className="text-gray-500">전공</p>
                  <p className="font-medium">
                    {selectedApplicant.major || "-"}
                  </p>
                </div>
              </div>

              <hr />

              <div className="text-sm space-y-4">
                <div>
                  <p className="text-gray-500 mb-1">경력 사항</p>
                  <p className="font-medium whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                    {selectedApplicant.experience}
                  </p>
                </div>
                {selectedApplicant.qualifications && (
                  <div>
                    <p className="text-gray-500 mb-1">자격 사항</p>
                    <p className="font-medium whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                      {selectedApplicant.qualifications}
                    </p>
                  </div>
                )}
                {selectedApplicant.introduction && (
                  <div>
                    <p className="text-gray-500 mb-1">자기소개</p>
                    <p className="font-medium whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                      {selectedApplicant.introduction}
                    </p>
                  </div>
                )}
              </div>

              <hr />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="status-select"
                    className="text-sm text-gray-500 mb-2 block"
                  >
                    상태 변경
                  </label>
                  <select
                    id="status-select"
                    value={selectedApplicant.status}
                    onChange={(e) =>
                      updateStatus(selectedApplicant.id, e.target.value)
                    }
                    className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm w-full focus:ring-2 focus:ring-primary"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-2">배정 학교 / 과목</p>
                  <div className="space-y-2">
                    {currentAssignments.map((assignment, idx) => {
                      const school = SCHOOLS.find((sc) => sc.id === assignment.school_id);
                      // 학교의 gradeSchedule에서 과목별 일정 목록 생성
                      const scheduleSlots = school
                        ? school.gradeSchedule.flatMap((gs) =>
                            gs.subjects.map((subId) => {
                              const sub = SUBJECTS.find((s) => s.id === subId);
                              return {
                                key: `${subId}||${gs.grade}`,
                                subjectId: subId,
                                grade: gs.grade,
                                label: `${sub?.icon || ""} ${sub?.name || subId} - ${gs.grade} ${gs.period} (${gs.capacity}명)`,
                              };
                            })
                          )
                        : [];
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <select
                            aria-label={`배정 학교 ${idx + 1}`}
                            value={assignment.school_id}
                            onChange={(e) => {
                              const updated = [...currentAssignments];
                              updated[idx] = { school_id: e.target.value, subject_id: "", grade: null };
                              setEditingAssignments(updated);
                            }}
                            className={`border rounded-lg px-3 py-2 text-sm w-28 shrink-0 focus:ring-2 focus:ring-primary ${
                              assignment.school_id
                                ? "border-green-300 bg-green-50"
                                : "border-gray-300"
                            }`}
                          >
                            <option value="">학교</option>
                            {selectedApplicant.applicant_schools?.map((s) => {
                              const sc = SCHOOLS.find((sc) => sc.id === s.school_id);
                              return (
                                <option key={s.school_id} value={s.school_id}>
                                  {sc?.shortName || s.school_id}
                                </option>
                              );
                            })}
                          </select>
                          <select
                            aria-label={`배정 일정 ${idx + 1}`}
                            value={assignment.subject_id && assignment.grade ? `${assignment.subject_id}||${assignment.grade}` : ""}
                            onChange={(e) => {
                              const [subjectId, grade] = e.target.value.split("||");
                              const updated = [...currentAssignments];
                              updated[idx] = { ...updated[idx], subject_id: subjectId || "", grade: grade || null };
                              setEditingAssignments(updated);
                              // 학교+과목+일정 모두 선택된 행만 저장
                              const toSave = updated.filter((a) => a.school_id && a.subject_id && a.grade);
                              saveAssignments(selectedApplicant.id, toSave);
                            }}
                            disabled={!assignment.school_id}
                            className={`border rounded-lg px-3 py-2 text-sm flex-1 focus:ring-2 focus:ring-primary ${
                              assignment.subject_id
                                ? "border-green-300 bg-green-50"
                                : "border-gray-300"
                            } ${!assignment.school_id ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <option value="">과목·일정 선택</option>
                            {scheduleSlots.map((slot) => (
                              <option key={slot.key} value={slot.key}>
                                {slot.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => {
                              const updated = currentAssignments.filter(
                                (_, i) => i !== idx
                              );
                              setEditingAssignments(updated);
                              const toSave = updated.filter((a) => a.school_id && a.subject_id);
                              saveAssignments(selectedApplicant.id, toSave);
                            }}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label={`배정 ${idx + 1} 삭제`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => {
                        setEditingAssignments([
                          ...currentAssignments,
                          { school_id: "", subject_id: "", grade: null },
                        ]);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <Plus className="w-4 h-4" />
                      배정 추가
                    </button>
                  </div>
                  {currentAssignments.filter((a) => a.school_id && a.subject_id).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {currentAssignments
                        .filter((a) => a.school_id && a.subject_id)
                        .map((a, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            {SCHOOLS.find((s) => s.id === a.school_id)?.shortName} / {SUBJECTS.find((s) => s.id === a.subject_id)?.icon} {SUBJECTS.find((s) => s.id === a.subject_id)?.name}{a.grade ? ` (${a.grade})` : ""}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 강사료 지급 정보 (제출된 경우만) */}
              {selectedApplicant.payment_submitted_at && (
                <>
                  <hr />
                  <div className="text-sm">
                    <p className="text-gray-500 mb-2 font-medium">강사료 지급 정보</p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">성함:</span>{" "}
                        <span className="font-medium">{selectedApplicant.payment_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">주민등록번호:</span>{" "}
                        <span className="font-medium">{selectedApplicant.resident_id}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">주소:</span>{" "}
                        <span className="font-medium">{selectedApplicant.payment_address}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">은행:</span>{" "}
                        <span className="font-medium">{selectedApplicant.bank_name} {selectedApplicant.bank_account}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">제출일:</span>{" "}
                        <span className="font-medium">
                          {new Date(selectedApplicant.payment_submitted_at).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <hr />

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (confirm(`${selectedApplicant.name}님의 지원서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
                      adminFetch(`/api/applicants/${selectedApplicant.id}`, {
                        method: "DELETE",
                      }).then(() => {
                        { setSelectedId(null); setEditingAssignments(null); };
                        fetchData();
                      });
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  지원서 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
