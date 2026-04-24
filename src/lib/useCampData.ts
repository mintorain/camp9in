"use client";

import { useEffect, useState } from "react";
import type { School, Subject } from "@/lib/data";

/**
 * Client 컴포넌트에서 학교/과목 데이터를 fetch하는 공용 훅.
 * Server 컴포넌트는 @/lib/data의 getSchools()/getSubjects() 직접 사용.
 *
 * 데이터가 아직 로드 안 됐을 때는 빈 배열을 주므로,
 * 호출 측에서 `loading` 체크나 빈 상태 처리 필요.
 */
export function useCampData() {
  const [schools, setSchools] = useState<School[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [sRes, subRes] = await Promise.all([
          fetch("/api/schools"),
          fetch("/api/subjects"),
        ]);
        const sJson = await sRes.json();
        const subJson = await subRes.json();
        if (!mounted) return;
        setSchools(sJson.data || []);
        setSubjects(subJson.data || []);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "load failed");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { schools, subjects, loading, error };
}
