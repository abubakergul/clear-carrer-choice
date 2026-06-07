import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExplorationStatus, ReflectionSource } from "@/generated/prisma/client";
import { computeStanding, buildVerdict, type StandingItem } from "@/lib/options";
import OptionsStanding from "@/components/dashboard/OptionsStanding";
import ClarityGenerator from "@/components/dashboard/ClarityGenerator";

type ClarityOutputData = {
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
            <circle cx="8"  cy="10" r="6" stroke="#a78bfa" strokeWidth="1.4" />
            <circle cx="14" cy="10" r="6" stroke="#7c3aed" strokeWidth="1.4" opacity="0.5" />
          </svg>
        </div>
        <p className="text-sm font-medium text-stone-700">Your pattern isn&apos;t ready yet.</p>
        <p className="mt-1 text-xs text-stone-400 max-w-xs">
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

  // Where each option the user is weighing currently stands.
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

  // The "answer" unlocks at 5 completed explorations.
  const unlocked = totalCompleted >= 5;
  const verdict = unlocked && standings.length > 0 ? buildVerdict(standings) : null;

  // "What to do next" comes from the cached clarity output; regenerate in the
  // background when it's missing or the insight has evolved past it.
  const needsClarity =
    unlocked && (!insight.clarityOutput || insight.clarityInsightVersion < insight.version);
  let nextSteps: string[] = [];
  if (unlocked && insight.clarityOutput) {
    try {
      nextSteps = (JSON.parse(insight.clarityOutput) as ClarityOutputData).nextSteps ?? [];
    } catch {
      nextSteps = [];
    }
  }

  return (
    <div className="mx-auto min-h-full max-w-2xl px-6 py-9 sm:px-8">
      {needsClarity && <ClarityGenerator />}

      {/* ── Header ──────────────────────────────────────── */}
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-600">
            {unlocked ? "Where you’ve landed" : "Your pattern"}
          </span>
        </div>
        <h1 className="text-[26px] font-bold leading-snug tracking-tight text-stone-900">
          {verdict ?? "What draws you in"}
        </h1>
        <p className="mt-1.5 text-sm text-stone-400">
          Built from your conversation
          {totalCompleted > 0 && ` · shaped by ${totalCompleted} exploration${totalCompleted !== 1 ? "s" : ""}`}.
        </p>
      </div>

      {/* ── Where your options stand ─────────────────────── */}
      {standings.length > 0 && (
        <section className="mb-9 rounded-2xl border border-stone-100 bg-white px-6 py-6 shadow-sm">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
            Where your options stand
          </p>
          <OptionsStanding standings={standings} />
        </section>
      )}

      {/* ── What to do next (unlocked at 5) ──────────────── */}
      {unlocked && (
        <section className="mb-9">
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

      {/* ── Directions ───────────────────────────────────── */}
      <section className="mb-8">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
          Paths worth exploring
        </p>
        <div className="flex flex-col gap-2">
          {insight.directions.map((d, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-stone-100 bg-white px-5 py-4 shadow-sm"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-stone-800">{d}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Explorations in context ──────────────────────── */}
      {explorationsWithSignals.length > 0 && (
        <section className="mb-8">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
            What you noticed during each exploration
          </p>
          <div className="flex flex-col gap-2">
            {explorationsWithSignals.map((e) => (
              <div key={e.id} className="rounded-xl border border-stone-100 bg-white px-5 py-4">
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

      {/* ── Tensions ─────────────────────────────────────── */}
      {insight.tensions.length > 0 && (
        <section className="mb-8">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
            Things to navigate
          </p>
          <div className="flex flex-col gap-2">
            {insight.tensions.map((t, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border-l-4 border-amber-200 bg-white px-5 py-3.5 shadow-sm"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                <span className="text-sm leading-relaxed text-stone-600">{t}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Pre-unlock teaser ────────────────────────────── */}
      {!unlocked && totalCompleted >= 3 && (
        <div className="mt-8 rounded-xl border border-stone-100 bg-stone-50 px-5 py-4">
          <p className="text-sm text-stone-500">
            Your answer unlocks after 5 explorations. You&apos;ve completed {totalCompleted} so far.
          </p>
        </div>
      )}

      {/* ── Disclaimer ───────────────────────────────────── */}
      <p className="mt-4 text-xs text-stone-400">
        This mirrors how you&apos;ve reacted — not a verdict on what&apos;s right. Speak with a counselor if you&apos;re feeling stuck.
      </p>
    </div>
  );
}
