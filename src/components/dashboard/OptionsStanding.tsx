import type { OptionStanding } from "@/lib/options";

function stateText(s: OptionStanding): string {
  switch (s.state) {
    case "lean_in":
      return "you lean in";
    case "pull_back":
      return "you pull back";
    case "mixed":
      return "mixed";
    default:
      return "not tested yet";
  }
}

function stateColor(s: OptionStanding): string {
  switch (s.state) {
    case "lean_in":
      return "text-emerald-600";
    case "pull_back":
      return "text-amber-600";
    case "mixed":
      return "text-stone-400";
    default:
      return "text-stone-300";
  }
}

export default function OptionsStanding({ standings }: { standings: OptionStanding[] }) {
  return (
    <div className="flex flex-col gap-5">
      {standings.map((s) => (
        <div key={s.label}>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-stone-800">{s.label}</span>
            <span className={`text-xs font-medium ${stateColor(s)}`}>{stateText(s)}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-violet-500 transition-all duration-700"
              style={{ width: `${Math.round(s.fill * 100)}%` }}
            />
          </div>
          {/* The evidence: what they actually felt */}
          {s.signals.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {s.signals.map((sig) => (
                <span
                  key={sig}
                  className="rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[11px] text-stone-500"
                >
                  {sig}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
      <p className="mt-1 text-xs text-stone-400">
        Based on how you&apos;ve reacted so far — not a verdict on what&apos;s right.
      </p>
    </div>
  );
}
