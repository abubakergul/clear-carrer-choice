import OpenAI from "openai";
import { CONVERSATION_PROMPT } from "@/lib/prompts/conversation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Per-IP cap so a single client (or bot) can't run up the OpenAI bill.
const CHAT_RATE_LIMIT = 20; // requests
const CHAT_RATE_WINDOW_MS = 60_000; // per minute
// Fail fast instead of letting the SDK hang + retry for ~45s on a slow upstream.
const OPENAI_TIMEOUT_MS = 30_000;

const STAGE_CONTEXT: Record<string, string> = {
  school: `
STUDENT CONTEXT: This student is still in secondary or high school. They are at the stage of choosing what to study or what career to aim for. They likely have no work experience. Questions should focus on interests, natural strengths, subjects they enjoy, and realistic paths available after school. Degree requirements and entry routes are relevant to surface.`,

  college: `
STUDENT CONTEXT: This student is currently in college or university, mid-degree. They may be questioning whether their chosen subject is right for them, or unsure what to do with their degree. Acknowledge they are already on a path — explore whether it fits them, what they've learned about themselves so far, and what careers their degree opens or closes.`,

  graduating: `
STUDENT CONTEXT: This student is in their final year and graduating soon. There is real urgency — they need clarity fast. Focus on immediate, realistic options based on their existing degree and interests. Avoid suggesting paths that require starting over unless they raise it. Time and momentum matter here.`,

  graduated: `
STUDENT CONTEXT: This student has already graduated and is trying to figure out their career direction. They may feel stuck, behind, or like they chose the wrong degree. Acknowledge their existing qualifications as an asset. Explore whether they want to use their degree, pivot away from it, or find a path that bridges both.`,
};

// The conversation allows up to 12 user turns (~25 messages incl. the opening +
// assistant replies). Keep headroom above that so a full chat never gets rejected.
const MAX_MESSAGES = 30;
const MAX_MESSAGE_LENGTH = 4000;

export async function POST(req: Request) {
  try {
    const limit = rateLimit(`chat:${clientIp(req)}`, CHAT_RATE_LIMIT, CHAT_RATE_WINDOW_MS);
    if (!limit.ok) {
      return Response.json(
        { error: "Too many messages — give it a moment and try again." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
      );
    }

    const { messages, educationStage } = await req.json();

    if (!Array.isArray(messages) || messages.length > MAX_MESSAGES) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    // Truncate any individual message that exceeds the per-message limit.
    const safeMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: typeof m.content === "string" ? m.content.slice(0, MAX_MESSAGE_LENGTH) : "",
    }));

    const stageContext = educationStage ? (STAGE_CONTEXT[educationStage] ?? "") : "";
    const systemPrompt = CONVERSATION_PROMPT + stageContext;

    const stream = await openai.responses.create(
      {
        model: "gpt-4.1-mini",
        stream: true,
        input: [
          { role: "system", content: systemPrompt },
          ...safeMessages,
        ],
      },
      // Cap the wait + retries so a slow upstream surfaces as a quick, retryable
      // error rather than a ~45s hang that ends in a 500.
      { timeout: OPENAI_TIMEOUT_MS, maxRetries: 1 }
    );

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "response.output_text.delta") {
              controller.enqueue(encoder.encode(event.delta));
            }
          }
          controller.close();
        } catch (err) {
          // Upstream failed mid-stream — surface it as a stream error so the
          // client's retry UI fires, instead of silently truncating the reply.
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: unknown) {
    // Never leak raw SDK/DB error text to the client; the UI just needs a non-OK.
    console.error("[/api/chat] error:", error);
    return Response.json(
      { error: "The assistant stalled. Please resend your message." },
      { status: 503 }
    );
  }
}
