import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { ExplorationStatus, ReflectionSource } from "@/generated/prisma/client";
import { computeStanding, buildVerdict, type StandingItem } from "@/lib/options";
import OptionsStanding from "@/components/dashboard/OptionsStanding";
import ClarityGenerator from "@/components/dashboard/ClarityGenerator";
import ImpactRing from "@/components/result/ImpactRing";
import { parseDriverFactors } from "@/lib/driver-factors";
import { EXPLORATION_GOAL } from "@/lib/exploration";

type ClarityOutputData = {
  fusedRead?: string;
  pathNotes?: { option: string; note: string }[];
  observations: string[];
  uncertainties: string[];
  environments: { title: string; reasoning: string; action: string }[];
  nextSteps: string[];
};

function storedOption(ctx: unknown): string | null {
  if (!ctx || typeof ctx !== "object") return null;
  const o = (ctx as Record<string, unknown>).option;
  return typeof o === "string" && o.trim() ? o.trim() : null;
}

// Abstract "journey to a destination" hero — a path winding over soft hills to a
// marked spot. Gives the page a real visual anchor instead of opening on text.
function JourneyArt() {
  return (
    <svg viewBox="0 0 400 150" className="h-auto w-full" role="img" aria-label="Your path">
      <rect x="0" y="0" width="400" height="150" rx="20" fill="#f5f3ff" />
      {/* hills */}
      <path d="M0 150 Q 90 96 200 120 T 400 104 V150 Z" fill="#ddd6fe" />
      <path d="M0 150 Q 120 124 250 134 T 400 128 V150 Z" fill="#c4b5fd" />
      {/* winding path */}
      <path
        d="M40 138 C 110 132, 120 96, 200 100 S 300 70, 344 44"
        fill="none"
        stroke="#7c3aed"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="2 7"
        opacity="0.7"
      />
      {/* destination */}
      <circle cx="344" cy="44" r="13" fill="#ede9fe" />
      <circle cx="344" cy="44" r="5.5" fill="#7c3aed" />
      <circle cx="344" cy="44" r="13" fill="none" stroke="#a78bfa" strokeWidth="1.5" />
      {/* a couple of soft sun rings */}
      <circle cx="92" cy="44" r="16" fill="#fff" opacity="0.6" />
    </svg>
  );
}

