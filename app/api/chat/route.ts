import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are JARVIS, a smart and concise personal morning briefing assistant. You have access to the user's current dashboard data — live weather, markets, news, tech, and cybersecurity.

Guidelines:
- Be direct and useful. No filler phrases like "Great question!" or "Certainly!"
- Reference specific data from the dashboard context when relevant
- Keep answers brief unless depth is explicitly requested
- For market questions, cite actual numbers from the context
- For news questions, summarize the key points and why they matter
- You can help draft emails, explain technical concepts, or analyze anything on the dashboard
- The user's name is Graden`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Anthropic API key not configured" }, { status: 500 });
  }

  const { messages, context } = await req.json() as {
    messages: { role: "user" | "assistant"; content: string }[];
    context: string;
  };

  if (!messages || messages.length === 0) {
    return Response.json({ error: "No messages provided" }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const systemWithContext = context
    ? `${SYSTEM_PROMPT}\n\n---\n\n${context}`
    : SYSTEM_PROMPT;

  // Return a streaming response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: systemWithContext,
          messages,
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(
              new TextEncoder().encode(event.delta.text)
            );
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(new TextEncoder().encode(`\n\n[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
