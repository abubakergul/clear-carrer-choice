import { prisma } from "@/lib/db";
import { withLogger } from "@/lib/logger";

export const POST = withLogger("/api/chat/session", async function (req: Request) {
  try {
    const { sessionId, educationStage } = await req.json();
    if (!sessionId) {
      return Response.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Return existing unclaimed conversation for this session
    const existing = await prisma.conversation.findFirst({
      where: { sessionId, userId: null },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (existing) return Response.json({ conversationId: existing.id });

    const conversation = await prisma.conversation.create({
      data: { sessionId, educationStage: educationStage ?? null },
    });
    return Response.json({ conversationId: conversation.id });
  } catch {
    return Response.json({ error: "Failed to create session" }, { status: 500 });
  }
});
