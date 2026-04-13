"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Download } from "lucide-react";
import { SCHOOLS, SUBJECTS } from "@/lib/constants";
import { adminFetch, getAdminToken } from "@/lib/admin";

interface Applicant {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: string;
  applicant_schools: { school_id: string }[];
  applicant_subjects: { subject_id: string }[];
  assignments: { school_id: string; subject_id: string }[];
}

export default function AssignedPage() {
  const router = useRouter();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAdminToken()) {
      router.push("/admin");
      return;
    }
    fetchData();
  }, [router]);

  async function fetchData() {
    try {
      const res = await adminFetch("/api/applicants?status=accepted");
      const { data } = await res.json();
      setApplicants(data || []);
    } catch {
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </main>
    );
  }

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
          <h1 className="text-lg font-bold text-gray-900">학교별 배정 강사 명단</h1>
          <span className="ml-auto text-sm text-gray-500">
            합격자 {applicants.length}명
          </span>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {applicants.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">배정된 강사가 없습니다</p>
            <p className="text-sm mt-2">지원자 목록에서 상태를 &apos;선발&apos;로 변경하면 여기에 표시됩니다.</p>
          </div>
        ) : (
          SCHOOLS.map((school) => {
            const schoolApplicants = applicants.filter((a) =>
              a.assignments?.some((asn) => asn.school_id === school.id)
            );

            if (schoolApplicants.length === 0) return null;

            const schoolSubjects = SUBJECTS.filter((sub) =>
              (school.subjects as readonly string[]).includes(sub.id)
            );

            return (
              <section key={school.id}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    {school.name}
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      {schoolApplicants.length}명 배정
                    </span>
                  </h2>
                  <span className="text-xs text-gray-400">{school.dateLabel}</span>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th scope="col" className="text-left px-4 py-3 font-medium text-gray-600 w-32">
                          과목
                        </th>
                        <th scope="col" className="text-left px-4 py-3 font-medium text-gray-600">
                          배정 강사
                        </th>
                        <th scope="col" className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">
                          연락처
                        </th>
                        <th scope="col" className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">
                          이메일
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {schoolSubjects.map((subject) => {
                        const assigned = schoolApplicants.filter((a) =>
                          a.assignments?.some(
                            (asn) =>
                              asn.school_id === school.id &&
                              asn.subject_id === subject.id
                          )
                        );

                        return (
                          <tr
                            key={subject.id}
                            className="border-b border-gray-100 last:border-0"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900 align-top">
                              <span className="text-base mr-1">{subject.icon}</span>
                              {subject.name}
                            </td>
                            <td className="px-4 py-3 align-top">
                              {assigned.length === 0 ? (
                                <span className="text-gray-300 text-xs">미배정</span>
                              ) : (
                                <div className="space-y-1">
                                  {assigned.map((a) => (
                                    <span
                                      key={a.id}
                                      className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-medium mr-1"
                                    >
                                      {a.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-500 align-top hidden md:table-cell">
                              {assigned.map((a) => (
                                <p key={a.id} className="text-xs">{a.phone}</p>
                              ))}
                            </td>
                            <td className="px-4 py-3 text-gray-500 align-top hidden lg:table-cell">
                              {assigned.map((a) => (
                                <p key={a.id} className="text-xs">{a.email}</p>
                              ))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })
        )}

        <div className="flex gap-3">
          <Link
            href="/admin/applicants"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            지원자 관리
          </Link>
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            대시보드
          </Link>
        </div>
      </main>
    </div>
  );
}
