import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { SCHOOLS, SUBJECTS } from "@/lib/constants";
import TiltCard from "@/components/TiltCard";
import ScrollReveal from "@/components/ScrollReveal";
import AnimatedCounter from "@/components/AnimatedCounter";
import GlowButton from "@/components/GlowButton";
import SubjectGrid from "@/components/SubjectGrid";
import ScrollHero from "@/components/ScrollHero";
import ParallaxText from "@/components/ParallaxText";
import SecretAdminLink from "@/components/SecretAdminLink";
import StatusLink from "@/components/StatusLink";

export default function Home() {
  return (
    <>
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/50">
        <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">두온교육 <span className="text-indigo-600">AI캠프</span></span>
          </a>
          <ul className="hidden md:flex items-center gap-0.5 text-[13px]" role="list">
            {[
              { href: "#about", label: "캠프소개" },
              { href: "#schedule", label: "일정" },
              { href: "#subjects", label: "모집분야" },
              { href: "#process", label: "지원절차" },
            ].map((item) => (
              <li key={item.href}>
                <a href={item.href} className="px-3 py-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/80 transition-colors font-medium">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <StatusLink />
            <a href="/apply"
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2">
              강사 지원하기
            </a>
          </div>
        </nav>
      </header>

      <main id="main-content">
        <ScrollHero />

        {/* 학교별 모집 현황 */}
        <section className="py-20 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-5">
              {SCHOOLS.map((school, i) => (
                <ScrollReveal key={school.id} delay={i * 120} direction="up">
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden="true" />
                    <p className="text-lg font-bold mb-4">{school.shortName}</p>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-3xl font-extrabold text-indigo-400">
                          <AnimatedCounter target={school.subjects.length} suffix="" />
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">체험 분야</p>
                      </div>
                      <div>
                        <p className="text-3xl font-extrabold text-amber-400">
                          <AnimatedCounter target={school.capacityPerSubject} suffix="" />
                        </p>
                        <p className="text-slate-400 text-xs mt-0.5">분야별 모집</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-white/10">{school.dateLabel}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* 캠프 소개 */}
        <section id="about" className="py-28 bg-slate-50 scroll-mt-20" aria-labelledby="about-heading">
          <div className="max-w-5xl mx-auto px-4">
            <ParallaxText scaleRange={[0.9, 1.03]}>
              <p className="text-xs font-bold text-indigo-600 tracking-widest uppercase mb-3 text-center">About Camp</p>
              <h2 id="about-heading" className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 text-center leading-tight">
                AI로 만나는<br />미래 교육 체험 캠프
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto text-base leading-relaxed text-center mb-16">
                두온교육(주)이 주관하는 초등학교 대상 AI·미래기술 체험 프로그램입니다.
                학생들이 다양한 체험 부스를 순환하며 AI, 로봇, 코딩, 드론, 요리 등을 직접 경험합니다.
              </p>
            </ParallaxText>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { icon: "🎯", title: "운영 목표", desc: "AI 시대를 살아갈 학생들에게 미래 기술을 체험하고 흥미를 발견할 수 있는 기회를 제공합니다." },
                { icon: "🔄", title: "부스 순환 방식", desc: "학년별로 배정된 체험 부스를 순환하며, 전문 강사의 지도 아래 실습 중심 활동을 진행합니다." },
                { icon: "👨‍🏫", title: "강사 역할", desc: "각 분야별 전문 강사가 체험 부스를 담당하며, 학생들의 안전하고 즐거운 체험 활동을 이끕니다." },
              ].map((item, i) => (
                <ScrollReveal key={item.title} delay={i * 120} direction="up">
                  <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow h-full">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center text-2xl mb-4">
                      {item.icon}
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* 일정 및 장소 */}
        <section id="schedule" className="py-28 bg-white scroll-mt-20" aria-labelledby="schedule-heading">
          <div className="max-w-5xl mx-auto px-4">
            <ParallaxText scaleRange={[0.9, 1.03]}>
              <p className="text-xs font-bold text-indigo-600 tracking-widest uppercase mb-3 text-center">Schedule</p>
              <h2 id="schedule-heading" className="text-3xl md:text-5xl font-extrabold text-slate-900 text-center mb-4">캠프 일정 및 장소</h2>
              <p className="text-slate-400 text-center mb-14 text-sm">카드 위에 마우스를 올려보세요</p>
            </ParallaxText>

            <div className="grid md:grid-cols-3 gap-5">
              {SCHOOLS.map((school, i) => (
                <ScrollReveal key={school.id} delay={i * 150} direction="up">
                  <TiltCard className="rounded-2xl h-full">
                    <article className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-2xl p-7 text-white overflow-hidden h-full">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden="true" />

                      <h3 className="text-xl font-bold mb-5 relative z-10">{school.name}</h3>
                      <ul className="space-y-3 relative z-10 text-sm">
                        {[
                          { icon: <Calendar className="w-4 h-4" />, text: school.dateLabel },
                          { icon: <Clock className="w-4 h-4" />, text: school.time },
                          { icon: <MapPin className="w-4 h-4" />, text: school.location },
                          { icon: <Users className="w-4 h-4" />, text: <>{"target" in school && <span className="text-amber-300 font-semibold">{(school as typeof school & { target: string }).target} · </span>}각 분야별 <strong className="text-amber-300">{school.capacityPerSubject}명</strong> 모집</> },
                        ].map((item, idx) => (
                          <li key={idx} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">{item.icon}</div>
                            <span className="text-white/90">{item.text}</span>
                          </li>
                        ))}
                      </ul>

                      {"gradeSchedule" in school && (
                        <div className="mt-5 pt-5 border-t border-white/10 relative z-10">
                          <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wider mb-2">학년별 체험 과목</p>
                          <div className="space-y-1.5">
                            {(school as typeof school & { gradeSchedule: { grade: string; period: string; subjects: string[]; type?: string }[] }).gradeSchedule.map((gs) => {
                              const subjectNames = gs.subjects.map((sid: string) => SUBJECTS.find((s) => s.id === sid)).filter(Boolean).map((s) => `${s!.icon} ${s!.name}`).join(", ");
                              const isMulti = gs.subjects.length > 1;
                              return (
                                <div key={gs.grade} className="bg-white/8 rounded-lg px-3 py-2">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-amber-300 text-xs">
                                      {gs.grade}
                                      {gs.type && <span className="ml-1.5 px-1.5 py-0.5 rounded bg-white/10 text-white/50 text-[10px] font-normal">{gs.type}</span>}
                                    </span>
                                    <span className="text-white/40 text-[10px]">{gs.period}</span>
                                  </div>
                                  <p className={`text-white/70 mt-1 leading-relaxed ${isMulti ? "text-[10px]" : "text-xs"}`}>
                                    {isMulti ? `${gs.subjects.length}개 체험부스: ` : ""}{subjectNames}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </article>
                  </TiltCard>
                </ScrollReveal>
              ))}
            </div>
            <p className="text-center text-xs text-slate-400 mt-8">* 학교 사정에 의해 일정은 변경될 수 있습니다.</p>
          </div>
        </section>

        {/* 모집 분야 */}
        <section id="subjects" className="py-28 bg-slate-50 scroll-mt-20" aria-labelledby="subjects-heading">
          <div className="max-w-6xl mx-auto px-4">
            <ParallaxText scaleRange={[0.9, 1.03]}>
              <p className="text-xs font-bold text-indigo-600 tracking-widest uppercase mb-3 text-center">Positions</p>
              <h2 id="subjects-heading" className="text-3xl md:text-5xl font-extrabold text-slate-900 text-center mb-4">모집 분야</h2>
              <p className="text-slate-400 text-center mb-14 text-sm">체험 부스별 전문 강사를 모집합니다</p>
            </ParallaxText>
            <SubjectGrid />
          </div>
        </section>

        {/* 지원 절차 */}
        <section id="process" className="py-28 bg-white scroll-mt-20" aria-labelledby="process-heading">
          <div className="max-w-4xl mx-auto px-4">
            <ParallaxText scaleRange={[0.9, 1.03]}>
              <p className="text-xs font-bold text-indigo-600 tracking-widest uppercase mb-3 text-center">Process</p>
              <h2 id="process-heading" className="text-3xl md:text-5xl font-extrabold text-slate-900 text-center mb-14">지원 절차</h2>
            </ParallaxText>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { num: "01", title: "지원서 작성", desc: "온라인 지원서를 작성하고 제출해주세요", color: "from-blue-500 to-indigo-600" },
                { num: "02", title: "서류 검토", desc: "제출된 지원서를 검토합니다", color: "from-indigo-500 to-violet-600" },
                { num: "03", title: "최종 선발", desc: "선발 결과를 이메일/문자로 안내합니다", color: "from-violet-500 to-purple-600" },
              ].map((item, i) => (
                <ScrollReveal key={item.num} delay={i * 120} direction="up">
                  <div className="relative bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow text-center h-full">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} text-white text-lg font-bold mb-5 shadow-lg`}>
                      {item.num}
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2">{item.title}</h3>
                    <p className="text-slate-500 text-sm">{item.desc}</p>
                    {i < 2 && (
                      <div className="hidden md:flex absolute top-1/2 -right-3 w-6 items-center justify-center" aria-hidden="true">
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-32 overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white text-center">
          <div className="absolute inset-0 opacity-30" aria-hidden="true">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/30 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto px-4">
            <ParallaxText scaleRange={[0.9, 1.05]}>
              <p className="text-xs font-bold text-indigo-400 tracking-widest uppercase mb-4">Join Us</p>
              <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                AI캠프 강사로<br />
                <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">함께해주세요</span>
              </h2>
              <p className="text-indigo-300/70 text-lg mb-12">
                아이들의 미래를 함께 만들어갈 열정 있는 분을 기다립니다
              </p>
              <GlowButton
                href="/apply"
                className="bg-white text-slate-900 hover:bg-slate-100 px-10 py-5 rounded-2xl text-lg font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                지금 지원하기
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </GlowButton>
            </ParallaxText>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-slate-500 py-12">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm">
          <SecretAdminLink />
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 mb-4">
            <a href="mailto:duonedu@duonedu.net" className="hover:text-slate-300 transition-colors">duonedu@duonedu.net</a>
            <a href="tel:010-3343-4000" className="hover:text-slate-300 transition-colors">010-3343-4000</a>
            <a href="https://vibe.duonedu.net" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">vibe.duonedu.net</a>
            <a href="http://pf.kakao.com/_QVXFj/chat" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">카카오채널</a>
          </div>
          <p className="text-slate-600">&copy; 2026 두온교육(주). All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
