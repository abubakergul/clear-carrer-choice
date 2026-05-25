"use client";

import { useState } from "react";

type Props = {
  label: string;
  why?: string;
  index: number;
};

export default function DirectionCard({ label, why, index }: Props) {
  const [open, setOpen] = useState(false);
  const hasWhy = !!why;

  return (
    <div
      className={`rounded-xl border-l-4 border-violet-300 bg-white shadow-sm transition-shadow ${hasWhy ? "cursor-pointer hover:shadow-md" : ""}`}
      onClick={() => hasWhy && setOpen((p) => !p)}
    >
      <div className="flex items-center gap-4 px-4 py-4">
        <span className="shrink-0 text-sm font-black text-violet-300">
          {String(index + 1).padStart(2, "0")}
        </span>
        <p className="flex-1 text-sm font-semibold text-stone-800">{label}</p>
        {hasWhy && (
          <span className="shrink-0 text-xs text-stone-400 transition-transform duration-200" style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}>
            ＋
          </span>
        )}
      </div>

      {/* Smooth expand using CSS grid trick */}
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="px-4 pb-4 pl-12 text-xs leading-relaxed text-stone-500">
            {why}
          </p>
        </div>
      </div>
    </div>
  );
}
