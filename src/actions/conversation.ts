"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import { INSIGHT_PROMPT } from "@/lib/prompts/insight";
import { FIRST_EXPLORATION_PROMPT } from "@/lib/prompts/first-exploration";
import { ExplorationStatus, ExplorationType, ExplorationIntensity } from "@/generated/prisma/client";
import { ExplorationAIResponse, isInteractiveBroken } from "@/lib/exploration";
import { stageLabel, stageExplorationGuidance } from "@/lib/education-stage";
import { parseDriverFactors } from "@/lib/driver-factors";
import { track } from "@/lib/analytics";

const EMOTIONAL_WORDS = [
  "love", "hate", "excited", "excitement", "scared", "fear", "boring", "bored",
  "alive", "interesting", "terrifying", "terrified", "fun", "dread", "passionate",
  "obsessed", "miserable", "amazing", "awful", "enjoy", "enjoyed", "dislike",
  "worried", "nervous", "thrilled", "dull", "exhausting", "energizing",
  "fascinating", "frustrating", "overwhelmed", "curious",
];

function extractKeyUserQuotes(messages: { role: string; content: string }[]): string {
  const userMessages = messages.filter((m) => m.role === "user");
  const emotional = userMessages.filter((m) => {
    const lower = m.content.toLowerCase();
    return EMOTIONAL_WORDS.some((w) => lower.includes(w));
  });
  const picks = emotional.length >= 2 ? emotional.slice(0, 3) : userMessages.slice(0, 3);
  if (picks.length === 0) return "(no direct quotes available)";
  return picks.map((m) => `- "${m.content}"`).join("\n");
}

export async function saveMessages(
  conversationId: string,
  userContent: string,
  assistantContent: string
) {
  const session = await auth();
  // Verify the conversation belongs to this user (or is still unclaimed for guests).
  const conv = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId: session?.user?.id ?? null,
    },
    select: { id: true },
  });
  if (!conv) return;

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
  const keyUserQuotes = extractKeyUserQuotes(messages);
  const educationStage = stageLabel(conv.educationStage);
  const insightPrompt = INSIGHT_PROMPT
    .replace("{keyUserQuotes}", keyUserQuotes)
    .replace("{educationStage}", educationStage)
    .replace("{messages}", formatted);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Generate FitInsight
  let insightData: { summary: string; directions: string[]; tensions: string[]; options?: string[]; factors?: unknown };
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
    const driverFactors = parseDriverFactors(insightData.factors);
    await prisma.fitInsight.create({
      data: {
        userId,
        summary: insightData.summary,
        directions: insightData.directions,
        tensions: insightData.tensions,
        options: Array.isArray(insightData.options) ? insightData.options.slice(0, 4) : [],
        driverFactors: driverFactors.length > 0 ? driverFactors : undefined,
      },
    });
    await track("insight_generated", { userId });
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
  const userOptions = Array.isArray(insightData.options) ? insightData.options.slice(0, 4) : [];
  const explorationPrompt = FIRST_EXPLORATION_PROMPT
    .replace("{keyUserQuotes}", keyUserQuotes)
    .replace("{educationStage}", educationStage)
    .replace("{stageGuidance}", stageExplorationGuidance(conv.educationStage))
    .replace("{options}", userOptions.join("\n") || "(none named)")
    .replace("{directions}", insightData.directions.join("\n"))
    .replace("{tensions}", insightData.tensions.join("\n"));
  // Note: second check is done after the AI call (see below) to close the
  // race window between the pre-check and the OpenAI round-trip.

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

  // If the AI chose an interactive format but omitted the required interaction data,
  // retry once — the interaction object is what makes the page actually work.
  if (isInteractiveBroken(explorationData)) {
    try {
      const retryRes = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: [{ role: "user", content: explorationPrompt }],
      });
      const retryRaw = retryRes.output_text.replace(/```(?:json)?\n?/g, "").trim();
      explorationData = JSON.parse(retryRaw);
    } catch {
      // retry failed — fall through with original data, page will use plain fallback
    }
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

  // Second guard: re-check after the AI call to close the race window.
  const activeAfterAI = await prisma.exploration.findFirst({
    where: { userId, status: ExplorationStatus.ACTIVE },
    select: { id: true },
  });
  if (activeAfterAI) return { ok: true };

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
