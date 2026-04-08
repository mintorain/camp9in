import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ChevronRight,
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

export default function Home() {
  return (
    <>
      {/* 글래스모피즘 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/20">
        <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            두온교육 AI캠프
          </span>
          <ul className="hidden md:flex items-center gap-1 text-sm" role="list">
            <li>
              <a href="#about" className="px-3 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                캠프소개
              </a>
            </li>
            <li>
              <a href="#schedule" className="px-3 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                일정
              </a>
            </li>
            <li>
              <a href="#pay" className="px-3 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                강사료
              </a>
            </li>
            <li>
              <a href="#subjects" className="px-3 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                모집분야
              </a>
            </li>
            <li>
              <a href="#process" className="px-3 py-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                지원절차
              </a>
            </li>
          </ul>
          <a
            href="/apply"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            강사 지원하기
          </a>
        </nav>
      </header>

      <main id="main-content">
        {/* 히어로 - 3D 스크롤 기반 */}
        <ScrollHero />

        {/* 학교별 모집 현황 */}
        <section className="py-20 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-6">
              {SCHOOLS.map((school, i) => (
                <ScrollReveal key={school.id} delay={i * 150} direction="up">
                  <div className="text-center bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <p className="text-lg font-bold text-gray-900 mb-4">
                      {school.shortName}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          <AnimatedCounter
                            target={school.subjects.length}
                            suffix="개"
                          />
                        </p>
                        <p className="text-gray-500 text-xs mt-1">체험 분야</p>
                      </div>
                      <div>
                        <p className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          <AnimatedCounter
                            target={school.capacityPerSubject}
                            suffix="명"
                          />
                        </p>
                        <p className="text-gray-500 text-xs mt-1">분야별 모집</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">{school.dateLabel}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* 캠프 소개 */}
        <section id="about" className="py-24 bg-gray-50 scroll-mt-20" aria-labelledby="about-heading">
          <div className="max-w-6xl mx-auto px-4">
            <ParallaxText scaleRange={[0.8, 1.05]}>
              <h2
                id="about-heading"
                className="text-2xl md:text-4xl font-bold text-gray-900 mb-6 text-center"
              >
                캠프 소개
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed text-center mb-12">
                <strong className="text-indigo-600">&ldquo;AI로 만나는 미래 교육 체험 캠프&rdquo;</strong>는
                두온교육(주)이 주관하는 초등학교 대상 AI·미래기술 체험 프로그램입니다.
                학생들이 다양한 체험 부스를 순환하며 AI, 로봇, 코딩, 드론, 요리 등을 직접 경험합니다.
              </p>
            </ParallaxText>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <ScrollReveal delay={0} direction="up">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl mx-auto mb-4">
                    🎯
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">운영 목표</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    AI 시대를 살아갈 학생들에게 미래 기술을 체험하고 흥미를 발견할 수 있는 기회를 제공합니다.
                  </p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={150} direction="up">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl mx-auto mb-4">
                    🔄
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">부스 순환 방식</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    학년별로 배정된 체험 부스를 순환하며, 각 부스에서 전문 강사의 지도 아래 실습 중심의 활동을 진행합니다.
                  </p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={300} direction="up">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl mx-auto mb-4">
                    👨‍🏫
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">강사 역할</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    각 분야별 전문 강사가 체험 부스를 담당하며, 학생들의 안전하고 즐거운 체험 활동을 이끌어주게 됩니다.
                  </p>
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={400} direction="up">
              <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-6 max-w-3xl mx-auto">
                <h3 className="font-bold text-gray-900 mb-4 text-center">참여 학교 및 일정</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="font-semibold text-indigo-600">성남 미금초</p>
                    <p className="text-gray-500 mt-1">4월 20일~24일 (5일간)</p>
                    <p className="text-xs text-gray-400 mt-1">학년별 체험 운영</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="font-semibold text-indigo-600">화성 정림초</p>
                    <p className="text-gray-500 mt-1">4월 29일 (1일)</p>
                    <p className="text-xs text-gray-400 mt-1">전교생 체험캠프</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="font-semibold text-indigo-600">화성 청원초</p>
                    <p className="text-gray-500 mt-1">6월 12일 (1일)</p>
                    <p className="text-xs text-gray-400 mt-1">전교생 체험캠프</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 일정 및 장소 - 3D 틸트 카드 */}
        <section id="schedule" className="py-24 bg-white scroll-mt-20" aria-labelledby="schedule-heading">
          <div className="max-w-6xl mx-auto px-4">
            <ParallaxText scaleRange={[0.8, 1.05]}>
              <h2
                id="schedule-heading"
                className="text-2xl md:text-4xl font-bold text-gray-900 text-center mb-4"
              >
                캠프 일정 및 장소
              </h2>
              <p className="text-gray-500 text-center mb-12">
                카드 위에 마우스를 올려보세요
              </p>
            </ParallaxText>

            <div className="grid md:grid-cols-2 gap-8">
              {SCHOOLS.map((school, i) => (
                <ScrollReveal
                  key={school.id}
                  delay={i * 200}
                  direction={i === 0 ? "left" : "right"}
                >
                  <TiltCard className="rounded-2xl">
                    <article className="relative bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white overflow-hidden">
                      {/* 배경 장식 */}
                      <div
                        className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"
                        aria-hidden="true"
                      />
                      <div
                        className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"
                        aria-hidden="true"
                      />

                      <h3 className="text-2xl font-bold mb-6 relative z-10">
                        {school.name}
                      </h3>
                      <ul className="space-y-4 relative z-10">
                        <li className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                            <Calendar
                              className="w-5 h-5"
                              aria-hidden="true"
                            />
                          </div>
                          <span className="text-white/90">
                            {school.dateLabel}
                          </span>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                            <Clock className="w-5 h-5" aria-hidden="true" />
                          </div>
                          <span className="text-white/90">{school.time}</span>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                            <MapPin className="w-5 h-5" aria-hidden="true" />
                          </div>
                          <span className="text-white/90">
                            {school.location}
                          </span>
                        </li>
                        <li className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                            <Users className="w-5 h-5" aria-hidden="true" />
                          </div>
                          <span className="text-white/90">
                            {"target" in school && (
                              <span className="text-amber-300 font-semibold">
                                {(school as typeof school & { target: string }).target} ·{" "}
                              </span>
                            )}
                            각 분야별{" "}
                            <strong className="text-amber-300">
                              {school.capacityPerSubject}명
                            </strong>{" "}
                            모집
                          </span>
                        </li>
                      </ul>

                      {/* 학년별 일정 (미금초) */}
                      {"gradeSchedule" in school &&
                        (
                          school as typeof school & {
                            gradeSchedule: { grade: string; period: string }[];
                          }
                        ).gradeSchedule && (
                          <div className="mt-5 pt-5 border-t border-white/15 relative z-10">
                            <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-2">
                              학년별 일정 및 체험 과목
                            </p>
                            <div className="space-y-1.5">
                              {(
                                school as typeof school & {
                                  gradeSchedule: {
                                    grade: string;
                                    period: string;
                                    subjects: string[];
                                    type?: string;
                                  }[];
                                }
                              ).gradeSchedule.map((gs) => {
                                const subjectNames = gs.subjects
                                  .map((sid: string) => {
                                    const sub = SUBJECTS.find((s) => s.id === sid);
                                    return sub ? `${sub.icon} ${sub.name}` : sid;
                                  })
                                  .join(", ");
                                const isMulti = gs.subjects.length > 1;

                                return (
                                  <div
                                    key={gs.grade}
                                    className="bg-white/10 rounded-lg px-3 py-2"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-amber-300 text-xs">
                                        {gs.grade}
                                        {gs.type && (
                                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-white/15 text-white/60 text-[10px] font-normal">
                                            {gs.type}
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-white/50 text-[10px]">
                                        {gs.period}
                                      </span>
                                    </div>
                                    <p className={`text-white/80 mt-1 leading-relaxed ${isMulti ? "text-[10px]" : "text-xs"}`}>
                                      {isMulti ? `${gs.subjects.length}개 체험부스: ` : ""}
                                      {subjectNames}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-[10px] text-white/40 mt-2">
                              * 학교 사정에 의해 일정은 변경될 수 있습니다.
                            </p>
                          </div>
                        )}
                    </article>
                  </TiltCard>
                </ScrollReveal>
              ))}
            </div>
            <p className="text-center text-sm text-gray-400 mt-6">
              * 학교 사정에 의해 일정은 변경될 수 있습니다.
            </p>
          </div>
        </section>

        {/* 강사료 지급 규정 */}
        <section id="pay" className="py-24 bg-white scroll-mt-20" aria-labelledby="pay-heading">
          <div className="max-w-4xl mx-auto px-4">
            <ScrollReveal direction="up">
              <h2
                id="pay-heading"
                className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-10"
              >
                강사료 지급 규정
              </h2>
            </ScrollReveal>
            <div className="grid md:grid-cols-2 gap-6">
              <ScrollReveal delay={100} direction="left">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                  <h3 className="font-bold text-lg text-indigo-900 mb-4">
                    🏫 미금초등학교
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl p-4 text-center">
                      <p className="text-xs font-semibold text-indigo-500 mb-1">1~4학년</p>
                      <p className="text-sm text-gray-500">80분 기준</p>
                      <p className="text-3xl font-bold text-indigo-600 mt-1">
                        80,000<span className="text-lg font-medium">원</span>
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 text-center">
                      <p className="text-xs font-semibold text-indigo-500 mb-1">5~6학년</p>
                      <p className="text-sm text-gray-500">1일 캠프 운영</p>
                      <p className="text-3xl font-bold text-indigo-600 mt-1">
                        150,000<span className="text-lg font-medium">원</span>
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={200} direction="right">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                  <h3 className="font-bold text-lg text-amber-900 mb-3">
                    🏫 정림초 · 청원초
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    1일 체험캠프 운영
                  </p>
                  <div className="bg-white rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-500">1일</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">
                      150,000<span className="text-lg font-medium">원</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      체험캠프 전체 운영 기준
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
            <p className="text-center text-xs text-gray-400 mt-6">
              * 강사료는 원천징수 후 지급됩니다.
            </p>
          </div>
        </section>

        {/* 모집 분야 - 3D 틸트 그리드 */}
        <section
          id="subjects"
          className="py-24 bg-gray-50 scroll-mt-20"
          aria-labelledby="subjects-heading"
        >
          <div className="max-w-6xl mx-auto px-4">
            <ParallaxText scaleRange={[0.8, 1.05]}>
              <h2
                id="subjects-heading"
                className="text-2xl md:text-4xl font-bold text-gray-900 text-center mb-4"
              >
                모집 분야
              </h2>
              <p className="text-gray-500 text-center mb-12">
                체험 부스별 전문 강사를 모집합니다
              </p>
            </ParallaxText>

            <SubjectGrid />
          </div>
        </section>

        {/* 지원 절차 - 3D 스텝 */}
        <section
          id="process"
          className="py-24 bg-gray-50 scroll-mt-20"
          aria-labelledby="process-heading"
        >
          <div className="max-w-6xl mx-auto px-4">
            <ParallaxText scaleRange={[0.8, 1.05]}>
              <h2
                id="process-heading"
                className="text-2xl md:text-4xl font-bold text-gray-900 text-center mb-12"
              >
                지원 절차
              </h2>
            </ParallaxText>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "STEP 1",
                  title: "지원서 작성",
                  desc: "온라인 지원서를 작성하고 제출해주세요",
                  gradient: "from-blue-500 to-indigo-600",
                },
                {
                  step: "STEP 2",
                  title: "서류 검토",
                  desc: "제출된 지원서를 검토합니다",
                  gradient: "from-indigo-500 to-purple-600",
                },
                {
                  step: "STEP 3",
                  title: "최종 선발",
                  desc: "선발 결과를 이메일/문자로 안내합니다",
                  gradient: "from-purple-500 to-pink-600",
                },
              ].map((item, i) => (
                <ScrollReveal key={item.step} delay={i * 150} direction="up">
                  <TiltCard className="rounded-2xl h-full">
                    <div className="relative bg-white rounded-2xl p-8 text-center border border-gray-100 h-full shadow-sm">
                      <div
                        className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} text-white text-lg font-bold mb-5 shadow-lg`}
                      >
                        {i + 1}
                      </div>
                      <p className="text-xs font-bold text-indigo-500 tracking-widest mb-2">
                        {item.step}
                      </p>
                      <h3 className="font-bold text-gray-900 text-lg mb-3">
                        {item.title}
                      </h3>
                      <p className="text-gray-500">{item.desc}</p>

                      {/* 연결선 (md 이상) */}
                      {i < 2 && (
                        <div
                          className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-indigo-300 to-purple-300"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </TiltCard>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA - 3D 배경 */}
        <section className="relative py-24 overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white text-center">
          <div
            className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 max-w-6xl mx-auto px-4">
            <ParallaxText scaleRange={[0.85, 1.1]}>
              <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
                AI캠프 강사로
                <br />
                <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                  함께해주세요!
                </span>
              </h2>
              <p className="text-indigo-300/80 text-lg mb-10">
                아이들의 미래를 함께 만들어갈 열정 있는 분을 기다립니다
              </p>
              <GlowButton
                href="/apply"
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white px-10 py-5 rounded-2xl text-lg font-bold transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/30 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                지금 지원하기
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </GlowButton>
            </ParallaxText>
          </div>
        </section>
      </main>

      <footer className="bg-slate-950 text-gray-500 py-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <SecretAdminLink />
          <p>
            이메일:{" "}
            <a href="mailto:duonedu@duonedu.net" className="hover:text-gray-300 transition-colors">
              duonedu@duonedu.net
            </a>{" "}
            | 연락처:{" "}
            <a href="tel:010-3343-4000" className="hover:text-gray-300 transition-colors">
              010-3343-4000
            </a>
          </p>
          <p className="mt-2">
            홈페이지:{" "}
            <a
              href="https://vibe.duonedu.net"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors"
            >
              vibe.duonedu.net
            </a>
            {" "}| 카카오채널:{" "}
            <a
              href="http://pf.kakao.com/_QVXFj/chat"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-300 transition-colors"
            >
              두온교육(주)
            </a>
          </p>
          <p className="mt-4 text-gray-600">
            &copy; 2026 두온교육(주). All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
