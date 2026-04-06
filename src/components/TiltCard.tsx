"use client";

import { useRef, useState, type ReactNode } from "react";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  glare?: boolean;
}

export default function TiltCard({
  children,
  className = "",
  glare = true,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");
  const [glareStyle, setGlareStyle] = useState({ opacity: 0, angle: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    setTransform(
      `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
    );

    if (glare) {
      const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) + 90;
      setGlareStyle({ opacity: 0.15, angle });
    }
  }

  function handleMouseLeave() {
    setTransform("");
    setGlareStyle({ opacity: 0, angle: 0 });
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden transition-transform duration-200 ease-out ${className}`}
      style={{ transform, transformStyle: "preserve-3d" }}
    >
      {children}
      {glare && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background: `linear-gradient(${glareStyle.angle}deg, rgba(255,255,255,${glareStyle.opacity}) 0%, transparent 80%)`,
            transition: "opacity 0.2s ease-out",
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
