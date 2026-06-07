// "Where your options stand" — turns the user's reactions across explorations
// into a warming/cooling standing per option they're weighing. No fake scores:
// the bar reflects how they've reacted so far, never a claim that one is right.

const POSITIVE = new Set([
  "Curious",
  "Energized",
  "Excited",
  "Engaged",
  "Inspired",
  "Focused",
  "Calm",
  "Enjoyed it",
]);

const NEGATIVE = new Set([
  "Overwhelmed",
  "Intimidated",
  "Bored",
  "Confused",
  "Resistant",
  "Stressed",
  "Not for me",
]);

export type StandingItem = {
  option: string | null;
  title?: string | null; // exploration title — used as a fallback to match an option
  signals: string[];
  curiosity: number | null;
  energy: number | null;
  intimidation: number | null;
};

export type OptionStanding = {
  label: string;
  fill: number; // 0..1 bar fill
  state: "lean_in" | "mixed" | "pull_back" | "untested";
  signals: string[]; // the actual feelings tapped for this option (most frequent first) — the evidence
  count: number;
};

// Charge is driven by what the user actually tapped (the feeling chips). A
// positive feeling warms the option, a negative one ("Bored", "Stressed",
// "Not for me") cools it. The derived 1–5 numbers are noise here, so we ignore
// them and trust the taps.
function charge(item: StandingItem): number {
  return item.signals.reduce(
    (a, s) => a + (POSITIVE.has(s) ? 1 : NEGATIVE.has(s) ? -1 : 0),
    0
  );
}

function loose(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x.includes(y) || y.includes(x);
}

// Match an exploration to one of the user's options: first by its explicit tag,
// then — crucially — by its title (so "A real day as an Army vehicle mechanic"
// still counts toward "Army" even if the tag was missing or off).
function matchOption(item: StandingItem, options: string[]): string | null {
  if (item.option) {
    const tag = item.option;
    const exact = options.find((o) => o === tag);
    if (exact) return exact;
    const byTag = options.find((o) => loose(o, tag));
    if (byTag) return byTag;
  }
  if (item.title) {
    const byTitle = options.find((o) => item.title!.toLowerCase().includes(o.toLowerCase()));
    if (byTitle) return byTitle;
  }
  return null;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function computeStanding(
  options: string[],
  items: StandingItem[]
): OptionStanding[] {
  // items are most-recent-first.
  const byOption = new Map<string, StandingItem[]>();
  for (const o of options) byOption.set(o, []);
  for (const it of items) {
    const o = matchOption(it, options);
    if (o) byOption.get(o)!.push(it);
  }

  return options.map((label) => {
    const group = byOption.get(label) ?? [];
    if (group.length === 0) {
      return { label, fill: 0, state: "untested" as const, signals: [], count: 0 };
    }
    // avg signal valence per exploration, roughly -3..3.
    const avg = group.reduce((a, it) => a + charge(it), 0) / group.length;
    const fill = clamp01(0.5 + avg / 3);
    const state: OptionStanding["state"] =
      fill >= 0.6 ? "lean_in" : fill <= 0.38 ? "pull_back" : "mixed";

    // The evidence: the feelings they actually tapped for this option, most frequent first.
    const freq = new Map<string, number>();
    for (const it of group) for (const s of it.signals) freq.set(s, (freq.get(s) ?? 0) + 1);
    const signals = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s).slice(0, 4);

    return { label, fill, state, signals, count: group.length };
  });
}

// One honest, plain sentence answering "where have I landed?" — a reflection of
// their own reactions, never a claim about what's objectively right.
export function buildVerdict(standings: OptionStanding[]): string {
  const tested = standings.filter((s) => s.count > 0).sort((a, b) => b.fill - a.fill);
  const untested = standings.filter((s) => s.count === 0);

  if (tested.length === 0) {
    return "You haven't reacted to enough explorations yet to call it.";
  }

  const top = tested[0];
  let line: string;

  if (tested.length === 1) {
    line =
      top.state === "pull_back"
        ? `So far, ${top.label} hasn't been landing for you.`
        : `So far, ${top.label} is the one drawing you in.`;
  } else {
    const second = tested[1];
    const gap = top.fill - second.fill;
    line =
      gap > 0.2
        ? `Based on how you've reacted, ${top.label} is pulling clearly ahead of ${second.label}.`
        : `${top.label} and ${second.label} are running close — you lean slightly toward ${top.label}.`;
  }

  if (untested.length > 0) {
    line += ` You haven't tested ${untested.map((u) => u.label).join(" or ")} yet.`;
  }
  return line;
}
