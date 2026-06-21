import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExplorationStatus, ReflectionSource } from "@/generated/prisma/client";
import { buildShift, type CompletedItem } from "@/lib/constellation";
import { EXPLORATION_GOAL } from "@/lib/exploration";
import Stars from "@/components/dashboard/Stars";
import ExplorationGenerator from "@/components/dashboard/ExplorationGenerator";

function storedDirection(ctx: unknown): string | null {
  if (!ctx || typeof ctx !== "object") return null;
  const d = (ctx as Record<string, unknown>).direction;
  return typeof d === "string" && d.trim() ? d.trim() : null;
}

export default async function ShiftPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const userId = session.user.id;
  const { id } = await params;

  const [insight, completedRaw] = await Promise.all([
    prisma.fitInsight.findUnique({
      where: { userId },
      select: { directions: true },
    }),
    prisma.exploration.findMany({
      where: { userId, status: ExplorationStatus.COMPLETED },
      orderBy: { completedAt: "desc" },
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
  ]);

  const thisOne = completedRaw.find((e) => e.id === id);
  // Only a freshly-completed exploration earns a payoff screen.
  if (!insight || insight.directions.length === 0 || !thisOne) {
    redirect("/dashboard");
  }

  const completed: CompletedItem[] = completedRaw.map((e) => {
    const r = e.reflections[0];
    return {
      id: e.id,
      direction: storedDirection(e.generationContext),
      signals: r?.selectedSignals ?? [],
      curiosity: r?.curiosityLevel ?? null,
      energy: r?.energyLevel ?? null,
      intimidation: r?.intimidationLevel ?? null,
    };
  });

  const { reactionRead } = buildShift({
    directions: insight.directions,
    completed,
    justCompletedId: id,
  });

  const completedCount = completed.length;
  const earned = Math.min(EXPLORATION_GOAL, completedCount);
  const remaining = Math.max(0, EXPLORATION_GOAL - completedCount);

  return (
    <div className="min-h-full px-6 py-12 sm:px-10">
      {/* Pre-warm the next exploration in the background while they sit here */}
      <ExplorationGenerator />

      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        {/* Eyebrow */}
        <div
          className="anim-fade-in mb-6 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1"
          style={{ animationDelay: "0ms" }}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-600">
            What just shifted
          </span>
        </div>

        {/* A star lights up for this exploration */}
        <div className="anim-fade-up mb-5 mt-2" style={{ animationDelay: "120ms" }}>
          <Stars earned={earned} total={EXPLORATION_GOAL} justEarned />
        </div>

        {/* The reaction read — instant, grounded in their own answers */}
        <p
          className="anim-fade-up mb-2 max-w-sm text-lg font-semibold leading-snug text-stone-800"
          style={{ animationDelay: "320ms" }}
        >
          {reactionRead}
        </p>

        <p
          className="anim-fade-in mb-9 text-sm text-stone-500"
          style={{ animationDelay: "460ms" }}
        >
          {remaining > 0
            ? `${earned} of ${EXPLORATION_GOAL} lit — ${remaining} more to unlock your answer.`
            : `All ${EXPLORATION_GOAL} lit — your answer is ready.`}
        </p>

        {/* Continue */}
        <div
          className="anim-fade-in flex flex-col items-center gap-3"
          style={{ animationDelay: "560ms" }}
        >
          {completedCount >= EXPLORATION_GOAL ? (
            <>
              <Link
                href="/dashboard/pattern"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 active:scale-[0.98]"
              >
                See where you&apos;ve landed
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2.5 7h9m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/dashboard" className="text-xs text-stone-400 hover:text-stone-600">
                Back to home
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 active:scale-[0.98]"
              >
                Keep exploring
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2.5 7h9m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/dashboard/pattern"
                className="text-xs text-stone-400 hover:text-stone-600"
              >
                See your pattern so far →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
