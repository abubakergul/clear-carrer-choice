// The "IMPACT" breakdown — the competing forces pulling at a student's choice and
// fuelling their confusion (money, family pressure, genuine interest, etc.). Stored
// on FitInsight.driverFactors and rendered as a weighted ring.

export type DriverFactor = {
  label: string;
  weight: number; // re-based to a percentage of the total pull (0–100)
  reason?: string;
};

// The only labels the model may use. Keeping it closed lets the ring stay legible
// and the colours/legend stable.
export const DRIVER_FACTOR_LABELS = [
  "Money",
  "Stability",
  "Family",
  "Friends",
  "Personal interest",
  "Freedom",
  "Impact",
  "Status",
] as const;

// Violet scale, darkest first. The strongest pull gets the darkest colour, the
// weakest the lightest — so the ring reads "what's tugging hardest" at a glance.
export const DRIVER_FACTOR_PALETTE = [
  "#4c1d95",
  "#6d28d9",
  "#7c3aed",
  "#8b5cf6",
  "#a78bfa",
  "#c4b5fd",
  "#ddd6fe",
  "#ede9fe",
];

const LABEL_LOOKUP = new Map(
  DRIVER_FACTOR_LABELS.map((l) => [l.toLowerCase(), l] as const)
);

// Validate/normalise whatever the model returned: keep only known labels, drop
// non-positive or junk weights, merge duplicates, sort strongest-first, and re-base
// the weights into clean percentages that sum to ~100.
export function parseDriverFactors(raw: unknown): DriverFactor[] {
  if (!Array.isArray(raw)) return [];

  const merged = new Map<string, { weight: number; reason?: string }>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label =
      typeof o.label === "string"
        ? LABEL_LOOKUP.get(o.label.trim().toLowerCase())
        : undefined;
    if (!label) continue;
    const weight = Number(o.weight);
    if (!Number.isFinite(weight) || weight <= 0) continue;
    const reason =
      typeof o.reason === "string" && o.reason.trim() ? o.reason.trim() : undefined;

    const existing = merged.get(label);
    if (existing) {
      existing.weight += weight;
      if (!existing.reason && reason) existing.reason = reason;
    } else {
      merged.set(label, { weight, reason });
    }
  }

  const total = [...merged.values()].reduce((s, v) => s + v.weight, 0);
  if (total <= 0) return [];

  return [...merged.entries()]
    .map(([label, v]) => ({
      label,
      weight: Math.round((v.weight / total) * 100),
      reason: v.reason,
    }))
    .filter((f) => f.weight > 0)
    .sort((a, b) => b.weight - a.weight);
}
