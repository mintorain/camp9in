"use client";

import { useEffect, useRef } from "react";

const CHECK_INTERVAL = 30000; // 30초마다 체크

export default function AutoRefresh() {
  const versionRef = useRef<string | null>(null);

  useEffect(() => {
    async function checkVersion() {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const { version } = await res.json();

        if (versionRef.current === null) {
          versionRef.current = version;
          return;
        }

        if (versionRef.current !== version) {
          window.location.reload();
        }
      } catch {
        /* ignore */
      }
    }

    checkVersion();
    const interval = setInterval(checkVersion, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return null;
}
