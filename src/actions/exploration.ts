"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import OpenAI from "openai";
import { NEXT_EXPLORATION_PROMPT } from "@/lib/prompts/next-exploration";
import { INSIGHT_EVOLUTION_PROMPT } from "@/lib/prompts/insight-evolution";
import { CLARITY_OUTPUT_PROMPT } from "@/lib/prompts/clarity-output";
import {
  ExplorationStatus,
  ExplorationType,
  ExplorationIntensity,
  ReflectionSource,
} from "@/generated/prisma/client";
import { SKIP_REASONS, ExplorationAIResponse, isInteractiveBroken, sanitizeBrokenInteraction, EXPLORATION_GOAL } from "@/lib/exploration";
import { stageExplorationGuidance } from "@/lib/education-stage";
import { parseDriverFactors } from "@/lib/driver-factors";
import { track } from "@/lib/analytics";

type ReflectionData = {
  selectedSignals: string[];
  energyLevel: number;
  curiosityLevel: number;
  intimidationLevel: number;
  notes?: string;
  emotionalState?: string; // e.g. the option picked in a this-or-that exploration
};

// Pull the option an exploration was built to test out of its generationContext.
// The AI is told to copy the option verbatim, but casing/whitespace can drift, so
// callers match it back against the canonical option list loosely.
function extractTestedOption(ctx: unknown): string {
  if (!ctx || typeof ctx !== "object") return "";
  const o = (ctx as Record<string, unknown>).option;
  return typeof o === "string" ? o.trim() : "";
}

// The interaction format an exploration used ("this_or_that", "real_day", or "" for
// a plain format), normalised so casing/separator drift doesn't hide a repeat.
function extractKind(ctx: unknown): string {
  if (!ctx || typeof ctx !== "object") return "";
  const it = (ctx as Record<string, unknown>).interaction;
  if (!it || typeof it !== "object") return "";
  const raw = (it as Record<string, unknown>).kind;
  if (typeof raw !== "string") return "";
  return raw
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[-\s]+/g, "_");
}

// Decide which option the next exploration should test so coverage stays balanced.
// Rotation is enforced here in code — not left to the prompt, which drifts and can
// pile several explorations onto one option while another never gets a fair look.
// Returns the least-covered option and how many times it has been tested so far.
function pickLeastCoveredOption(
  options: string[],
  pastContexts: unknown[]
): { option: string; timesTested: number } | null {
  if (options.length === 0) return null;

  const norm = (s: string) => s.trim().toLowerCase();
  const coverage = new Map<string, number>();
  for (const opt of options) coverage.set(norm(opt), 0);

  for (const ctx of pastContexts) {
    const tested = norm(extractTestedOption(ctx));
    if (!tested) continue;
    // Match back to a canonical option: exact-normalised, else substring either way.
    const match =
      options.find((o) => norm(o) === tested) ??
      options.find((o) => norm(o).includes(tested) || tested.includes(norm(o)));
    if (match) coverage.set(norm(match), (coverage.get(norm(match)) ?? 0) + 1);
  }

  // Least-covered wins; ties resolve to the order the user named them.
  let best = options[0];
  let min = coverage.get(norm(options[0])) ?? 0;
  for (const opt of options) {
    const c = coverage.get(norm(opt)) ?? 0;
    if (c < min) {
      min = c;
      best = opt;
    }
  }
  return { option: best, timesTested: min };
}

// ─── Core generation logic (private) ─────────────────────────────────────────

