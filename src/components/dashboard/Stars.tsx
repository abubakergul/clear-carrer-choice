"use client";

import { useEffect, useState } from "react";

const STAR_PATH =
  "M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

type Props = {
  earned: number;
  total?: number;
  /** Animate the newest star lighting up (use on the payoff screen). */
  justEarned?: boolean;
  size?: number;
};

export default function Stars({ earned, total = 5, justEarned = false, size = 38 }: Props) {
  const capped = Math.max(0, Math.min(total, earned));
  // When justEarned, hold the newest star dark for a beat, then reveal it.
  const [revealed, setRevealed] = useState(!justEarned);

  useEffect(() => {
    if (!justEarned) return;
    const t = setTimeout(() => setRevealed(true), 420);
    return () => clearTimeout(t);
  }, [justEarned]);

  const lit = justEarned && !revealed ? Math.max(0, capped - 1) : capped;

  return (
    <div className="flex items-center justify-center gap-2.5">
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < lit;
        const isNew = justEarned && i === capped - 1;
        return (
          <svg
            key={i}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{
              transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1), filter 500ms ease",
              transform: filled ? "scale(1)" : "scale(0.82)",
              filter: filled
                ? `drop-shadow(0 0 ${isNew ? 9 : 5}px rgba(124,58,237,0.5))`
                : "none",
            }}
          >
            <path
              d={STAR_PATH}
              fill={filled ? "#7c3aed" : "none"}
              stroke={filled ? "#7c3aed" : "#d6d3d1"}
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </div>
  );
}
