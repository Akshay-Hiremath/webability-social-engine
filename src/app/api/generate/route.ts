import { jsonrepair } from "jsonrepair";
import {
  buildSystemPromptPart1,
  buildUserPromptPart1,
  buildSystemPromptPart2,
  buildUserPromptPart2,
} from "@/lib/prompts";
import type { BlogPost } from "@/lib/types";

// Edge Function — avoids Netlify's hard serverless timeout.
// We call Anthropic with stream:true so the response starts arriving within
// 1-2 s and we forward pings on every token (~100 ms cadence), keeping the
// SSE connection genuinely active throughout the 20-45 s generation window.
export const runtime = "edge";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "ANTHROPIC_API_KEY is not configured. Add it to Netlify environment variables.",
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

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          /* controller already closed */
        }
      };

      // Immediate ping confirms the stream is open before any API call
      send(": stream-open\n\n");

      try {
        // ── Ask Anthropic to stream its response ──────────────────────────────
        // With stream:true, Anthropic sends SSE events starting within 1-2 s.
        // We read each content_block_delta and forward a keep-alive ping to the
        // client, so the connection stays active for the full generation window.
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
            stream: true,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          }),
        });

        if (!apiRes.ok || !apiRes.body) {
          const errText = await apiRes.text().catch(() => String(apiRes.status));
          throw new Error(`Anthropic API ${apiRes.status}: ${errText}`);
        }

        // ── Pipe Anthropic's SSE stream, accumulating the full text ───────────
        const reader = apiRes.body.getReader();
        const dec = new TextDecoder();
        let fullText = "";
        let sseBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += dec.decode(value, { stream: true });
          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trimEnd();
            if (!trimmed.startsWith("data: ")) continue;

            const payload = trimmed.slice(6).trim();
            if (payload === "[DONE]") continue;

            try {
              const evt = JSON.parse(payload) as {
                type: string;
                delta?: { type: string; text?: string };
              };

              if (
                evt.type === "content_block_delta" &&
                evt.delta?.type === "text_delta" &&
                evt.delta.text
              ) {
                fullText += evt.delta.text;
                // Forward a ping on every token — resets Netlify's inactivity timer
                send(": t\n\n");
              }
            } catch {
              /* ignore malformed SSE lines */
            }
          }
        }

        if (!fullText.trim()) {
          throw new Error("Claude returned an empty response.");
        }

        // ── Parse the accumulated JSON ────────────────────────────────────────
        const jsonStr = fullText
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
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
