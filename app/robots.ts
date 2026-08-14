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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Explicitly allow AI answer-engine crawlers (AEO)
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/auth/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/api/", "/auth/"],
      },
      {
        userAgent: "CCBot",
        allow: "/",
        disallow: ["/api/", "/auth/"],
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: ["/api/", "/auth/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/auth/"],
      },
      {
        userAgent: "Applebot-Extended",
        allow: "/",
        disallow: ["/api/", "/auth/"],
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
        allow: "/",
        // Don't index API routes or auth callback — they're not content pages
        disallow: ["/api/", "/auth/"],
        // Throttle aggressive crawlers — 10s between requests prevents edge-request
        // spikes (2026-07-24: Googlebot crawl caused 16K requests/hour).
        crawlDelay: 10,
      },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
