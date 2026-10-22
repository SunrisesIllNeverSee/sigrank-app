/**
 * app/robots.ts — robots.txt for crawlers.
 *
 * Allow all crawlers access to everything. The sitemap is referenced so
 * Google Search Console can discover it automatically.
 *
 * AEO (2026-08-14): explicit AI answer-engine crawler allowlist so ChatGPT
 * Search, Perplexity, Claude, Google AI Overviews, and Apple Intelligence
 * can read and cite our content. Training-focused scrapers (Bytespider,
 * meta-externalagent) are blocked.
 */

import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo";

// Named AI crawler groups mirror the `*` group below — robots groups are
// exclusive, so a bot with its own group ignores `*`. Keep these in sync.
const ALLOW = ["/", "/api/exchange/signals"];
const DISALLOW = ["/api/", "/auth/", "/internal/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Explicitly allow AI answer-engine crawlers (AEO)
      {
        userAgent: "GPTBot",
        allow: ALLOW,
        disallow: DISALLOW,
      },
      {
        userAgent: "ClaudeBot",
        allow: ALLOW,
        disallow: DISALLOW,
      },
      {
        userAgent: "CCBot",
        allow: ALLOW,
        disallow: DISALLOW,
      },
      {
        userAgent: "Google-Extended",
        allow: ALLOW,
        disallow: DISALLOW,
      },
      {
        userAgent: "PerplexityBot",
        allow: ALLOW,
        disallow: DISALLOW,
      },
      {
        userAgent: "Applebot-Extended",
        allow: ALLOW,
        disallow: DISALLOW,
      },
      // Block training-focused scrapers (not answer engines)
      {
        userAgent: "Bytespider",
        disallow: "/",
      },
      {
        userAgent: "meta-externalagent",
        disallow: "/",
      },
      // Default: all crawlers
      {
        userAgent: "*",
        allow: ["/", "/api/exchange/signals"],
        // Don't index API routes or auth callback — they're not content pages.
        // Exception: /api/exchange/signals is a public discovery surface for
        // agents (spec §11.4). The more specific Allow rule wins over the
        // broader Disallow: /api/ rule per RFC 9309.
        disallow: ["/api/", "/auth/", "/internal/"],
        // Throttle aggressive crawlers — 10s between requests prevents edge-request
        // spikes (2026-07-24: Googlebot crawl caused 16K requests/hour).
        crawlDelay: 10,
      },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