async function runGeneration(userId: string): Promise<void> {
  const existing = await prisma.exploration.findFirst({
    where: { userId, status: ExplorationStatus.ACTIVE },
    select: { id: true },
  });
  if (existing) return;

  // Once the user has completed the goal, stop pushing new explorations — their
  // answer is ready; don't make it feel like an endless treadmill.
  const completedSoFar = await prisma.exploration.count({
    where: { userId, status: ExplorationStatus.COMPLETED },
  });
  if (completedSoFar >= EXPLORATION_GOAL) return;

  // Pre-check passed. We now call OpenAI (slow). After the AI responds, we
  // do a second check so two concurrent requests (e.g. shift page + dashboard)
  // don't both slip through and create two ACTIVE explorations.

  const insight = await prisma.fitInsight.findUnique({
    where: { userId },
    select: { directions: true, tensions: true, options: true },
  });
  if (!insight) return;

  const recentExplorations = await prisma.exploration.findMany({
    where: { userId, status: { not: ExplorationStatus.ACTIVE } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { reflections: { take: 1 } },
  });

  // Coverage is counted across ALL past explorations, not just the recent 5, so a
  // single under-explored option still gets pulled forward late in the cycle.
  const allPastContexts = await prisma.exploration.findMany({
    where: { userId, status: { not: ExplorationStatus.ACTIVE } },
    select: { generationContext: true },
  });
  const leastCovered = pickLeastCoveredOption(
    insight.options ?? [],
    allPastContexts.map((e) => e.generationContext)
  );
  const rotationDirective = leastCovered
    ? `ROTATION — MANDATORY: Of all the user's options, "${leastCovered.option}" has been explored the LEAST so far (${leastCovered.timesTested} time${leastCovered.timesTested === 1 ? "" : "s"}). Your next exploration MUST test "${leastCovered.option}". Copy it verbatim into generationContext.option. Do not pick a different option, even if another feels more interesting — balanced coverage is what lets the user actually compare.`
    : "";

  // Keep this-or-that from taking over: it's the easy format, so the model reaches
  // for it repeatedly. If it appeared in the last exploration, or twice in the last
  // three, force a different format this time.
  const recentKinds = recentExplorations.map((e) => extractKind(e.generationContext));
  const thisOrThatInLast3 = recentKinds.slice(0, 3).filter((k) => k === "this_or_that").length;
  const formatVariety =
    recentKinds[0] === "this_or_that" || thisOrThatInLast3 >= 2
      ? `FORMAT VARIETY — MANDATORY: "this-or-that" has been used very recently and is getting repetitive. Do NOT use this-or-that this time. Pick a clearly different format: a "real day" breakdown, a thought experiment, a vivid role-play, or a memory reflection.`
      : "";

  // Push back against an all-imagination set: SIMULATE/REFLECT are the "imagine
  // you…" / "recall when…" formats. If the last two were those, force a grounded,
  // real-world exploration this time so the journey doesn't feel like daydreaming.
  const imaginativeTypes = new Set<string>(["SIMULATE", "REFLECT"]);
  const lastTwoImaginative =
    recentExplorations.slice(0, 2).filter((e) => imaginativeTypes.has(e.type ?? "")).length >= 2;
  const groundingDirective = lastTwoImaginative
    ? `GROUNDING — MANDATORY: The recent explorations were imagination-based ("imagine you…"). This one must get them OUT of their head and into something REAL: read an actual job description or a real "day in the life" write-up, look at a real example of the work, or reach out to one real person who does it. Do NOT use another imagined thought experiment this time.`
    : "";

  // Passive history isn't enough — the model repeats roles/titles (e.g. two
  // identical "A real day as a front-end developer"). List the exact ones already
  // done and forbid repeating them.
  const avoidRepeats = recentExplorations.length
    ? `NO REPEATS — MANDATORY: These explorations have ALREADY been done. Do NOT generate another with the same role or a near-identical title — pick a genuinely different angle, slice, or format:\n${recentExplorations
        .map((e) => `- "${e.title}"`)
        .join("\n")}`
    : "";

  // educationStage is captured per-conversation; pull it from the user's most recent
  // one so explorations stay grounded in what they can actually reach (a school
  // student has no college lab to "try").
  const latestConversation = await prisma.conversation.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { educationStage: true },
  });

  // Detect consecutive skips — reset count on first non-skip
  const consecutiveSkips = (() => {
    let count = 0;
    for (const e of recentExplorations) {
      if (e.status === ExplorationStatus.SKIPPED) count++;
      else break;
    }
    return count;
  })();

  const skipWarning =
    consecutiveSkips >= 3
      ? `⚠️ CRITICAL: The user has skipped ${consecutiveSkips} explorations in a row. You MUST:
1. Switch to a completely different format — thought experiment, job description read, or portfolio browse. NO video watching.
2. Intensity VERY_LIGHT only.
3. Completable in under 5 minutes without navigating to any external app or video platform.`
      : consecutiveSkips === 2
      ? `NOTE: The user has skipped the last 2 explorations. Switch to a noticeably different format and direction.`
      : "";

  const history = recentExplorations
    .map((e) => {
      const r = e.reflections[0];
      const detail = r
        ? `Reflected: signals=[${r.selectedSignals.join(", ")}], curiosity=${r.curiosityLevel}/5, energy=${r.energyLevel}/5, intimidation=${r.intimidationLevel}/5`
        : e.status === ExplorationStatus.SKIPPED
        ? `Skipped: reason="${e.skipReason}"`
        : `Expired`;
      return `- "${e.title}" (${e.type ?? "OBSERVE"}, ${e.intensity ?? "VERY_LIGHT"}): ${detail}`;
    })
    .join("\n");

  const prompt = NEXT_EXPLORATION_PROMPT
    .replace("{options}", insight.options.join("\n") || "(none named)")
    .replace("{directions}", insight.directions.join("\n"))
    .replace("{tensions}", insight.tensions.join("\n"))
    .replace("{history}", history || "No prior explorations.")
    .replace("{skipWarning}", skipWarning)
    .replace("{rotationDirective}", rotationDirective)
    .replace("{formatVariety}", formatVariety)
    .replace("{groundingDirective}", groundingDirective)
    .replace("{avoidRepeats}", avoidRepeats)
    .replace("{stageGuidance}", stageExplorationGuidance(latestConversation?.educationStage));

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let data: ExplorationAIResponse;
  try {
    const res = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [{ role: "user", content: prompt }],
    });
    const raw = res.output_text.replace(/```(?:json)?\n?/g, "").trim();
    data = JSON.parse(raw);
  } catch {
    return;
  }

  if (isInteractiveBroken(data)) {
    try {
      const retryRes = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: [{ role: "user", content: prompt }],
      });
      const retryRaw = retryRes.output_text.replace(/```(?:json)?\n?/g, "").trim();
      data = JSON.parse(retryRaw);
    } catch {
      // retry failed — fall through, page will use plain fallback
    }
  }

  // Still broken after the retry → strip the interactive framing so the user
  // never sees a "tap each part" prompt with nothing to tap.
  data = sanitizeBrokenInteraction(data);

  const validTypes = Object.values(ExplorationType) as string[];
  const validIntensities = Object.values(ExplorationIntensity) as string[];

  const type =
    data.type && validTypes.includes(data.type)
      ? (data.type as ExplorationType)
      : ExplorationType.OBSERVE;
  const intensity =
    data.intensity && validIntensities.includes(data.intensity)
      ? (data.intensity as ExplorationIntensity)
      : ExplorationIntensity.VERY_LIGHT;

  // Second check — close the race window between the pre-check and the AI call.
  // If another concurrent request already created an ACTIVE exploration, bail out.
  const raceCheck = await prisma.exploration.findFirst({
    where: { userId, status: ExplorationStatus.ACTIVE },
    select: { id: true },
  });
  if (raceCheck) return;

  await prisma.exploration.create({
    data: {
      userId,
      title: data.title,
      prompt: data.prompt,
      status: ExplorationStatus.ACTIVE,
      type,
      intensity,
      generationContext: data.generationContext ?? undefined,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });
}

