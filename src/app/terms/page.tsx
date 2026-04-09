import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DuonFooter from "@/components/DuonFooter";

export const metadata = { title: "이용약관 | 두온교육 AI캠프" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-200">
        <nav className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-slate-700 p-1 rounded-lg" aria-label="메인으로">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-base font-bold text-slate-900">이용약관</h1>
        </nav>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10 text-sm text-slate-700 leading-relaxed space-y-8">
        <p className="text-xs text-slate-400">시행일: 2026년 4월 7일</p>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">제1조 (목적)</h2>
          <p>이 약관은 두온교육(주)(이하 &ldquo;회사&rdquo;)가 운영하는 AI캠프 강사 모집 웹사이트(camp9in.duonedu.net, 이하 &ldquo;서비스&rdquo;)의 이용 조건 및 절차에 관한 사항을 규정합니다.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">제2조 (정의)</h2>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li><strong>서비스:</strong> 회사가 운영하는 AI캠프 강사 모집 및 관리 웹사이트</li>
            <li><strong>이용자:</strong> 서비스에 접속하여 정보를 열람하거나 지원서를 작성하는 자</li>
            <li><strong>지원자:</strong> 서비스를 통해 강사 지원서를 제출한 자</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">제3조 (약관의 효력 및 변경)</h2>
          <ol className="list-decimal list-inside space-y-1 text-slate-600">
            <li>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
            <li>회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있으며, 개정 시 적용일자 7일 전부터 공지합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">제4조 (서비스의 제공)</h2>
          <p>회사는 다음의 서비스를 제공합니다.</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-slate-600">
            <li>AI캠프 프로그램 안내 및 강사 모집 정보 제공</li>
            <li>온라인 강사 지원서 접수</li>
            <li>지원 결과 조회</li>
            <li>기타 회사가 정하는 서비스</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">제5조 (지원서 접수)</h2>
          <ol className="list-decimal list-inside space-y-1 text-slate-600">
            <li>지원자는 서비스에서 요구하는 정보를 정확하게 입력하여 지원서를 제출합니다.</li>
            <li>허위 정보 기재 시 선발이 취소될 수 있습니다.</li>
            <li>지원서 제출은 개인정보 수집·이용 동의를 전제로 합니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">제6조 (이용자의 의무)</h2>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li>이용자는 서비스 이용 시 관계 법령, 이 약관, 이용안내 등을 준수하여야 합니다.</li>
            <li>타인의 정보를 도용하거나 허위 정보를 등록하여서는 안 됩니다.</li>
            <li>서비스의 안정적 운영을 방해하는 행위를 하여서는 안 됩니다.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">제7조 (서비스의 중단)</h2>
          <p>회사는 시스템 점검, 교체, 고장, 통신 두절 등의 사유가 발생한 경우 서비스 제공을 일시적으로 중단할 수 있으며, 이 경우 사전 공지합니다.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">제8조 (면책조항)</h2>
          <ol className="list-decimal list-inside space-y-1 text-slate-600">
            <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
            <li>회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">제9조 (분쟁 해결)</h2>
          <p>서비스 이용과 관련하여 분쟁이 발생한 경우, 회사의 본사 소재지를 관할하는 법원을 관할 법원으로 합니다.</p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-3">부칙</h2>
          <p>이 약관은 2026년 4월 7일부터 시행합니다.</p>
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden mt-4">
            <tbody>
              <tr className="border-b border-slate-100"><td className="px-4 py-2 bg-slate-50 font-medium w-32">회사명</td><td className="px-4 py-2">두온교육(주)</td></tr>
              <tr className="border-b border-slate-100"><td className="px-4 py-2 bg-slate-50 font-medium">대표</td><td className="px-4 py-2">이신우</td></tr>
              <tr className="border-b border-slate-100"><td className="px-4 py-2 bg-slate-50 font-medium">사업자번호</td><td className="px-4 py-2">264-87-01676</td></tr>
              <tr className="border-b border-slate-100"><td className="px-4 py-2 bg-slate-50 font-medium">소재지</td><td className="px-4 py-2">경기도 평택시 고덕중앙로 322 704호</td></tr>
              <tr><td className="px-4 py-2 bg-slate-50 font-medium">연락처</td><td className="px-4 py-2">070-5089-5960 / duonedu@duonedu.net</td></tr>
            </tbody>
          </table>
        </section>
      </main>
      <DuonFooter />
    </div>
  );
}
