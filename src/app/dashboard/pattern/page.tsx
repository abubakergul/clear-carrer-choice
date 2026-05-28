import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExplorationStatus } from "@/generated/prisma/client";

export default async function PatternPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const userId = session.user.id;

  const insight = await prisma.fitInsight.findUnique({
    where: { userId },
  });

  if (!insight) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-8 py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <circle cx="8"  cy="10" r="6" stroke="#a78bfa" strokeWidth="1.4" />
            <circle cx="14" cy="10" r="6" stroke="#7c3aed" strokeWidth="1.4" opacity="0.5" />
            <circle cx="11" cy="14" r="6" stroke="#6d28d9" strokeWidth="1.4" opacity="0.25" />
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
      take: 3,
      include: { reflections: { take: 1 } },
    }),
    prisma.exploration.count({
      where: { userId, status: ExplorationStatus.COMPLETED },
    }),
  ]);

  return (
    <div className="min-h-full px-10 py-9">

      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-600">
            Your pattern · v{insight.version}
          </span>
        </div>
        <h1 className="text-[22px] font-bold tracking-tight text-stone-900">My Pattern</h1>
        <p className="mt-1 text-sm text-stone-400">
          Built from your conversation.
          {totalCompleted > 0 && ` Refined by ${totalCompleted} exploration${totalCompleted !== 1 ? "s" : ""}.`}
        </p>
      </div>

      {/* Summary */}
      <section className="mb-8">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
          Summary
        </p>
        <div className="rounded-2xl bg-violet-50 px-6 py-5 ring-1 ring-violet-100">
          <p className="text-sm leading-7 text-stone-700">{insight.summary}</p>
        </div>
      </section>

      {/* Directions + Tensions side-by-side */}
      <div className="mb-8 grid grid-cols-2 gap-4">
        {/* Directions */}
        <section>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
            Paths worth exploring
          </p>
          <div className="flex flex-col gap-2">
            {insight.directions.map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-stone-100 bg-white px-4 py-3"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-600">
                  {i + 1}
                </span>
                <span className="text-sm text-stone-700">{d}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Tensions */}
        <section>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
            Tensions to work through
          </p>
          {insight.tensions.length > 0 ? (
            <div className="flex flex-col gap-2">
              {insight.tensions.map((t, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  <span className="text-sm text-stone-600">{t}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-300">None identified yet.</p>
          )}
        </section>
      </div>

      {/* Exploration signal recap */}
      {explorations.length > 0 && (
        <section>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
            What your explorations revealed
          </p>
          <div className="flex flex-col gap-3">
            {explorations.map((e) => {
              const r = e.reflections[0];
              return (
                <div key={e.id} className="rounded-xl border border-stone-100 bg-white px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-stone-800">{e.title}</p>
                    {r && (
                      <div className="flex shrink-0 items-center gap-2">
                        {r.curiosityLevel !== null && (
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
                            curiosity {r.curiosityLevel}/5
                          </span>
                        )}
                        {r.energyLevel !== null && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                            energy {r.energyLevel}/5
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {r?.selectedSignals && r.selectedSignals.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.selectedSignals.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-stone-100 bg-stone-50 px-2.5 py-0.5 text-[11px] text-stone-500"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <p className="mt-8 text-xs text-stone-300">
        One conversation — a starting point, not a verdict. Speak with a counselor if you&apos;re feeling stuck.{" "}
        <Link href="/result" className="underline-offset-2 hover:text-stone-500 hover:underline">
          See original reveal →
        </Link>
      </p>
    </div>
  );
}
