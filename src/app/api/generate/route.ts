import { jsonrepair } from "jsonrepair";
import {
  buildSystemPromptPart1,
  buildUserPromptPart1,
  buildSystemPromptPart2,
  buildUserPromptPart2,
} from "@/lib/prompts";
import type { BlogPost } from "@/lib/types";

// Edge Function — no hard wall-clock timeout; streaming keeps the connection alive.
// We call the Anthropic REST API directly via fetch (pure Fetch API, Deno-compatible)
// instead of the SDK, which relies on Node.js internals that don't exist in edge runtime.
export const runtime = "edge";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  // Prevent Netlify CDN / nginx from buffering the event stream
  "X-Accel-Buffering": "no",
};

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  // ── Validate before opening the stream ────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "ANTHROPIC_API_KEY is not configured. Add it to Netlify environment variables.",
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

  // ── Open the SSE stream ────────────────────────────────────────────────────
  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // controller already closed — swallow
        }
      };

      // Immediate ping confirms the stream opened successfully
      send(": stream-open\n\n");

      // Keep-alive heartbeat every 8 s while Claude is thinking
      const heartbeat = setInterval(() => send(": ping\n\n"), 8000);

      try {
        // ── Call Anthropic REST API directly (Fetch API — edge-safe) ──────────
        const apiRes = await fetch(ANTHROPIC_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 8192,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          }),
        });

        if (!apiRes.ok) {
          const errText = await apiRes.text().catch(() => apiRes.statusText);
          throw new Error(`Anthropic API error ${apiRes.status}: ${errText}`);
        }

        const apiResult = (await apiRes.json()) as {
          content: Array<{ type: string; text?: string }>;
        };

        const raw =
          apiResult.content?.[0]?.type === "text"
            ? (apiResult.content[0].text ?? "")
            : "";

        // Strip accidental markdown code fences
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

        send(`data: ${JSON.stringify(result)}\n\n`);
        send("data: [DONE]\n\n");
        controller.close();
      } catch (err) {
        console.error("Generate error:", err);
        const msg =
          err instanceof Error && err.message.toLowerCase().includes("timeout")
            ? "Generation timed out. Please try again — Claude is crafting a lot of content."
            : "Generation failed. Please check your API key and try again.";

        send(`event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`);
        try {
          controller.close();
        } catch {
          // already closed
        }
      } finally {
        clearInterval(heartbeat);
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
