"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("비밀번호가 올바르지 않습니다");
        return;
      }

      const { token } = await res.json();
      sessionStorage.setItem("admin_token", token);
      router.push("/admin/dashboard");
    } catch {
      setError("로그인에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="text-center mb-6">
            <Lock
              className="w-10 h-10 text-primary mx-auto mb-3"
              aria-hidden="true"
            />
            <h1 className="text-xl font-bold text-gray-900">관리자 로그인</h1>
            <p className="text-sm text-gray-500 mt-1">
              AI캠프 강사 모집 관리 시스템
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <label htmlFor="password" className="sr-only">
              관리자 비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm mb-4 focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="관리자 비밀번호"
              required
            />

            {error && (
              <p className="text-red-500 text-sm mb-4" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2
                    className="w-4 h-4 animate-spin"
                    aria-hidden="true"
                  />
                  로그인 중...
                </span>
              ) : (
                "로그인"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
