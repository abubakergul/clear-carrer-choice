import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ExplorationStatus } from "@/generated/prisma/client";
import ReflectionForm from "@/components/dashboard/ReflectionForm";

export default async function ReflectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const userId = session.user.id;

  const { id } = await params;

  const exploration = await prisma.exploration.findFirst({
    where: { id, userId, status: ExplorationStatus.ACTIVE },
  });

  if (!exploration) notFound();

  return (
    <div className="min-h-full px-10 py-9">
      {/* Back */}
      <Link
        href={`/dashboard/explore/${exploration.id}`}
        className="mb-8 inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600"
      >
        ← Back to exploration
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-violet-600">
            Reflect
          </span>
        </div>
        <h1 className="text-2xl font-bold text-stone-900">
          What did you notice?
        </h1>
        <p className="mt-2 text-sm text-stone-500">
          From: <span className="text-stone-700">{exploration.title}</span>
        </p>
        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          There are no right answers here. Your emotional reaction is exactly the
          data we need to find what fits you.
        </p>
      </div>

      <ReflectionForm explorationId={exploration.id} />
    </div>
  );
}
