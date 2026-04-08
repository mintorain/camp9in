"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { applicantSchema, type ApplicantFormData } from "@/lib/schema";
import { SCHOOLS, SUBJECTS, EDUCATION_OPTIONS } from "@/lib/constants";

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function ApplyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ApplicantFormData>({
    resolver: zodResolver(applicantSchema),
    defaultValues: {
      schools: [],
      subjects: [],
      privacyAgreed: false as unknown as true,
    },
  });

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [dbClosedIds, setDbClosedIds] = useState<string[]>([]);
  const [showCounts, setShowCounts] = useState(true);

  useEffect(() => {
    fetch("/api/applicants/counts")
      .then((res) => res.json())
      .then((json) => {
        setCounts(json.data || {});
        setDbClosedIds(json.closedIds || []);
      })
      .catch(() => {});
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.show_counts !== undefined) {
          setShowCounts(json.data.show_counts !== "false");
        }
      })
      .catch(() => {});
  }, []);

  function isSubjectClosed(subjectId: string) {
    return dbClosedIds.includes(subjectId);
  }

  const selectedSchools = watch("schools") || [];
  const selectedSubjects = watch("subjects") || [];

  // 학교별 선택 과목 상태
  const [schoolSubjectMap, setSchoolSubjectMap] = useState<Record<string, string>>({});

  function handleSchoolToggle(schoolId: string) {
    const current = selectedSchools;
    let newSchools: string[];
    if (current.includes(schoolId)) {
      newSchools = current.filter((v) => v !== schoolId);
      // 해제된 학교의 과목 제거
      const newMap = { ...schoolSubjectMap };
      delete newMap[schoolId];
      setSchoolSubjectMap(newMap);
    } else {
      newSchools = [...current, schoolId];
    }
    setValue("schools", newSchools as ApplicantFormData["schools"], {
      shouldValidate: true,
    });

    // 학교별 과목 → subjects 배열 동기화
    const updatedMap = { ...schoolSubjectMap };
    if (!newSchools.includes(schoolId)) delete updatedMap[schoolId];
    syncSubjects(updatedMap);
  }

  function handleSchoolSubjectChange(schoolId: string, subjectId: string) {
    const newMap = { ...schoolSubjectMap };
    if (subjectId === "") {
      delete newMap[schoolId];
    } else {
      newMap[schoolId] = subjectId;
    }
    setSchoolSubjectMap(newMap);
    syncSubjects(newMap);
  }

  function syncSubjects(map: Record<string, string>) {
    const uniqueSubjects = [...new Set(Object.values(map).filter(Boolean))];
    setValue("subjects", uniqueSubjects as ApplicantFormData["subjects"], {
      shouldValidate: true,
    });
  }

  async function onSubmit(data: ApplicantFormData) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/applicants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "제출에 실패했습니다");
      }
      router.push("/apply/complete");
    } catch (e) {
      alert(e instanceof Error ? e.message : "제출에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="bg-white border-b border-gray-100">
        <nav className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary rounded-lg p-1"
            aria-label="메인 페이지로 돌아가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">강사 지원서 작성</h1>
        </nav>
      </header>

      <main className="flex-1 bg-gray-50 py-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="max-w-3xl mx-auto px-4 space-y-8"
        >
          {/* 기본 정보 */}
          <fieldset className="bg-white rounded-xl border border-gray-200 p-6">
            <legend className="text-lg font-bold text-gray-900 px-2">
              기본 정보
            </legend>
            <div className="grid md:grid-cols-2 gap-5 mt-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  {...register("name")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="홍길동"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    setValue("phone", formatted, { shouldValidate: true });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="010-0000-0000"
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1" role="alert">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="birthDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  생년월일 <span className="text-red-500">*</span>
                </label>
                <input
                  id="birthDate"
                  type="date"
                  {...register("birthDate")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                />
                {errors.birthDate && (
                  <p className="text-red-500 text-xs mt-1" role="alert">
                    {errors.birthDate.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  주소 (동까지만) <span className="text-red-500">*</span>
                </label>
                <input
                  id="address"
                  type="text"
                  {...register("address")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="예: 화성시 봉담읍"
                />
                {errors.address && (
                  <p className="text-red-500 text-xs mt-1" role="alert">
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>
          </fieldset>

          {/* 지원 정보 */}
          <fieldset className="bg-white rounded-xl border border-gray-200 p-6">
            <legend className="text-lg font-bold text-gray-900 px-2">
              지원 정보
            </legend>

            <div className="mt-4 space-y-6">
              {/* 지원 학교 */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  지원 학교 <span className="text-red-500">*</span>
                </p>
                <div className="flex flex-wrap gap-3">
                  {SCHOOLS.map((school) => (
                    <button
                      key={school.id}
                      type="button"
                      onClick={() => handleSchoolToggle(school.id)}
                      className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                        selectedSchools.includes(school.id)
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-700 border-gray-300 hover:border-primary/50"
                      }`}
                      aria-pressed={selectedSchools.includes(school.id)}
                    >
                      {school.shortName} ({school.dateLabel})
                    </button>
                  ))}
                </div>
                {errors.schools && (
                  <p className="text-red-500 text-xs mt-1" role="alert">
                    {errors.schools.message}
                  </p>
                )}
              </div>

              {/* 학교별 지원 과목 */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  학교별 지원 과목{" "}
                  <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  각 학교에서 동시에 과목이 운영되므로, 학교별로 1개 과목을 선택해주세요.
                  동일 과목을 여러 학교에서 선택하면 해당 학교 모두 동일 강사가 진행합니다.
                </p>
                {selectedSchools.length === 0 ? (
                  <p className="text-amber-600 text-xs bg-amber-50 px-3 py-2 rounded-lg">
                    먼저 지원할 학교를 선택해주세요.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedSchools.map((schoolId) => {
                      const school = SCHOOLS.find((s) => s.id === schoolId);
                      if (!school) return null;
                      const schoolSubjectList = SUBJECTS.filter((sub) =>
                        (school.subjects as readonly string[]).includes(sub.id)
                      ).filter((sub) => !isSubjectClosed(sub.id));

                      return (
                        <div key={schoolId} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-indigo-600 shrink-0 w-16">
                              {school.shortName}
                            </span>
                            <label htmlFor={`subject-${schoolId}`} className="sr-only">{school.shortName} 과목 선택</label>
                            <select
                              id={`subject-${schoolId}`}
                              value={schoolSubjectMap[schoolId] || ""}
                              onChange={(e) => handleSchoolSubjectChange(schoolId, e.target.value)}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary bg-white"
                            >
                              <option value="">과목을 선택해주세요</option>
                              {schoolSubjectList.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                  {subject.icon} {subject.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          {schoolSubjectMap[schoolId] && (
                            <p className="text-[11px] text-gray-400 mt-1.5 ml-19">
                              {SUBJECTS.find((s) => s.id === schoolSubjectMap[schoolId])?.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {errors.subjects && (
                  <p className="text-red-500 text-xs mt-1" role="alert">
                    {errors.subjects.message}
                  </p>
                )}
              </div>
            </div>
          </fieldset>

          {/* 학력 및 경력 */}
          <fieldset className="bg-white rounded-xl border border-gray-200 p-6">
            <legend className="text-lg font-bold text-gray-900 px-2">
              학력 및 경력
            </legend>
            <div className="space-y-5 mt-4">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="education"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    최종 학력 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="education"
                    {...register("education")}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">선택해주세요</option>
                    {EDUCATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  {errors.education && (
                    <p className="text-red-500 text-xs mt-1" role="alert">
                      {errors.education.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="major"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    전공
                  </label>
                  <input
                    id="major"
                    type="text"
                    {...register("major")}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="예: 컴퓨터공학"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="experience"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  경력 사항 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="experience"
                  rows={4}
                  {...register("experience")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                  placeholder="관련 교육/강의 경력을 작성해주세요 (20자 이상)"
                />
                {errors.experience && (
                  <p className="text-red-500 text-xs mt-1" role="alert">
                    {errors.experience.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="qualifications"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  자격 사항
                </label>
                <textarea
                  id="qualifications"
                  rows={3}
                  {...register("qualifications")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                  placeholder="관련 자격증을 기재해주세요"
                />
              </div>

              <div>
                <label
                  htmlFor="introduction"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  자기소개 (최대 500자)
                </label>
                <textarea
                  id="introduction"
                  rows={4}
                  {...register("introduction")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                  placeholder="지원 동기를 포함하여 자기소개를 작성해주세요"
                />
                {errors.introduction && (
                  <p className="text-red-500 text-xs mt-1" role="alert">
                    {errors.introduction.message}
                  </p>
                )}
              </div>
            </div>
          </fieldset>

          {/* 강사료 지급 규정 */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">강사료 지급 규정</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <p className="font-semibold text-indigo-700 text-sm mb-3">미금초등학교</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="bg-indigo-50/50 rounded-lg p-3">
                    <p className="font-medium text-gray-700">1~4학년 (교실수업)</p>
                    <p className="mt-1">1개반 80분 기준 <strong className="text-indigo-600">80,000원</strong></p>
                    <p className="text-xs text-gray-400 mt-0.5">1일 2개반 운영 (160,000원)</p>
                  </div>
                  <div className="bg-indigo-50/50 rounded-lg p-3">
                    <p className="font-medium text-gray-700">5~6학년 (강당 체험부스)</p>
                    <p className="mt-1">09:00~12:20 / 20분씩 8타임 <strong className="text-indigo-600">160,000원</strong></p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="font-semibold text-amber-700 text-sm mb-3">정림초 · 청원초</p>
                <div className="bg-amber-50/50 rounded-lg p-3 text-sm text-gray-600">
                  <p className="font-medium text-gray-700">자율 체험부스 운영</p>
                  <p className="mt-1">09:00~12:00 <strong className="text-amber-600">150,000원</strong></p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">* 강사료는 원천징수 후 지급됩니다.</p>
          </div>

          {/* 개인정보 동의 */}
          <fieldset className="bg-white rounded-xl border border-gray-200 p-6">
            <legend className="text-lg font-bold text-gray-900 px-2">
              개인정보 수집·이용 동의
            </legend>

            <div className="mt-4">
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 mb-4 max-h-48 overflow-y-auto">
                <p className="font-semibold text-gray-800 mb-2">
                  개인정보 수집·이용 동의서
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    <strong>수집 목적:</strong> AI캠프 강사 모집 및 선발, 연락
                  </li>
                  <li>
                    <strong>수집 항목:</strong> 이름, 연락처, 이메일, 주소(동까지),
                    생년월일, 학력, 경력, 자격사항
                  </li>
                  <li>
                    <strong>보유 기간:</strong> 모집 완료 후 1년간 보관 후 파기
                  </li>
                  <li>
                    <strong>동의 거부 시</strong> 지원이 불가합니다.
                  </li>
                </ol>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("privacyAgreed")}
                  className="mt-0.5 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">
                  위 개인정보 수집·이용에 동의합니다{" "}
                  <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.privacyAgreed && (
                <p className="text-red-500 text-xs mt-1" role="alert">
                  {errors.privacyAgreed.message}
                </p>
              )}
            </div>
          </fieldset>

          {/* 제출 버튼 */}
          <div className="flex gap-3 pb-8">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  제출 중...
                </span>
              ) : (
                "지원서 제출"
              )}
            </button>
          </div>
        </form>
      </main>
    </>
  );
}
