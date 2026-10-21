/**
 * lib/search/page-index.ts — page index for the title-bar global search
 * (owner 2026-10-21). Built from existing sources, never a parallel list:
 *   - lib/seo/search-index-policy ROUTE_CLASSES, CORE + SUPPORTED only:
 *     HOLD routes are deliberately unadvertised (some are flag-gated and can
 *     404), and UTILITY/REDIRECT are forms and redirects
 *   - content/blog + static posts via lib/editorial/blog-index (real titles)
 *   - WIKI_PAGES from lib/seo/llms-pages (real wiki titles)
 * Routes with no editorial title fall back to a humanized path segment.
 */

import { ROUTE_CLASSES } from "@/lib/seo/search-index-policy";
import { getAllPosts, getArticlePosts } from "@/lib/editorial/blog-index";
import { WIKI_PAGES } from "@/lib/seo/llms-pages";
import type { SearchPage } from "./match";

const SECTION: Record<string, string> = {
  wiki: "Wiki",
  blog: "Blog",
  articles: "Articles",
  metrics: "Metrics",
  methodology: "Methodology",
  research: "Research",
  field: "Field",
  fieldhub: "Field",
  guides: "Guides",
  tools: "Tools",
  vs: "Compare",
  alternatives: "Alternatives",
  standard: "Standard",
  docs: "Docs",
  exchange: "Exchange",
};

const ACRONYMS = new Set(["ai", "snr", "mcp", "ct", "roi", "hitl", "api", "cli", "llm"]);

function humanize(segment: string): string {
  return segment
    .split("-")
    .map((w) => (ACRONYMS.has(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function fallbackTitle(path: string): string {
  if (path === "/") return "Home";
  // the /vs index itself (matches its page metadata title), not "SigRank vs Vs"
  if (path === "/vs") return "SigRank vs Other Tools";
  const parts = path.split("/").filter(Boolean);
  const last = humanize(parts[parts.length - 1]);
  return parts[0] === "vs" ? `SigRank vs ${last}` : last;
}

export async function buildPageIndex(): Promise<SearchPage[]> {
  const [posts, articles] = await Promise.all([getAllPosts(), getArticlePosts()]);
  const byPath = new Map<string, SearchPage>();

  for (const [path, cls] of Object.entries(ROUTE_CLASSES)) {
    if (cls !== "CORE" && cls !== "SUPPORTED") continue;
    const first = path.split("/").filter(Boolean)[0] ?? "";
    byPath.set(path, {
      path,
      title: fallbackTitle(path),
      section: SECTION[first] ?? "Pages",
    });
  }
  for (const w of WIKI_PAGES) {
    byPath.set(w.path, { path: w.path, title: w.title, section: "Wiki" });
  }
  const articleSlugs = new Set(articles.map((a) => a.slug));
  for (const p of [...posts, ...articles]) {
    const path = `/blog/${p.slug}`;
    byPath.set(path, {
      path,
      title: p.title,
      section: articleSlugs.has(p.slug) ? "Articles" : "Blog",
      description: p.description,
    });
  }
  return [...byPath.values()];
}
