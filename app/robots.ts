/**
 * app/robots.ts — robots.txt for crawlers.
 *
 * Allow all crawlers access to everything. The sitemap is referenced so
 * Google Search Console can discover it automatically.
 *
 * AEO (2026-10-25): AI crawlers are grouped by function. Answer-engine and
 * on-demand fetchers (OAI-SearchBot, Claude-SearchBot, ChatGPT-User,
 * Claude-User, PerplexityBot, Perplexity-User) get explicit groups so ChatGPT
 * Search, Claude, Perplexity, and similar surfaces can read and cite our
 * content. Training/extended-use crawlers (GPTBot, ClaudeBot, CCBot,
 * Google-Extended, Applebot-Extended) are kept at parity with `*` — flip to
 * disallow to opt out of training. Aggressive scrapers (Bytespider,
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
      // AI search & answer-engine crawlers — these drive chat citations.
      {
        userAgent: "OAI-SearchBot",
        allow: ALLOW,
        disallow: DISALLOW,
      },
      {
        userAgent: "Claude-SearchBot",
        allow: ALLOW,
        disallow: DISALLOW,
      },
      {
        userAgent: "PerplexityBot",
        allow: ALLOW,
        disallow: DISALLOW,
      },
      // On-demand fetchers — fire when a user asks the AI to open a page.
      {
        userAgent: "ChatGPT-User",
        allow: ALLOW,
        disallow: DISALLOW,
      },
      {
        userAgent: "Claude-User",
        allow: ALLOW,
        disallow: DISALLOW,
      },
      {
        userAgent: "Perplexity-User",
        allow: ALLOW,
        disallow: DISALLOW,
      },
      // AI training / extended-use controls (not search crawlers).
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
