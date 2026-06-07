// Pure logic for the "self-picture" constellation and the post-reflection
// "what just shifted" payoff. No AI calls — every number here is derived
// directly from the user's own reflections, so the reaction read is provably
// honest ("4th time" is literally a count, not a generated claim).

const POSITIVE_SIGNALS = new Set([
  "Curious",
  "Energized",
  "Excited",
  "Engaged",
  "Inspired",
  "Focused",
  "Calm",
  "Enjoyed it",
]);

const NEGATIVE_SIGNALS = new Set([
  "Overwhelmed",
  "Intimidated",
  "Bored",
  "Confused",
  "Resistant",
  "Stressed",
  "Not for me",
]);

// One completed exploration + its reflection, flattened for the math below.
export type CompletedItem = {
  id: string;
  direction: string | null; // canonical direction text this exploration tested
  signals: string[];
  curiosity: number | null;
  energy: number | null;
  intimidation: number | null;
};

export type ConstellationNode = {
  direction: string; // full direction text (node identity)
  label: string; // short label for display
  weight: number; // 0..1 — drives size, brightness, and pull toward center
  charge: number; // raw signed charge (can be negative)
  count: number; // explorations attributed to this direction
  trend: "rising" | "steady" | "fading";
};

export type Shift = {
  nodes: ConstellationNode[];
  highlightDirection: string | null;
  reactionRead: string;
};

// Signed "charge" a single reflection contributes. Curiosity + energy lift it,
// intimidation pulls it down; selected signals nudge by valence.
function reflectionCharge(item: CompletedItem): number {
  const cur = item.curiosity ?? 3;
  const en = item.energy ?? 3;
  const intim = item.intimidation ?? 3;
  const scale = cur + en - intim; // roughly -3..9

  const signal = item.signals.reduce((acc, s) => {
    if (POSITIVE_SIGNALS.has(s)) return acc + 1;
    if (NEGATIVE_SIGNALS.has(s)) return acc - 1;
    return acc;
  }, 0);

  return scale + signal;
}

function isPositive(item: CompletedItem): boolean {
  return reflectionCharge(item) >= 2;
}

