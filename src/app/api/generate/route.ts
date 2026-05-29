import Anthropic from "@anthropic-ai/sdk";
import { jsonrepair } from "jsonrepair";
import {
  buildSystemPromptPart1,
  buildUserPromptPart1,
  buildSystemPromptPart2,
  buildUserPromptPart2,
} from "@/lib/prompts";
import type { BlogPost } from "@/lib/types";

// Run as an Edge Function — no hard wall-clock timeout, streaming keeps connection alive
export const runtime = "edge";

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  // Validate before opening the stream
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "ANTHROPIC_API_KEY is not configured. Add it to .env.local.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const blog: BlogPost = (body.blog as BlogPost) ?? (body as unknown as BlogPost);
  const part: 1 | 2 = body.part === 2 ? 2 : 1;

  if (!blog.title) {
    return new Response(JSON.stringify({ error: "Blog title is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const systemPrompt =
    part === 2 ? buildSystemPromptPart2() : buildSystemPromptPart1();
  const userPrompt =
    part === 2 ? buildUserPromptPart2(blog) : buildUserPromptPart1(blog);

  // Create the Anthropic client inside the handler so the API key env var is
  // resolved at request time (edge environment) rather than module init time.
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const stream = new ReadableStream({
    async start(controller) {
      // Heartbeat comment every 8 s — resets any inactivity timeout and
      // proves to the browser that the connection is still alive.
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          // Controller already closed — swallow
        }
      }, 8000);

      try {
        const message = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        });

        const raw =
          message.content[0].type === "text" ? message.content[0].text : "";

        // Strip any accidental markdown code fences
        const jsonStr = raw
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/, "")
          .trim();

        let parsed: { contentPillar?: string; platforms: unknown };
        try {
          parsed = JSON.parse(jsonStr);
        } catch {
          parsed = JSON.parse(jsonrepair(jsonStr));
        }

        const result = {
          blogTitle: blog.title,
          blogUrl: blog.url,
          generatedAt: new Date().toISOString(),
          contentPillar: parsed.contentPillar ?? "educational",
          platforms: parsed.platforms,
        };

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(result)}\n\n`)
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        console.error("Generate error:", err);
        const msg =
          err instanceof Error &&
          err.message.toLowerCase().includes("timeout")
            ? "Generation timed out. Please try again — Claude is crafting a lot of content."
            : "Generation failed. Please check your API key and try again.";

        try {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`
            )
          );
          controller.close();
        } catch {
          // Already closed
        }
      } finally {
        clearInterval(heartbeat);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Prevent nginx / Netlify CDN from buffering the SSE stream
      "X-Accel-Buffering": "no",
    },
  });
}
