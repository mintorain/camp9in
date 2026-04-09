"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle, ChevronRight } from "lucide-react";
import { applicantSchema, type ApplicantFormData } from "@/lib/schema";
import { SCHOOLS, SUBJECTS, EDUCATION_OPTIONS } from "@/lib/constants";

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

const STEPS = [
  { id: 1, label: "기본 정보" },
  { id: 2, label: "지원 학교·과목" },
  { id: 3, label: "학력·경력" },
  { id: 4, label: "확인·제출" },
];

export default function ApplyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
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
    fetch("/api/applicants/counts").then((r) => r.json()).then((j) => { setCounts(j.data || {}); setDbClosedIds(j.closedIds || []); }).catch(() => {});
    fetch("/api/settings").then((r) => r.json()).then((j) => { if (j.data?.show_counts !== undefined) setShowCounts(j.data.show_counts !== "false"); }).catch(() => {});
  }, []);

  function isSubjectClosed(subjectId: string) {
    return dbClosedIds.includes(subjectId);
  }

  const selectedSchools = watch("schools") || [];
  const selectedSubjects = watch("subjects") || [];
  const [schoolSubjectMap, setSchoolSubjectMap] = useState<Record<string, string>>({});

  function handleSchoolToggle(schoolId: string) {
    const current = selectedSchools;
    let newSchools: string[];
    if (current.includes(schoolId)) {
      newSchools = current.filter((v) => v !== schoolId);
      const newMap = { ...schoolSubjectMap };
      delete newMap[schoolId];
      setSchoolSubjectMap(newMap);
    } else {
      newSchools = [...current, schoolId];
    }
    setValue("schools", newSchools as ApplicantFormData["schools"], { shouldValidate: true });
    const updatedMap = { ...schoolSubjectMap };
    if (!newSchools.includes(schoolId)) delete updatedMap[schoolId];
    syncSubjects(updatedMap);
  }

  function handleSchoolSubjectChange(schoolId: string, subjectId: string) {
    const newMap = { ...schoolSubjectMap };
    if (subjectId === "") { delete newMap[schoolId]; } else { newMap[schoolId] = subjectId; }
    setSchoolSubjectMap(newMap);
    syncSubjects(newMap);
  }

  function syncSubjects(map: Record<string, string>) {
    const uniqueSubjects = [...new Set(Object.values(map).filter(Boolean))];
    setValue("subjects", uniqueSubjects as ApplicantFormData["subjects"], { shouldValidate: true });
  }

  async function nextStep() {
    let valid = true;
    if (step === 1) valid = await trigger(["name", "phone", "email", "birthDate", "address"]);
    if (step === 2) valid = await trigger(["schools", "subjects"]);
    if (step === 3) valid = await trigger(["education", "experience"]);
    if (valid) setStep((s) => Math.min(s + 1, 4));
  }

  async function onSubmit(data: ApplicantFormData) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/applicants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "제출에 실패했습니다"); }
      router.push("/apply/complete");
    } catch (e) {
      alert(e instanceof Error ? e.message : "제출에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow placeholder:text-slate-300";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5";
  const errorClass = "text-red-500 text-xs mt-1";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/60 sticky top-0 z-40">
        <nav className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-slate-700 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" aria-label="메인으로">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold text-slate-900">강사 지원서</h1>
        </nav>
      </header>

      {/* 진행 단계 */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <button
                type="button"
                onClick={() => s.id < step && setStep(s.id)}
                className={`flex items-center gap-2 text-xs font-semibold transition-colors ${
                  s.id === step ? "text-indigo-600" : s.id < step ? "text-emerald-600 cursor-pointer" : "text-slate-300"
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  s.id === step ? "bg-indigo-600 text-white" : s.id < step ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                }`}>
                  {s.id < step ? <CheckCircle className="w-3.5 h-3.5" /> : s.id}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${s.id < step ? "bg-emerald-300" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* Step 1: 기본 정보 */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">기본 정보를 입력해주세요</h2>
                <p className="text-sm text-slate-400 mt-1">정확한 연락처를 입력해주세요. 선발 결과 안내에 사용됩니다.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className={labelClass}>이름 <span className="text-red-400">*</span></label>
                  <input id="name" type="text" {...register("name")} className={inputClass} placeholder="홍길동" />
                  {errors.name && <p className={errorClass} role="alert">{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className={labelClass}>연락처 <span className="text-red-400">*</span></label>
                  <input id="phone" type="tel" {...register("phone")} onChange={(e) => setValue("phone", formatPhone(e.target.value), { shouldValidate: true })} className={inputClass} placeholder="010-0000-0000" />
                  {errors.phone && <p className={errorClass} role="alert">{errors.phone.message}</p>}
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>이메일 <span className="text-red-400">*</span></label>
                  <input id="email" type="email" {...register("email")} className={inputClass} placeholder="example@email.com" />
                  {errors.email && <p className={errorClass} role="alert">{errors.email.message}</p>}
                </div>
                <div>
                  <label htmlFor="birthDate" className={labelClass}>생년월일 <span className="text-red-400">*</span></label>
                  <input id="birthDate" type="date" {...register("birthDate")} className={inputClass} />
                  {errors.birthDate && <p className={errorClass} role="alert">{errors.birthDate.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="address" className={labelClass}>주소 (동까지만) <span className="text-red-400">*</span></label>
                  <input id="address" type="text" {...register("address")} className={inputClass} placeholder="예: 화성시 봉담읍" />
                  {errors.address && <p className={errorClass} role="alert">{errors.address.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 학교·과목 */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">지원할 학교와 과목을 선택하세요</h2>
                <p className="text-sm text-slate-400 mt-1">학교는 복수 선택 가능하며, 각 학교별로 1개 과목을 선택해주세요.</p>
              </div>

              <div>
                <p className={labelClass}>지원 학교 <span className="text-red-400">*</span></p>
                <div className="grid grid-cols-1 gap-3">
                  {SCHOOLS.map((school) => {
                    const selected = selectedSchools.includes(school.id);
                    return (
                      <button key={school.id} type="button" onClick={() => handleSchoolToggle(school.id)}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                          selected ? "border-indigo-500 bg-indigo-50/50 shadow-sm shadow-indigo-100" : "border-slate-200 bg-white hover:border-slate-300"
                        }`} aria-pressed={selected}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? "border-indigo-500 bg-indigo-500" : "border-slate-300"}`}>
                          {selected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${selected ? "text-indigo-700" : "text-slate-700"}`}>{school.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{school.dateLabel} | {school.time}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.schools && <p className={errorClass} role="alert">{errors.schools.message}</p>}
              </div>

              {selectedSchools.length > 0 && (
                <div>
                  <p className={labelClass}>학교별 지원 과목 <span className="text-red-400">*</span></p>
                  <p className="text-xs text-slate-400 mb-3">동시 운영이므로 학교별 1개 과목만 선택 가능합니다.</p>
                  <div className="space-y-3">
                    {selectedSchools.map((schoolId) => {
                      const school = SCHOOLS.find((s) => s.id === schoolId);
                      if (!school) return null;
                      const subjectList = SUBJECTS.filter((sub) => (school.subjects as readonly string[]).includes(sub.id)).filter((sub) => !isSubjectClosed(sub.id));
                      const selectedSub = schoolSubjectMap[schoolId];
                      const subInfo = selectedSub ? SUBJECTS.find((s) => s.id === selectedSub) : null;
                      return (
                        <div key={schoolId} className="bg-white rounded-xl border border-slate-200 p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-sm font-bold text-indigo-600">{school.shortName}</span>
                            {subInfo && <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">{subInfo.icon} {subInfo.name}</span>}
                          </div>
                          <label htmlFor={`subject-${schoolId}`} className="sr-only">{school.shortName} 과목</label>
                          <select id={`subject-${schoolId}`} value={schoolSubjectMap[schoolId] || ""} onChange={(e) => handleSchoolSubjectChange(schoolId, e.target.value)}
                            className={inputClass}>
                            <option value="">과목을 선택해주세요</option>
                            {subjectList.map((subject) => (
                              <option key={subject.id} value={subject.id}>{subject.icon} {subject.name} — {subject.description}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                  {errors.subjects && <p className={errorClass} role="alert">{errors.subjects.message}</p>}
                </div>
              )}
            </div>
          )}

          {/* Step 3: 학력·경력 */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">학력과 경력을 알려주세요</h2>
                <p className="text-sm text-slate-400 mt-1">관련 경험이 있으면 더 좋습니다.</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="education" className={labelClass}>최종 학력 <span className="text-red-400">*</span></label>
                  <select id="education" {...register("education")} className={inputClass}>
                    <option value="">선택해주세요</option>
                    {EDUCATION_OPTIONS.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
                  </select>
                  {errors.education && <p className={errorClass} role="alert">{errors.education.message}</p>}
                </div>
                <div>
                  <label htmlFor="major" className={labelClass}>전공</label>
                  <input id="major" type="text" {...register("major")} className={inputClass} placeholder="예: 컴퓨터공학" />
                </div>
              </div>
              <div>
                <label htmlFor="experience" className={labelClass}>경력 사항 <span className="text-red-400">*</span></label>
                <textarea id="experience" rows={4} {...register("experience")} className={`${inputClass} resize-none`} placeholder="관련 교육/강의 경력을 작성해주세요 (20자 이상)" />
                {errors.experience && <p className={errorClass} role="alert">{errors.experience.message}</p>}
              </div>
              <div>
                <label htmlFor="qualifications" className={labelClass}>자격 사항</label>
                <textarea id="qualifications" rows={3} {...register("qualifications")} className={`${inputClass} resize-none`} placeholder="관련 자격증을 기재해주세요" />
              </div>
              <div>
                <label htmlFor="introduction" className={labelClass}>자기소개 (최대 500자)</label>
                <textarea id="introduction" rows={4} {...register("introduction")} className={`${inputClass} resize-none`} placeholder="지원 동기를 포함하여 자기소개를 작성해주세요" />
                {errors.introduction && <p className={errorClass} role="alert">{errors.introduction.message}</p>}
              </div>
            </div>
          )}

          {/* Step 4: 확인·제출 */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">지원 내용을 확인하고 제출하세요</h2>
              </div>

              {/* 강사료 */}
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-100 p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-3">강사료 지급 규정</h3>
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/80 rounded-lg p-3">
                    <p className="font-semibold text-indigo-700 text-xs mb-2">미금초</p>
                    <p className="text-slate-600">1~4학년: 80분 <strong className="text-indigo-600">80,000원</strong> (1일 2개반)</p>
                    <p className="text-slate-600 mt-1">5~6학년: 1일 <strong className="text-indigo-600">160,000원</strong></p>
                  </div>
                  <div className="bg-white/80 rounded-lg p-3">
                    <p className="font-semibold text-amber-700 text-xs mb-2">정림초 · 청원초</p>
                    <p className="text-slate-600">09:00~12:00 <strong className="text-amber-600">150,000원</strong></p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">* 원천징수 후 지급</p>
              </div>

              {/* 개인정보 */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-3">개인정보 수집·이용 동의</h3>
                <div className="bg-slate-50 rounded-lg p-4 text-xs text-slate-500 mb-4 max-h-36 overflow-y-auto leading-relaxed">
                  <ol className="list-decimal list-inside space-y-1">
                    <li><strong>수집 목적:</strong> AI캠프 강사 모집 및 선발, 연락</li>
                    <li><strong>수집 항목:</strong> 이름, 연락처, 이메일, 주소, 생년월일, 학력, 경력, 자격사항</li>
                    <li><strong>보유 기간:</strong> 모집 완료 후 1년간 보관 후 파기</li>
                    <li><strong>동의 거부 시</strong> 지원이 불가합니다.</li>
                  </ol>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register("privacyAgreed")} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm text-slate-700 font-medium">위 개인정보 수집·이용에 동의합니다 <span className="text-red-400">*</span></span>
                </label>
                {errors.privacyAgreed && <p className={errorClass} role="alert">{errors.privacyAgreed.message}</p>}
              </div>

              {/* 제출 */}
              <button type="submit" disabled={submitting}
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                {submitting ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> 제출 중...</span>
                ) : "지원서 제출"}
              </button>
            </div>
          )}

          {/* 하단 네비게이션 */}
          {step < 4 && (
            <div className="flex gap-3 mt-8 pb-8">
              {step > 1 && (
                <button type="button" onClick={() => setStep((s) => s - 1)}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  이전
                </button>
              )}
              <button type="button" onClick={nextStep}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                다음 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
