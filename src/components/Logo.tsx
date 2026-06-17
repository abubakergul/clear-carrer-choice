import type { CSSProperties } from "react";

type Props = { size?: number; className?: string };

// The ClearCareerChoice mark — three overlapping rings = different paths/options
// converging toward one clear choice. Single source of truth so the brand looks
// the same on the chat, the dashboard, the result page, and sign-in.
export function LogoMark({ size = 28, className = "" }: Props) {
  const icon = Math.round(size * 0.57);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-stone-950 ${className}`}
      style={{ width: size, height: size } as CSSProperties}
    >
      <svg width={icon} height={icon} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="6" cy="7" r="4" stroke="#c4b5fd" strokeWidth="1.2" />
        <circle cx="10" cy="7" r="4" stroke="#a78bfa" strokeWidth="1.2" opacity="0.6" />
        <circle cx="8" cy="10" r="4" stroke="#7c3aed" strokeWidth="1.2" opacity="0.3" />
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
