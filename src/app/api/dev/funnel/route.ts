import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Funnel snapshot. Guarded: in production it requires ?key=<ADMIN_SECRET>; in dev
// it's open. Visit /api/dev/funnel?key=... to read your validation numbers.
export async function GET(req: Request) {
  const secret = process.env.ADMIN_SECRET;
  const key = new URL(req.url).searchParams.get("key");
  if (process.env.NODE_ENV === "production" && (!secret || key !== secret)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Ordered funnel steps. Each value is a distinct count where it makes sense
  // (e.g. unique guest sessions that started a chat), else a raw event count.
  const [
    chatStartedSessions,
    wallReached,
    signedUp,
    insightGenerated,
    explorationCompletedEvents,
    usersWith5,
  ] = await Promise.all([
    prisma.event
      .findMany({ where: { name: "chat_started" }, select: { sessionId: true }, distinct: ["sessionId"] })
      .then((r) => r.length),
    prisma.event.count({ where: { name: "wall_reached" } }),
    prisma.event.count({ where: { name: "signed_up" } }),
    prisma.event.count({ where: { name: "insight_generated" } }),
    prisma.event.count({ where: { name: "exploration_completed" } }),
    // Users who reached the 5-exploration "answer unlock".
    prisma.event
      .groupBy({ by: ["userId"], where: { name: "exploration_completed", userId: { not: null } }, _count: true })
      .then((rows) => rows.filter((r) => r._count >= 5).length),
  ]);

  return NextResponse.json({
    funnel: {
      "1_chat_started (unique sessions)": chatStartedSessions,
      "2_wall_reached": wallReached,
      "3_signed_up": signedUp,
      "4_insight_generated": insightGenerated,
      "5_exploration_completed (total)": explorationCompletedEvents,
      "6_users_reached_answer (5 done)": usersWith5,
    },
    generatedAt: new Date().toISOString(),
  });
}
