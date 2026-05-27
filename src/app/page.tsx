"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Clock, BookOpen } from "lucide-react";
import BlogPreview from "@/components/BlogPreview";
import type { BlogPost, HistorySession } from "@/lib/types";
import { formatDate, truncate, generateId } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistorySession[]>([]);
  const [generating, setGenerating] = useState(false);

  const fetchBlog = useCallback(async (url?: string) => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = url
        ? `/api/scrape?url=${encodeURIComponent(url)}`
        : "/api/scrape";
      const res = await fetch(endpoint);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch blog");
      setBlog(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch blog post.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlog();
  }, [fetchBlog]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("wce_history");
      if (stored) setHistory(JSON.parse(stored).slice(0, 3));
    } catch {}
  }, []);

  const handleGenerate = async () => {
    if (!blog) return;
    setGenerating(true);
    try {
      sessionStorage.setItem("wce_blog", JSON.stringify(blog));
      router.push("/generate");
    } catch {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Hero - dark branded banner matching Webability ad aesthetic */}
      <div className="mb-10 overflow-hidden rounded-3xl bg-hero-gradient-dark text-center animate-slide-up">
        <div className="px-8 py-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/70">
            <Sparkles size={12} />
            AI-Powered Content Repurposing
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl">
            Turn one blog post into{" "}
            <span className="text-primary">7 platform-ready</span> content suites
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/60">
            Paste your latest Webability blog post and get curated text, image
            briefs, and video scripts for every platform — in under 45 seconds.
          </p>
        </div>
      </div>

      {/* Blog preview */}
      <div className="mb-6 animate-slide-up-delay-1">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-brand-muted">
            Latest Blog Post
          </h2>
          <span className="flex items-center gap-1 text-xs text-brand-muted">
            <BookOpen size={11} />
            Auto-fetched from webability.io/blog
          </span>
        </div>
        <BlogPreview
          blog={blog}
          loading={loading}
          error={error}
          onRefresh={() => fetchBlog()}
          onManualUrl={(url) => fetchBlog(url)}
        />
      </div>

      {/* Generate button */}
      <div className="animate-slide-up-delay-2">
        <button
          onClick={handleGenerate}
          disabled={!blog || loading || generating}
          className="group relative w-full overflow-hidden rounded-2xl bg-primary px-8 py-4 font-display text-base font-bold text-white shadow-primary transition-all duration-200 hover:bg-primary-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="relative flex items-center justify-center gap-3">
            {generating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Preparing generation…
              </>
            ) : (
              <>
                <Sparkles size={18} strokeWidth={2} />
                Generate All 7 Platforms
                <ArrowRight
                  size={18}
                  strokeWidth={2}
                  className="transition-transform group-hover:translate-x-1"
                />
              </>
            )}
          </span>
          {/* Shine effect */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </button>

        {/* Platform chips */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {["LinkedIn", "X / Twitter", "Instagram", "Facebook", "Medium", "Substack", "Reddit"].map(
            (p) => (
              <span
                key={p}
                className="rounded-full border border-brand-border bg-white px-3 py-1 text-xs font-medium text-brand-muted"
              >
                {p}
              </span>
            )
          )}
        </div>
      </div>

      {/* Recent history */}
      {history.length > 0 && (
        <div className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-brand-muted">
              Recent Generations
            </h2>
            <button
              onClick={() => router.push("/history")}
              className="text-xs text-primary transition-opacity hover:opacity-75"
            >
              View all →
            </button>
          </div>
          <div className="space-y-3">
            {history.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  sessionStorage.setItem("wce_suite", JSON.stringify(session.suite));
                  router.push("/generate");
                }}
                className="w-full rounded-xl border border-brand-border bg-white p-4 text-left shadow-card transition-all hover:shadow-card-hover"
              >
                <p className="font-display text-sm font-semibold text-brand-dark line-clamp-1">
                  {truncate(session.blogTitle, 70)}
                </p>
                <div className="mt-1.5 flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-brand-muted">
                    <Clock size={11} />
                    {formatDate(session.generatedAt)}
                  </span>
                  <span className="rounded-full bg-primary-bg px-2 py-0.5 text-[10px] font-semibold capitalize text-primary">
                    {session.suite.contentPillar}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
