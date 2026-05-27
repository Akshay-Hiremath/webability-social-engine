# Webability Social Content Engine

Turn one blog post into a full social media content suite for 7 platforms — in under 90 seconds.

Built with Next.js 16 + Claude AI (Sonnet 4.6). Designed for [Webability](https://www.webability.io).

## What it does

Paste any Webability blog URL (or use the auto-fetched latest post) and generate platform-ready content for:

- **LinkedIn** — Thought leadership post + 10-slide carousel + image brief + video script
- **X / Twitter** — 6–10 tweet thread + quote card + video script
- **Instagram** — Caption + 8-slide carousel + 28 hashtags + Reel script
- **Facebook** — Community post + image brief + video script
- **Medium** — Full 900–1,100 word repurposed article
- **Substack** — Newsletter section
- **Reddit** — Organic community post (zero promotional language)

Content is generated in **2 parts** to keep token usage lean — you review Part 1 (LinkedIn/X/Instagram) before approving Part 2 (Facebook/Medium/Substack/Reddit).

## Tech stack

- **Framework:** Next.js 16.2 (App Router, Turbopack)
- **AI:** Anthropic Claude Sonnet 4.6 via `@anthropic-ai/sdk`
- **Styling:** Tailwind CSS v3
- **Scraping:** Cheerio
- **JSON safety:** jsonrepair

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/webability-social-engine.git
cd webability-social-engine
npm install
```

### 2. Add your Anthropic API key

```bash
cp .env.example .env.local
```

Open `.env.local` and replace `your_anthropic_api_key_here` with your key from [console.anthropic.com](https://console.anthropic.com/).

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. In **Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your key
4. Click **Deploy**

Vercel auto-detects Next.js — no extra config needed.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |

## Project structure

```
src/
├── app/
│   ├── page.tsx              # Homepage — blog fetch + generate button
│   ├── generate/page.tsx     # Generation flow (2-part)
│   ├── history/page.tsx      # Past generations (localStorage)
│   └── api/
│       ├── scrape/route.ts   # Scrapes webability.io/blog for latest post
│       └── generate/route.ts # Calls Claude API, returns platform content
├── components/
│   ├── PlatformTabs.tsx      # Tabbed results viewer
│   ├── BlogPreview.tsx       # Blog card with manual URL input
│   └── Navbar.tsx
└── lib/
    ├── prompts.ts            # Part 1 + Part 2 Claude prompt builders
    ├── types.ts              # TypeScript interfaces
    └── utils.ts              # Helpers + platform metadata
```
