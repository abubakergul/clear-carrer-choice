import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import DirectionCard from "@/components/result/DirectionCard";

export default async function ResultPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const insight = await prisma.fitInsight.findUnique({
    where: { userId: session.user.id },
  });
  if (!insight) redirect("/dashboard");

  const exploration = await prisma.exploration.findFirst({
    where: { userId: session.user.id, status: "active" },
    orderBy: { createdAt: "asc" },
  });

  const firstName = session.user.name?.split(" ")[0] ?? "you";

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <nav className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
        <span className="text-sm font-semibold text-stone-400">ClearCareerChoice</span>
        <Link href="/dashboard" className="text-xs text-stone-400 hover:text-stone-600">
          Skip →
        </Link>
      </nav>

      <main className="mx-auto max-w-lg px-6 pb-16 pt-10">

        {/* ── Hero ─────────────────────────────────────────── */}
        <div className="anim-fade-up mb-8" style={{ animationDelay: "0ms" }}>
          {/* Abstract pattern visual — three overlapping rings */}
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            className="mb-5"
            aria-hidden="true"
          >
            <circle cx="24" cy="28" r="18" stroke="#c4b5fd" strokeWidth="1.5" />
            <circle cx="40" cy="28" r="18" stroke="#a78bfa" strokeWidth="1.5" opacity="0.65" />
            <circle cx="32" cy="44" r="18" stroke="#7c3aed" strokeWidth="1.5" opacity="0.35" />
          </svg>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-violet-600">
              Your initial picture
            </span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">
            Here&apos;s what I found, {firstName}.
          </h1>
        </div>

        {/* ── Summary ──────────────────────────────────────── */}
        <div
          className="anim-fade-up mb-8 rounded-2xl bg-violet-50 px-6 py-5 ring-1 ring-violet-100"
          style={{ animationDelay: "80ms" }}
        >
          <p className="text-sm leading-7 text-stone-700">{insight.summary}</p>
        </div>

        {/* ── Directions ───────────────────────────────────── */}
        <div className="anim-fade-up mb-8" style={{ animationDelay: "160ms" }}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
            Paths worth exploring
            {(insight.directionsWhy?.length ?? 0) > 0 && (
              <span className="ml-2 font-normal normal-case text-stone-300">
                — tap to expand
              </span>
            )}
          </p>
          <div className="flex flex-col gap-3">
            {insight.directions.map((label, i) => (
              <DirectionCard
                key={i}
                index={i}
                label={label}
                why={insight.directionsWhy?.[i]}
              />
            ))}
          </div>
        </div>

        {/* ── Tensions ─────────────────────────────────────── */}
        {insight.tensions.length > 0 && (
          <div className="anim-fade-up mb-8" style={{ animationDelay: "240ms" }}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
              Tensions to work through
            </p>
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-5 py-4">
              <ul className="flex flex-col gap-3">
                {insight.tensions.map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-stone-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── First Exploration ────────────────────────────── */}
        {exploration ? (
          <div
            className="anim-fade-up mb-8 rounded-2xl bg-stone-900 p-6 text-white"
            style={{ animationDelay: "320ms" }}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
              Your first step
            </p>
            <h2 className="mb-2 text-base font-bold leading-snug">{exploration.title}</h2>
            <p className="mb-6 text-sm leading-relaxed text-stone-400">
              A short reflection designed around your conversation — about 10 minutes.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              Start exploring →
            </Link>
          </div>
        ) : (
          <div className="anim-fade-up mb-8" style={{ animationDelay: "320ms" }}>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              Go to dashboard →
            </Link>
          </div>
        )}

        {/* ── Disclaimer ───────────────────────────────────── */}
        <p
          className="anim-fade-up text-center text-xs leading-relaxed text-stone-400"
          style={{ animationDelay: "400ms" }}
        >
          One conversation — a starting point, not a verdict.
          <br />
          Speak with a counselor if you&apos;re feeling stuck.
        </p>
      </main>
    </div>
  );
}
