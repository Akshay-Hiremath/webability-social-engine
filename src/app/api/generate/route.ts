import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { jsonrepair } from "jsonrepair";
import {
  buildSystemPromptPart1,
  buildUserPromptPart1,
  buildSystemPromptPart2,
  buildUserPromptPart2,
} from "@/lib/prompts";
import type { BlogPost } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const keyValue = process.env.ANTHROPIC_API_KEY;
    if (!keyValue) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured. Add it to .env.local." },
        { status: 500 }
      );
    }

    const body = await request.json();
    // Support both { blog, part } (new 2-part flow) and raw blog object (legacy)
    const blog: BlogPost = body.blog ?? body;
    const part: 1 | 2 = body.part === 2 ? 2 : 1;

    if (!blog.title) {
      return NextResponse.json(
        { error: "Blog title is required." },
        { status: 400 }
      );
    }

    const systemPrompt =
      part === 2 ? buildSystemPromptPart2() : buildSystemPromptPart1();
    const userPrompt =
      part === 2 ? buildUserPromptPart2(blog) : buildUserPromptPart1(blog);

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
      // jsonrepair handles unescaped quotes, literal newlines, trailing commas, etc.
      parsed = JSON.parse(jsonrepair(jsonStr));
    }

    return NextResponse.json({
      blogTitle: blog.title,
      blogUrl: blog.url,
      generatedAt: new Date().toISOString(),
      contentPillar: parsed.contentPillar ?? "educational",
      platforms: parsed.platforms,
    });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: "Generation failed. Please check your API key and try again." },
      { status: 500 }
    );
  }
}
