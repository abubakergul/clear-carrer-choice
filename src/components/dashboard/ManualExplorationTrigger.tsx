"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { triggerNextExploration } from "@/actions/exploration";

export default function ManualExplorationTrigger() {
  const router = useRouter();
  const triggered = useRef(false);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (triggered.current) return;
    triggered.current = true;
    setLoading(true);
    await triggerNextExploration();
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-5 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:opacity-50"
    >
      {loading ? (
        <>
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
            <path d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          On its way…
        </>
      ) : (
        "Try a fresh one →"
      )}
    </button>
  );
}