// ─── Public: called by dashboard client component ─────────────────────────────

export async function triggerNextExploration(): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };
  await runGeneration(session.user.id);
  return { ok: true };
}

// ─── Skip — instant redirect, generation triggered client-side after ──────────

export async function skipExploration(
  explorationId: string,
  reason: string
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const userId = session.user.id;

  const exploration = await prisma.exploration.findFirst({
    where: { id: explorationId, userId, status: ExplorationStatus.ACTIVE },
    select: { id: true },
  });
  // Already skipped (e.g. double-tap on skip button) — just go to dashboard.
  if (!exploration) redirect("/dashboard");

  const alreadySkipped = await prisma.reflection.findFirst({
    where: { explorationId },
    select: { id: true },
  });
  if (alreadySkipped) redirect("/dashboard");

  // Only accept reasons from the predefined set; reject arbitrary client strings.
  const validReason = (SKIP_REASONS as readonly string[]).includes(reason)
    ? reason
    : SKIP_REASONS[0];

  await prisma.$transaction([
    prisma.reflection.create({
      data: { explorationId, source: ReflectionSource.SKIP, selectedSignals: [] },
    }),
    prisma.exploration.update({
      where: { id: explorationId },
      data: { status: ExplorationStatus.SKIPPED, skipReason: validReason, skippedAt: new Date() },
    }),
  ]);

  redirect("/dashboard");
}

