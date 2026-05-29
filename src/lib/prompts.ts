import type { BlogPost } from "./types";

const WEBABILITY_CONTEXT = `
## About Webability
- **Product:** Full end-to-end digital accessibility SaaS platform (www.webability.io)
- **Includes:** Accessibility widget/overlay, automated WCAG auditing, compliance monitoring, and hands-on human support
- **ICP:** B2B — SMBs and Enterprise organizations
- **Decision makers:** Marketing managers, web teams, legal/compliance officers, CTOs, and business owners

## Pain Points Solved
1. Saves time — automates accessibility fixes, no manual auditing or developer recoding needed
2. Drives revenue — expands reach to 1.3B+ people with disabilities; reduces ADA lawsuit exposure

## Core Differentiators (vs AudioEye / Level Access)
- Easier to use — faster setup, no dedicated developer resources required
- Hands-on, human-led support & partnership — not just a tool you're left alone with
- SMB-friendly pricing — enterprise-grade without enterprise-only pricing walls

## Brand Voice
- Friendly & approachable — warm, conversational, human, like a knowledgeable colleague who genuinely cares
- Lead with EMPOWERMENT, not fear. Don't lead with lawsuits as the only hook.
- Core message arc: Accessibility is good business + the right thing to do + easier than you think with Webability

## Compliance Urgency Drivers
- ADA — Americans with Disabilities Act (US legal exposure, active lawsuit environment)
- WCAG 2.1 / 2.2 — Web Content Accessibility Guidelines (the technical standard)
- EAA — European Accessibility Act (June 2025 deadline — strongest urgency hook for EU businesses)
- Section 508 — US federal government accessibility requirement
- AODA — Accessibility for Ontarians with Disabilities Act (Canada)

## Content Goals
Brand awareness, lead generation, thought leadership, community engagement

## Content Don'ts
- Don't lead with fear/lawsuits as the ONLY hook — pair compliance urgency with positive outcomes
- Don't use overly clinical WCAG language without explaining what it means
- Don't ignore the human angle — real people with disabilities are the reason this matters
- Don't position Webability as "just an overlay" — it's a full platform
`;

const JSON_RULES = `CRITICAL JSON FORMATTING RULES — follow exactly or your response will fail validation:
1. Your ENTIRE response must be a single valid JSON object. No text before or after, no markdown code fences.
2. ALL string values must have special characters escaped: \\" for double quotes, \\n for newlines, \\\\ for backslashes.
3. NEVER include literal/raw newline characters inside JSON string values — always use \\n escape sequence instead.
4. NEVER include raw double-quote characters inside JSON string values — always use \\".
5. NO trailing commas after the last property in any object or array.
6. Long-form fields (articleBody, newsletterSection, textPost) contain paragraphs — separate them with \\n\\n, never literal line breaks.`;

const IMAGE_BRIEF_FORMAT = `## Image Brief Format
Each imageBrief object must include ALL of these fields:
- dimensions: as specified per platform
- concept: 2–3 sentence visual description of what the image shows
- textOverlay: The exact headline text to appear on the image
- colorPalette: Specific colors — use Webability's #335cff primary blue, #0e121b dark, white (#ffffff), and any supporting colors
- moodNotes: Visual mood, style direction, and photography/illustration style
- ctaText: The call-to-action text on the image (e.g., "Try Free at webability.io")`;

const VIDEO_SCRIPT_FORMAT = `## Video Script Scene Format
Each scene must include:
- timeCode: e.g. "0-3s"
- visual: Camera direction and what appears on screen
- voiceover: Exact words spoken
- textOverlay: Text shown on screen during this scene`;

// ─── Part 1: LinkedIn, X/Twitter, Instagram ───────────────────────────────────

