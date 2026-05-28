import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  ExplorationStatus,
  ExplorationType,
  ExplorationIntensity,
  ReflectionSource,
} from "@/generated/prisma/client";

// ─── Dev only — seeds the current logged-in user with realistic demo data ────
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;

  // Wipe existing data for this user so seed is idempotent
  await prisma.fitInsight.deleteMany({ where: { userId } });
  await prisma.exploration.deleteMany({ where: { userId } });

  // Create FitInsight
  await prisma.fitInsight.create({
    data: {
      userId,
      summary:
        "You're drawn to deep, focused work and feel most alive when you have clear ownership over a problem. You tend to avoid ambiguous social dynamics and perform best in structured environments that give you autonomy. There's a recurring tension between wanting creative freedom and needing financial stability — that pull is worth understanding rather than resolving too quickly.",
      directions: [
        "Software engineering / systems design",
        "Independent research or analysis",
        "Product strategy in a small team",
        "Technical writing or education",
      ],
      tensions: [
        "Craving creative freedom vs. needing financial predictability",
        "Preferring solo work vs. growing in collaborative environments",
      ],
      version: 1,
    },
  });

  // Completed exploration 1
  const e1 = await prisma.exploration.create({
    data: {
      userId,
      title: "Watch 5 minutes of a software engineer's day",
      prompt:
        'Search YouTube for "day in the life of a software engineer" and watch at least 5 minutes of the first result. Don\'t judge the person — just notice: does the environment feel familiar or foreign? Does watching it give you energy or make you want to look away?',
      status: ExplorationStatus.COMPLETED,
      type: ExplorationType.OBSERVE,
      intensity: ExplorationIntensity.VERY_LIGHT,
      generationContext: {
        basedOnSignals: ["deep work preference", "systems thinking"],
        basedOnTensions: ["creative freedom vs stability"],
        reason:
          "Starting with passive observation of a concrete role to see if the environment resonates.",
      },
      expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    },
  });
  await prisma.reflection.create({
    data: {
      explorationId: e1.id,
      source: ReflectionSource.COMPLETION,
      selectedSignals: ["Felt curious", "Felt engaged", "Wanted to keep going"],
      energyLevel: 4,
      curiosityLevel: 5,
      intimidationLevel: 1,
      notes: "Actually looked up more videos after. The debugging process looked satisfying.",
    },
  });

  // Completed exploration 2
  const e2 = await prisma.exploration.create({
    data: {
      userId,
      title: "Read about what a product manager actually does",
      prompt:
        'Search "what does a product manager do all day" and read one article for 5 minutes. Notice: does the role sound exciting or exhausting? Does the mix of meetings + decisions + cross-team communication feel like a fit or a nightmare?',
      status: ExplorationStatus.SKIPPED,
      type: ExplorationType.OBSERVE,
      intensity: ExplorationIntensity.VERY_LIGHT,
      generationContext: {
        basedOnSignals: ["ownership preference", "structure need"],
        basedOnTensions: ["solo work vs collaborative roles"],
        reason: "Testing reaction to a more people-facing, strategic role.",
      },
      skipReason: "Already know it's not for me",
      expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      skippedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
  });
  await prisma.reflection.create({
    data: {
      explorationId: e2.id,
      source: ReflectionSource.SKIP,
      selectedSignals: [],
    },
  });

  // Skipped exploration
  const e3 = await prisma.exploration.create({
    data: {
      userId,
      title: "Compare two developer tools you've never used",
      prompt:
        "Pick any two tools from this list: Figma, Notion, Linear, Vercel, Supabase, Raycast. Open both homepages. Read the tagline and first paragraph of each. Notice which one makes you curious to click around, and which one feels like more to learn.",
      status: ExplorationStatus.COMPLETED,
      type: ExplorationType.COMPARE,
      intensity: ExplorationIntensity.LIGHT,
      generationContext: {
        basedOnSignals: ["curiosity from exploration 1", "systems interest"],
        basedOnTensions: [],
        reason:
          "High curiosity from first exploration — moving slightly deeper into the tech ecosystem.",
      },
      expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    },
  });
  await prisma.reflection.create({
    data: {
      explorationId: e3.id,
      source: ReflectionSource.COMPLETION,
      selectedSignals: ["Felt curious", "Felt comfortable", "Wanted to keep going"],
      energyLevel: 4,
      curiosityLevel: 4,
      intimidationLevel: 2,
      notes: "Ended up spending 20 minutes on Vercel. Didn't feel like work at all.",
    },
  });

  // Active exploration
  await prisma.exploration.create({
    data: {
      userId,
      title: "Read one commit message thread on an open source project",
      prompt:
        'Go to github.com/vercel/next.js/commits/canary and open any recent commit. Read the title, the description, and one or two comments if there are any. Notice: does the conversation feel foreign or do you follow along? Does seeing real engineers discuss decisions feel intimidating, interesting, or both?',
      status: ExplorationStatus.ACTIVE,
      type: ExplorationType.OBSERVE,
      intensity: ExplorationIntensity.LIGHT,
      generationContext: {
        basedOnSignals: ["high curiosity", "tech ecosystem engagement", "Vercel interest"],
        basedOnTensions: ["creative freedom vs stability"],
        reason:
          "Moving from passive watching to reading real engineering decisions — still low pressure, just reading.",
      },
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 36),
    },
  });

  return NextResponse.json({ ok: true, message: "Demo data seeded for your account." });
}
