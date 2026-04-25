"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  School as SchoolIcon,
  BookOpen,
} from "lucide-react";
import type { School, Subject, CampType } from "@/lib/data";
import { adminFetch, getAdminToken } from "@/lib/admin";

type Tab = "schools" | "subjects";

interface SchoolFormData {
  id: string;
  name: string;
  shortName: string;
  startDate: string;
  endDate: string;
  recruitDeadline: string;
  dateLabel: string;
  time: string;
  location: string;
  target: string;
  capacityPerSubject: number;
  campType: CampType;
  hideName: boolean;
  hideScheduleCard: boolean;
  isClosed: boolean;
  sortOrder: number;
}

interface SubjectFormData {
  id: string;
  name: string;
  description: string;
  skills: string;
  icon: string;
  isClosed: boolean;
  sortOrder: number;
}

const emptySchool: SchoolFormData = {
  id: "",
  name: "",
  shortName: "",
  startDate: "",
  endDate: "",
  recruitDeadline: "",
  dateLabel: "",
  time: "",
  location: "",
  target: "",
  capacityPerSubject: 8,
  campType: "class",
  hideName: false,
  hideScheduleCard: false,
  isClosed: false,
  sortOrder: 100,
};

const emptySubject: SubjectFormData = {
  id: "",
  name: "",
  description: "",
  skills: "",
  icon: "",
  isClosed: false,
  sortOrder: 100,
};

