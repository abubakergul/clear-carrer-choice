"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import OpenAI from "openai";
import { NEXT_EXPLORATION_PROMPT } from "@/lib/prompts/next-exploration";
import {
  ExplorationStatus,
  ExplorationType,
  ExplorationIntensity,
  ReflectionSource,
} from "@/generated/prisma/client";

type ReflectionData = {
  selectedSignals: string[];
  energyLevel: number;
  curiosityLevel: number;
  intimidationLevel: number;
  notes?: string;
};

// ─── Core generation logic (private) ─────────────────────────────────────────

async function runGeneration(userId: string): Promise<void> {
  const existing = await prisma.exploration.findFirst({
    where: { userId, status: ExplorationStatus.ACTIVE },
    select: { id: true },
  });
  if (existing) return;

  const insight = await prisma.fitInsight.findUnique({
    where: { userId },
    select: { directions: true, tensions: true },
  });
  if (!insight) return;

  const recentExplorations = await prisma.exploration.findMany({
    where: { userId, status: { not: ExplorationStatus.ACTIVE } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { reflections: { take: 1 } },
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
    .replace("{directions}", insight.directions.join("\n"))
    .replace("{tensions}", insight.tensions.join("\n"))
    .replace("{history}", history || "No prior explorations.")
    .replace("{skipWarning}", skipWarning);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  type AIResponse = {
    title: string;
    prompt: string;
    estimatedMinutes?: number;
    type?: string;
    intensity?: string;
    generationContext?: {
      basedOnSignals?: string[];
      basedOnTensions?: string[];
      reason?: string;
    };
  };

  let data: AIResponse;
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
  if (!exploration) redirect("/dashboard");

  await prisma.$transaction([
    prisma.reflection.create({
      data: { explorationId, source: ReflectionSource.SKIP, selectedSignals: [] },
    }),
    prisma.exploration.update({
      where: { id: explorationId },
      data: { status: ExplorationStatus.SKIPPED, skipReason: reason, skippedAt: new Date() },
    }),
  ]);

  redirect("/dashboard");
}

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
  if (!exploration) redirect("/dashboard");

  await prisma.$transaction([
    prisma.reflection.create({
      data: {
        explorationId,
        source: ReflectionSource.COMPLETION,
        selectedSignals: reflection.selectedSignals,
        energyLevel: reflection.energyLevel,
        curiosityLevel: reflection.curiosityLevel,
        intimidationLevel: reflection.intimidationLevel,
        notes: reflection.notes || null,
      },
    }),
    prisma.exploration.update({
      where: { id: explorationId },
      data: { status: ExplorationStatus.COMPLETED, completedAt: new Date() },
    }),
  ]);

  redirect("/dashboard");
}

// ─── Expiry ───────────────────────────────────────────────────────────────────

export async function markExpiredExplorations(userId: string): Promise<void> {
  await prisma.exploration.updateMany({
    where: { userId, status: ExplorationStatus.ACTIVE, expiresAt: { lt: new Date() } },
    data: { status: ExplorationStatus.EXPIRED },
  });
}
