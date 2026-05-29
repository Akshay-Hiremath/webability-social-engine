import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const maxDuration = 30; // blog scraping should be well within 30s

const BLOG_BASE = "https://www.webability.io";
const EXCLUDED_SLUGS = ["archive", "category", "tag", "/page/", "index", "sitemap"];

function isValidBlogPostUrl(url: string): boolean {
  return (
    /webability\.io\/blog\/.+/.test(url) &&
    url !== `${BLOG_BASE}/blog` &&
    !EXCLUDED_SLUGS.some((e) => url.toLowerCase().includes(e))
  );
}

/** Primary: scrape the /blog listing page — posts are always newest-first */
async function getLatestBlogUrlFromListing(): Promise<string | null> {
  try {
    const res = await fetch(`${BLOG_BASE}/blog`, {
      headers: { "User-Agent": "WebabilityContentBot/1.0" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    // Strip chrome so we only look at page body links
    $("nav, header, footer, [class*='nav'], [class*='header'], [class*='footer'], [class*='menu']").remove();

    let latestUrl: string | null = null;
    $("a[href]").each((_, el) => {
      if (latestUrl) return;
      const href = $(el).attr("href") ?? "";
      const full = href.startsWith("http")
        ? href
        : href.startsWith("/")
        ? `${BLOG_BASE}${href}`
        : "";
      if (full && isValidBlogPostUrl(full)) {
        latestUrl = full;
      }
    });

    return latestUrl;
  } catch {
    return null;
  }
}

/** Fallback: parse sitemap.xml and sort by lastmod */
async function getLatestBlogUrlFromSitemap(): Promise<string | null> {
  try {
    const res = await fetch(`${BLOG_BASE}/sitemap.xml`, {
      headers: { "User-Agent": "WebabilityContentBot/1.0" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });

    const entries: Array<{ url: string; lastmod: string }> = [];
    $("url").each((_, el) => {
      const loc = $(el).find("loc").text().trim();
      const lastmod = $(el).find("lastmod").text().trim();
      const slug = loc.split("/blog/")[1] ?? "";
      if (isValidBlogPostUrl(loc) && slug.length > 5) {
        entries.push({ url: loc, lastmod });
      }
    });

    if (entries.length === 0) return null;

    // Posts without lastmod are treated as oldest
    entries.sort((a, b) => {
      if (!a.lastmod && !b.lastmod) return 0;
      if (!a.lastmod) return 1;
      if (!b.lastmod) return -1;
      return new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime();
    });

    return entries[0].url;
  } catch {
    return null;
  }
}

async function scrapeBlogPost(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; WebabilityContentBot/1.0)" },
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  const title =
    $("h1").first().text().trim() ||
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    "Untitled";

  const imageUrl =
    $('meta[property="og:image"]').attr("content") ||
    $("article img").first().attr("src");

  const publishedAt =
    $('meta[property="article:published_time"]').attr("content") ||
    $("time[datetime]").first().attr("datetime") ||
    new Date().toISOString();

  const author =
    $('meta[name="author"]').attr("content") ||
    $('[class*="author"]').first().text().trim() ||
    "Webability Team";

  // Extract main content
  let content = "";
  const selectors = ["article", "main", '[class*="content"]', '[class*="post"]', ".prose"];
  for (const sel of selectors) {
    const el = $(sel);
    if (el.length > 0) {
      el.find("nav, header, footer, aside, script, style, [class*='nav'], [class*='sidebar'], [class*='menu']").remove();
      const text = el.text().replace(/\s+/g, " ").trim();
      if (text.length > 300) {
        content = text;
        break;
      }
    }
  }

  if (!content) {
    $("script, style, nav, header, footer, aside").remove();
    content = $("body").text().replace(/\s+/g, " ").trim();
  }

  const excerpt =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    content.substring(0, 220) + "…";

  const readTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

  return { title, url, excerpt, content, publishedAt, readTime, imageUrl, author };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const manualUrl = searchParams.get("url");

    let blogUrl: string;

    if (manualUrl && manualUrl.includes("webability.io/blog/")) {
      blogUrl = manualUrl;
    } else {
      const latestUrl =
        (await getLatestBlogUrlFromListing()) ??
        (await getLatestBlogUrlFromSitemap());
      if (!latestUrl) {
        return NextResponse.json(
          {
            error:
              "Could not auto-detect the latest blog post. Please paste the blog URL below.",
          },
          { status: 404 }
        );
      }
      blogUrl = latestUrl;
    }

    const post = await scrapeBlogPost(blogUrl);
    return NextResponse.json(post);
  } catch (err) {
    console.error("Scrape error:", err);
    return NextResponse.json(
      { error: "Failed to scrape blog post. Try providing the URL manually." },
      { status: 500 }
    );
  }
}
