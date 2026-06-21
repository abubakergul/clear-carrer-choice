import type { CSSProperties } from "react";

type Props = { size?: number; className?: string };

// The ClearCareerChoice mark — converging paths: several possible directions
// resolving into one clear point. No container (sits in brand violet on any light
// surface). Single source of truth so the brand looks the same everywhere.
export function LogoMark({ size = 28, className = "" }: Props) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size } as CSSProperties}
    >
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path d="M4 6 C 15 14, 15 14, 23 14" stroke="#c4b5fd" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M4 14 L 21.5 14" stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M4 22 C 15 14, 15 14, 23 14" stroke="#7c3aed" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="23.5" cy="14" r="2.6" fill="#7c3aed" />
      </svg>
    </span>
  );
}

// Mark + wordmark, for headers/navs.
export function Logo({ size = 28, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="text-sm font-semibold tracking-tight text-stone-900">
        ClearCareerChoice
      </span>
    </span>
  );
}
