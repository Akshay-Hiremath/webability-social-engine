"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import PlatformTabs from "@/components/PlatformTabs";
import type { BlogPost, GeneratedSuite, HistorySession, PlatformKey } from "@/lib/types";
import { formatDate, generateId, PLATFORM_META, PLATFORM_ORDER } from "@/lib/utils";

type Stage = "idle" | "generating" | "awaiting_continuation" | "done" | "error";

/**
 * Read a Server-Sent Events stream from the /api/generate route.
 * Ignores heartbeat comments (": ping"), waits for a `data:` line
 * containing JSON, and returns it. Throws on `event: error` payloads
 * or if the stream closes before a result arrives.
 */
async function readSSE(res: Response): Promise<GeneratedSuite> {
  if (!res.body) throw new Error("Response has no body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    // Split on newlines, keep the last (possibly incomplete) chunk in buffer
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trimEnd();

      // Blank line = end of SSE event block — reset event type
      if (trimmed === "") {
        currentEvent = "";
        continue;
      }
      // Heartbeat / comment lines start with ":"
      if (trimmed.startsWith(":")) continue;

      if (trimmed.startsWith("event:")) {
        currentEvent = trimmed.slice(6).trim();
        continue;
      }

      if (trimmed.startsWith("data:")) {
        const payload = trimmed.slice(5).trim();

        // End-of-stream sentinel — we already returned the data above
        if (payload === "[DONE]") {
          reader.cancel();
          throw new Error("Stream ended without data");
        }

        const parsed = JSON.parse(payload) as Record<string, unknown>;

        if (currentEvent === "error") {
          reader.cancel();
          throw new Error(
            (parsed.error as string | undefined) || "Generation failed"
          );
        }

        // Success — stop reading and return
        reader.cancel();
        return parsed as unknown as GeneratedSuite;
      }
    }
  }

  throw new Error("Stream ended without data");
}

const PART1_KEYS: PlatformKey[] = ["linkedin", "twitter", "instagram"];
const PART2_KEYS: PlatformKey[] = ["facebook", "medium", "substack", "reddit"];

function GeneratingAnimation({ part }: { part: 1 | 2 }) {
  const keys = part === 1 ? PART1_KEYS : PART2_KEYS;
  const steps = keys.map((k) => PLATFORM_META[k].label);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % steps.length);
    }, 900);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="mx-auto max-w-sm space-y-3">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-3">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full">
            {i < active ? (
              <CheckCircle2 size={20} className="text-green-500" />
            ) : i === active ? (
              <Loader2 size={20} className="animate-spin text-primary" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-white/20" />
            )}
          </div>
          <span
            className={`text-sm font-medium transition-colors ${
              i < active
                ? "text-green-400"
                : i === active
                ? "text-white"
                : "text-white/40"
            }`}
          >
            {label}
          </span>
          {i === active && (
            <span className="text-xs text-white/50 animate-pulse">generating…</span>
          )}
        </div>
      ))}
    </div>
  );
}

