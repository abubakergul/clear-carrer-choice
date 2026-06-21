"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Chunk = { percent: number; text: string };
type Rating = "good" | "ok" | "drain";

const OPTIONS: { key: Rating; label: string }[] = [
  { key: "good", label: "👍 Fine by me" },
  { key: "ok", label: "😐 Meh" },
  { key: "drain", label: "👎 Drains me" },
];

export default function RealDay({
  explorationId,
  role,
  chunks,
  closer,
}: {
  explorationId: string;
  role: string;
  chunks: Chunk[];
  closer?: string;
}) {
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<number, Rating>>({});
  const [pending, startTransition] = useTransition();

  const allRated = chunks.length > 0 && chunks.every((_, i) => ratings[i]);

  function rate(i: number, r: Rating) {
    setRatings((p) => ({ ...p, [i]: r }));
  }

  function finish() {
    if (!allRated || pending) return;
    const good = chunks.filter((_, i) => ratings[i] === "good").map((c) => c.text);
    const drain = chunks.filter((_, i) => ratings[i] === "drain").map((c) => c.text);

    let choice: string;
    if (good.length) {
      choice = good.join(", ");
      if (drain.length) choice += ` — but drained by ${drain.join(", ")}`;
    } else if (drain.length) {
      choice = `drained by most of it (${drain.join(", ")})`;
    } else {
      choice = `a real day as a ${role}`;
    }

    // Carry the choice via sessionStorage instead of a long URL query string
    // (long ?choice= values were 404'ing the reflect route in dev).
    try {
      sessionStorage.setItem(`ccc_choice_${explorationId}`, choice);
    } catch {}
    startTransition(() => {
      router.push(`/dashboard/explore/${explorationId}/reflect`);
    });
  }

  return (
    <div>
      <p className="mb-4 text-xs font-medium text-stone-400">
        The honest version — boring parts included. Tap how each part feels.
      </p>

      <div className="flex flex-col gap-3">
        {chunks.map((c, i) => (
          <div key={i} className="rounded-2xl border border-stone-200 bg-white p-4">
            <div className="mb-3 flex items-baseline gap-2">
              <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-500">
                ~{c.percent}%
              </span>
              <span className="text-sm leading-relaxed text-stone-700">{c.text}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {OPTIONS.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => rate(i, o.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition active:scale-[0.97] ${
                    ratings[i] === o.key
                      ? "border-violet-300 bg-violet-100 font-medium text-violet-800"
                      : "border-stone-200 bg-white text-stone-600 hover:border-violet-300"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {closer && (
        <p className="mt-4 text-sm font-medium text-stone-700">{closer}</p>
      )}

      <button
        type="button"
        disabled={!allRated || pending}
        onClick={finish}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40 active:scale-[0.98]"
      >
        {pending ? "…" : allRated ? "Continue →" : `Tap how all ${chunks.length} parts feel`}
      </button>
    </div>
  );
}
