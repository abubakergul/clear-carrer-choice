"use client";

import { useEffect, useState, useTransition } from "react";
import { completeExploration } from "@/actions/exploration";

// Plain-English feelings with an emoji so a tap feels fast and human, not like a
// clinical form. The `value` is what gets stored + scored (do not change those
// strings); the emoji + label are display only.
const FEELINGS: { value: string; emoji: string }[] = [
  { value: "Excited", emoji: "🤩" },
  { value: "Curious", emoji: "🤔" },
  { value: "Enjoyed it", emoji: "😄" },
  { value: "Calm", emoji: "😌" },
  { value: "Bored", emoji: "🥱" },
  { value: "Confused", emoji: "😵‍💫" },
  { value: "Stressed", emoji: "😣" },
  { value: "Not for me", emoji: "🙅" },
];

// The numeric levels still feed insight evolution + clarity, so we derive them
// from the taps instead of asking the user to rate three separate 1–5 scales.
function deriveLevels(signals: string[]) {
  const has = (s: string) => signals.includes(s);
  const curiosity = has("Curious") || has("Excited") ? 5 : has("Enjoyed it") ? 4 : has("Bored") || has("Not for me") ? 2 : 3;
  const energy = has("Excited") || has("Enjoyed it") ? 5 : has("Curious") ? 4 : has("Bored") || has("Stressed") ? 2 : 3;
  const intimidation = has("Stressed") ? 4 : has("Confused") ? 3 : 1;
  return { energy, curiosity, intimidation };
}

export default function ReflectionForm({
  explorationId,
}: {
  explorationId: string;
}) {
  const [signals, setSignals] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  // The this-or-that / real-day choice is carried in sessionStorage (not the URL)
  // to keep the reflect route's URL short.
  const [choice, setChoice] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      const c = sessionStorage.getItem(`ccc_choice_${explorationId}`);
      if (c) setChoice(c);
    } catch {}
  }, [explorationId]);

  function toggleSignal(s: string) {
    setSignals((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const canSubmit = signals.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const { energy, curiosity, intimidation } = deriveLevels(signals);
    startTransition(async () => {
      await completeExploration(explorationId, {
        selectedSignals: signals,
        energyLevel: energy,
        curiosityLevel: curiosity,
        intimidationLevel: intimidation,
        notes: notes.trim() || undefined,
        emotionalState: choice || undefined,
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      {/* What they leaned toward (this-or-that explorations) */}
      {choice && (
        <div className="rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-violet-500">
            You leaned toward
          </p>
          <p className="text-sm leading-relaxed text-stone-700">{choice}</p>
        </div>
      )}

      {/* Feeling chips */}
      <div>
        <p className="mb-1 text-base font-semibold text-stone-800">How did that feel?</p>
        <p className="mb-4 text-sm text-stone-400">Tap anything that fits — there&apos;s no wrong answer.</p>
        <div className="flex flex-wrap gap-2.5">
          {FEELINGS.map(({ value, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleSignal(value)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition active:scale-[0.97] ${
                signals.includes(value)
                  ? "border-violet-300 bg-violet-100 font-medium text-violet-800"
                  : "border-stone-200 bg-white text-stone-600 hover:border-violet-300"
              }`}
            >
              <span aria-hidden="true">{emoji}</span>
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Optional note */}
      <div>
        <label className="mb-2 block text-sm text-stone-500">
          Want to say more? <span className="text-stone-300">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything you noticed…"
          rows={2}
          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 placeholder-stone-300 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit || pending}
        className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40 active:scale-[0.98]"
      >
        {pending ? "Saving…" : "Done →"}
      </button>
    </form>
  );
}