const VALID_SIGNALS = new Set([
  "Excited", "Curious", "Enjoyed it", "Calm",
  "Bored", "Confused", "Stressed", "Not for me",
]);

const MAX_NOTES_LENGTH = 1000;

// ─── Complete — instant redirect, generation triggered client-side after ──────

export async function completeExploration(
  explorationId: string,
  reflection: ReflectionData
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const userId = session.user.id;

  const exploration = await prisma.exploration.findFirst({
    where: { id: explorationId, userId, status: ExplorationStatus.ACTIVE },
    select: { id: true },
  });
  // If already completed (e.g. double-submit), go straight to the payoff screen.
  if (!exploration) redirect(`/dashboard/explore/${explorationId}/shift`);

  // Guard against a second concurrent submission creating a duplicate reflection.
  const alreadyReflected = await prisma.reflection.findFirst({
    where: { explorationId, source: ReflectionSource.COMPLETION },
    select: { id: true },
  });
  if (alreadyReflected) redirect(`/dashboard/explore/${explorationId}/shift`);

  // Sanitise client-supplied values.
  const cleanSignals = reflection.selectedSignals.filter((s) => VALID_SIGNALS.has(s));
  const cleanNotes = reflection.notes
    ? reflection.notes.slice(0, MAX_NOTES_LENGTH)
    : null;

  await prisma.$transaction([
    prisma.reflection.create({
      data: {
        explorationId,
        source: ReflectionSource.COMPLETION,
        selectedSignals: cleanSignals,
        energyLevel: reflection.energyLevel,
        curiosityLevel: reflection.curiosityLevel,
        intimidationLevel: reflection.intimidationLevel,
        emotionalState: reflection.emotionalState || null,
        notes: cleanNotes,
      },
    }),
    prisma.exploration.update({
      where: { id: explorationId },
      data: { status: ExplorationStatus.COMPLETED, completedAt: new Date() },
    }),
  ]);

  const completedCount = await prisma.exploration.count({
    where: { userId, status: ExplorationStatus.COMPLETED },
  });
  await track("exploration_completed", { userId, meta: { count: completedCount } });
  if (completedCount % 3 === 0) {
    // Fire-and-forget — does not block the redirect
    runInsightEvolution(userId).catch(() => {});
  }

  // Land on the payoff screen — the user sees their picture move in response to
  // what they just reflected, instead of bouncing back to a list.
  redirect(`/dashboard/explore/${explorationId}/shift`);
}

// ─── FitInsight evolution (fire-and-forget) ───────────────────────────────────

