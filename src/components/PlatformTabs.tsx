"use client";

import { useState } from "react";
import { cn, PLATFORM_META, PLATFORM_ORDER } from "@/lib/utils";
import type { GeneratedSuite, PlatformKey } from "@/lib/types";
import {
  ContentCard,
  TextContent,
  ThreadContent,
  HashtagsContent,
  CarouselContent,
  ImageBriefContent,
  VideoScriptContent,
} from "./ContentCard";

interface PlatformTabsProps {
  suite: GeneratedSuite;
}

// Platform icon SVGs (inline for no extra deps)
const PLATFORM_ICONS: Record<PlatformKey, React.ReactNode> = {
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  medium: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
    </svg>
  ),
  substack: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
    </svg>
  ),
  reddit: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  ),
};

export default function PlatformTabs({ suite }: PlatformTabsProps) {
  const [activeTab, setActiveTab] = useState<PlatformKey>("linkedin");

  const meta = PLATFORM_META[activeTab];
  const platform = suite.platforms[activeTab];

  return (
    <div className="animate-fade-in">
      {/* Tab bar */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-brand-border bg-white p-2 shadow-card">
        {PLATFORM_ORDER.map((key) => {
          const m = PLATFORM_META[key];
          const isActive = key === activeTab;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex flex-1 min-w-[80px] flex-col items-center gap-1.5 rounded-xl px-3 py-3 transition-all duration-200",
                isActive
                  ? "shadow-sm text-white"
                  : "text-brand-muted hover:bg-gray-50"
              )}
              style={isActive ? { backgroundColor: m.color } : {}}
            >
              <span style={{ color: isActive ? "white" : m.color }}>
                {PLATFORM_ICONS[key]}
              </span>
              <span className="text-[11px] font-semibold leading-none whitespace-nowrap">
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Platform description */}
      <div
        className="mb-5 flex items-center gap-3 rounded-xl px-4 py-3"
        style={{ backgroundColor: meta.bgColor }}
      >
        <span style={{ color: meta.color }}>{PLATFORM_ICONS[activeTab]}</span>
        <div>
          <p className="font-display text-sm font-bold text-brand-dark">{meta.label}</p>
          <p className="text-xs text-brand-muted">{meta.description}</p>
        </div>
      </div>

      {/* Content sections */}
      <div className="space-y-4">
        {/* LinkedIn */}
        {activeTab === "linkedin" && platform && "textPost" in platform && (
          <>
            <ContentCard title="Post Copy" icon="text" copyText={(platform as { textPost: string }).textPost} accentColor={meta.color}>
              <TextContent text={(platform as { textPost: string }).textPost} />
            </ContentCard>
            {"hashtags" in platform && (platform as { hashtags?: string[] }).hashtags && (
              <ContentCard title="Hashtags" icon="text" accentColor={meta.color}>
                <HashtagsContent hashtags={(platform as { hashtags: string[] }).hashtags} />
              </ContentCard>
            )}
            {"carouselSlides" in platform && (platform as { carouselSlides?: string[] }).carouselSlides && (
              <ContentCard title="Carousel Slides (10 slides)" icon="image" accentColor={meta.color} defaultExpanded={false}>
                <CarouselContent slides={(platform as { carouselSlides: string[] }).carouselSlides} />
              </ContentCard>
            )}
            {"imageBrief" in platform && (platform as { imageBrief?: object }).imageBrief && (
              <ContentCard title="Image Brief" icon="image" accentColor={meta.color} defaultExpanded={false}>
                <ImageBriefContent brief={(platform as { imageBrief: Parameters<typeof ImageBriefContent>[0]["brief"] }).imageBrief} />
              </ContentCard>
            )}
            {"videoScript" in platform && (platform as { videoScript?: object }).videoScript && (
              <ContentCard title="Video Script" icon="video" accentColor={meta.color} defaultExpanded={false}>
                <VideoScriptContent script={(platform as { videoScript: Parameters<typeof VideoScriptContent>[0]["script"] }).videoScript} />
              </ContentCard>
            )}
          </>
        )}

        {/* Twitter */}
        {activeTab === "twitter" && platform && "thread" in platform && (
          <>
            <ContentCard
              title={`Thread (${(platform as { thread: string[] }).thread.length} tweets)`}
              icon="thread"
              copyText={(platform as { thread: string[] }).thread.join("\n\n---\n\n")}
              accentColor={meta.color}
            >
              <ThreadContent tweets={(platform as { thread: string[] }).thread} />
            </ContentCard>
            {"hashtags" in platform && (platform as { hashtags?: string[] }).hashtags && (
              <ContentCard title="Hashtags" icon="text" accentColor={meta.color}>
                <HashtagsContent hashtags={(platform as { hashtags: string[] }).hashtags} />
              </ContentCard>
            )}
            {"imageBrief" in platform && (platform as { imageBrief?: object }).imageBrief && (
              <ContentCard title="Image Brief (Quote Card)" icon="image" accentColor={meta.color} defaultExpanded={false}>
                <ImageBriefContent brief={(platform as { imageBrief: Parameters<typeof ImageBriefContent>[0]["brief"] }).imageBrief} />
              </ContentCard>
            )}
            {"videoScript" in platform && (platform as { videoScript?: object }).videoScript && (
              <ContentCard title="Video Script" icon="video" accentColor={meta.color} defaultExpanded={false}>
                <VideoScriptContent script={(platform as { videoScript: Parameters<typeof VideoScriptContent>[0]["script"] }).videoScript} />
              </ContentCard>
            )}
          </>
        )}

        {/* Instagram */}
        {activeTab === "instagram" && platform && "textPost" in platform && (
          <>
            <ContentCard title="Caption" icon="text" copyText={(platform as { textPost: string }).textPost} accentColor={meta.color}>
              <TextContent text={(platform as { textPost: string }).textPost} />
            </ContentCard>
            {"hashtags" in platform && (platform as { hashtags?: string[] }).hashtags && (
              <ContentCard title={`Hashtags (${(platform as { hashtags: string[] }).hashtags.length})`} icon="text" accentColor={meta.color}>
                <HashtagsContent hashtags={(platform as { hashtags: string[] }).hashtags} />
              </ContentCard>
            )}
            {"carouselSlides" in platform && (platform as { carouselSlides?: string[] }).carouselSlides && (
              <ContentCard title="Carousel Slides (8 slides)" icon="image" accentColor={meta.color} defaultExpanded={false}>
                <CarouselContent slides={(platform as { carouselSlides: string[] }).carouselSlides} />
              </ContentCard>
            )}
            {"imageBrief" in platform && (platform as { imageBrief?: object }).imageBrief && (
              <ContentCard title="Image Brief" icon="image" accentColor={meta.color} defaultExpanded={false}>
                <ImageBriefContent brief={(platform as { imageBrief: Parameters<typeof ImageBriefContent>[0]["brief"] }).imageBrief} />
              </ContentCard>
            )}
            {"videoScript" in platform && (platform as { videoScript?: object }).videoScript && (
              <ContentCard title="Reel Script" icon="video" accentColor={meta.color} defaultExpanded={false}>
                <VideoScriptContent script={(platform as { videoScript: Parameters<typeof VideoScriptContent>[0]["script"] }).videoScript} />
              </ContentCard>
            )}
          </>
        )}

        {/* Facebook */}
        {activeTab === "facebook" && platform && "textPost" in platform && (
          <>
            <ContentCard title="Post Copy" icon="text" copyText={(platform as { textPost: string }).textPost} accentColor={meta.color}>
              <TextContent text={(platform as { textPost: string }).textPost} />
            </ContentCard>
            {"hashtags" in platform && (platform as { hashtags?: string[] }).hashtags && (
              <ContentCard title="Hashtags" icon="text" accentColor={meta.color}>
                <HashtagsContent hashtags={(platform as { hashtags: string[] }).hashtags} />
              </ContentCard>
            )}
            {"imageBrief" in platform && (platform as { imageBrief?: object }).imageBrief && (
              <ContentCard title="Image Brief" icon="image" accentColor={meta.color} defaultExpanded={false}>
                <ImageBriefContent brief={(platform as { imageBrief: Parameters<typeof ImageBriefContent>[0]["brief"] }).imageBrief} />
              </ContentCard>
            )}
            {"videoScript" in platform && (platform as { videoScript?: object }).videoScript && (
              <ContentCard title="Video Script" icon="video" accentColor={meta.color} defaultExpanded={false}>
                <VideoScriptContent script={(platform as { videoScript: Parameters<typeof VideoScriptContent>[0]["script"] }).videoScript} />
              </ContentCard>
            )}
          </>
        )}

        {/* Medium */}
        {activeTab === "medium" && platform && "articleBody" in platform && (
          <>
            <ContentCard title="Full Article" icon="article" copyText={(platform as { articleBody: string }).articleBody} accentColor={meta.color}>
              <TextContent text={(platform as { articleBody: string }).articleBody} />
            </ContentCard>
            {"imageBrief" in platform && (platform as { imageBrief?: object }).imageBrief && (
              <ContentCard title="Header Image Brief" icon="image" accentColor={meta.color} defaultExpanded={false}>
                <ImageBriefContent brief={(platform as { imageBrief: Parameters<typeof ImageBriefContent>[0]["brief"] }).imageBrief} />
              </ContentCard>
            )}
          </>
        )}

        {/* Substack */}
        {activeTab === "substack" && platform && "newsletterSection" in platform && (
          <>
            <ContentCard title="Newsletter Section" icon="text" copyText={(platform as { newsletterSection: string }).newsletterSection} accentColor={meta.color}>
              <TextContent text={(platform as { newsletterSection: string }).newsletterSection} />
            </ContentCard>
            {"imageBrief" in platform && (platform as { imageBrief?: object }).imageBrief && (
              <ContentCard title="Header Image Brief" icon="image" accentColor={meta.color} defaultExpanded={false}>
                <ImageBriefContent brief={(platform as { imageBrief: Parameters<typeof ImageBriefContent>[0]["brief"] }).imageBrief} />
              </ContentCard>
            )}
          </>
        )}

        {/* Reddit */}
        {activeTab === "reddit" && platform && "textPost" in platform && (
          <>
            <ContentCard title="Community Post" icon="text" copyText={(platform as { textPost: string }).textPost} accentColor={meta.color}>
              <TextContent text={(platform as { textPost: string }).textPost} />
            </ContentCard>
            {"subreddits" in platform && (platform as { subreddits?: string[] }).subreddits && (
              <ContentCard title="Suggested Subreddits" icon="text" accentColor={meta.color}>
                <div className="flex flex-wrap gap-2">
                  {(platform as { subreddits: string[] }).subreddits.map((sub, i) => (
                    <span key={i} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-[#FF4500]">
                      {sub}
                    </span>
                  ))}
                </div>
              </ContentCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}
