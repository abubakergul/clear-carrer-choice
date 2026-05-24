import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

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

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="mx-auto max-w-xl">

        {/* Header */}
        <div className="mb-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-violet-500">
            Your initial picture
          </p>
          <h1 className="text-2xl font-bold text-stone-900">Here&apos;s what I found.</h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">
            This is not a career recommendation — it&apos;s a starting hypothesis. Use it to explore, not decide.
          </p>
        </div>

        {/* Summary */}
        <div className="mb-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
            Summary
          </p>
          <p className="text-sm leading-relaxed text-stone-700">{insight.summary}</p>
        </div>

        {/* Directions */}
        <div className="mb-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
            Directions worth exploring
          </p>
          <ul className="flex flex-col gap-2.5">
            {insight.directions.map((d, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-stone-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                {d}
              </li>
            ))}
          </ul>
        </div>

        {/* Tensions */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-100">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">
            Tensions to work through
          </p>
          <ul className="flex flex-col gap-2.5">
            {insight.tensions.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-stone-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* First exploration CTA */}
        {exploration && (
          <div className="mb-6 rounded-2xl bg-violet-50 p-6 ring-1 ring-violet-100">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-violet-400">
              First exploration
            </p>
            <h3 className="mb-2 text-base font-bold text-stone-900">{exploration.title}</h3>
            <p className="mb-5 text-sm leading-relaxed text-stone-600">{exploration.prompt}</p>
            <Link
              href="/dashboard"
              className="inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 active:bg-violet-800"
            >
              Start exploring →
            </Link>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-center text-xs text-stone-400">
          This is an initial hypothesis, not a definitive answer. If you&apos;re feeling overwhelmed or stuck, consider speaking with a school counselor or career advisor.
        </p>
      </div>
    </div>
  );
}
