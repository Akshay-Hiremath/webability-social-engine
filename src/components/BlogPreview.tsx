"use client";

import { useState } from "react";
import { Calendar, Clock, RefreshCw, ExternalLink, Link2, AlertCircle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";

interface BlogPreviewProps {
  blog: BlogPost | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onManualUrl: (url: string) => void;
}

export default function BlogPreview({
  blog,
  loading,
  error,
  onRefresh,
  onManualUrl,
}: BlogPreviewProps) {
  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState("");

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.includes("webability.io/blog/")) {
      onManualUrl(manualInput.trim());
      setShowManual(false);
      setManualInput("");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-card">
        <div className="flex items-start gap-4">
          <div className="skeleton h-20 w-28 flex-shrink-0 rounded-xl" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-5 w-3/4 rounded-lg" />
            <div className="skeleton h-4 w-full rounded-lg" />
            <div className="skeleton h-4 w-2/3 rounded-lg" />
            <div className="flex gap-3">
              <div className="skeleton h-4 w-24 rounded-lg" />
              <div className="skeleton h-4 w-20 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <div className="mt-4 space-y-3">
              {showManual ? (
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    type="url"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="https://www.webability.io/blog/post-slug"
                    className="flex-1 rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-dark placeholder:text-brand-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                  >
                    Fetch
                  </button>
                </form>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={onRefresh}
                    className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-brand-dark shadow-sm transition-colors hover:bg-gray-50"
                  >
                    <RefreshCw size={13} />
                    Retry
                  </button>
                  <button
                    onClick={() => setShowManual(true)}
                    className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-brand-dark shadow-sm transition-colors hover:bg-gray-50"
                  >
                    <Link2 size={13} />
                    Paste URL
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) return null;

  return (
    <div className="group rounded-2xl border border-brand-border bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex items-start gap-5">
        {/* Thumbnail */}
        <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-xl bg-hero-gradient-dark">
          {blog.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blog.imageUrl}
              alt={blog.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-display text-3xl font-extrabold text-white/30">W</span>
            </div>
          )}
          <div className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Latest
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base font-bold leading-snug text-brand-dark line-clamp-2">
            {blog.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-brand-muted line-clamp-2">
            {blog.excerpt}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-brand-muted">
              <Calendar size={12} strokeWidth={2} />
              {formatDate(blog.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-brand-muted">
              <Clock size={12} strokeWidth={2} />
              {blog.readTime} min read
            </span>
            <a
              href={blog.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary transition-opacity hover:opacity-75"
            >
              View post
              <ExternalLink size={10} />
            </a>
          </div>
        </div>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          className="flex-shrink-0 rounded-lg p-2 text-brand-muted transition-colors hover:bg-primary-bg hover:text-primary"
          title="Fetch latest post"
        >
          <RefreshCw size={15} strokeWidth={2} />
        </button>
      </div>

      {/* Manual URL toggle */}
      {!showManual ? (
        <button
          onClick={() => setShowManual(true)}
          className="mt-4 flex items-center gap-1.5 text-xs text-brand-muted transition-colors hover:text-primary"
        >
          <Link2 size={11} />
          Use a different blog URL
        </button>
      ) : (
        <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
          <input
            type="url"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="https://www.webability.io/blog/post-slug"
            className="flex-1 rounded-lg border border-brand-border bg-gray-50 px-3 py-2 text-sm text-brand-dark placeholder:text-brand-muted focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
          >
            Fetch
          </button>
          <button
            type="button"
            onClick={() => setShowManual(false)}
            className="rounded-lg px-3 py-2 text-sm text-brand-muted transition-colors hover:text-brand-dark"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
