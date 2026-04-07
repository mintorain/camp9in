"use client";

import { useEffect, useRef, useState } from "react";

export default function ScrollHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [scroll, setScroll] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    function handleScroll() {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionHeight = sectionRef.current.offsetHeight;
      const progress = Math.max(0, Math.min(1, -rect.top / sectionHeight));
      setScroll(progress);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const titleScale = 1 + scroll * 0.3;
  const titleOpacity = 1 - scroll * 1.5;
  const subtitleY = scroll * -60;
  const badgeScale = 1 - scroll * 0.3;
  const ctaY = scroll * -40;

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[140vh] overflow-hidden bg-slate-950"
    >
      {/* 배경 그라디언트 오브 - 아주 천천히 움직임 */}
      <div className="absolute inset-0">
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px] hero-orb-1"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)",
            top: "10%",
            left: "10%",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] hero-orb-2"
          style={{
            background:
              "radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)",
            bottom: "20%",
            right: "10%",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[150px] hero-orb-3"
          style={{
            background:
              "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)",
            top: "40%",
            left: "35%",
          }}
          aria-hidden="true"
        />
      </div>

      {/* 3D 그리드 배경 - 정지 */}
      <div
        className="absolute inset-0 overflow-hidden opacity-15"
        style={{ perspective: "800px" }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            transform: "rotateX(60deg) translateY(-50%)",
            transformOrigin: "center bottom",
          }}
        />
      </div>

      {/* 고정 콘텐츠 영역 */}
      <div className="sticky top-0 h-screen flex items-center justify-center pt-16">
        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          {/* 배지 */}
          <div
            style={{
              transform: `scale(${Math.max(0, badgeScale)})`,
              opacity: Math.max(0, titleOpacity + 0.3),
              transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
            }}
          >
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-300 text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              강사 모집중 · 두온교육(주) 캠프사업부
            </span>
          </div>

          {/* 메인 타이틀 - 3D 입체 텍스트 (글자 자체는 안 움직임) */}
          <div
            className="mt-6"
            style={{
              perspective: "1200px",
              opacity: Math.max(0, titleOpacity),
              transition: "opacity 0.3s ease-out",
            }}
          >
            <h1
              className="hero-title text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight"
              style={{
                transform: `scale(${titleScale})`,
                transition: "transform 0.3s ease-out",
              }}
            >
              <span className="hero-line1 block text-white mb-2">
                AI로 만나는
              </span>
              <span className="hero-line2 block bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                미래 교육 체험 캠프
              </span>
            </h1>
          </div>

          {/* 강사 모집 텍스트 */}
          <div
            className="mt-6"
            style={{
              opacity: Math.max(0, 1 - scroll * 2),
              transition: "opacity 0.3s ease-out",
            }}
          >
            <p
              className="hero-line3 text-3xl md:text-5xl font-black bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 bg-clip-text text-transparent"
              style={{
                transform: `translateY(${subtitleY}px) scale(${1 + scroll * 0.5})`,
                transition: "transform 0.3s ease-out",
              }}
            >
              강사 모집
            </p>
          </div>

          {/* 설명 텍스트 */}
          <div
            className="mt-8"
            style={{
              transform: `translateY(${scroll * -30}px)`,
              opacity: Math.max(0, 1 - scroll * 1.8),
              transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
            }}
          >
            <p className="text-indigo-200/70 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              초등학생들에게 AI 시대의 창의력과 문제해결력을 키워줄
              <br className="hidden md:block" />
              열정 있는 강사를 찾습니다.
            </p>
          </div>

          {/* CTA 버튼 */}
          <div
            className="mt-10"
            style={{
              transform: `translateY(${ctaY}px)`,
              opacity: Math.max(0, 1 - scroll * 1.5),
              transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
            }}
          >
            <a
              href="/apply"
              className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-10 py-5 rounded-2xl text-lg font-bold overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/25 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10">강사 지원하기</span>
              <svg
                className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
          </div>

          {/* 스크롤 안내 */}
          <div
            className="mt-16"
            style={{
              opacity: Math.max(0, 1 - scroll * 5),
              transition: "opacity 0.3s ease-out",
            }}
          >
            <div className="flex flex-col items-center gap-2 text-indigo-400/40">
              <span className="text-xs tracking-widest uppercase">
                Scroll Down
              </span>
              <div className="w-6 h-10 border-2 border-indigo-400/20 rounded-full flex justify-center pt-2">
                <div className="w-1.5 h-3 bg-indigo-400/40 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