// Strip the grounding boilerplate off an evolved direction sentence and keep a
// short, node-sized phrase. Directions are full sentences post prompt-grounding
// (e.g. "You seem drawn toward creative, open-ended work because..."), so we cut
// at the first clause boundary and cap the word count.
export function shortLabel(direction: string): string {
  let s = direction.trim();
  s = s.replace(
    /^you(?:'re| are| seem(?:\s+to\s+be)?)?\s+(?:drawn\s+(?:to|toward)|interested\s+in|leaning\s+toward|pulled\s+toward)\s+/i,
    ""
  );
  // Cut at the first clause boundary.
  s = s.split(/\bbecause\b|—|–| - |[,.;:]/i)[0].trim();
  const words = s.split(/\s+/).filter(Boolean).slice(0, 4).join(" ");
  if (!words) return direction.split(/\s+/).slice(0, 4).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Match a stored direction string to one of the user's current directions.
// Directions evolve over time, so we accept exact match first, then a loose
// substring overlap, then give up (null = unattributed).
export function attributeDirection(
  stored: string | null | undefined,
  directions: string[]
): string | null {
  if (!stored) return null;
  const exact = directions.find((d) => d === stored);
  if (exact) return exact;
  const norm = stored.toLowerCase();
  const loose = directions.find(
    (d) => d.toLowerCase().includes(norm) || norm.includes(d.toLowerCase())
  );
  return loose ?? null;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Compute the constellation node weights from a user's completed explorations.
// Used both by the payoff screen and the dashboard home (where there is no
// "just completed" highlight).
export function computeNodes(
  directions: string[],
  completed: CompletedItem[]
): ConstellationNode[] {
  // Group charges by direction (most-recent-first order preserved).
  const byDirection = new Map<string, CompletedItem[]>();
  for (const d of directions) byDirection.set(d, []);
  for (const item of completed) {
    const dir = attributeDirection(item.direction, directions);
    if (dir) byDirection.get(dir)!.push(item);
  }

  const rawNodes = directions.map((direction) => {
    const items = byDirection.get(direction) ?? [];
    const charge = items.reduce((acc, it) => acc + reflectionCharge(it), 0);

    // Trend: compare the most recent attributed item against the earlier ones.
    let trend: ConstellationNode["trend"] = "steady";
    if (items.length >= 1) {
      const recent = reflectionCharge(items[0]);
      if (recent >= 4) trend = "rising";
      else if (recent <= 0) trend = "fading";
    }

    return {
      direction,
      label: shortLabel(direction),
      charge,
      count: items.length,
      trend,
    };
  });

  // Normalize charge → weight in [0.14, 1]. Empty/negative nodes stay faint;
  // the strongest positive direction approaches 1.
  const maxCharge = Math.max(1, ...rawNodes.map((n) => n.charge));
  return rawNodes.map((n) => {
    const norm = Math.max(0, n.charge) / maxCharge; // 0..1
    const weight = n.count === 0 ? 0.14 : 0.3 + 0.7 * norm;
    return { ...n, weight };
  });
}

// Build the full payoff: node weights + which node to highlight + the sentence.
export function buildShift(params: {
  directions: string[];
  completed: CompletedItem[]; // all completed items, including the just-finished one
  justCompletedId: string;
}): Shift {
  const { directions, completed, justCompletedId } = params;

  const just = completed.find((c) => c.id === justCompletedId) ?? null;
  const highlightDirection = just
    ? attributeDirection(just.direction, directions)
    : null;

  return {
    nodes: computeNodes(directions, completed),
    highlightDirection,
    reactionRead: buildReactionRead({ directions, completed, just, highlightDirection }),
  };
}

function buildReactionRead(params: {
  directions: string[];
  completed: CompletedItem[];
  just: CompletedItem | null;
  highlightDirection: string | null;
}): string {
  const { completed, just, highlightDirection } = params;
  if (!just) return "Your picture just took in a little more of who you are.";

  const positive = isPositive(just);
  const namedSignals = just.signals
    .filter((s) => (positive ? POSITIVE_SIGNALS.has(s) : NEGATIVE_SIGNALS.has(s)))
    .slice(0, 2);
  const named =
    namedSignals.length > 0
      ? namedSignals.join(" and ")
      : just.signals.slice(0, 2).join(" and ");

  // How many completed explorations share this direction (the count that makes
  // "4th time" true). Fall back to "shares a dominant signal" when unattributed.
  let count: number;
  let label: string | null = null;
  if (highlightDirection) {
    count = completed.filter(
      (c) => attributeDirection(c.direction, params.directions) === highlightDirection
    ).length;
    label = shortLabel(highlightDirection).toLowerCase();
  } else {
    const dominant = new Set(namedSignals);
    count = completed.filter((c) => c.signals.some((s) => dominant.has(s))).length;
  }

  if (!named) {
    return positive
      ? "That reaction is becoming a pattern worth trusting."
      : "Noticing what drains you matters as much as what lifts you.";
  }

  const ord = ordinal(Math.max(1, count));

  if (positive) {
    if (label && count >= 2)
      return `You felt ${named} — that's the ${ord} time ${label} has drawn you in. It's pulling ahead.`;
    if (label)
      return `You felt ${named} exploring ${label}. Your picture leaned toward it.`;
    return `You felt ${named} again — that reaction is becoming a pattern worth trusting.`;
  }

  if (label && count >= 2)
    return `You felt ${named} here — ${label} keeps going quiet for you. That's signal too.`;
  if (label)
    return `You felt ${named} exploring ${label}. That reaction is data, not failure.`;
  return `You felt ${named} here. What drains you is as telling as what lifts you.`;
}
