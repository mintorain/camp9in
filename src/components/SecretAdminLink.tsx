"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";

export default function SecretAdminLink() {
  const router = useRouter();
  const clickCount = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleClick() {
    clickCount.current += 1;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      clickCount.current = 0;
    }, 3000);

    if (clickCount.current >= 5) {
      clickCount.current = 0;
      router.push("/admin");
    }
  }

  return (
    <p
      className="font-semibold text-gray-400 mb-2 cursor-default select-none"
      onClick={handleClick}
    >
      두온교육(주) 캠프사업부
    </p>
  );
}
