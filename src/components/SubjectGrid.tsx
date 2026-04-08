"use client";

import { useEffect, useState } from "react";
import { SCHOOLS, SUBJECTS, SUBJECT_CLOSE_THRESHOLD } from "@/lib/constants";
import TiltCard from "./TiltCard";
import ScrollReveal from "./ScrollReveal";

export default function SubjectGrid() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [dbClosedIds, setDbClosedIds] = useState<string[]>([]);
  const [showCounts, setShowCounts] = useState(true);

  useEffect(() => {
    fetch("/api/applicants/counts")
      .then((res) => res.json())
      .then((json) => {
        setCounts(json.data || {});
        setDbClosedIds(json.closedIds || []);
      })
      .catch(() => {});
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json.data?.show_counts !== undefined) {
          setShowCounts(json.data.show_counts !== "false");
        }
      })
      .catch(() => {});
  }, []);

  function isClosed(subjectId: string) {
    if (dbClosedIds.includes(subjectId)) return true;
    return (counts[subjectId] || 0) >= SUBJECT_CLOSE_THRESHOLD;
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {SUBJECTS.map((subject, i) => {
        const closed = isClosed(subject.id);
        const count = counts[subject.id] || 0;

        return (
          <ScrollReveal key={subject.id} delay={i * 80} direction="scale">
            <TiltCard className="rounded-2xl h-full">
              <article
                className={`relative bg-white rounded-2xl p-6 border h-full shadow-sm transition-shadow duration-300 ${
                  closed
                    ? "border-gray-200 opacity-75"
                    : "border-gray-100 hover:shadow-xl"
                }`}
              >
                {closed && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-500/20">
                    마감
                  </div>
                )}
                {!closed && count > 0 && showCounts && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                    {count}명 지원
                  </div>
                )}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-3xl mb-4">
                  <span role="img" aria-label={subject.name}>
                    {subject.icon}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">
                  {subject.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                  {subject.description}
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {subject.skills.split(", ").map((skill) => (
                    <span
                      key={skill}
                      className="inline-block px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {SCHOOLS.filter((sc) =>
                    (sc.subjects as readonly string[]).includes(subject.id)
                  ).map((sc) => (
                    <span
                      key={sc.id}
                      className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px]"
                    >
                      {sc.shortName}
                    </span>
                  ))}
                </div>
              </article>
            </TiltCard>
          </ScrollReveal>
        );
      })}
    </div>
  );
}
