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
} from "lucide-react";
import PlatformTabs from "@/components/PlatformTabs";
import type {
  BlogPost,
  GeneratedPlatforms,
  GeneratedSuite,
  HistorySession,
  PlatformKey,
} from "@/lib/types";
import { formatDate, generateId, PLATFORM_META, PLATFORM_ORDER } from "@/lib/utils";

type Stage = "idle" | "generating" | "done" | "error";

// ── helpers ──────────────────────────────────────────────────────────────────

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

  if (platforms.linkedin) {
    lines.push("LINKEDIN", "-".repeat(40));
    lines.push("POST:", platforms.linkedin.textPost, "");
    lines.push("HASHTAGS:", platforms.linkedin.hashtags.join(" "), "");
    lines.push("CAROUSEL SLIDES:");
    platforms.linkedin.carouselSlides.forEach((s, i) => lines.push(`  ${i + 1}. ${s}`));
    lines.push("");
  }
  if (platforms.twitter) {
    lines.push("X / TWITTER THREAD", "-".repeat(40));
    platforms.twitter.thread.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
    lines.push("", "HASHTAGS:", platforms.twitter.hashtags.join(" "), "");
  }
  if (platforms.instagram) {
    lines.push("INSTAGRAM", "-".repeat(40));
    lines.push("CAPTION:", platforms.instagram.textPost, "");
    lines.push("HASHTAGS:", platforms.instagram.hashtags.join(" "), "");
  }
  if (platforms.facebook) {
    lines.push("FACEBOOK", "-".repeat(40));
    lines.push(platforms.facebook.textPost, "");
  }
  if (platforms.medium) {
    lines.push("MEDIUM ARTICLE", "-".repeat(40));
    lines.push(platforms.medium.articleBody, "");
  }
  if (platforms.substack) {
    lines.push("SUBSTACK", "-".repeat(40));
    lines.push(platforms.substack.newsletterSection, "");
  }
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

// ── ProgressTracker shown during generation ───────────────────────────────────