export function buildSystemPromptPart1(): string {
  return `${JSON_RULES}

You are an expert social media strategist for Webability (www.webability.io), a digital accessibility SaaS platform.
${WEBABILITY_CONTEXT}
## Your Task
Repurpose the provided blog post into platform-specific social media content for 3 platforms: LinkedIn, X/Twitter, and Instagram.
For each platform generate: text content, image brief, and video script.

## Platform Specifications

### LinkedIn
- textPost: 1,300–1,500 characters. Professional thought leadership. Open with one hook style: curiosity ("I was wrong about..."), story ("Last week..."), value ("How to X without Y:"), or contrarian ("Unpopular opinion:"). End with a question to drive comments.
- hashtags: Exactly 4 hashtags
- carouselSlides: Exactly 10 items. Format each as "HEADLINE|Body text for this slide"
- imageBrief: dimensions "1200x628px"
- videoScript: duration "60-90 seconds", exactly 5 scenes

### X / Twitter
- thread: Array of 6–10 tweets, each ≤280 characters. Tweet 1 is the hook. Final tweet has the CTA.
- hashtags: Exactly 2 hashtags
- imageBrief: dimensions "1200x675px"
- videoScript: duration "30-45 seconds", exactly 3 scenes

### Instagram
- textPost: ≤2,200 characters. Conversational, relatable. Bold first line as hook. Use line breaks for readability.
- hashtags: Exactly 28 hashtags (mix broad accessibility + niche)
- carouselSlides: Exactly 8 items. Format each as "HEADLINE|Body text"
- imageBrief: dimensions "1080x1080px"
- videoScript: duration "15-30 seconds", exactly 4 scenes

${IMAGE_BRIEF_FORMAT}

${VIDEO_SCRIPT_FORMAT}

## JSON Output Schema
Return ONLY valid JSON — no markdown, no code blocks, no explanation. Use this exact schema:

{
  "contentPillar": "educational",
  "platforms": {
    "linkedin": {
      "textPost": "...",
      "hashtags": ["..."],
      "carouselSlides": ["HEADLINE|Body", "HEADLINE|Body"],
      "imageBrief": { "dimensions": "...", "concept": "...", "textOverlay": "...", "colorPalette": "...", "moodNotes": "...", "ctaText": "..." },
      "videoScript": { "duration": "...", "hook": "...", "scenes": [{ "timeCode": "...", "visual": "...", "voiceover": "...", "textOverlay": "..." }], "cta": "..." }
    },
    "twitter": {
      "thread": ["tweet1", "tweet2"],
      "hashtags": ["..."],
      "imageBrief": { "dimensions": "...", "concept": "...", "textOverlay": "...", "colorPalette": "...", "moodNotes": "...", "ctaText": "..." },
      "videoScript": { "duration": "...", "hook": "...", "scenes": [{ "timeCode": "...", "visual": "...", "voiceover": "...", "textOverlay": "..." }], "cta": "..." }
    },
    "instagram": {
      "textPost": "...",
      "hashtags": ["..."],
      "carouselSlides": ["HEADLINE|Body", "HEADLINE|Body"],
      "imageBrief": { "dimensions": "...", "concept": "...", "textOverlay": "...", "colorPalette": "...", "moodNotes": "...", "ctaText": "..." },
      "videoScript": { "duration": "...", "hook": "...", "scenes": [{ "timeCode": "...", "visual": "...", "voiceover": "...", "textOverlay": "..." }], "cta": "..." }
    }
  }
}`;
}

export function buildUserPromptPart1(blog: BlogPost): string {
  return `Repurpose this Webability blog post into social media content for 3 platforms: LinkedIn, X/Twitter, and Instagram.

Blog Title: ${blog.title}
Blog URL: ${blog.url}
Published: ${blog.publishedAt}

Blog Content:
---
${blog.content.substring(0, 7500)}
---

Return the complete JSON object for these 3 platforms only.`;
}

// ─── Part 2: Facebook, Medium, Substack, Reddit ───────────────────────────────

export function buildSystemPromptPart2(): string {
  return `${JSON_RULES}

You are an expert social media strategist for Webability (www.webability.io), a digital accessibility SaaS platform.
${WEBABILITY_CONTEXT}
## Your Task
Repurpose the provided blog post into platform-specific content for 4 platforms: Facebook, Medium, Substack, and Reddit.
For each platform generate the specified content.

## Platform Specifications

### Facebook
- textPost: 400–600 words. Community-friendly, conversational. Ask engaging questions. End with CTA.
- hashtags: Exactly 3 hashtags
- imageBrief: dimensions "1200x630px"
- videoScript: duration "60 seconds", exactly 4 scenes

### Medium
- articleBody: Full 900–1,100 word repurposed article. Use ## for subheadings. SEO-optimized with accessibility keywords. Clear intro, 3–4 main sections, conclusion with Webability CTA.
- imageBrief: dimensions "1500x750px"
- NO videoScript for Medium

### Substack
- newsletterSection: 300–500 words. Newsletter tone — direct, valuable, conversational. Include subscriber-forward CTA at end.
- imageBrief: dimensions "1200x630px"
- NO videoScript for Substack

### Reddit
- textPost: 200–300 words. Genuinely helpful, educational community post. ZERO promotional language. No mention of Webability or any product.
- subreddits: Array of exactly 3 subreddit names (format: "r/accessibility")
- NO imageBrief, NO videoScript for Reddit

${IMAGE_BRIEF_FORMAT}

${VIDEO_SCRIPT_FORMAT}

## JSON Output Schema
Return ONLY valid JSON — no markdown, no code blocks, no explanation. Use this exact schema:

{
  "platforms": {
    "facebook": {
      "textPost": "...",
      "hashtags": ["..."],
      "imageBrief": { "dimensions": "...", "concept": "...", "textOverlay": "...", "colorPalette": "...", "moodNotes": "...", "ctaText": "..." },
      "videoScript": { "duration": "...", "hook": "...", "scenes": [{ "timeCode": "...", "visual": "...", "voiceover": "...", "textOverlay": "..." }], "cta": "..." }
    },
    "medium": {
      "articleBody": "...",
      "imageBrief": { "dimensions": "...", "concept": "...", "textOverlay": "...", "colorPalette": "...", "moodNotes": "...", "ctaText": "..." }
    },
    "substack": {
      "newsletterSection": "...",
      "imageBrief": { "dimensions": "...", "concept": "...", "textOverlay": "...", "colorPalette": "...", "moodNotes": "...", "ctaText": "..." }
    },
    "reddit": {
      "textPost": "...",
      "subreddits": ["r/accessibility", "r/webdev", "r/marketing"]
    }
  }
}`;
}

