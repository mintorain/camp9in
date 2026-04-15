"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle } from "lucide-react";

function CompleteContent() {
  const searchParams = useSearchParams();
  const isEdit = searchParams.get("mode") === "edit";

  return (
    <main className="flex-1 flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <CheckCircle
          className="w-16 h-16 text-green-500 mx-auto mb-6"
          aria-hidden="true"
        />
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {isEdit ? "지원서가 수정되었습니다!" : "지원서가 접수되었습니다!"}
        </h1>
        <p className="text-gray-600 mb-2">
          {isEdit ? "지원서 수정이 완료되었습니다." : "소중한 지원에 감사드립니다."}
        </p>
        <p className="text-gray-500 text-sm mb-8">
          서류 검토 후 이메일 또는 문자로 결과를 안내해드리겠습니다.
        </p>
        <Link
          href="/"
          className="inline-block bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          메인으로 돌아가기
        </Link>
      </div>
    </main>
  );
}

export default function CompletePage() {
  return (
    <Suspense fallback={
      <main className="flex-1 flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center"><p className="text-gray-500">로딩 중...</p></div>
      </main>
    }>
      <CompleteContent />
    </Suspense>
  );
}
