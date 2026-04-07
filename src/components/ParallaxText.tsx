"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface ParallaxTextProps {
  children: ReactNode;
  className?: string;
  speed?: number;
  scaleRange?: [number, number];
}

export default function ParallaxText({
  children,
  className = "",
  speed = 0.1,
  scaleRange = [0.85, 1],
}: ParallaxTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({ scale: scaleRange[0], opacity: 0 });

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      setStyle({ scale: 1, opacity: 1 });
      return;
    }

    function handleScroll() {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const windowH = window.innerHeight;
      const center = rect.top + rect.height / 2;
      const distFromCenter = (windowH / 2 - center) / windowH;

      const progress = Math.max(0, Math.min(1, 0.5 + distFromCenter * 2));
      const scale =
        scaleRange[0] + (scaleRange[1] - scaleRange[0]) * progress;
      const opacity = Math.min(1, progress * 2);

      setStyle({ scale, opacity });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scaleRange, speed]);

  return (
    <div
      ref={ref}
      className={`transition-transform duration-150 ease-out ${className}`}
      style={{
        transform: `scale(${style.scale})`,
        opacity: style.opacity,
      }}
    >
      {children}
    </div>
  );
}
