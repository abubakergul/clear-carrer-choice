import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ExplorationStatus } from "@/generated/prisma/client";
import Link from "next/link";
import ImpactRing from "@/components/result/ImpactRing";
import { parseDriverFactors } from "@/lib/driver-factors";
import { Logo } from "@/components/Logo";

// The post-signup REVEAL — a short, animated visual moment, not a report. The
// detailed breakdown (directions, tensions, standings) lives on the pattern page.
export default async function ResultPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const insight = await prisma.fitInsight.findUnique({
    where: { userId: session.user.id },
  });
  if (!insight) redirect("/dashboard");

  const exploration = await prisma.exploration.findFirst({
    where: { userId: session.user.id, status: ExplorationStatus.ACTIVE },
    orderBy: { createdAt: "asc" },
  });

  const firstName = session.user.name?.split(" ")[0] ?? "you";
  const factors = parseDriverFactors(insight.driverFactors);
  const topFactor = factors[0] ?? null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FAFAF9]">
      {/* Soft aurora backdrop — gives the reveal some life and depth */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-300/40 blur-3xl" />
        <div className="absolute top-44 -right-16 h-60 w-60 rounded-full bg-fuchsia-200/40 blur-3xl" />
        <div className="absolute bottom-0 -left-16 h-60 w-60 rounded-full bg-indigo-200/30 blur-3xl" />
      </div>

      <nav className="relative flex items-center justify-between px-6 py-4">
        <Logo size={24} />
        <Link href="/dashboard" className="text-xs text-stone-400 hover:text-stone-600">
          Skip →
        </Link>
      </nav>

      <main className="relative mx-auto flex max-w-md flex-col items-center px-6 pb-16 pt-6 text-center">
        <p
          className="anim-fade-in mb-3 text-xs font-semibold uppercase tracking-widest text-violet-500"
          style={{ animationDelay: "0ms" }}
        >
          Your picture
        </p>
        <h1
          className="anim-fade-up mb-8 text-3xl font-bold leading-tight text-stone-900"
          style={{ animationDelay: "100ms" }}
        >
          Here&apos;s what we found, {firstName}.
        </h1>

        {/* The reveal card */}
        <div
          className="anim-fade-up w-full rounded-3xl border border-violet-100 bg-white/80 p-7 shadow-xl shadow-violet-100/60 backdrop-blur"
          style={{ animationDelay: "240ms" }}
        >
          {factors.length > 0 ? (
            <>
              <div className="mb-5 flex justify-center">
                <ImpactRing factors={factors} />
              </div>
              {topFactor && (
                <p className="text-sm leading-6 text-stone-500">
                  The biggest thing pulling at your choice is{" "}
                  <span className="font-semibold text-stone-800">
                    {topFactor.label.toLowerCase()}
                  </span>
                  {factors.length > 1 ? ", with a couple of others underneath." : "."}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm leading-7 text-stone-700">{insight.summary}</p>
          )}
        </div>

        {/* One next step */}
        {exploration ? (
          <Link
            href={`/dashboard/explore/${exploration.id}`}
            className="anim-fade-in mt-8 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:scale-105 active:scale-95"
            style={{ animationDelay: "380ms" }}
          >
            Start exploring →
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="anim-fade-in mt-8 inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-7 py-3.5 text-sm font-semibold text-white transition hover:scale-105 active:scale-95"
            style={{ animationDelay: "380ms" }}
          >
            Go to dashboard →
          </Link>
        )}

        <Link
          href="/dashboard/pattern"
          className="anim-fade-in mt-4 text-xs text-stone-400 hover:text-stone-600"
          style={{ animationDelay: "460ms" }}
        >
          See the full breakdown →
        </Link>

        <p
          className="anim-fade-in mt-10 text-xs leading-relaxed text-stone-400"
          style={{ animationDelay: "560ms" }}
        >
          One conversation — a starting point, not a verdict.
          <br />
          Speak with a counselor if you&apos;re feeling stuck.
        </p>
      </main>
    </div>
  );
}
