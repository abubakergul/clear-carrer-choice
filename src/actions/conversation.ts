"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import { INSIGHT_PROMPT } from "@/lib/prompts/insight";
import { FIRST_EXPLORATION_PROMPT } from "@/lib/prompts/first-exploration";
import { ExplorationStatus, ExplorationType, ExplorationIntensity } from "@/generated/prisma/client";

export async function saveMessages(
  conversationId: string,
  userContent: string,
  assistantContent: string
) {
  await prisma.message.createMany({
    data: [
      { conversationId, role: "user", content: userContent },
      { conversationId, role: "assistant", content: assistantContent },
    ],
  });
}

type ClaimResult =
  | { ok: true }
  | { ok: false; to: string }
  | { ok: false; error: string };

export async function claimAndGenerate(
  sessionId: string | null
): Promise<ClaimResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, to: "/dashboard" };

  const userId = session.user.id;

  // Already has insight — send straight to result page
  const existingInsight = await prisma.fitInsight.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (existingInsight) return { ok: false, to: "/result" };

  if (!sessionId) return { ok: false, to: "/dashboard" };

  // Find unclaimed conversation OR one already claimed by this user (retry after failed insight)
  const conv = await prisma.conversation.findFirst({
    where: { sessionId, OR: [{ userId: null }, { userId }] },
    orderBy: { createdAt: "desc" },
  });
  if (!conv) return { ok: false, to: "/dashboard" };

  if (!conv.userId) {
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { userId },
    });
  }

  // Load persisted messages
  const messages = await prisma.message.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: "asc" },
  });
  if (messages.length === 0) return { ok: false, to: "/dashboard" };

  const formatted = messages
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");
  const insightPrompt = INSIGHT_PROMPT.replace("{messages}", formatted);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Generate FitInsight
  let insightData: { summary: string; directions: string[]; tensions: string[] };
  try {
    const insightRes = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [{ role: "user", content: insightPrompt }],
    });
    const raw = insightRes.output_text.replace(/```(?:json)?\n?/g, "").trim();
    insightData = JSON.parse(raw);
  } catch {
    return { ok: false, error: "insight_generation_failed" };
  }

  try {
    await prisma.fitInsight.create({
      data: {
        userId,
        summary: insightData.summary,
        directions: insightData.directions,
        tensions: insightData.tensions,
      },
    });
  } catch {
    return { ok: false, error: "insight_generation_failed" };
  }

  // Ensure no existing active exploration before creating one
  const existingActive = await prisma.exploration.findFirst({
    where: { userId, status: ExplorationStatus.ACTIVE },
    select: { id: true },
  });
  if (existingActive) return { ok: true };

  // Generate first Exploration
  const explorationPrompt = FIRST_EXPLORATION_PROMPT
    .replace("{directions}", insightData.directions.join("\n"))
    .replace("{tensions}", insightData.tensions.join("\n"));

  type ExplorationAIResponse = {
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

  let explorationData: ExplorationAIResponse;
  try {
    const explorationRes = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [{ role: "user", content: explorationPrompt }],
    });
    const raw = explorationRes.output_text.replace(/```(?:json)?\n?/g, "").trim();
    explorationData = JSON.parse(raw);
  } catch {
    return { ok: false, error: "exploration_generation_failed" };
  }

  // Validate and coerce enums returned by the AI
  const validTypes = Object.values(ExplorationType) as string[];
  const validIntensities = Object.values(ExplorationIntensity) as string[];
  const explorationTypeValue = explorationData.type && validTypes.includes(explorationData.type)
    ? (explorationData.type as ExplorationType)
    : ExplorationType.OBSERVE;
  const explorationIntensityValue = explorationData.intensity && validIntensities.includes(explorationData.intensity)
    ? (explorationData.intensity as ExplorationIntensity)
    : ExplorationIntensity.VERY_LIGHT;

  // Expire after 48 hours
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  await prisma.exploration.create({
    data: {
      userId,
      title: explorationData.title,
      prompt: explorationData.prompt,
      status: ExplorationStatus.ACTIVE,
      type: explorationTypeValue,
      intensity: explorationIntensityValue,
      generationContext: explorationData.generationContext ?? undefined,
      expiresAt,
    },
  });

  return { ok: true };
}