function ProgressTracker({
  currentPlatform,
  completedPlatforms,
}: {
  currentPlatform: PlatformKey | null;
  completedPlatforms: PlatformKey[];
}) {
  return (
    <div className="mx-auto max-w-xs space-y-3">
      {PLATFORM_ORDER.map((key) => {
        const isDone = completedPlatforms.includes(key);
        const isActive = key === currentPlatform;
        const meta = PLATFORM_META[key];
        return (
          <div key={key} className="flex items-center gap-3">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full">
              {isDone ? (
                <CheckCircle2 size={20} className="text-green-400" />
              ) : isActive ? (
                <Loader2 size={20} className="animate-spin text-white" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-white/20" />
              )}
            </div>
            <span
              className={`text-sm font-medium transition-colors ${
                isDone
                  ? "text-green-400"
                  : isActive
                  ? "text-white"
                  : "text-white/40"
              }`}
            >
              {meta.label}
            </span>
            {isActive && (
              <span className="text-xs text-white/50 animate-pulse">
                generating…
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GeneratePage() {
  const router = useRouter();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [suite, setSuite] = useState<GeneratedSuite | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentPlatform, setCurrentPlatform] = useState<PlatformKey | null>(null);
  const [completedPlatforms, setCompletedPlatforms] = useState<PlatformKey[]>([]);
  // Platforms accumulated so far (used for partial retry)
  const accRef = useRef<GeneratedPlatforms>({});
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
      const existing = JSON.parse(
        localStorage.getItem("wce_history") || "[]"
      ) as HistorySession[];
      const updated = [session, ...existing].slice(0, 20);
      localStorage.setItem("wce_history", JSON.stringify(updated));
    } catch {}
  }, []);

  // Generate platforms sequentially, starting from `startFrom` index.
  // Accepts already-accumulated platforms so partial retries pick up mid-way.
  const generateSequential = useCallback(
    async (
      blogData: BlogPost,
      startFrom: PlatformKey = PLATFORM_ORDER[0],
      alreadyDone: PlatformKey[] = [],
      alreadyAcc: GeneratedPlatforms = {}
    ) => {
      setStage("generating");
      setError(null);
      setCompletedPlatforms(alreadyDone);
      accRef.current = alreadyAcc;

      const startIdx = PLATFORM_ORDER.indexOf(startFrom);
      const remaining = PLATFORM_ORDER.slice(startIdx);

      let contentPillar = "educational";
      let acc = { ...alreadyAcc };

      for (const platform of remaining) {
        setCurrentPlatform(platform);

        try {
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ blog: blogData, platform }),
          });

          // Parse body safely — a Netlify timeout returns HTML or a non-standard JSON shape
          const json = await res.json().catch(() => ({})) as Record<string, unknown>;

          if (!res.ok) {
            // Netlify timeout: { errorType, errorMessage } — not our { error } shape
            const netlifyMsg = json.errorType === "TimeoutError"
              ? `${PLATFORM_META[platform].label} timed out — please try again.`
              : null;
            throw new Error(
              netlifyMsg ||
              (json.error as string | undefined) ||
              `Failed to generate ${PLATFORM_META[platform].label}. Please try again.`
            );
          }

          if (json.contentPillar) contentPillar = json.contentPillar as string;

          acc = { ...acc, [platform]: json.data };
          accRef.current = acc;

          setCompletedPlatforms((prev) => [...prev, platform]);
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : `${platform} generation failed.`;
          setError(msg);
          setCurrentPlatform(null);
          setStage("error");
          return;
        }
      }

      setCurrentPlatform(null);

      const finalSuite: GeneratedSuite = {
        blogTitle: blogData.title,
        blogUrl: blogData.url,
        generatedAt: new Date().toISOString(),
        contentPillar,
        platforms: acc,
      };

      saveToHistory(finalSuite);
      sessionStorage.setItem("wce_suite", JSON.stringify(finalSuite));
      setSuite(finalSuite);
      setStage("done");
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
      generateSequential(parsed);
    } else {
      router.replace("/");
    }
  }, [generateSequential, router]);

  // Retry: resume from the platform that failed (skip already-completed ones)
  const handleRetry = useCallback(() => {
    if (!blog) return;
    const done = completedPlatforms;
    const nextIdx = done.length < PLATFORM_ORDER.length ? done.length : 0;
    const startFrom = PLATFORM_ORDER[nextIdx];
    generateSequential(blog, startFrom, done, accRef.current);
  }, [blog, completedPlatforms, generateSequential]);

  const handleRegenerate = useCallback(() => {
    if (!blog) return;
    accRef.current = {};
    setCompletedPlatforms([]);
    generateSequential(blog);
  }, [blog, generateSequential]);

  const doneCount = completedPlatforms.length;
  const totalCount = PLATFORM_ORDER.length;

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
              onClick={handleRegenerate}
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
      {blog && (
        <div className="mb-8 rounded-2xl border border-brand-border bg-white px-6 py-4 shadow-card">
          <div className="flex items-start gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                {stage === "done" ? (
                  <>
                    <CheckCircle2 size={14} className="flex-shrink-0 text-green-500" />
                    <span className="text-xs font-semibold text-green-600">
                      Content suite complete — {totalCount} platforms
                    </span>
                  </>
                ) : stage === "generating" ? (
                  <>
                    <Loader2 size={14} className="flex-shrink-0 animate-spin text-primary" />
                    <span className="text-xs font-semibold text-primary">
                      Generating… {doneCount}/{totalCount} platforms done
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={14} className="flex-shrink-0 text-red-500" />
                    <span className="text-xs font-semibold text-red-600">
                      Stopped at {PLATFORM_META[PLATFORM_ORDER[doneCount]]?.label ?? "unknown"}
                    </span>
                  </>
                )}
              </div>
              <h2 className="font-display text-base font-bold text-brand-dark line-clamp-1">
                {blog.title}
              </h2>
              {stage === "done" && suite && (
                <p className="mt-0.5 text-xs text-brand-muted">
                  Generated {formatDate(suite.generatedAt)} · 7 platforms · Text, Image briefs & Video scripts
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generating state */}
      {stage === "generating" && (
        <div className="overflow-hidden rounded-3xl bg-hero-gradient-dark">
          <div className="flex flex-col items-center py-20 px-8">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles size={32} className="animate-pulse text-white" />
            </div>
            <h2 className="mb-2 font-display text-2xl font-bold text-white">
              Generating content…
            </h2>
            <p className="mb-10 text-sm text-white/60">
              Claude is crafting one platform at a time. Each takes ~5–10 seconds.
            </p>
            <div className="w-full max-w-xs rounded-2xl bg-white/5 p-6">
              <ProgressTracker
                currentPlatform={currentPlatform}
                completedPlatforms={completedPlatforms}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {stage === "error" && (
        <div className="flex flex-col items-center py-16 text-center">
          <AlertCircle size={48} className="mb-4 text-red-400" />
          <h2 className="mb-2 font-display text-xl font-bold text-brand-dark">
            Generation failed
          </h2>
          <p className="mb-2 max-w-sm text-sm text-brand-muted">{error}</p>
          {doneCount > 0 && (
            <p className="mb-6 text-xs text-brand-muted">
              {doneCount} of {totalCount} platforms completed —{" "}
              <span className="font-semibold text-primary">
                "Try again" will resume from where it stopped.
              </span>
            </p>
          )}
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white shadow-primary transition-colors hover:bg-primary-dark"
          >
            <RefreshCw size={15} strokeWidth={2} />
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {stage === "done" && suite && <PlatformTabs suite={suite} />}
    </div>
  );
}
