import OpenAI from "openai";
import { CONVERSATION_PROMPT } from "@/lib/prompts/conversation";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

export async function POST(req: Request) {
  try {
    const { messages, educationStage } = await req.json();

    const stageContext = educationStage ? (STAGE_CONTEXT[educationStage] ?? "") : "";
    const systemPrompt = CONVERSATION_PROMPT + stageContext;

    const stream = await openai.responses.create({
      model: "gpt-4.1-mini",
      stream: true,
      input: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "response.output_text.delta") {
              controller.enqueue(encoder.encode(event.delta));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