async function runInsightEvolution(userId: string): Promise<void> {
  const insight = await prisma.fitInsight.findUnique({
    where: { userId },
    select: { id: true, summary: true, directions: true, tensions: true },
  });
  if (!insight) return;

  const recentReflections = await prisma.reflection.findMany({
    where: {
      exploration: { userId, status: ExplorationStatus.COMPLETED },
      source: ReflectionSource.COMPLETION,
    },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      selectedSignals: true,
      energyLevel: true,
      curiosityLevel: true,
      intimidationLevel: true,
      notes: true,
      exploration: { select: { title: true } },
    },
  });

  const reflectionText = recentReflections
    .map((r) =>
      `- "${r.exploration.title}": signals=[${r.selectedSignals.join(", ")}], energy=${r.energyLevel}/5, curiosity=${r.curiosityLevel}/5, intimidation=${r.intimidationLevel}/5${r.notes ? `, note="${r.notes}"` : ""}`
    )
    .join("\n");

  const prompt = INSIGHT_EVOLUTION_PROMPT
    .replace("{summary}", insight.summary)
    .replace("{directions}", insight.directions.join("\n"))
    .replace("{tensions}", insight.tensions.join("\n"))
    .replace("{reflections}", reflectionText || "No reflections yet.");

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  type EvolutionResponse = {
    summary: string;
    directions: string[];
    tensions: string[];
    patternSummary: string;
  };

  let data: EvolutionResponse;
  try {
    const res = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [{ role: "user", content: prompt }],
    });
    const raw = res.output_text.replace(/```(?:json)?\n?/g, "").trim();
    data = JSON.parse(raw);
  } catch {
    return;
  }

  await prisma.fitInsight.update({
    where: { id: insight.id },
    data: {
      summary: data.summary,
      directions: data.directions,
      tensions: data.tensions,
      patternSummary: data.patternSummary || null,
      version: { increment: 1 },
    },
  });
}

// ─── Expiry ───────────────────────────────────────────────────────────────────

export async function markExpiredExplorations(userId: string): Promise<void> {
  await prisma.exploration.updateMany({
    where: { userId, status: ExplorationStatus.ACTIVE, expiresAt: { lt: new Date() } },
    data: { status: ExplorationStatus.EXPIRED },
  });
}

// ─── Clarity Output generation ────────────────────────────────────────────────

type ClarityOutputData = {
  fusedRead?: string;
  pathNotes?: { option: string; note: string }[];
  observations: string[];
  uncertainties: string[];
  environments: { title: string; reasoning: string; action: string }[];
  nextSteps: string[];
};

export async function generateClarityOutput(): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };
  const userId = session.user.id;

  const insight = await prisma.fitInsight.findUnique({
    where: { userId },
    select: {
      id: true,
      summary: true,
      directions: true,
      tensions: true,
      options: true,
      driverFactors: true,
      version: true,
      clarityOutput: true,
      clarityInsightVersion: true,
    },
  });
  if (!insight) return { ok: false };

  // Already generated and insight hasn't evolved since — skip
  if (insight.clarityOutput && insight.clarityInsightVersion >= insight.version) {
    return { ok: true };
  }

  const [recentReflections, recentSkips] = await Promise.all([
    prisma.reflection.findMany({
      where: {
        exploration: { userId, status: ExplorationStatus.COMPLETED },
        source: ReflectionSource.COMPLETION,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        selectedSignals: true,
        energyLevel: true,
        curiosityLevel: true,
        intimidationLevel: true,
        exploration: { select: { title: true } },
      },
    }),
    prisma.exploration.findMany({
      where: { userId, status: ExplorationStatus.SKIPPED, skipReason: { not: null } },
      orderBy: { skippedAt: "desc" },
      take: 5,
      select: { title: true, skipReason: true },
    }),
  ]);

  const reflectionText = recentReflections
    .map(
      (r) =>
        `- "${r.exploration.title}": signals=[${r.selectedSignals.join(", ")}], energy=${r.energyLevel}/5, curiosity=${r.curiosityLevel}/5, intimidation=${r.intimidationLevel}/5`
    )
    .join("\n") || "No reflections yet.";

  const skipText = recentSkips
    .map((s) => `- "${s.title}": "${s.skipReason}"`)
    .join("\n") || "None.";

  const factorsText = parseDriverFactors(insight.driverFactors)
    .map((f) => `- ${f.label} (${f.weight}%)${f.reason ? `: ${f.reason}` : ""}`)
    .join("\n") || "Not captured.";

  const prompt = CLARITY_OUTPUT_PROMPT
    .replace("{summary}", insight.summary)
    .replace("{directions}", insight.directions.join("\n"))
    .replace("{tensions}", insight.tensions.join("\n"))
    .replace("{factors}", factorsText)
    .replace("{options}", insight.options.join("\n") || "(none named)")
    .replace("{reflections}", reflectionText)
    .replace("{skipReasons}", skipText);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let data: ClarityOutputData;
  try {
    const res = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [{ role: "user", content: prompt }],
    });
    const raw = res.output_text.replace(/```(?:json)?\n?/g, "").trim();
    data = JSON.parse(raw);
  } catch {
    return { ok: false };
  }

  await prisma.fitInsight.update({
    where: { id: insight.id },
    data: {
      clarityOutput: JSON.stringify(data),
      clarityUnlockedAt: insight.clarityOutput ? undefined : new Date(),
      clarityInsightVersion: insight.version,
    },
  });

  return { ok: true };
}
