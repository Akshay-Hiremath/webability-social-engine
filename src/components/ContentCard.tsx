"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp, Image, Video, FileText, MessageSquare } from "lucide-react";
import { cn, parseCarouselSlide } from "@/lib/utils";
import type { ImageBrief, VideoScript } from "@/lib/types";

interface ContentCardProps {
  title: string;
  icon: "text" | "image" | "video" | "thread" | "article";
  children: React.ReactNode;
  copyText?: string;
  defaultExpanded?: boolean;
  accentColor?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
        copied
          ? "bg-green-50 text-green-600"
          : "bg-gray-50 text-brand-muted hover:bg-primary-bg hover:text-primary"
      )}
    >
      {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} strokeWidth={2} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

const ICON_MAP = {
  text: FileText,
  image: Image,
  video: Video,
  thread: MessageSquare,
  article: FileText,
};

export function ContentCard({
  title,
  icon,
  children,
  copyText,
  defaultExpanded = true,
  accentColor,
}: ContentCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const Icon = ICON_MAP[icon];

  return (
    <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
      <div
        className="flex cursor-pointer items-center justify-between px-5 py-3.5 transition-colors hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: accentColor ? `${accentColor}18` : "#eef2ff" }}
          >
            <Icon
              size={14}
              strokeWidth={2}
              style={{ color: accentColor || "#335cff" }}
            />
          </div>
          <span className="font-display text-sm font-semibold text-brand-dark">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {copyText && expanded && (
            <div onClick={(e) => e.stopPropagation()}>
              <CopyButton text={copyText} />
            </div>
          )}
          <div className="text-brand-muted">
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-brand-border px-5 py-4">{children}</div>
      )}
    </div>
  );
}

// Text post card content
export function TextContent({ text }: { text: string }) {
  return (
    <p className="prose-content text-sm leading-relaxed text-brand-dark">{text}</p>
  );
}

// Thread (X/Twitter) card content
export function ThreadContent({ tweets }: { tweets: string[] }) {
  return (
    <div className="space-y-3">
      {tweets.map((tweet, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white">
              {i + 1}
            </div>
            {i < tweets.length - 1 && (
              <div className="mt-1 w-px flex-1 bg-gray-200" />
            )}
          </div>
          <div className="flex-1 pb-1">
            <p className="text-sm leading-relaxed text-brand-dark">{tweet}</p>
            <p className="mt-1 text-[11px] text-brand-muted">
              {tweet.length}/280 chars
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Hashtags content
export function HashtagsContent({ hashtags }: { hashtags: string[] }) {
  const [copied, setCopied] = useState(false);
  const hashtagText = hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ");

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {hashtags.map((tag, i) => (
          <span
            key={i}
            className="rounded-full bg-primary-bg px-3 py-1 text-xs font-medium text-primary"
          >
            {tag.startsWith("#") ? tag : `#${tag}`}
          </span>
        ))}
      </div>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(hashtagText);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className={cn(
          "mt-3 flex items-center gap-1.5 text-xs font-medium transition-colors",
          copied ? "text-green-600" : "text-brand-muted hover:text-primary"
        )}
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
        {copied ? "Copied all hashtags!" : "Copy all hashtags"}
      </button>
    </div>
  );
}

// Carousel slides content
export function CarouselContent({ slides }: { slides: string[] }) {
  return (
    <div className="space-y-3">
      {slides.map((slide, i) => {
        const { headline, body } = parseCarouselSlide(slide);
        return (
          <div key={i} className="rounded-xl bg-gray-50 p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {i + 1}
              </span>
              <span className="font-display text-xs font-bold uppercase tracking-wider text-primary">
                Slide {i + 1}
              </span>
            </div>
            {headline && (
              <p className="font-display text-sm font-bold text-brand-dark">{headline}</p>
            )}
            {body && (
              <p className="mt-1 text-xs leading-relaxed text-brand-muted">{body}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Image brief content
export function ImageBriefContent({ brief }: { brief: ImageBrief }) {
  const fields = [
    { label: "Dimensions", value: brief.dimensions },
    { label: "Visual Concept", value: brief.concept },
    { label: "Text Overlay", value: brief.textOverlay },
    { label: "Color Palette", value: brief.colorPalette },
    { label: "Mood & Style", value: brief.moodNotes },
    ...(brief.ctaText ? [{ label: "CTA Text", value: brief.ctaText }] : []),
  ];

  return (
    <div className="space-y-3">
      {fields.map(({ label, value }) => (
        <div key={label} className="flex gap-3">
          <span className="w-28 flex-shrink-0 text-xs font-semibold text-brand-muted">
            {label}
          </span>
          <span className="text-xs leading-relaxed text-brand-dark">{value}</span>
        </div>
      ))}
    </div>
  );
}

// Video script content
export function VideoScriptContent({ script }: { script: VideoScript }) {
  const scriptText = `HOOK: ${script.hook}\n\n${script.scenes
    .map(
      (s) =>
        `[${s.timeCode}]\nVisual: ${s.visual}\nVoiceover: ${s.voiceover}\nText: ${s.textOverlay}`
    )
    .join("\n\n")}\n\nCTA: ${script.cta}`;

  return (
    <div className="space-y-4">
      {/* Duration badge */}
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-primary-bg px-3 py-1 text-xs font-semibold text-primary">
          {script.duration}
        </span>
        <CopyButton text={scriptText} />
      </div>

      {/* Hook */}
      <div className="rounded-xl border-l-4 border-primary bg-primary-bg/40 p-4">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">Hook</p>
        <p className="text-sm font-medium text-brand-dark">{script.hook}</p>
      </div>

      {/* Scenes */}
      <div className="space-y-3">
        {script.scenes.map((scene, i) => (
          <div key={i} className="rounded-xl bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-xs font-bold text-brand-dark">
                Scene {i + 1}
              </span>
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-brand-muted">
                {scene.timeCode}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
              <div>
                <p className="mb-1 font-semibold uppercase tracking-wider text-brand-muted" style={{ fontSize: "10px" }}>Visual</p>
                <p className="text-brand-dark">{scene.visual}</p>
              </div>
              <div>
                <p className="mb-1 font-semibold uppercase tracking-wider text-brand-muted" style={{ fontSize: "10px" }}>Voiceover</p>
                <p className="text-brand-dark">{scene.voiceover}</p>
              </div>
              <div>
                <p className="mb-1 font-semibold uppercase tracking-wider text-brand-muted" style={{ fontSize: "10px" }}>Text on Screen</p>
                <p className="text-brand-dark">{scene.textOverlay}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="rounded-xl border border-dashed border-primary/30 bg-primary-bg/30 p-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">CTA</p>
        <p className="mt-1 text-sm font-medium text-brand-dark">{script.cta}</p>
      </div>
    </div>
  );
}