function downloadTextFile(suite: GeneratedSuite) {
  const lines: string[] = [
    `WEBABILITY SOCIAL CONTENT SUITE`,
    `Blog: ${suite.blogTitle}`,
    `URL: ${suite.blogUrl}`,
    `Generated: ${formatDate(suite.generatedAt)}`,
    `Content Pillar: ${suite.contentPillar}`,
    `${"=".repeat(60)}`,
    "",
  ];

  const { platforms } = suite;

  // LinkedIn
  if (platforms.linkedin) {
    lines.push("LINKEDIN", "-".repeat(40));
    lines.push("POST:", platforms.linkedin.textPost, "");
    lines.push("HASHTAGS:", platforms.linkedin.hashtags.join(" "), "");
    lines.push("CAROUSEL SLIDES:");
    platforms.linkedin.carouselSlides.forEach((s, i) => lines.push(`  ${i + 1}. ${s}`));
    lines.push("");
  }

  // Twitter
  if (platforms.twitter) {
    lines.push("X / TWITTER THREAD", "-".repeat(40));
    platforms.twitter.thread.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
    lines.push("", "HASHTAGS:", platforms.twitter.hashtags.join(" "), "");
  }

  // Instagram
  if (platforms.instagram) {
    lines.push("INSTAGRAM", "-".repeat(40));
    lines.push("CAPTION:", platforms.instagram.textPost, "");
    lines.push("HASHTAGS:", platforms.instagram.hashtags.join(" "), "");
  }

  // Facebook
  if (platforms.facebook) {
    lines.push("FACEBOOK", "-".repeat(40));
    lines.push(platforms.facebook.textPost, "");
  }

  // Medium
  if (platforms.medium) {
    lines.push("MEDIUM ARTICLE", "-".repeat(40));
    lines.push(platforms.medium.articleBody, "");
  }

  // Substack
  if (platforms.substack) {
    lines.push("SUBSTACK", "-".repeat(40));
    lines.push(platforms.substack.newsletterSection, "");
  }

  // Reddit
  if (platforms.reddit) {
    lines.push("REDDIT", "-".repeat(40));
    lines.push(platforms.reddit.textPost, "");
    lines.push("SUBREDDITS:", platforms.reddit.subreddits.join(", "), "");
  }

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `webability-content-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function GeneratePage() {
  const router = useRouter();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [suite, setSuite] = useState<GeneratedSuite | null>(null);
  const [partialSuite, setPartialSuite] = useState<GeneratedSuite | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  const saveToHistory = useCallback((s: GeneratedSuite) => {
    try {
      const session: HistorySession = {
        id: generateId(),
        blogTitle: s.blogTitle,
        blogUrl: s.blogUrl,
        generatedAt: s.generatedAt,
        suite: s,
      };
      const existing = JSON.parse(localStorage.getItem("wce_history") || "[]") as HistorySession[];
      const updated = [session, ...existing].slice(0, 20);
      localStorage.setItem("wce_history", JSON.stringify(updated));
    } catch {}
  }, []);

  // Part 1: LinkedIn, Twitter, Instagram
  const generate = useCallback(async (blogData: BlogPost) => {
    setPartialSuite(null);
    setSuite(null);
    setStage("generating");
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blog: blogData, part: 1 }),
      });
      // Non-2xx before the stream opens (validation errors) are plain JSON
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(errData.error || "Generation failed");
      }
      const data = await readSSE(res);
      setPartialSuite(data);
      setStage("awaiting_continuation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStage("error");
    }
  }, []);

  // Part 2: Facebook, Medium, Substack, Reddit — merges with Part 1 result
  const generatePart2 = useCallback(
    async (blogData: BlogPost, partial: GeneratedSuite) => {
      setStage("generating");
      setError(null);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blog: blogData, part: 2 }),
        });
        // Non-2xx before the stream opens (validation errors) are plain JSON
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: "Generation failed" }));
          throw new Error(errData.error || "Generation failed");
        }
        const data = await readSSE(res);

        const merged: GeneratedSuite = {
          ...partial,
          platforms: {
            ...partial.platforms,
            ...data.platforms,
          },
        };
        setSuite(merged);
        saveToHistory(merged);
        sessionStorage.setItem("wce_suite", JSON.stringify(merged));
        setStage("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setStage("error");
      }
    },
    [saveToHistory]
  );

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const storedSuite = sessionStorage.getItem("wce_suite");
    const storedBlog = sessionStorage.getItem("wce_blog");

    if (storedSuite) {
      const parsed = JSON.parse(storedSuite) as GeneratedSuite;
      setSuite(parsed);
      setStage("done");
      sessionStorage.removeItem("wce_suite");
      return;
    }

    if (storedBlog) {
      const parsed = JSON.parse(storedBlog) as BlogPost;
      setBlog(parsed);
      sessionStorage.removeItem("wce_blog");
      generate(parsed);
    } else {
      router.replace("/");
    }
  }, [generate, router]);

  // Determine which part is currently generating for the animation
  const generatingPart: 1 | 2 = partialSuite ? 2 : 1;

  // Display suite for the blog summary banner
  const displaySuite = suite ?? partialSuite;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-brand-muted transition-colors hover:text-brand-dark"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          Back to dashboard
        </button>

        {stage === "done" && suite && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const blogData = blog || {
                  title: suite.blogTitle,
                  url: suite.blogUrl,
                  excerpt: "",
                  content: "",
                  publishedAt: suite.generatedAt,
                  readTime: 0,
                };
                generate(blogData as BlogPost);
              }}
              className="flex items-center gap-2 rounded-xl border border-brand-border bg-white px-4 py-2 text-sm font-medium text-brand-muted shadow-card transition-all hover:border-primary hover:text-primary"
            >
              <RefreshCw size={14} strokeWidth={2} />
              Regenerate
            </button>
            <button
              onClick={() => downloadTextFile(suite)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-primary transition-colors hover:bg-primary-dark"
            >
              <Download size={14} strokeWidth={2} />
              Download All
            </button>
          </div>
        )}
      </div>

      {/* Blog summary banner */}
      {displaySuite && (
        <div className="mb-8 rounded-2xl border border-brand-border bg-white px-6 py-4 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                {stage === "done" ? (
                  <>
                    <CheckCircle2 size={14} className="flex-shrink-0 text-green-500" />
                    <span className="text-xs font-semibold text-green-600">Content suite generated</span>
                  </>
                ) : (
                  <>
                    <Loader2 size={14} className="flex-shrink-0 animate-spin text-primary" />
                    <span className="text-xs font-semibold text-primary">
                      {stage === "awaiting_continuation"
                        ? "Part 1 ready — 3 platforms"
                        : "Generating…"}
                    </span>
                  </>
                )}
                <span className="rounded-full bg-primary-bg px-2 py-0.5 text-[10px] font-semibold capitalize text-primary">
                  {displaySuite.contentPillar}
                </span>
              </div>
              <h2 className="font-display text-base font-bold text-brand-dark line-clamp-1">
                {displaySuite.blogTitle}
              </h2>
              <p className="mt-0.5 text-xs text-brand-muted">
                {stage === "done"
                  ? `Generated ${formatDate(displaySuite.generatedAt)} · 7 platforms · Text, Image briefs & Video scripts`
                  : stage === "awaiting_continuation"
                  ? "LinkedIn, X/Twitter & Instagram ready · Waiting to continue"
                  : "Working…"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generating state (Part 1 or Part 2) */}
      {stage === "generating" && (
        <div className="overflow-hidden rounded-3xl bg-hero-gradient-dark">
          <div className="flex flex-col items-center py-20 px-8">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles size={32} className="animate-pulse text-white" />
            </div>
            <h2 className="mb-2 font-display text-2xl font-bold text-white">
              {generatingPart === 1
                ? "Generating Part 1 of 2…"
                : "Generating Part 2 of 2…"}
            </h2>
            <p className="mb-10 text-sm text-white/60">
              {generatingPart === 1
                ? "Claude is crafting LinkedIn, X/Twitter & Instagram content."
                : "Claude is crafting Facebook, Medium, Substack & Reddit content."}
              {" "}This takes 20–45 seconds.
            </p>
            <div className="w-full max-w-sm rounded-2xl bg-white/5 p-6">
              <GeneratingAnimation part={generatingPart} />
            </div>
          </div>
        </div>
      )}

      {/* Awaiting continuation — Part 1 done, waiting for user to continue */}
      {stage === "awaiting_continuation" && partialSuite && (
        <div className="overflow-hidden rounded-3xl bg-hero-gradient-dark">
          <div className="flex flex-col items-center py-16 px-8 text-center">
            {/* Part 1 complete icon */}
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <CheckCircle2 size={32} className="text-green-400" />
            </div>

            <h2 className="mb-2 font-display text-2xl font-bold text-white">
              Part 1 complete!
            </h2>
            <p className="mb-6 text-sm text-white/70 max-w-sm">
              Content for{" "}
              <span className="font-semibold text-white">
                LinkedIn, X/Twitter &amp; Instagram
              </span>{" "}
              has been generated.
            </p>

            {/* Part 1 platform chips */}
            <div className="mb-8 flex flex-wrap justify-center gap-3">
              {PART1_KEYS.map((key) => (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2"
                >
                  <CheckCircle2 size={14} className="text-green-400" />
                  <span className="text-sm font-medium text-white">
                    {PLATFORM_META[key].label}
                  </span>
                </div>
              ))}
            </div>

            {/* Divider + upcoming */}
            <div className="mb-6 w-full max-w-sm rounded-2xl bg-white/5 px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
                Continue to generate
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {PART2_KEYS.map((key) => (
                  <div
                    key={key}
                    className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2"
                  >
                    <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30" />
                    <span className="text-sm font-medium text-white/60">
                      {PLATFORM_META[key].label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mb-6 text-sm text-white/50">
              Should I continue generating content for the remaining 4 platforms?
            </p>

            <button
              onClick={() => blog && generatePart2(blog, partialSuite)}
              className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white shadow-primary transition-all hover:bg-primary-dark hover:scale-[1.02]"
            >
              <Sparkles size={15} />
              Yes, continue — generate remaining 4 platforms
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Error state */}
      {stage === "error" && (
        <div className="flex flex-col items-center py-20 text-center">
          <AlertCircle size={48} className="mb-4 text-red-400" />
          <h2 className="mb-2 font-display text-xl font-bold text-brand-dark">Generation failed</h2>
          <p className="mb-6 max-w-sm text-sm text-brand-muted">{error}</p>
          <button
            onClick={() => {
              if (blog) {
                // Retry the correct part
                if (partialSuite) {
                  generatePart2(blog, partialSuite);
                } else {
                  generate(blog);
                }
              }
            }}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white shadow-primary transition-colors hover:bg-primary-dark"
          >
            <RefreshCw size={15} strokeWidth={2} />
            Try again
          </button>
        </div>
      )}

      {/* Results — shown only after both parts complete */}
      {stage === "done" && suite && <PlatformTabs suite={suite} />}
    </div>
  );
}
