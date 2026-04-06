"use client";

import { useRef, useState, type ReactNode } from "react";

interface GlowButtonProps {
  children: ReactNode;
  className?: string;
  href?: string;
}

export default function GlowButton({
  children,
  className = "",
  href,
}: GlowButtonProps) {
  const btnRef = useRef<HTMLAnchorElement>(null);
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent) {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    setGlowPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <a
      ref={btnRef}
      href={href}
      onMouseMove={handleMouseMove}
      className={`relative inline-flex items-center gap-2 overflow-hidden group ${className}`}
    >
      <span
        className="pointer-events-none absolute w-32 h-32 rounded-full bg-white/20 blur-xl transition-opacity opacity-0 group-hover:opacity-100"
        style={{
          left: glowPos.x - 64,
          top: glowPos.y - 64,
        }}
        aria-hidden="true"
      />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </a>
  );
}
