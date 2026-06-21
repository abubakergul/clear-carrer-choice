import { track } from "@/lib/analytics";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { withLogger } from "@/lib/logger";

// Only client-originated funnel events are accepted here; server-side steps
// (signup, insight, completion) are tracked directly and can't be spoofed.
const CLIENT_EVENTS = new Set(["chat_started", "wall_reached"]);

export const POST = withLogger("/api/track", async function (req: Request) {
  // Always answer 200 so a tracking call can never surface as an error in the UI.
  try {
    const limit = rateLimit(`track:${clientIp(req)}`, 60, 60_000);
    if (!limit.ok) return Response.json({ ok: false });

    const { name, sessionId, meta } = await req.json();
    if (typeof name !== "string" || !CLIENT_EVENTS.has(name)) {
      return Response.json({ ok: false });
    }

    await track(name as "chat_started" | "wall_reached", {
      sessionId: typeof sessionId === "string" ? sessionId.slice(0, 100) : undefined,
      meta: meta && typeof meta === "object" ? (meta as Record<string, unknown>) : undefined,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false });
  }
});
