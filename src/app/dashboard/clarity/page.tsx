import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExplorationStatus } from "@/generated/prisma/client";
import ClarityGenerator from "@/components/dashboard/ClarityGenerator";

type ClarityOutputData = {
  observations: string[];
  uncertainties: string[];
  environments: { title: string; reasoning: string; action: string }[];
  nextSteps: string[];
};

export default async function ClarityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const userId = session.user.id;

  const [insight, completedCount] = await Promise.all([
    prisma.fitInsight.findUnique({
      where: { userId },
      select: {
        clarityOutput: true,
        clarityInsightVersion: true,
        version: true,
      },
    }),
    prisma.exploration.count({ where: { userId, status: ExplorationStatus.COMPLETED } }),
  ]);

  if (!insight || completedCount < 5) {
    redirect("/dashboard/pattern");
  }

  const needsGeneration =
    !insight.clarityOutput || insight.clarityInsightVersion < insight.version;

  if (needsGeneration) {
    return (
      <div className="min-h-full px-10 py-9">
        <Link
          href="/dashboard/pattern"
          className="mb-8 inline-flex items-center gap-1.5 text-xs text-stone-400 transition-colors hover:text-stone-600"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to pattern
        </Link>

        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 animate-pulse rounded-full bg-violet-300"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          <p className="text-sm font-medium text-stone-700">
            Preparing your Clarity Output&hellip;
          </p>
          <p className="mt-1 text-xs text-stone-400">This takes a moment.</p>
        </div>

        <ClarityGenerator />
      </div>
    );
  }

  let data: ClarityOutputData;
  try {
    data = JSON.parse(insight.clarityOutput!);
  } catch {
    return (
      <div className="min-h-full px-10 py-9">
        <Link
          href="/dashboard/pattern"
          className="mb-8 inline-flex items-center gap-1.5 text-xs text-stone-400 transition-colors hover:text-stone-600"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to pattern
        </Link>
        <p className="mt-20 text-center text-sm text-stone-500">
          We couldn&apos;t prepare this right now. Try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full px-10 py-9">

      {/* ── Back link ─────────────────────────────────────── */}
      <Link
        href="/dashboard/pattern"
        className="mb-8 inline-flex items-center gap-1.5 text-xs text-stone-400 transition-colors hover:text-stone-600"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M7.5 2L3.5 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to pattern
      </Link>

      {/* ── Header ────────────────────────────────────────── */}
      <div className="mb-12">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-violet-600">
            Clarity Output
          </span>
        </div>
        <h1 className="text-[26px] font-bold tracking-tight text-stone-900">
          Here is what we noticed.
        </h1>
        <p className="mt-1.5 text-sm text-stone-400">
          Based on {completedCount} exploration{completedCount !== 1 ? "s" : ""} and your reflections.
        </p>
      </div>

      {/* ── Section 1: What We Noticed ────────────────────── */}
      <section className="mb-12">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
          What we noticed
        </p>
        <div className="flex flex-col gap-3">
          {data.observations.map((obs, i) => (
            <p
              key={i}
              className="rounded-xl border border-stone-100 bg-white px-5 py-4 text-sm leading-relaxed text-stone-700 shadow-sm"
            >
              {obs}
            </p>
          ))}
        </div>
      </section>

      {/* ── Section 2: What's Still Uncertain ────────────── */}
      {data.uncertainties.length > 0 && (
        <section className="mb-12">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
            What&apos;s still uncertain
          </p>
          <div className="flex flex-col gap-3">
            {data.uncertainties.map((u, i) => (
              <p
                key={i}
                className="rounded-xl border-l-4 border-stone-200 bg-white px-5 py-4 text-sm leading-relaxed text-stone-600 shadow-sm"
              >
                {u}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* ── Section 3: Environments ───────────────────────── */}
      <section className="mb-12">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
          Environments worth exploring
        </p>
        <div className="flex flex-col gap-4">
          {data.environments.map((env, i) => (
            <div
              key={i}
              className="rounded-xl border border-stone-100 bg-white px-5 py-5 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600">
                  {i + 1}
                </span>
                <h3 className="text-sm font-semibold text-stone-800">{env.title}</h3>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-stone-600">{env.reasoning}</p>
              <div className="rounded-lg bg-violet-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-500 mb-1">
                  One thing to try
                </p>
                <p className="text-sm text-violet-800">{env.action}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4: What To Do Next ────────────────────── */}
      <section className="mb-12">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-stone-300">
          What to do next
        </p>
        <div className="flex flex-col gap-2">
          {data.nextSteps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border border-stone-100 bg-white px-5 py-3.5 shadow-sm"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
              <p className="text-sm leading-relaxed text-stone-700">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Disclaimer ────────────────────────────────────── */}
      <p className="mt-2 text-xs text-stone-400">
        This reflects observed patterns, not a verdict. Speak with a counselor if you&apos;re feeling stuck.
      </p>
    </div>
  );
}
