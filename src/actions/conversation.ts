"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";
import { INSIGHT_PROMPT } from "@/lib/prompts/insight";
import { FIRST_EXPLORATION_PROMPT } from "@/lib/prompts/first-exploration";

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
  | { ok: false; fallback: true }
  | { ok: false; fallback?: false; error: string };

export async function claimAndGenerate(
  sessionId: string | null
): Promise<ClaimResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, fallback: true };

  const userId = session.user.id;

  // Already has insight — nothing to generate
  const existingInsight = await prisma.fitInsight.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (existingInsight) return { ok: false, fallback: true };

  if (!sessionId) return { ok: false, fallback: true };

  // Claim latest unclaimed conversation for this session
  const conv = await prisma.conversation.findFirst({
    where: { sessionId, userId: null },
    orderBy: { createdAt: "desc" },
  });
  if (!conv) return { ok: false, fallback: true };

  await prisma.conversation.update({
    where: { id: conv.id },
    data: { userId },
  });

  // Load persisted messages
  const messages = await prisma.message.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: "asc" },
  });
  if (messages.length === 0) return { ok: false, fallback: true };

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

  await prisma.fitInsight.create({
    data: {
      userId,
      summary: insightData.summary,
      directions: insightData.directions,
      tensions: insightData.tensions,
    },
  });

  // Generate first Exploration
  const explorationPrompt = FIRST_EXPLORATION_PROMPT
    .replace("{directions}", insightData.directions.join("\n"))
    .replace("{tensions}", insightData.tensions.join("\n"));

  let explorationData: { title: string; prompt: string };
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

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 1);

  await prisma.exploration.create({
    data: {
      userId,
      title: explorationData.title,
      prompt: explorationData.prompt,
      status: "active",
      expiresAt,
    },
  });

  return { ok: true };
}
