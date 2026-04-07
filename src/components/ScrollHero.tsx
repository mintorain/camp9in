"use client";

import { useEffect, useRef, useState } from "react";

export default function ScrollHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [time, setTime] = useState(0);

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

    function handleMouseMove(e: MouseEvent) {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouse({ x, y });
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let animId: number;
    function animate() {
      setTime((t) => t + 0.015);
      animId = requestAnimationFrame(animate);
    }
    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  const titleScale = 1 + scroll * 0.3;
  const titleOpacity = 1 - scroll * 1.5;
  const subtitleY = scroll * -60;
  const badgeScale = 1 - scroll * 0.3;
  const orb1X = scroll * 120;
  const orb1Y = scroll * -80;
  const orb2X = scroll * -100;
  const orb2Y = scroll * 60;
  const orb3Scale = 1 + scroll * 0.5;
  const ctaY = scroll * -40;
  const gridRotateX = scroll * 15;

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[140vh] overflow-hidden bg-slate-950"
    >
      {/* 움직이는 그라디언트 배경 */}
      <div className="absolute inset-0">
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px] transition-transform duration-100"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)",
            top: "10%",
            left: "10%",
            transform: `translate(${orb1X}px, ${orb1Y}px)`,
          }}
          aria-hidden="true"
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] transition-transform duration-100"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 70%)",
            bottom: "20%",
            right: "10%",
            transform: `translate(${orb2X}px, ${orb2Y}px)`,
          }}
          aria-hidden="true"
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[150px] transition-transform duration-100"
          style={{
            background: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)",
            top: "40%",
            left: "35%",
            transform: `scale(${orb3Scale})`,
          }}
          aria-hidden="true"
        />
      </div>

      {/* 3D 그리드 배경 */}
      <div
        className="absolute inset-0 overflow-hidden opacity-20"
        style={{
          perspective: "800px",
        }}
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
            transform: `rotateX(${60 + gridRotateX}deg) translateY(-50%)`,
            transformOrigin: "center bottom",
          }}
        />
      </div>

      {/* 고정 콘텐츠 영역 */}
      <div className="sticky top-0 h-screen flex items-center justify-center pt-16">
        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          {/* 배지 */}
          <div
            className="transition-transform duration-100"
            style={{
              transform: `scale(${Math.max(0, badgeScale)})`,
              opacity: Math.max(0, titleOpacity + 0.3),
            }}
          >
            <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-300 text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              강사 모집중 · 두온교육(주) 캠프사업부
            </span>
          </div>

          {/* 메인 타이틀 - 3D 마우스 추적 + 부유 애니메이션 */}
          <div
            ref={titleRef}
            className="mt-6"
            style={{
              perspective: "1000px",
              opacity: Math.max(0, titleOpacity),
            }}
          >
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight"
              style={{
                transform: `
                  scale(${titleScale})
                  rotateX(${mouse.y * -5 + Math.sin(time) * 2}deg)
                  rotateY(${mouse.x * 5 + Math.cos(time * 0.7) * 2}deg)
                  translateZ(${30 + Math.sin(time * 0.5) * 10}px)
                `,
                transformStyle: "preserve-3d",
                transition: "transform 0.15s ease-out",
              }}
            >
              <span
                className="block text-white mb-2"
                style={{
                  transform: `translateZ(${40 + Math.sin(time * 0.8) * 8}px)`,
                  textShadow: `
                    0 0 40px rgba(99,102,241,0.3),
                    0 ${5 + Math.sin(time) * 3}px ${15 + Math.sin(time) * 5}px rgba(0,0,0,0.4)
                  `,
                }}
              >
                AI로 만나는
              </span>
              <span
                className="block bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent"
                style={{
                  transform: `translateZ(${20 + Math.cos(time * 0.6) * 8}px)`,
                  filter: `drop-shadow(0 ${8 + Math.sin(time * 0.9) * 4}px ${20 + Math.sin(time * 0.9) * 5}px rgba(99,102,241,0.25))`,
                }}
              >
                미래 교육 체험 캠프
              </span>
            </h1>
          </div>

          {/* 강사 모집 텍스트 - 3D 부유 */}
          <div
            className="mt-6"
            style={{
              perspective: "800px",
              opacity: Math.max(0, 1 - scroll * 2),
            }}
          >
            <p
              className="text-3xl md:text-5xl font-black bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 bg-clip-text text-transparent"
              style={{
                transform: `
                  translateY(${subtitleY}px)
                  scale(${1 + scroll * 0.5})
                  rotateX(${mouse.y * -3 + Math.cos(time * 1.2) * 1.5}deg)
                  rotateY(${mouse.x * 3 + Math.sin(time * 0.9) * 1.5}deg)
                  translateZ(${20 + Math.sin(time * 0.7) * 10}px)
                `,
                transition: "transform 0.15s ease-out",
                filter: `drop-shadow(0 ${6 + Math.sin(time) * 3}px ${15 + Math.sin(time) * 5}px rgba(245,158,11,0.2))`,
              }}
            >
              강사 모집
            </p>
          </div>

          {/* 설명 텍스트 */}
          <div
            className="transition-all duration-100 mt-8"
            style={{
              transform: `translateY(${scroll * -30}px)`,
              opacity: Math.max(0, 1 - scroll * 1.8),
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
            className="transition-all duration-100 mt-10"
            style={{
              transform: `translateY(${ctaY}px)`,
              opacity: Math.max(0, 1 - scroll * 1.5),
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
            className="mt-16 transition-opacity duration-300"
            style={{ opacity: Math.max(0, 1 - scroll * 5) }}
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
