"use client";

import { useState, useTransition } from "react";
import { skipExploration } from "@/actions/exploration";
import { SKIP_REASONS } from "@/lib/exploration";

export default function SkipDialog({ explorationId }: { explorationId: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>("");
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    if (!selected) return;
    startTransition(async () => {
      await skipExploration(explorationId, selected);
    });
  }

  function handleClose() {
    setOpen(false);
    setSelected("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-stone-400 underline-offset-2 hover:text-stone-600 hover:underline"
      >
        Skip this one
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-0.5 text-sm font-semibold text-stone-800">
              Why are you skipping?
            </h3>
            <p className="mb-4 text-xs text-stone-400">
              Skipping is fine — your reason helps us try something better next time.
            </p>

            <div className="flex flex-col gap-2 mb-5">
              {SKIP_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                    selected === reason
                      ? "border-violet-300 bg-violet-50 text-violet-900"
                      : "border-stone-100 bg-stone-50 text-stone-700 hover:border-stone-200 hover:bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="skip-reason"
                    value={reason}
                    checked={selected === reason}
                    onChange={() => setSelected(reason)}
                    className="sr-only"
                  />
                  <span className={`h-4 w-4 shrink-0 rounded-full border-2 transition ${
                    selected === reason
                      ? "border-violet-500 bg-violet-500"
                      : "border-stone-300 bg-white"
                  }`} />
                  {reason}
                </label>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={!selected || pending}
                className="rounded-xl bg-stone-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-500 disabled:opacity-40"
              >
                {pending ? "Skipping…" : "Skip exploration"}
              </button>
              <button
                onClick={handleClose}
                className="text-sm text-stone-400 hover:text-stone-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