export default function CampsAdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("schools");
  const [schools, setSchools] = useState<School[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [schoolForm, setSchoolForm] = useState<SchoolFormData | null>(null);
  const [schoolEditId, setSchoolEditId] = useState<string | null>(null); // null = new
  const [subjectForm, setSubjectForm] = useState<SubjectFormData | null>(null);
  const [subjectEditId, setSubjectEditId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [sRes, subRes] = await Promise.all([
        fetch("/api/schools"),
        fetch("/api/subjects"),
      ]);
      const sJson = await sRes.json();
      const subJson = await subRes.json();
      setSchools(sJson.data || []);
      setSubjects(subJson.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getAdminToken()) {
      router.push("/admin");
      return;
    }
    fetchData();
  }, [router, fetchData]);

  // ============ 학교 ============
  function openSchoolForm(school: School | null) {
    if (school) {
      setSchoolEditId(school.id);
      setSchoolForm({
        id: school.id,
        name: school.name,
        shortName: school.shortName,
        startDate: school.date,
        endDate: school.endDate,
        recruitDeadline: school.recruitDeadline || "",
        dateLabel: school.dateLabel,
        time: school.time,
        location: school.location,
        target: school.target || "",
        capacityPerSubject: school.capacityPerSubject,
        campType: school.campType,
        hideName: school.hideName,
        hideScheduleCard: school.hideScheduleCard,
        isClosed: school.isClosed,
        sortOrder: school.sortOrder,
      });
    } else {
      setSchoolEditId(null);
      setSchoolForm({ ...emptySchool });
    }
  }

  async function saveSchool() {
    if (!schoolForm) return;
    if (!schoolForm.id || !schoolForm.name || !schoolForm.shortName || !schoolForm.startDate || !schoolForm.endDate) {
      alert("ID, 학교명, 짧은이름, 시작일, 종료일은 필수입니다");
      return;
    }
    setSaving(true);
    try {
      const isEdit = !!schoolEditId;
      const url = isEdit ? `/api/schools/${schoolEditId}` : "/api/schools";
      const method = isEdit ? "PATCH" : "POST";
      const res = await adminFetch(url, {
        method,
        body: JSON.stringify(schoolForm),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "저장 실패");
        return;
      }
      setSchoolForm(null);
      setSchoolEditId(null);
      await fetchData();
    } finally {
      setSaving(false);
    }
  }

  async function deleteSchool(id: string) {
    if (!confirm(`"${id}" 학교를 삭제하시겠습니까? (배정/지원 데이터가 있으면 삭제 불가)`)) return;
    setDeletingId(id);
    try {
      const res = await adminFetch(`/api/schools/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "삭제 실패");
        return;
      }
      await fetchData();
    } finally {
      setDeletingId(null);
    }
  }

  // ============ 과목 ============
  function openSubjectForm(subject: Subject | null) {
    if (subject) {
      setSubjectEditId(subject.id);
      setSubjectForm({
        id: subject.id,
        name: subject.name,
        description: subject.description,
        skills: subject.skills,
        icon: subject.icon,
        isClosed: subject.closed,
        sortOrder: subject.sortOrder,
      });
    } else {
      setSubjectEditId(null);
      setSubjectForm({ ...emptySubject });
    }
  }

  async function saveSubject() {
    if (!subjectForm) return;
    if (!subjectForm.id || !subjectForm.name) {
      alert("ID와 과목명은 필수입니다");
      return;
    }
    setSaving(true);
    try {
      const isEdit = !!subjectEditId;
      const url = isEdit ? `/api/subjects/${subjectEditId}` : "/api/subjects";
      const method = isEdit ? "PATCH" : "POST";
      const res = await adminFetch(url, {
        method,
        body: JSON.stringify(subjectForm),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "저장 실패");
        return;
      }
      setSubjectForm(null);
      setSubjectEditId(null);
      await fetchData();
    } finally {
      setSaving(false);
    }
  }

  async function deleteSubject(id: string) {
    if (!confirm(`"${id}" 과목을 삭제하시겠습니까? (배정/지원 데이터가 있으면 삭제 불가)`)) return;
    setDeletingId(id);
    try {
      const res = await adminFetch(`/api/subjects/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "삭제 실패");
        return;
      }
      await fetchData();
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="text-gray-500 hover:text-gray-900 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="대시보드로"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">캠프 관리</h1>
          <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
            학교 {schools.length}개 · 과목 {subjects.length}개
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* 탭 */}
        <div className="flex gap-1 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab("schools")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors flex items-center gap-2 ${
              tab === "schools"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <SchoolIcon className="w-4 h-4" />
            학교 ({schools.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("subjects")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors flex items-center gap-2 ${
              tab === "subjects"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            과목 ({subjects.length})
          </button>
        </div>

        {/* 학교 탭 */}
        {tab === "schools" && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">
                ※ 학년-과목 배정(gradeSchedule) 편집은 다음 단계에서 추가됩니다.
              </p>
              <button
                type="button"
                onClick={() => openSchoolForm(null)}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                학교 추가
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">ID</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">이름</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">기간</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">유형</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">상태</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-gray-400 text-sm">
                        등록된 학교가 없습니다. "학교 추가" 버튼으로 시작하세요.
                      </td>
                    </tr>
                  ) : (
                    schools.map((s) => (
                      <tr key={s.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{s.id}</td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400">{s.shortName}</p>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-600">
                          <p>{s.date} ~ {s.endDate}</p>
                          {s.recruitDeadline && <p className="text-amber-600">마감: {s.recruitDeadline}</p>}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">
                            {s.campType === "class" ? "반별" : s.campType === "rotation" ? "순환" : "복합"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs">
                          {s.isClosed && <span className="text-red-600">마감</span>}
                          {s.hideName && <span className="ml-1 text-gray-400">[이름숨김]</span>}
                          {s.hideScheduleCard && <span className="ml-1 text-gray-400">[카드숨김]</span>}
                          {!s.isClosed && !s.hideName && !s.hideScheduleCard && <span className="text-emerald-600">정상</span>}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => openSchoolForm(s)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 mr-1"
                          >
                            <Pencil className="w-3 h-3" />
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSchool(s.id)}
                            disabled={deletingId === s.id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-50 hover:bg-red-100 text-red-700 disabled:opacity-40"
                          >
                            <Trash2 className="w-3 h-3" />
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 과목 탭 */}
        {tab === "subjects" && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">
                과목은 학교의 학년 배정에 사용됩니다.
              </p>
              <button
                type="button"
                onClick={() => openSubjectForm(null)}
                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                과목 추가
              </button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">ID</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">아이콘</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">이름·설명</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">필요 역량</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">상태</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-gray-400 text-sm">
                        등록된 과목이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    subjects.map((sub) => (
                      <tr key={sub.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{sub.id}</td>
                        <td className="px-3 py-2.5 text-2xl">{sub.icon}</td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-gray-900">{sub.name}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{sub.description}</p>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-500 line-clamp-1">{sub.skills}</td>
                        <td className="px-3 py-2.5 text-xs">
                          {sub.closed ? (
                            <span className="text-red-600">마감</span>
                          ) : (
                            <span className="text-emerald-600">모집중</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => openSubjectForm(sub)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 mr-1"
                          >
                            <Pencil className="w-3 h-3" />
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSubject(sub.id)}
                            disabled={deletingId === sub.id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-50 hover:bg-red-100 text-red-700 disabled:opacity-40"
                          >
                            <Trash2 className="w-3 h-3" />
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* 학교 추가/수정 모달 */}
      {schoolForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-base font-bold text-gray-900">
                {schoolEditId ? "학교 수정" : "학교 추가"}
              </h3>
              <button
                type="button"
                onClick={() => { setSchoolForm(null); setSchoolEditId(null); }}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="ID (영소문자/숫자/하이픈)" required>
                  <input
                    type="text"
                    value={schoolForm.id}
                    disabled={!!schoolEditId}
                    onChange={(e) => setSchoolForm({ ...schoolForm, id: e.target.value })}
                    className={inputCls + (schoolEditId ? " bg-gray-50 text-gray-500" : "")}
                    placeholder="예: hwaseong-bom"
                  />
                </Field>
                <Field label="짧은 이름" required>
                  <input
                    type="text"
                    value={schoolForm.shortName}
                    onChange={(e) => setSchoolForm({ ...schoolForm, shortName: e.target.value })}
                    className={inputCls}
                    placeholder="예: 봄초"
                  />
                </Field>
              </div>
              <Field label="학교명 (전체)" required>
                <input
                  type="text"
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  className={inputCls}
                  placeholder="예: 화성 봄초등학교"
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="시작일" required>
                  <input
                    type="date"
                    value={schoolForm.startDate}
                    onChange={(e) => setSchoolForm({ ...schoolForm, startDate: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="종료일" required>
                  <input
                    type="date"
                    value={schoolForm.endDate}
                    onChange={(e) => setSchoolForm({ ...schoolForm, endDate: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="지원 마감일">
                  <input
                    type="date"
                    value={schoolForm.recruitDeadline}
                    onChange={(e) => setSchoolForm({ ...schoolForm, recruitDeadline: e.target.value })}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="기간 표시 라벨 (예: '2026년 4월 20일~24일')">
                <input
                  type="text"
                  value={schoolForm.dateLabel}
                  onChange={(e) => setSchoolForm({ ...schoolForm, dateLabel: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="시간">
                  <input
                    type="text"
                    value={schoolForm.time}
                    onChange={(e) => setSchoolForm({ ...schoolForm, time: e.target.value })}
                    className={inputCls}
                    placeholder="오전 9:00 ~ 12:00"
                  />
                </Field>
                <Field label="대상 (선택)">
                  <input
                    type="text"
                    value={schoolForm.target}
                    onChange={(e) => setSchoolForm({ ...schoolForm, target: e.target.value })}
                    className={inputCls}
                    placeholder="전교생 대상"
                  />
                </Field>
              </div>
              <Field label="장소">
                <input
                  type="text"
                  value={schoolForm.location}
                  onChange={(e) => setSchoolForm({ ...schoolForm, location: e.target.value })}
                  className={inputCls}
                  placeholder="강당"
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="과목별 정원">
                  <input
                    type="number"
                    value={schoolForm.capacityPerSubject}
                    onChange={(e) => setSchoolForm({ ...schoolForm, capacityPerSubject: Number(e.target.value) })}
                    className={inputCls}
                  />
                </Field>
                <Field label="캠프 유형">
                  <select
                    value={schoolForm.campType}
                    onChange={(e) => setSchoolForm({ ...schoolForm, campType: e.target.value as CampType })}
                    className={inputCls}
                  >
                    <option value="class">반별</option>
                    <option value="rotation">순환</option>
                    <option value="hybrid">복합</option>
                  </select>
                </Field>
                <Field label="정렬 순서">
                  <input
                    type="number"
                    value={schoolForm.sortOrder}
                    onChange={(e) => setSchoolForm({ ...schoolForm, sortOrder: Number(e.target.value) })}
                    className={inputCls}
                  />
                </Field>
              </div>
              <div className="flex gap-4 text-sm pt-2">
                <CheckboxField label="이름 숨김" checked={schoolForm.hideName} onChange={(v) => setSchoolForm({ ...schoolForm, hideName: v })} />
                <CheckboxField label="일정카드 숨김" checked={schoolForm.hideScheduleCard} onChange={(v) => setSchoolForm({ ...schoolForm, hideScheduleCard: v })} />
                <CheckboxField label="모집 마감" checked={schoolForm.isClosed} onChange={(v) => setSchoolForm({ ...schoolForm, isClosed: v })} />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button
                type="button"
                onClick={() => { setSchoolForm(null); setSchoolEditId(null); }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white text-sm"
              >
                취소
              </button>
              <button
                type="button"
                onClick={saveSchool}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (schoolEditId ? "수정 저장" : "추가")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 과목 추가/수정 모달 */}
      {subjectForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">
                {subjectEditId ? "과목 수정" : "과목 추가"}
              </h3>
              <button
                type="button"
                onClick={() => { setSubjectForm(null); setSubjectEditId(null); }}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="ID (영소문자/숫자/하이픈)" required>
                    <input
                      type="text"
                      value={subjectForm.id}
                      disabled={!!subjectEditId}
                      onChange={(e) => setSubjectForm({ ...subjectForm, id: e.target.value })}
                      className={inputCls + (subjectEditId ? " bg-gray-50 text-gray-500" : "")}
                      placeholder="예: ai-music"
                    />
                  </Field>
                </div>
                <Field label="아이콘 (이모지)">
                  <input
                    type="text"
                    value={subjectForm.icon}
                    onChange={(e) => setSubjectForm({ ...subjectForm, icon: e.target.value })}
                    className={inputCls + " text-2xl text-center"}
                    placeholder="🎵"
                    maxLength={4}
                  />
                </Field>
              </div>
              <Field label="과목명" required>
                <input
                  type="text"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="설명">
                <textarea
                  rows={2}
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  className={inputCls + " resize-none"}
                />
              </Field>
              <Field label="필요 역량 (콤마 구분)">
                <input
                  type="text"
                  value={subjectForm.skills}
                  onChange={(e) => setSubjectForm({ ...subjectForm, skills: e.target.value })}
                  className={inputCls}
                  placeholder="음악교육, AI도구 활용"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3 items-end">
                <Field label="정렬 순서">
                  <input
                    type="number"
                    value={subjectForm.sortOrder}
                    onChange={(e) => setSubjectForm({ ...subjectForm, sortOrder: Number(e.target.value) })}
                    className={inputCls}
                  />
                </Field>
                <CheckboxField label="모집 마감" checked={subjectForm.isClosed} onChange={(v) => setSubjectForm({ ...subjectForm, isClosed: v })} />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button
                type="button"
                onClick={() => { setSubjectForm(null); setSubjectEditId(null); }}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white text-sm"
              >
                취소
              </button>
              <button
                type="button"
                onClick={saveSubject}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (subjectEditId ? "수정 저장" : "추가")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <span className="text-gray-700">{label}</span>
    </label>
  );
}
