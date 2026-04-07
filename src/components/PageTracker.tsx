"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function getSessionId() {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("_sid");
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("_sid", sid);
  }
  return sid;
}

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId || pathname.startsWith("/admin")) return;

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: pathname, sessionId }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
