"use client";

import { useState, useTransition } from "react";
import { completeExploration } from "@/actions/exploration";

const SIGNALS = [
  "Curious",
  "Energized",
  "Calm",
  "Excited",
  "Engaged",
  "Overwhelmed",
  "Intimidated",
  "Bored",
  "Confused",
  "Resistant",
  "Inspired",
  "Focused",
];

type ScaleProps = {
  label: string;
  value: number;
  onChange: (v: number) => void;
};

function Scale({ label, value, onChange }: ScaleProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-stone-700">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-9 w-9 rounded-xl text-sm font-semibold transition ${
              value === n
                ? "bg-violet-600 text-white"
                : "bg-stone-100 text-stone-500 hover:bg-stone-200"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReflectionForm({ explorationId }: { explorationId: string }) {
  const [signals, setSignals] = useState<string[]>([]);
  const [energy, setEnergy] = useState(0);
  const [curiosity, setCuriosity] = useState(0);
  const [intimidation, setIntimidation] = useState(0);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function toggleSignal(s: string) {
    setSignals((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const canSubmit = signals.length > 0 && energy > 0 && curiosity > 0 && intimidation > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    startTransition(async () => {
      await completeExploration(explorationId, {
        selectedSignals: signals,
        energyLevel: energy,
        curiosityLevel: curiosity,
        intimidationLevel: intimidation,
        notes: notes.trim() || undefined,
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Signal chips */}
      <div>
        <p className="mb-1 text-sm font-medium text-stone-700">
          How did this feel? <span className="font-normal text-stone-400">(select all that apply)</span>
        </p>
        <p className="mb-4 text-xs text-stone-400">
          No right answer — just what&apos;s true for you.
        </p>
        <div className="flex flex-wrap gap-2">
          {SIGNALS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSignal(s)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                signals.includes(s)
                  ? "border-violet-300 bg-violet-50 text-violet-800"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Scales */}
      <div className="flex flex-col gap-5">
        <Scale label="Energy level (1 = drained, 5 = energized)" value={energy} onChange={setEnergy} />
        <Scale label="Curiosity level (1 = none, 5 = very curious)" value={curiosity} onChange={setCuriosity} />
        <Scale label="Intimidation level (1 = none, 5 = very intimidated)" value={intimidation} onChange={setIntimidation} />
      </div>

      {/* Notes */}
      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">
          Anything else you noticed? <span className="font-normal text-stone-400">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any thoughts, surprises, or reactions…"
          rows={3}
          className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700 placeholder-stone-300 focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit || pending}
        className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40 active:scale-[0.98]"
      >
        {pending ? "Saving reflection…" : "Save reflection →"}
      </button>
    </form>
  );
}