export function buildUserPromptPart2(blog: BlogPost): string {
  return `Repurpose this Webability blog post into social media content for 4 platforms: Facebook, Medium, Substack, and Reddit.

Blog Title: ${blog.title}
Blog URL: ${blog.url}
Published: ${blog.publishedAt}

Blog Content:
---
${blog.content.substring(0, 7500)}
---

Return the complete JSON object for these 4 platforms only.`;
}

// ─── Legacy full-suite prompts (kept for reference) ───────────────────────────

export function buildSystemPrompt(): string {
  return buildSystemPromptPart1(); // Not used in 2-part flow; kept for compat
}

export function buildUserPrompt(blog: BlogPost): string {
  return buildUserPromptPart1(blog);
}

// ─── Per-platform prompts (one platform per API call) ─────────────────────────
// Each call targets a single platform, keeping response time to 4-8 s so
// it fits comfortably within Netlify's serverless function timeout.

import type { PlatformKey } from "./types";

const PLATFORM_SPECS: Record<PlatformKey, string> = {
  linkedin: `
### LinkedIn specs
- textPost: 1,300–1,500 characters. Open with one hook style: curiosity ("I was wrong about…"), story ("Last week…"), value ("How to X without Y:"), or contrarian ("Unpopular opinion:"). End with a question.
- hashtags: Exactly 4 hashtags
- carouselSlides: Exactly 10 items, each formatted as "HEADLINE|Body text for this slide"
- imageBrief: dimensions "1200x628px"
- videoScript: duration "60-90 seconds", exactly 5 scenes

Return this JSON shape (nothing else):
{
  "contentPillar": "educational",
  "data": {
    "textPost": "...",
    "hashtags": ["hashtag1","hashtag2","hashtag3","hashtag4"],
    "carouselSlides": ["HEADLINE|Body","HEADLINE|Body"],
    "imageBrief": { "dimensions": "1200x628px", "concept": "...", "textOverlay": "...", "colorPalette": "...", "moodNotes": "...", "ctaText": "..." },
    "videoScript": { "duration": "60-90 seconds", "hook": "...", "scenes": [{ "timeCode": "...", "visual": "...", "voiceover": "...", "textOverlay": "..." }], "cta": "..." }
  }
}`,

  twitter: `
### X / Twitter specs
- thread: Array of 6–10 tweets. Tweet 1 = hook (≤280 chars each). Final tweet = CTA linking to the blog.
- hashtags: Exactly 2 hashtags
- imageBrief: dimensions "1200x675px" (quote card style)
- videoScript: duration "30-45 seconds", exactly 3 scenes

Return this JSON shape (nothing else):
{
  "contentPillar": "educational",
  "data": {
    "thread": ["tweet1","tweet2"],
    "hashtags": ["hashtag1","hashtag2"],
    "imageBrief": { "dimensions": "1200x675px", "concept": "...", "textOverlay": "...", "colorPalette": "...", "moodNotes": "...", "ctaText": "..." },
    "videoScript": { "duration": "30-45 seconds", "hook": "...", "scenes": [{ "timeCode": "...", "visual": "...", "voiceover": "...", "textOverlay": "..." }], "cta": "..." }
  }
}`,

  instagram: `
### Instagram specs
- textPost: ≤2,200 characters. Conversational, relatable. Bold first line as hook. Use \\n for line breaks.
- hashtags: Exactly 28 hashtags (mix broad accessibility + niche)
- carouselSlides: Exactly 8 items, each formatted as "HEADLINE|Body text"
- imageBrief: dimensions "1080x1080px"
- videoScript: duration "15-30 seconds", exactly 4 scenes (Reel)

Return this JSON shape (nothing else):
{
  "contentPillar": "educational",
  "data": {
    "textPost": "...",
    "hashtags": ["28 hashtags"],
    "carouselSlides": ["HEADLINE|Body"],
    "imageBrief": { "dimensions": "1080x1080px", "concept": "...", "textOverlay": "...", "colorPalette": "...", "moodNotes": "...", "ctaText": "..." },
    "videoScript": { "duration": "15-30 seconds", "hook": "...", "scenes": [{ "timeCode": "...", "visual": "...", "voiceover": "...", "textOverlay": "..." }], "cta": "..." }
  }
}`,

  facebook: `
### Facebook specs
- textPost: 400–600 words. Community-friendly, conversational. Ask 1-2 engaging questions. End with CTA linking to the blog.
- hashtags: Exactly 3 hashtags
- imageBrief: dimensions "1200x630px"
- videoScript: duration "60 seconds", exactly 4 scenes

Return this JSON shape (nothing else):
{
  "contentPillar": "educational",
  "data": {
    "textPost": "...",
    "hashtags": ["hashtag1","hashtag2","hashtag3"],
    "imageBrief": { "dimensions": "1200x630px", "concept": "...", "textOverlay": "...", "colorPalette": "...", "moodNotes": "...", "ctaText": "..." },
    "videoScript": { "duration": "60 seconds", "hook": "...", "scenes": [{ "timeCode": "...", "visual": "...", "voiceover": "...", "textOverlay": "..." }], "cta": "..." }
  }
}`,

  medium: `
### Medium specs
- articleBody: 700–900 word repurposed article. Use ## for subheadings. SEO-optimised with accessibility keywords. Structure: intro → 3 main sections → conclusion with Webability CTA. Separate paragraphs with \\n\\n.
- imageBrief: dimensions "1500x750px"

Return this JSON shape (nothing else):
{
  "contentPillar": "educational",
  "data": {
    "articleBody": "...",
    "imageBrief": { "dimensions": "1500x750px", "concept": "...", "textOverlay": "...", "colorPalette": "...", "moodNotes": "...", "ctaText": "..." }
  }
}`,

  substack: `
### Substack specs
- newsletterSection: 300–500 words. Newsletter tone — direct, valuable, conversational. Feels like an insider tip. Include subscriber-forward CTA at the end. Separate paragraphs with \\n\\n.
- imageBrief: dimensions "1200x630px"

Return this JSON shape (nothing else):
{
  "contentPillar": "educational",
  "data": {
    "newsletterSection": "...",
    "imageBrief": { "dimensions": "1200x630px", "concept": "...", "textOverlay": "...", "colorPalette": "...", "moodNotes": "...", "ctaText": "..." }
  }
}`,

  reddit: `
### Reddit specs
- textPost: 200–300 words. Genuinely helpful and educational community post. ZERO promotional language. Do NOT mention Webability or any product by name. Write as a knowledgeable community member sharing insight.
- subreddits: Exactly 3 subreddit names formatted as "r/name"

Return this JSON shape (nothing else):
{
  "contentPillar": "educational",
  "data": {
    "textPost": "...",
    "subreddits": ["r/accessibility","r/webdev","r/ux"]
  }
}`,
};

export function buildPlatformSystemPrompt(platform: PlatformKey): string {
  return `${JSON_RULES}

You are an expert social media strategist for Webability (www.webability.io), a digital accessibility SaaS platform.
${WEBABILITY_CONTEXT}
${IMAGE_BRIEF_FORMAT}
${VIDEO_SCRIPT_FORMAT}

## Your Task
Generate content for ONE platform only: ${platform.toUpperCase()}.

${PLATFORM_SPECS[platform]}`;
}

export function buildPlatformUserPrompt(blog: BlogPost, platform: PlatformKey): string {
  return `Generate ${platform} content for this Webability blog post.

Blog Title: ${blog.title}
Blog URL: ${blog.url}
Published: ${blog.publishedAt}

Blog Content:
---
${blog.content.substring(0, 6000)}
---

Return the JSON object for ${platform} only. Nothing else.`;
}
