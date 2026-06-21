import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExplorationStatus } from "@/generated/prisma/client";
import { markExpiredExplorations } from "@/actions/exploration";
import { EXPLORATION_GOAL } from "@/lib/exploration";
import ExplorationGenerator from "@/components/dashboard/ExplorationGenerator";
import Stars from "@/components/dashboard/Stars";
import CoolDownTimer from "@/components/dashboard/CoolDownTimer";
import MilestoneBanner from "@/components/dashboard/MilestoneBanner";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const userId = session.user.id;

  // Run insight check and expiry marking in parallel — saves one sequential round trip
  const [insight] = await Promise.all([
    prisma.fitInsight.findUnique({
      where: { userId },
      select: { id: true, summary: true, directions: true },
    }),
    markExpiredExplorations(userId),
  ]);

  // No insight → show empty state inside the dashboard shell
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
        <p className="text-sm font-medium text-stone-700">Your explorations will appear here.</p>
        <p className="mt-1 text-xs text-stone-400 max-w-xs">
          Complete the conversation first — your pattern and first exploration unlock after that.
        </p>
      </div>
    );
  }

  const [activeExploration, pastExplorations] = await Promise.all([
    prisma.exploration.findFirst({
      where: { userId, status: ExplorationStatus.ACTIVE },
      orderBy: { createdAt: "asc" },
    }),
    prisma.exploration.findMany({
      where: {
        userId,
        status: {
          in: [ExplorationStatus.COMPLETED, ExplorationStatus.SKIPPED, ExplorationStatus.EXPIRED],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        reflections: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { selectedSignals: true },
        },
      },
    }),
  ]);

  const firstName = session.user.name?.split(" ")[0];
  const completedCount = pastExplorations.filter(
    (e) => e.status === ExplorationStatus.COMPLETED
  ).length;
  const COOLDOWN_MS = 12 * 60 * 60 * 1000;

  const consecutiveSkipItems = (() => {
    const items: typeof pastExplorations = [];
    for (const e of pastExplorations) {
      if (e.status === ExplorationStatus.SKIPPED) items.push(e);
      else break;
    }
    return items;
  })();
  const consecutiveSkips = consecutiveSkipItems.length;

  // Detect whether they already went through a cooldown (12h+ gap between any two consecutive skips)
  const wentThroughCooldown = consecutiveSkipItems.length >= 2 && (() => {
    for (let i = 0; i < consecutiveSkipItems.length - 1; i++) {
      const newer = consecutiveSkipItems[i].skippedAt?.getTime() ?? 0;
      const older = consecutiveSkipItems[i + 1].skippedAt?.getTime() ?? 0;
      if (newer - older >= COOLDOWN_MS) return true;
    }
    return false;
  })();

  const lastSkipAt = consecutiveSkipItems[0]?.skippedAt?.getTime() ?? null;
  const lastSkipAge = lastSkipAt ? Date.now() - lastSkipAt : null;
  const isDisengaged = wentThroughCooldown && consecutiveSkips >= 1;
  const inCoolDown = !isDisengaged && consecutiveSkips >= 3 && lastSkipAge !== null && lastSkipAge < COOLDOWN_MS;
  const coolDownEndsAt = lastSkipAt ? lastSkipAt + COOLDOWN_MS : null;
  const today = new Intl.DateTimeFormat("en", {
    weekday: "long", month: "long", day: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-full px-10 py-9">

      {/* ── Top bar ────────────────────────────────────── */}
      <div className="mb-9 flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-stone-900">
            {firstName ? `Hey, ${firstName}.` : "Welcome back."}
          </h1>
          <p className="mt-0.5 text-sm text-stone-400">
            {completedCount > 0
              ? `${completedCount} exploration${completedCount !== 1 ? "s" : ""} done — keep the momentum.`
              : "Ready to discover something about yourself?"}
          </p>
        </div>
        <span className="text-xs text-stone-400">{today}</span>
      </div>

      {/* ── Pattern milestone banner ───────────────────── */}
      {completedCount >= EXPLORATION_GOAL && <MilestoneBanner />}

      {/* ── Progress: a star per exploration, toward your Clarity Output ── */}
      <div className="mb-6 rounded-2xl border border-violet-100 bg-white px-5 py-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
            Your progress
          </p>
          <Link
            href="/dashboard/pattern"
            className="text-xs text-violet-400 transition-colors hover:text-violet-600"
          >
            See your pattern →
          </Link>
        </div>
        <Stars earned={Math.min(EXPLORATION_GOAL, completedCount)} total={EXPLORATION_GOAL} size={34} />
        <p className="mt-4 text-center text-sm text-stone-500">
          {completedCount >= EXPLORATION_GOAL
            ? `All ${EXPLORATION_GOAL} lit — your answer is ready on your pattern page.`
            : `${Math.min(EXPLORATION_GOAL, completedCount)} of ${EXPLORATION_GOAL} lit — ${EXPLORATION_GOAL - Math.min(EXPLORATION_GOAL, completedCount)} more to unlock your answer.`}
        </p>
      </div>

      {/* ── Active exploration ─────────────────────────── */}
      <section className="mb-10">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
          {completedCount >= EXPLORATION_GOAL ? "You're done" : "Up next"}
        </p>

        {completedCount >= EXPLORATION_GOAL ? (
          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-7">
            <p className="mb-1 text-sm font-semibold text-stone-800">
              You&apos;ve done your {EXPLORATION_GOAL} explorations.
            </p>
            <p className="mb-5 max-w-sm text-sm leading-relaxed text-stone-500">
              Your answer is ready — see where each of your options landed.
            </p>
            <Link
              href="/dashboard/pattern"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 active:scale-[0.98]"
            >
              See where you&apos;ve landed
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2.5 7h9m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        ) : activeExploration ? (
          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-7">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-500" />
                Up next
              </span>
              <span className="rounded-full bg-white border border-violet-100 px-2.5 py-1 text-[11px] text-stone-500">
                {typeLabel(activeExploration.type)}
              </span>
              <span className="rounded-full bg-white border border-violet-100 px-2.5 py-1 text-[11px] text-stone-500">
                {intensityLabel(activeExploration.intensity)}
              </span>
            </div>

            <h2 className="mb-2 max-w-lg text-xl font-bold leading-snug tracking-tight text-stone-900">
              {activeExploration.title}
            </h2>
            <p className="mb-6 max-w-md line-clamp-2 text-sm leading-relaxed text-stone-500">
              {activeExploration.prompt}
            </p>

            <Link
              href={`/dashboard/explore/${activeExploration.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 active:scale-[0.98]"
            >
              Open exploration
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2.5 7h9m-4-4 4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        ) : isDisengaged ? (
          <div className="rounded-2xl border border-stone-100 bg-stone-50 px-7 py-8">
            <p className="mb-1 text-sm font-semibold text-stone-700">Explorations don&apos;t seem to be clicking right now.</p>
            <p className="mb-5 max-w-sm text-sm leading-relaxed text-stone-400">
              That&apos;s okay — not every moment is right for this. Your pattern is always here when you want to reflect on what you&apos;ve noticed so far.
            </p>
            <Link
              href="/dashboard/pattern"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              See your pattern →
            </Link>
          </div>
        ) : inCoolDown && coolDownEndsAt ? (
          <div className="rounded-2xl border border-stone-100 bg-stone-50 px-7 py-8">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
              Next exploration unlocks in
            </p>
            <div className="my-3">
              <CoolDownTimer endsAt={coolDownEndsAt} />
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-stone-400">
              No rush. Come back when something feels right — a new exploration will be here.
            </p>
          </div>
        ) : (
          <>
            <ExplorationGenerator />
            <div className="rounded-2xl border border-violet-100 bg-violet-50 px-7 py-6">
              <div className="flex items-center gap-4">
                <svg
                  className="animate-spin shrink-0 text-violet-400"
                  width="18" height="18" viewBox="0 0 20 20" fill="none"
                  aria-hidden="true"
                >
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
                  <path d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-stone-800">Something new is on its way…</p>
                  <p className="mt-0.5 text-xs text-stone-400">
                    This takes a few seconds. The page will update automatically.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Journey timeline ───────────────────────────── */}
      {pastExplorations.length > 0 && (
        <section>
          <p className="mb-5 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
            Your journey
          </p>

          <div className="relative pl-7">
            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-stone-200" />

            <div className="flex flex-col gap-6">
              {pastExplorations.map((e) => {
                const done = e.status === ExplorationStatus.COMPLETED;
                const skipped = e.status === ExplorationStatus.SKIPPED;

                return (
                  <div key={e.id} className="relative flex items-start gap-4">
                    <div className={`absolute -left-7 top-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold ${
                      done    ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                      : skipped ? "border-stone-200 bg-white text-stone-400"
                      :           "border-stone-100 bg-stone-50 text-stone-300"
                    }`}>
                      {done ? "✓" : skipped ? "→" : "·"}
                    </div>

                    <div className="flex-1 rounded-xl border border-stone-100 bg-white px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-stone-800 leading-snug">{e.title}</p>
                        <span className="shrink-0 text-xs text-stone-300">
                          {formatDate(e.completedAt ?? e.skippedAt ?? e.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-stone-400">
                        {statusText(e.status, e.skipReason)}
                      </p>
                      {done && e.reflections[0]?.selectedSignals.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {e.reflections[0].selectedSignals.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function intensityLabel(i: string | null | undefined) {
  return i === "VERY_LIGHT" ? "~5 min" : i === "LIGHT" ? "~10 min" : i === "MEDIUM" ? "~15 min" : "Quick";
}

function typeLabel(t: string | null | undefined) {
  const map: Record<string, string> = { OBSERVE: "Observe", COMPARE: "Compare", INTERACT: "Interact", SIMULATE: "Simulate", REFLECT: "Reflect" };
  return (t && map[t]) ?? "Explore";
}

function statusText(status: ExplorationStatus, skipReason: string | null) {
  if (status === ExplorationStatus.COMPLETED) return "Completed";
  if (status === ExplorationStatus.SKIPPED) return skipReason ? `Skipped · ${skipReason}` : "Skipped";
  return "Expired — that's okay";
}

function formatDate(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}
