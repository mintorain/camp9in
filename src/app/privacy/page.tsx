import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DuonFooter from "@/components/DuonFooter";

export const metadata = { title: "개인정보처리방침 | 두온교육 AI캠프" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-200">
        <nav className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-slate-700 p-1 rounded-lg" aria-label="메인으로">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold text-slate-900">개인정보처리방침</h1>
        </nav>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10 text-sm text-slate-700 leading-relaxed space-y-8">
        <p className="text-xs text-slate-400">시행일: 2026년 4월 7일</p>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">1. 개인정보의 처리 목적</h2>
          <p>두온교육(주)(이하 &ldquo;회사&rdquo;)는 다음 목적을 위해 개인정보를 처리합니다.</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
            <li>AI캠프 강사 모집 및 선발</li>
            <li>지원자 연락 및 결과 통보</li>
            <li>캠프 운영 관련 행정 처리</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">2. 수집하는 개인정보 항목</h2>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li><strong>필수:</strong> 이름, 연락처, 이메일, 주소(동까지), 생년월일, 최종 학력, 경력 사항</li>
            <li><strong>선택:</strong> 전공, 자격 사항, 자기소개</li>
            <li><strong>자동 수집:</strong> 접속 IP, 브라우저 정보, 페이지 조회 기록 (접속 분석 목적)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">3. 개인정보의 보유 및 이용 기간</h2>
          <p>강사 모집 완료 후 <strong>1년간</strong> 보관하며, 보유 기간 경과 시 지체 없이 파기합니다.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">4. 개인정보의 제3자 제공</h2>
          <p>회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 다음의 경우에는 예외로 합니다.</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">5. 개인정보의 파기</h2>
          <p>보유 기간 경과, 처리 목적 달성 등 개인정보가 불필요하게 된 경우 지체 없이 해당 개인정보를 파기합니다.</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
            <li>전자적 파일: 복원 불가능한 방법으로 삭제</li>
            <li>종이 문서: 분쇄기로 파쇄 또는 소각</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">6. 쿠키의 사용</h2>
          <p>본 사이트는 지원서 작성 편의를 위해 localStorage를 사용하여 작성 중인 내용을 임시 저장합니다. 이 데이터는 브라우저에만 저장되며 서버로 전송되지 않습니다.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">7. 개인정보 보호책임자</h2>
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <tbody>
              <tr className="border-b border-slate-100"><td className="px-4 py-2 bg-slate-50 font-medium w-32">이름</td><td className="px-4 py-2">이신우</td></tr>
              <tr className="border-b border-slate-100"><td className="px-4 py-2 bg-slate-50 font-medium">직위</td><td className="px-4 py-2">대표</td></tr>
              <tr className="border-b border-slate-100"><td className="px-4 py-2 bg-slate-50 font-medium">연락처</td><td className="px-4 py-2">070-5089-5960 / 010-3343-4000</td></tr>
              <tr><td className="px-4 py-2 bg-slate-50 font-medium">이메일</td><td className="px-4 py-2">duonedu@duonedu.net</td></tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">8. 처리방침 변경</h2>
          <p>이 개인정보처리방침은 2026년 4월 7일부터 적용됩니다. 변경 시 웹사이트 공지를 통해 고지합니다.</p>
        </section>
      </main>
      <DuonFooter />
    </div>
  );
}
