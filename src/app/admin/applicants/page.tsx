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
  created_at: string;
  applicant_schools: { school_id: string }[];
  applicant_subjects: { subject_id: string }[];
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
                      ?.map(
                        (s) =>
                          SUBJECTS.find((sub) => sub.id === s.subject_id)
                            ?.name || s.subject_id
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
                          <span className="line-clamp-1">{subjects}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusOption?.color || ""}`}
                          >
                            {statusOption?.label || applicant.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                          {new Date(
                            applicant.created_at
                          ).toLocaleDateString("ko-KR")}
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
            onClick={() => setSelectedId(null)}
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
                onClick={() => setSelectedId(null)}
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
                <div>
                  <p className="text-gray-500">지원 과목</p>
                  <p className="font-medium">
                    {selectedApplicant.applicant_subjects
                      ?.map(
                        (s) =>
                          SUBJECTS.find((sub) => sub.id === s.subject_id)
                            ?.name || s.subject_id
                      )
                      .join(", ")}
                  </p>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
