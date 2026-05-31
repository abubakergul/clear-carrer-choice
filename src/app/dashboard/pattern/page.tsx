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
      take: 5,
      include: {
        reflections: {
          take: 1,
          select: { selectedSignals: true },
        },
      },
    }),
    prisma.exploration.count({ where: { userId, status: ExplorationStatus.COMPLETED } }),
  ]);

  const explorationsWithSignals = explorations.filter(
    (e) => (e.reflections[0]?.selectedSignals?.length ?? 0) > 0
  );

  return (
    <div className="min-h-full px-10 py-9">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-600">
            Your pattern · v{insight.version}
          </span>
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-stone-900">What draws you in</h1>
        <p className="mt-1 text-sm text-stone-400">
          Built from your conversation
          {totalCompleted > 0 && ` · shaped by ${totalCompleted} exploration${totalCompleted !== 1 ? "s" : ""}`}.
        </p>
      </div>

      {/* ── Directions ───────────────────────────────────── */}
      <section className="mb-8">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
          Paths worth exploring
        </p>
        <div className="flex flex-col gap-2">
          {insight.directions.map((d, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-stone-100 bg-white px-5 py-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
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

      {/* ── Clarity Output CTA ───────────────────────────── */}
      {totalCompleted >= 5 ? (
        <div className="mt-8 rounded-xl border border-violet-200 bg-violet-50 px-5 py-4">
          <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-violet-500">
            Ready
          </p>
          <p className="mb-3 text-sm font-medium text-violet-900">
            Your Clarity Output is available.
          </p>
          <Link
            href="/dashboard/clarity"
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-700"
          >
            View Clarity Output
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M4.5 2L8.5 6l-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      ) : totalCompleted >= 3 ? (
        <div className="mt-8 rounded-xl border border-stone-100 bg-stone-50 px-5 py-4">
          <p className="text-sm text-stone-500">
            Clarity Output unlocks after 5 explorations. You&apos;ve completed {totalCompleted} so far.
          </p>
        </div>
      ) : null}

      {/* ── Disclaimer ───────────────────────────────────── */}
      <p className="mt-4 text-xs text-stone-400">
        A starting point, not a verdict. Speak with a counselor if you&apos;re feeling stuck.{" "}
        <Link href="/result" className="underline-offset-2 hover:text-stone-600 hover:underline">
          See original reveal →
        </Link>
      </p>
    </div>
  );
}
