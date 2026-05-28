import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ExplorationStatus } from "@/generated/prisma/client";
import SkipDialog from "@/components/dashboard/SkipDialog";

export default async function ExplorationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const userId = session.user.id;

  const { id } = await params;

  const exploration = await prisma.exploration.findFirst({
    where: { id, userId },
  });

  if (!exploration) notFound();

  const isActive = exploration.status === ExplorationStatus.ACTIVE;
  const isCompleted = exploration.status === ExplorationStatus.COMPLETED;

  const estimatedMin = exploration.intensity === "VERY_LIGHT"
    ? "5"
    : exploration.intensity === "LIGHT"
    ? "10"
    : "15";

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      {/* Back */}
      <Link
        href="/dashboard"
        className="mb-8 inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600"
      >
        ← Dashboard
      </Link>

      {/* Header */}
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
          ~{estimatedMin} min
        </span>
        {!isActive && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            isCompleted
              ? "bg-green-50 text-green-700"
              : exploration.status === "SKIPPED"
              ? "bg-stone-100 text-stone-500"
              : "bg-amber-50 text-amber-700"
          }`}>
            {isCompleted ? "Completed" : exploration.status === "SKIPPED" ? "Skipped" : "Expired"}
          </span>
        )}
      </div>

      <h1 className="mb-6 text-2xl font-bold text-stone-900 leading-snug">
        {exploration.title}
      </h1>

      {/* Prompt */}
      <div className="mb-8 rounded-2xl bg-stone-50 px-6 py-5">
        <p className="text-sm leading-7 text-stone-700 whitespace-pre-line">
          {exploration.prompt}
        </p>
      </div>

      {/* What to notice */}
      <div className="mb-8 rounded-2xl border border-violet-100 bg-violet-50 px-5 py-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-violet-500">
          What to notice
        </p>
        <ul className="flex flex-col gap-2 text-sm text-stone-600">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
            Do you feel curious and want to keep going?
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
            Do you feel intimidated or resistant?
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
            Does your energy go up or down?
          </li>
        </ul>
        <p className="mt-3 text-xs text-stone-400">
          No right answer. Your reaction is the data.
        </p>
      </div>

      {/* CTA */}
      {isActive && (
        <>
          <Link
            href={`/dashboard/explore/${exploration.id}/reflect`}
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            I did it — reflect →
          </Link>
          <div className="mt-4">
            <SkipDialog explorationId={exploration.id} />
          </div>
        </>
      )}

      {isCompleted && (
        <div className="rounded-xl bg-green-50 px-5 py-4 text-sm text-green-700">
          You reflected on this one. Great.
        </div>
      )}
    </div>
  );
}