export default async function PatternPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const userId = session.user.id;

  const insight = await prisma.fitInsight.findUnique({ where: { userId } });

  if (!insight) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-8 py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <circle cx="8" cy="10" r="6" stroke="#a78bfa" strokeWidth="1.4" />
            <circle cx="14" cy="10" r="6" stroke="#7c3aed" strokeWidth="1.4" opacity="0.5" />
          </svg>
        </div>
        <p className="text-sm font-medium text-stone-700">Your pattern isn&apos;t ready yet.</p>
        <p className="mt-1 max-w-xs text-xs text-stone-400">
          Complete the conversation to generate your personal insight — then your pattern will live here.
        </p>
      </div>
    );
  }

  const [explorations, totalCompleted] = await Promise.all([
    prisma.exploration.findMany({
      where: { userId, status: ExplorationStatus.COMPLETED },
      orderBy: { completedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        generationContext: true,
        reflections: {
          where: { source: ReflectionSource.COMPLETION },
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            selectedSignals: true,
            curiosityLevel: true,
            energyLevel: true,
            intimidationLevel: true,
          },
        },
      },
    }),
    prisma.exploration.count({ where: { userId, status: ExplorationStatus.COMPLETED } }),
  ]);

  const explorationsWithSignals = explorations.filter(
    (e) => (e.reflections[0]?.selectedSignals?.length ?? 0) > 0
  );

  const standingItems: StandingItem[] = explorations.map((e) => {
    const r = e.reflections[0];
    return {
      option: storedOption(e.generationContext),
      title: e.title,
      signals: r?.selectedSignals ?? [],
      curiosity: r?.curiosityLevel ?? null,
      energy: r?.energyLevel ?? null,
      intimidation: r?.intimidationLevel ?? null,
    };
  });
  const standings =
    insight.options.length > 0 ? computeStanding(insight.options, standingItems) : [];

  const factors = parseDriverFactors(insight.driverFactors);

  const unlocked = totalCompleted >= EXPLORATION_GOAL;
  const verdict = unlocked && standings.length > 0 ? buildVerdict(standings) : null;

  const needsClarity =
    unlocked && (!insight.clarityOutput || insight.clarityInsightVersion < insight.version);
  let clarity: ClarityOutputData | null = null;
  if (unlocked && insight.clarityOutput) {
    try {
      clarity = JSON.parse(insight.clarityOutput) as ClarityOutputData;
    } catch {
      clarity = null;
    }
  }
  const nextSteps = clarity?.nextSteps ?? [];
  const fusedRead = clarity?.fusedRead?.trim() || null;

  const pathNotes: Record<string, string> = {};
  for (const pn of clarity?.pathNotes ?? []) {
    if (!pn || typeof pn.option !== "string" || typeof pn.note !== "string") continue;
    const match = insight.options.find(
      (o) =>
        o.toLowerCase() === pn.option.toLowerCase() ||
        o.toLowerCase().includes(pn.option.toLowerCase()) ||
        pn.option.toLowerCase().includes(o.toLowerCase())
    );
    if (match) pathNotes[match] = pn.note;
  }

  const hasDetails =
    insight.directions.length > 0 ||
    explorationsWithSignals.length > 0 ||
    insight.tensions.length > 0;

  return (
    <div className="mx-auto min-h-full max-w-2xl px-6 py-9 sm:px-8">
      {needsClarity && <ClarityGenerator />}

      {/* ── Hero ────────────────────────────────────────── */}
      <div className="mb-7">
        <div className="mb-4 overflow-hidden rounded-3xl">
          <JourneyArt />
        </div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-600">
            {unlocked ? "Where you’ve landed" : "Your pattern"}
          </span>
        </div>
        <h1 className="text-[26px] font-bold leading-snug tracking-tight text-stone-900">
          {verdict ?? "What draws you in"}
        </h1>
      </div>

      {/* ── What's pulling you (IMPACT ring) ─────────────── */}
      {factors.length > 0 && (
        <section className="mb-7 rounded-2xl border border-stone-100 bg-white px-6 py-6 shadow-sm">
          <p className="mb-5 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
            What&apos;s making this hard
          </p>
          <ImpactRing factors={factors} />
        </section>
      )}

      {/* ── Where you're landing (the visual answer) ─────── */}
      {standings.length > 0 && (
        <section className="mb-7 rounded-2xl border border-stone-100 bg-white px-6 py-6 shadow-sm">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
            {fusedRead ? "Where you're landing" : "Where your options stand"}
          </p>
          {fusedRead && (
            <p className="mb-5 border-l-2 border-violet-200 pl-4 text-[15px] font-medium leading-7 text-stone-700">
              {fusedRead}
            </p>
          )}
          <OptionsStanding standings={standings} notes={pathNotes} />
        </section>
      )}

      {/* ── What to do next ──────────────────────────────── */}
      {unlocked && (
        <section className="mb-7">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
            What to do next
          </p>
          {nextSteps.length > 0 ? (
            <div className="flex flex-col gap-2">
              {nextSteps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-stone-100 bg-white px-5 py-3.5 shadow-sm"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                  <p className="text-sm leading-relaxed text-stone-700">{step}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-stone-100 bg-white px-5 py-4 shadow-sm">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 animate-pulse rounded-full bg-violet-300"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              <p className="text-sm text-stone-400">Working out your next steps…</p>
            </div>
          )}
        </section>
      )}

      {/* ── Pre-unlock progress ──────────────────────────── */}
      {!unlocked && (
        <div className="mb-7 rounded-xl border border-stone-100 bg-stone-50 px-5 py-4">
          <p className="text-sm text-stone-500">
            {totalCompleted === 0
              ? `Do ${EXPLORATION_GOAL} short explorations and your answer unlocks here.`
              : `${EXPLORATION_GOAL - totalCompleted} more exploration${
                  EXPLORATION_GOAL - totalCompleted !== 1 ? "s" : ""
                } and your answer unlocks here. You've done ${totalCompleted}.`}
          </p>
        </div>
      )}

      {/* ── The detail (collapsed — most people just want the headline) ── */}
      {hasDetails && (
        <details className="group mb-4 rounded-2xl border border-stone-100 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 text-sm font-medium text-stone-600 hover:text-stone-900">
            See the full breakdown
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-stone-400 transition-transform group-open:rotate-180"
              aria-hidden="true"
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </summary>

          <div className="flex flex-col gap-8 border-t border-stone-100 px-6 py-6">
            {/* Directions */}
            {insight.directions.length > 0 && (
              <section>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
                  Paths worth exploring
                </p>
                <div className="flex flex-col gap-2">
                  {insight.directions.map((d, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-xl border border-stone-100 px-5 py-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-stone-800">{d}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* What you noticed */}
            {explorationsWithSignals.length > 0 && (
              <section>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
                  What you noticed during each exploration
                </p>
                <div className="flex flex-col gap-2">
                  {explorationsWithSignals.map((e) => (
                    <div key={e.id} className="rounded-xl border border-stone-100 px-5 py-4">
                      <p className="mb-2.5 text-[13px] font-semibold text-stone-700">{e.title}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {e.reflections[0].selectedSignals.slice(0, 4).map((s) => (
                          <span
                            key={s}
                            className="rounded-full border border-violet-100 bg-violet-50 px-2.5 py-0.5 text-[11px] font-medium text-violet-600"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tensions */}
            {insight.tensions.length > 0 && (
              <section>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
                  Things to navigate
                </p>
                <div className="flex flex-col gap-2">
                  {insight.tensions.map((t, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl border-l-4 border-amber-200 px-5 py-3.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      <span className="text-sm leading-relaxed text-stone-600">{t}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </details>
      )}

      {/* ── Disclaimer ───────────────────────────────────── */}
      <p className="mt-4 text-xs text-stone-400">
        This mirrors how you&apos;ve reacted — not a verdict on what&apos;s right. Speak with a counselor if you&apos;re feeling stuck.
      </p>
    </div>
  );
}
