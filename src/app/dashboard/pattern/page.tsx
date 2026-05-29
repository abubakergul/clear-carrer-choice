import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExplorationStatus } from "@/generated/prisma/client";

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

  const [explorations, totalCompleted, allReflections] = await Promise.all([
    prisma.exploration.findMany({
      where: { userId, status: ExplorationStatus.COMPLETED },
      orderBy: { completedAt: "desc" },
      take: 3,
      include: { reflections: { take: 1 } },
    }),
    prisma.exploration.count({ where: { userId, status: ExplorationStatus.COMPLETED } }),
    prisma.reflection.findMany({
      where: { exploration: { userId }, selectedSignals: { isEmpty: false } },
      select: { selectedSignals: true },
    }),
  ]);

  const signalCounts = allReflections.reduce<Record<string, number>>((acc, r) => {
    for (const s of r.selectedSignals) acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  const sortedSignals = Object.entries(signalCounts).sort(([, a], [, b]) => b - a);
  const maxCount = sortedSignals[0]?.[1] ?? 1;

  return (
    <>
      <style>{`
        @keyframes growBar {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ringPulse {
          0%, 100% { opacity: 0.10; }
          50%       { opacity: 0.20; }
        }
        .pattern-section {
          opacity: 0;
          animation: fadeUp 0.5s ease-out forwards;
        }
      `}</style>

      <div className="min-h-full px-10 py-9">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="relative mb-10 overflow-hidden pattern-section" style={{ animationDelay: "0ms" }}>
          {/* Animated rings */}
          <div
            className="pointer-events-none absolute -top-6 right-0"
            style={{ animation: "ringPulse 4s ease-in-out infinite" }}
          >
            <svg width="160" height="160" viewBox="0 0 160 160" fill="none" aria-hidden="true">
              <circle cx="54"  cy="80" r="50" stroke="#7c3aed" strokeWidth="1.2" />
              <circle cx="106" cy="80" r="50" stroke="#7c3aed" strokeWidth="1.2" />
              <circle cx="80"  cy="114" r="50" stroke="#7c3aed" strokeWidth="1.2" />
            </svg>
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-600">
              Your pattern · v{insight.version}
            </span>
          </div>
          <h1 className="text-[26px] font-bold tracking-tight text-stone-900">My Pattern</h1>
          <p className="mt-1 text-sm text-stone-400">
            Built from your conversation
            {totalCompleted > 0 && ` · shaped by ${totalCompleted} exploration${totalCompleted !== 1 ? "s" : ""}`}.
          </p>
        </div>

        {/* ── Signal frequency bars ────────────────────────── */}
        {sortedSignals.length > 0 && (
          <section
            className="mb-8 rounded-2xl border border-violet-100 bg-violet-50 px-6 py-5 pattern-section"
            style={{ animationDelay: "80ms" }}
          >
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-widest text-violet-400">
              What you keep noticing
            </p>
            <div className="flex flex-col gap-3.5">
              {sortedSignals.map(([signal, count], i) => {
                const pct = Math.round((count / maxCount) * 100);
                const isTop = i === 0;
                return (
                  <div key={signal} className="flex items-center gap-3">
                    <span className="w-[88px] shrink-0 text-right text-xs font-medium text-stone-500">
                      {signal}
                    </span>
                    <div className="relative flex-1 h-2 overflow-hidden rounded-full bg-violet-100">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full origin-left ${isTop ? "bg-violet-500" : "bg-violet-300"}`}
                        style={{
                          width: `${pct}%`,
                          animation: `growBar 0.7s cubic-bezier(0.16,1,0.3,1) ${120 + i * 60}ms both`,
                        }}
                      />
                    </div>
                    <span className="w-6 shrink-0 text-right text-xs text-stone-400">×{count}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Pattern synthesis ────────────────────────────── */}
        {insight.patternSummary && (
          <section
            className="mb-8 pattern-section"
            style={{ animationDelay: "160ms" }}
          >
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
              What we&apos;ve noticed
            </p>
            <div className="rounded-2xl border border-violet-100 bg-violet-50 px-6 py-5">
              <p className="text-sm leading-7 text-violet-900">{insight.patternSummary}</p>
            </div>
          </section>
        )}

        {/* ── Summary ──────────────────────────────────────── */}
        <section
          className="mb-8 pattern-section"
          style={{ animationDelay: "220ms" }}
        >
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
            Summary
          </p>
          <div className="rounded-2xl border-l-4 border-violet-300 bg-white px-6 py-5 shadow-sm">
            <p className="text-sm leading-7 text-stone-700">{insight.summary}</p>
          </div>
        </section>

        {/* ── Directions ───────────────────────────────────── */}
        <section
          className="mb-6 pattern-section"
          style={{ animationDelay: "300ms" }}
        >
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
            Paths worth exploring
          </p>
          <div className="flex flex-col gap-2">
            {insight.directions.map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border-l-4 border-violet-300 bg-white px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-stone-800">{d}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tensions ─────────────────────────────────────── */}
        {insight.tensions.length > 0 && (
          <section
            className="mb-8 pattern-section"
            style={{ animationDelay: "380ms" }}
          >
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
              Tensions to work through
            </p>
            <div className="flex flex-col gap-2">
              {insight.tensions.map((t, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-xl border-l-4 border-amber-300 bg-white px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                  <span className="text-sm text-stone-600">{t}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Explorations recap ───────────────────────────── */}
        {explorations.length > 0 && (
          <section
            className="mb-8 pattern-section"
            style={{ animationDelay: "440ms" }}
          >
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
              What your explorations revealed
            </p>
            <div className="flex flex-col gap-3">
              {explorations.map((e) => {
                const r = e.reflections[0];
                return (
                  <div
                    key={e.id}
                    className="rounded-xl border border-stone-100 bg-white px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                  >
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

        {/* ── Disclaimer ───────────────────────────────────── */}
        <p className="mt-4 text-xs text-stone-500">
          One conversation — a starting point, not a verdict. Speak with a counselor if you&apos;re feeling stuck.{" "}
          <Link href="/result" className="underline-offset-2 hover:text-stone-700 hover:underline">
            See original reveal →
          </Link>
        </p>
      </div>
    </>
  );
}
