import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

// Funnel event names — keep this list tight so the funnel stays readable.
export type EventName =
  | "chat_started"
  | "wall_reached"
  | "signed_up"
  | "insight_generated"
  | "exploration_completed";

// Fire-and-forget event logging. NEVER throws and NEVER blocks a user flow —
// analytics must not be able to break the product. Call without awaiting.
export async function track(
  name: EventName,
  opts?: { sessionId?: string; userId?: string; meta?: Record<string, unknown> }
): Promise<void> {
  try {
    await prisma.event.create({
      data: {
        name,
        sessionId: opts?.sessionId ?? null,
        userId: opts?.userId ?? null,
        meta: (opts?.meta as Prisma.InputJsonValue) ?? undefined,
      },
    });
  } catch {
    // swallow — a missing analytics row is never worth a failed request
  }
}
