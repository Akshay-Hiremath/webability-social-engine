"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Trash2, ArrowRight, BookOpen, Inbox } from "lucide-react";
import type { HistorySession } from "@/lib/types";
import { formatDate, truncate, PLATFORM_ORDER, PLATFORM_META } from "@/lib/utils";

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistorySession[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("wce_history");
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  const handleOpen = (session: HistorySession) => {
    sessionStorage.setItem("wce_suite", JSON.stringify(session.suite));
    router.push("/generate");
  };

  const handleDelete = (id: string) => {
    const updated = history.filter((s) => s.id !== id);
    setHistory(updated);
    localStorage.setItem("wce_history", JSON.stringify(updated));
  };

  const handleClearAll = () => {
    setHistory([]);
    localStorage.removeItem("wce_history");
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-brand-dark">History</h1>
          <p className="mt-1 text-sm text-brand-muted">
            Your past content generations — click any to view the full suite.
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            <Trash2 size={13} strokeWidth={2} />
            Clear all
          </button>
        )}
      </div>

      {/* Empty state */}
      {history.length === 0 && (
        <div className="flex flex-col items-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-bg">
            <Inbox size={28} className="text-primary/50" />
          </div>
          <h2 className="mb-2 font-display text-xl font-bold text-brand-dark">No history yet</h2>
          <p className="mb-6 text-sm text-brand-muted">
            Generate your first content suite and it will appear here.
          </p>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white shadow-primary transition-colors hover:bg-primary-dark"
          >
            Generate content
            <ArrowRight size={15} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* History list */}
      {history.length > 0 && (
        <div className="space-y-4">
          {history.map((session) => (
            <div
              key={session.id}
              className="group rounded-2xl border border-brand-border bg-white p-5 shadow-card transition-all hover:shadow-card-hover"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Blog title */}
                  <h3 className="font-display text-base font-bold text-brand-dark line-clamp-1">
                    {truncate(session.blogTitle, 80)}
                  </h3>

                  {/* Meta */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs text-brand-muted">
                      <Clock size={11} strokeWidth={2} />
                      {formatDate(session.generatedAt)}
                    </span>
                    <a
                      href={session.blogUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary transition-opacity hover:opacity-75"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <BookOpen size={10} />
                      View post
                    </a>
                    <span className="rounded-full bg-primary-bg px-2 py-0.5 text-[10px] font-semibold capitalize text-primary">
                      {session.suite.contentPillar}
                    </span>
                  </div>

                  {/* Platform chips */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {PLATFORM_ORDER.map((key) => {
                      const m = PLATFORM_META[key];
                      return (
                        <span
                          key={key}
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: m.bgColor, color: m.color }}
                        >
                          {m.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 flex-col items-end gap-2">
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="rounded-lg p-1.5 text-brand-muted opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                  <button
                    onClick={() => handleOpen(session)}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-primary transition-colors hover:bg-primary-dark"
                  >
                    View suite
                    <ArrowRight size={12} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
