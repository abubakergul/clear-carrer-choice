// Client-side funnel pings. Uses sendBeacon so the event still fires even if the
// page is navigating away; falls back to keepalive fetch. Always silent.

type ClientEventName = "chat_started" | "wall_reached";

export function trackClient(
  name: ClientEventName,
  sessionId?: string,
  meta?: Record<string, unknown>
): void {
  try {
    const body = JSON.stringify({ name, sessionId, meta });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      return;
    }
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never let a tracking call break the UI
  }
}
