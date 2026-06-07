"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import { INSIGHT_PROMPT } from "@/lib/prompts/insight";
import { FIRST_EXPLORATION_PROMPT } from "@/lib/prompts/first-exploration";
import { ExplorationStatus, ExplorationType, ExplorationIntensity } from "@/generated/prisma/client";

const EMOTIONAL_WORDS = [
  "love", "hate", "excited", "excitement", "scared", "fear", "boring", "bored",
  "alive", "interesting", "terrifying", "terrified", "fun", "dread", "passionate",
  "obsessed", "miserable", "amazing", "awful", "enjoy", "enjoyed", "dislike",
  "worried", "nervous", "thrilled", "dull", "exhausting", "energizing",
  "fascinating", "frustrating", "overwhelmed", "curious",
];

function stageLabel(stage: string | null): string {
  switch (stage) {
    case "school":
      return "still in school, figuring out what to study or aim for";
    case "college":
      return "in college/university, mid-degree and questioning the path";
    case "graduating":
      return "in their final year, about to finish, next step unclear";
    case "graduated":
      return "already graduated, direction still unclear";
    default:
      return "a student unsure about their direction";
  }
}

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
  let insightData: { summary: string; directions: string[]; tensions: string[]; options?: string[] };
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
        options: Array.isArray(insightData.options) ? insightData.options.slice(0, 4) : [],
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
  const userOptions = Array.isArray(insightData.options) ? insightData.options.slice(0, 4) : [];
  const explorationPrompt = FIRST_EXPLORATION_PROMPT
    .replace("{keyUserQuotes}", keyUserQuotes)
    .replace("{educationStage}", educationStage)
    .replace("{options}", userOptions.join("\n") || "(none named)")
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
      direction?: string;
      option?: string;
      reason?: string;
      interaction?: {
        kind: string;
        optionA?: string;
        optionB?: string;
        role?: string;
        chunks?: { percent: number; text: string }[];
        closer?: string;
      };
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
