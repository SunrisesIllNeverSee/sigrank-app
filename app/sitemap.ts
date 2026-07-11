/**
 * app/sitemap.ts — dynamic sitemap for Google Search Console.
 *
 * Static routes are listed with their natural change frequency. Operator
 * profile routes (/user/<codename>) are fetched from the leaderboard API
 * so every ranked operator gets a sitemap entry. Board windows + wiki
 * subpages are enumerated from their source-of-truth arrays.
 */

import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo";
import { BOARD_WINDOWS } from "@/lib/data/windows";

/** Static routes (manually maintained — add new static pages here). */
const STATIC_ROUTES: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/board/all", priority: 0.9, changeFrequency: "hourly" },
  { path: "/score", priority: 0.9, changeFrequency: "daily" },
  { path: "/hall", priority: 0.8, changeFrequency: "daily" },
  { path: "/methodology", priority: 0.8, changeFrequency: "daily" },
  { path: "/science", priority: 0.7, changeFrequency: "monthly" },
  { path: "/research", priority: 0.7, changeFrequency: "monthly" },
  { path: "/research/q1-2026", priority: 0.8, changeFrequency: "monthly" },
  { path: "/compare", priority: 0.7, changeFrequency: "weekly" },
  { path: "/mcp", priority: 0.8, changeFrequency: "weekly" },
  { path: "/wiki", priority: 0.7, changeFrequency: "weekly" },
  { path: "/wiki/local-agent", priority: 0.6, changeFrequency: "monthly" },
  {
    path: "/wiki/measured-alongside",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/wiki/methodology-refinement",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  { path: "/wiki/signal-drift", priority: 0.6, changeFrequency: "monthly" },
  { path: "/wiki/three-degrees", priority: 0.6, changeFrequency: "monthly" },
  { path: "/wiki/verification", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/llms.txt", priority: 0.5, changeFrequency: "monthly" },
  { path: "/llms-full.txt", priority: 0.5, changeFrequency: "monthly" },
  { path: "/upgrade", priority: 0.4, changeFrequency: "monthly" },
  { path: "/login", priority: 0.3, changeFrequency: "yearly" },

  // ── SEO content pages (2026-07-07) ──────────────────────────────────────
  // Comparison pages — commercial intent
  { path: "/vs/ccusage", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/wakatime", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/lmsys-arena", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/cursor", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/copilot", priority: 0.7, changeFrequency: "monthly" },

  // Alternatives / listicle pages — commercial intent
  {
    path: "/alternatives/ai-coding-metrics",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/alternatives/ccusage-alternatives",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/alternatives/ai-benchmarking-tools",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/alternatives/token-tracking-tools",
    priority: 0.7,
    changeFrequency: "monthly",
  },

  // Guide pages — educational intent
  {
    path: "/guides/how-to-measure-ai-coding-efficiency",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/guides/how-to-track-token-cascade",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/guides/how-to-improve-your-yield",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/guides/how-to-benchmark-ai-coding-workflow",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/guides/how-to-reduce-token-waste",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/guides/how-to-compare-ai-operators",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/guides/how-to-read-your-cascade",
    priority: 0.6,
    changeFrequency: "monthly",
  },

  // Metric definition pages — definitional intent
  { path: "/metrics/yield-cascade", priority: 0.6, changeFrequency: "monthly" },
  {
    path: "/metrics/compression-ratio",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/metrics/signal-to-noise-ratio",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/metrics/cache-hit-rate",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  { path: "/metrics/leverage", priority: 0.6, changeFrequency: "monthly" },
  { path: "/metrics/velocity", priority: 0.6, changeFrequency: "monthly" },

  // Tool / calculator pages — tool intent
  {
    path: "/tools/yield-calculator",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/tools/cascade-comparator",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/tools/operator-class-checker",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/tools/token-waste-calculator",
    priority: 0.7,
    changeFrequency: "monthly",
  },

  // Topic hub pages — category intent
  { path: "/token-telemetry", priority: 0.6, changeFrequency: "monthly" },
  { path: "/ai-coding-metrics", priority: 0.6, changeFrequency: "monthly" },
  { path: "/operator-performance", priority: 0.6, changeFrequency: "monthly" },
  { path: "/ai-benchmarking", priority: 0.6, changeFrequency: "monthly" },
  { path: "/cascade-analysis", priority: 0.6, changeFrequency: "monthly" },
  { path: "/ai-operator-scoring", priority: 0.6, changeFrequency: "monthly" },

  // Blog pages — content marketing
  {
    path: "/blog/best-ai-coding-tools-2026",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/blog/how-to-benchmark-ai-coding-workflow",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/blog/how-sigrank-measures-operator-efficiency",
    priority: 0.5,
    changeFrequency: "monthly",
  },
  {
    path: "/blog/token-cascade-vs-raw-token-consumption",
    priority: 0.5,
    changeFrequency: "monthly",
  },
  {
    path: "/blog/why-yield-beats-tokenmaxxing",
    priority: 0.5,
    changeFrequency: "monthly",
  },
  {
    path: "/blog/ai-power-user-benchmarking",
    priority: 0.5,
    changeFrequency: "monthly",
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static routes
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_ORIGIN}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Board window routes (/board/7d, /board/30d, /board/90d, /board/all, /board/off)
  const boardEntries: MetadataRoute.Sitemap = [
    ...BOARD_WINDOWS.map((w) => w.slug),
    "off",
  ].map((slug) => ({
    url: `${SITE_ORIGIN}/board/${slug}`,
    lastModified: now,
    changeFrequency: "hourly" as const,
    priority: 0.9,
  }));

  // Operator profile routes — fetch the leaderboard to get every ranked codename.
  // This is the highest-value sitemap content (each operator's profile is unique +
  // shareable). Falls back to an empty array if the API is unreachable.
  let operatorEntries: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${SITE_ORIGIN}/api/v1/leaderboard?limit=100`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      const entries = data.entries ?? [];
      operatorEntries = entries
        .map((e: { codename?: string; operator?: { codename?: string } }) => {
          const codename = e.codename ?? e.operator?.codename;
          if (!codename) return null;
          return {
            url: `${SITE_ORIGIN}/user/${codename}`,
            lastModified: now,
            changeFrequency: "daily" as const,
            priority: 0.8,
          };
        })
        .filter(Boolean);
    }
  } catch {
    // API unreachable — skip operator entries (sitemaps can be partial)
  }

  return [...staticEntries, ...boardEntries, ...operatorEntries];
}
