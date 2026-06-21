"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Props = {
  explorationId: string;
  optionA: string;
  optionB: string;
};

export default function ThisOrThat({ explorationId, optionA, optionB }: Props) {
  const router = useRouter();
  const [picked, setPicked] = useState<"A" | "B" | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(which: "A" | "B") {
    if (pending) return;
    setPicked(which);
    const choice = which === "A" ? optionA : optionB;
    // Carry the choice via sessionStorage instead of a long URL query string
    // (long ?choice= values were 404'ing the reflect route in dev).
    try {
      sessionStorage.setItem(`ccc_choice_${explorationId}`, choice);
    } catch {}
    // Brief beat so the selected state registers, then go to reflect.
    startTransition(() => {
      setTimeout(() => {
        router.push(`/dashboard/explore/${explorationId}/reflect`);
      }, 280);
    });
  }

  const cards: { key: "A" | "B"; label: string; text: string }[] = [
    { key: "A", label: "A", text: optionA },
    { key: "B", label: "B", text: optionB },
  ];

  return (
    <div>
      <p className="mb-3 text-xs font-medium text-stone-400">
        Don&apos;t overthink it — which one pulls you in?
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => {
          const isPicked = picked === c.key;
          const dimmed = picked !== null && !isPicked;
          return (
            <button
              key={c.key}
              type="button"
              disabled={pending}
              onClick={() => choose(c.key)}
              className={`group flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all duration-200 active:scale-[0.98] ${
                isPicked
                  ? "border-violet-400 bg-violet-50 ring-2 ring-violet-200"
                  : "border-stone-200 bg-white hover:border-violet-300 hover:bg-violet-50/40"
              } ${dimmed ? "opacity-40" : ""}`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isPicked
                    ? "bg-violet-600 text-white"
                    : "bg-stone-100 text-stone-500 group-hover:bg-violet-100 group-hover:text-violet-600"
                }`}
              >
                {c.label}
              </span>
              <span className="text-sm leading-relaxed text-stone-700">{c.text}</span>
            </button>
          );
        })}
      </div>
      {picked && (
        <p className="mt-3 text-xs text-violet-500">Taking you to reflect…</p>
      )}
    </div>
  );
}
