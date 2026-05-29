import { NextResponse } from "next/server";
import { jsonrepair } from "jsonrepair";
import { buildPlatformSystemPrompt, buildPlatformUserPrompt } from "@/lib/prompts";
import type { BlogPost, PlatformKey } from "@/lib/types";

// Node.js runtime — no Deno/edge compatibility concerns.
// Each per-platform call takes 4-8 s, well inside Netlify's function timeout.
export const maxDuration = 60; // respected by Vercel; Netlify uses its own limit

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

const VALID_PLATFORMS: PlatformKey[] = [
  "linkedin", "twitter", "instagram", "facebook", "medium", "substack", "reddit",
];

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const blog = (body.blog ?? body) as BlogPost;
  const platform = body.platform as PlatformKey | undefined;

  if (!blog?.title) {
    return NextResponse.json({ error: "Blog title is required." }, { status: 400 });
  }
  if (!platform || !VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json(
      { error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(", ")}` },
      { status: 400 }
    );
  }

  const systemPrompt = buildPlatformSystemPrompt(platform);
  const userPrompt = buildPlatformUserPrompt(blog, platform);

  try {
    const apiRes = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text().catch(() => String(apiRes.status));
      throw new Error(`Anthropic API ${apiRes.status}: ${errText}`);
    }

    const apiResult = (await apiRes.json()) as {
      content: Array<{ type: string; text?: string }>;
    };

    const raw =
      apiResult.content?.[0]?.type === "text"
        ? (apiResult.content[0].text ?? "")
        : "";

    if (!raw.trim()) throw new Error("Claude returned an empty response.");

    const jsonStr = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let parsed: { contentPillar?: string; data: unknown };
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = JSON.parse(jsonrepair(jsonStr));
    }

    return NextResponse.json({
      platform,
      contentPillar: parsed.contentPillar ?? "educational",
      data: parsed.data,
    });
  } catch (err) {
    console.error(`Generate [${platform}] error:`, err);
    const msg =
      err instanceof Error && err.message.toLowerCase().includes("timeout")
        ? `${platform} generation timed out. Please try again.`
        : `Failed to generate ${platform} content. Please try again.`;
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
