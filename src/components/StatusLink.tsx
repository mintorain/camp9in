"use client";

import { useEffect, useState } from "react";

export default function StatusLink() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        setShow(json.data?.show_status === "true");
      })
      .catch(() => {});
  }, []);

  if (!show) return null;

  return (
    <a
      href="/status"
      className="hidden sm:inline-flex px-4 py-2 rounded-full text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      결과 조회
    </a>
  );
}
