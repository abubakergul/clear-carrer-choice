import { DriverFactor, DRIVER_FACTOR_PALETTE } from "@/lib/driver-factors";

// The "IMPACT" ring: a weighted donut showing the competing forces behind a
// student's confusion. Strongest pull = darkest arc + top of the legend, so the
// reason they're stuck reads in a single glance.

const R = 60; // ring radius
const STROKE = 18; // arc thickness
const SIZE = 160; // viewBox edge
const C = 2 * Math.PI * R; // circumference
const GAP = 2.5; // visual gap between arcs, in path units

function colorFor(rank: number): string {
  return DRIVER_FACTOR_PALETTE[Math.min(rank, DRIVER_FACTOR_PALETTE.length - 1)];
}

export default function ImpactRing({ factors }: { factors: DriverFactor[] }) {
  if (!factors || factors.length === 0) return null;

  // Build the arc segments. Weights already sum to ~100 (parseDriverFactors).
  // Each segment starts where the sum of the earlier weights ends — computed
  // without mutating shared state so it stays render-safe.
  const segments = factors.map((f, i, arr) => {
    const startFrac =
      arr.slice(0, i).reduce((sum, x) => sum + x.weight, 0) / 100;
    const len = (f.weight / 100) * C;
    return {
      color: colorFor(i),
      dash: Math.max(len - GAP, 0.5),
      offset: -startFrac * C,
    };
  });

  const ariaLabel =
    "What's pulling at your choice: " +
    factors.map((f) => `${f.label} ${f.weight}%`).join(", ");

  return (
    <div>
      <div className="flex flex-col items-center sm:flex-row sm:items-center sm:gap-7">
        {/* Ring */}
        <div className="relative shrink-0">
          <svg
            width="176"
            height="176"
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label={ariaLabel}
          >
            <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
              {/* Track */}
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke="#f5f5f4"
                strokeWidth={STROKE}
              />
              {segments.map((s, i) => (
                <circle
                  key={i}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={STROKE}
                  strokeDasharray={`${s.dash} ${C - s.dash}`}
                  strokeDashoffset={s.offset}
                  strokeLinecap="butt"
                />
              ))}
            </g>
          </svg>
          {/* Center label */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
              What pulls
            </span>
            <span className="text-sm font-bold tracking-tight text-stone-700">
              you
            </span>
          </div>
        </div>

        {/* Legend */}
        <ul className="mt-5 flex w-full flex-col gap-2.5 sm:mt-0">
          {factors.map((f, i) => (
            <li key={f.label} className="flex items-start gap-2.5">
              <span
                className="mt-1 h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: colorFor(i) }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-stone-700">
                    {f.label}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-stone-400">
                    {f.weight}%
                  </span>
                </div>
                {f.reason && (
                  <p className="text-xs leading-snug text-stone-400">{f.reason}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
