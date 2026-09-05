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
import { BOARD_WINDOWS } from "@/lib/board/windows";

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
  { path: "/fieldhub", priority: 0.8, changeFrequency: "daily" },
  { path: "/field", priority: 0.8, changeFrequency: "daily" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/blog/volume-isnt-yield", priority: 0.9, changeFrequency: "weekly" },
  { path: "/blog/the-human-in-the-loop-is-unmeasured", priority: 0.9, changeFrequency: "weekly" },
  { path: "/blog/sigrank-dashboards", priority: 0.8, changeFrequency: "weekly" },
  { path: "/methodology", priority: 0.8, changeFrequency: "daily" },
  { path: "/upsilon", priority: 0.9, changeFrequency: "weekly" },
  { path: "/standard", priority: 0.9, changeFrequency: "weekly" },
  {
    path: "/standard/open-vs-proprietary",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  { path: "/science", priority: 0.7, changeFrequency: "monthly" },
  { path: "/research", priority: 0.8, changeFrequency: "monthly" },
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
  { path: "/wiki/four-degrees", priority: 0.6, changeFrequency: "monthly" },
  { path: "/wiki/verification", priority: 0.6, changeFrequency: "monthly" },
  // ── Evidence Layer wiki pages (Phase 4 ecosystem split) ──────────────────
  // Measurement category
  { path: "/wiki/measurement/operator", priority: 0.6, changeFrequency: "monthly" },
  { path: "/wiki/measurement/system", priority: 0.6, changeFrequency: "monthly" },
  { path: "/wiki/measurement/operator-system-dyad", priority: 0.6, changeFrequency: "monthly" },
  { path: "/wiki/measurement/composition", priority: 0.6, changeFrequency: "monthly" },
  { path: "/wiki/measurement/trajectory", priority: 0.6, changeFrequency: "monthly" },
  { path: "/wiki/measurement/cohort", priority: 0.6, changeFrequency: "monthly" },
  { path: "/wiki/measurement/reference-field", priority: 0.6, changeFrequency: "monthly" },
  // Metrics category
  { path: "/wiki/metrics/yield", priority: 0.7, changeFrequency: "monthly" },
  { path: "/wiki/metrics/leverage", priority: 0.6, changeFrequency: "monthly" },
  { path: "/wiki/metrics/velocity", priority: 0.6, changeFrequency: "monthly" },
  { path: "/wiki/metrics/snr", priority: 0.6, changeFrequency: "monthly" },
  { path: "/wiki/metrics/output-flow-share", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/metrics/context-activity-ratio", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/metrics/active-output-share", priority: 0.5, changeFrequency: "monthly" },
  // System Tests category
  { path: "/wiki/tests/lineage", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/tests/compression", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/tests/purpose-coherence", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/tests/modularity", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/tests/verifiability", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/tests/recursive-self-evaluation", priority: 0.5, changeFrequency: "monthly" },
  // Validation category
  { path: "/wiki/validation/test-retest", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/validation/operator-separability", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/validation/operator-system-interaction", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/validation/transportability", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/validation/task-conditioning", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/validation/convergent-validity", priority: 0.5, changeFrequency: "monthly" },
  // Governance category
  { path: "/wiki/governance/alignment-vs-governance", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/governance/persistent-governing-state", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/governance/execution-layer-governance", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/governance/lineage-preservation", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/governance/abstention", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/governance/re-grounding", priority: 0.5, changeFrequency: "monthly" },
  // Commitment Theory category
  { path: "/wiki/ct/commitment", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/ct/conservation", priority: 0.6, changeFrequency: "monthly" },
  { path: "/wiki/ct/transformation", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/ct/resonance", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/ct/semantic-entropy", priority: 0.5, changeFrequency: "monthly" },
  { path: "/wiki/ct/blackhole-law", priority: 0.5, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/developers", priority: 0.8, changeFrequency: "weekly" },
  { path: "/vercel", priority: 0.8, changeFrequency: "weekly" },
  { path: "/support", priority: 0.5, changeFrequency: "monthly" },
  { path: "/eula", priority: 0.4, changeFrequency: "monthly" },
  { path: "/docs/integrations/vercel", priority: 0.8, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.7, changeFrequency: "monthly" },
  // Machine-readable files (openapi.json, auth.md, llms.txt, llms-full.txt) are
  // excluded from the sitemap — they are not HTML pages, have no canonical, and
  // llms.txt/llms-full.txt have x-robots-tag: noindex. Including them causes
  // "Excluded by noindex tag" and "Duplicate without user-selected canonical"
  // errors in Google Search Console.
  { path: "/upgrade", priority: 0.4, changeFrequency: "monthly" },
  { path: "/login", priority: 0.3, changeFrequency: "yearly" },

  // ── Core public pages (2026-09-04 audit — were missing from sitemap) ──────
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/learn", priority: 0.7, changeFrequency: "weekly" },
  { path: "/live", priority: 0.7, changeFrequency: "hourly" },
  { path: "/marketplace", priority: 0.6, changeFrequency: "weekly" },
  { path: "/platforms", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/score/paste", priority: 0.7, changeFrequency: "weekly" },
  { path: "/share/mcp", priority: 0.5, changeFrequency: "weekly" },
  { path: "/vercel/config", priority: 0.6, changeFrequency: "weekly" },

  // ── Contribution Exchange pages ──────────────────────────────────────────
  { path: "/exchange", priority: 0.7, changeFrequency: "weekly" },
  { path: "/exchange/propose", priority: 0.6, changeFrequency: "weekly" },
  { path: "/exchange/signals", priority: 0.8, changeFrequency: "hourly" },
  { path: "/agents.md", priority: 0.5, changeFrequency: "weekly" },

  // ── SEO content pages (2026-07-07) ──────────────────────────────────────
  // Topic-hub index pages — hub priority 0.8 (higher than children)
  { path: "/metrics", priority: 0.8, changeFrequency: "weekly" },
  { path: "/vs", priority: 0.8, changeFrequency: "weekly" },
  { path: "/guides", priority: 0.8, changeFrequency: "weekly" },
  { path: "/tools", priority: 0.8, changeFrequency: "weekly" },
  { path: "/alternatives", priority: 0.8, changeFrequency: "weekly" },

  // Comparison pages — commercial intent
  { path: "/vs/ccusage", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/vals-ai", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/lmsys-arena", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/cursor", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/copilot", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/braintrust", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/langchain", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/langfuse", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/clawdboard", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/costhawk", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/mytokentracker", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/tokenrank", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/tokentracker", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/tokscale", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/wakatime", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/aider", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/cline", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/continue", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/roo-code", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/windsurf", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/zed", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/tabnine", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/amazon-q", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/sourcegraph-cody", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/swe-bench", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/chatbot-arena", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/ai-productivity-dashboards", priority: 0.7, changeFrequency: "monthly" },
  // Competitor /vs/ pages (2026-08-27 batch — token tracker & leaderboard competitors)
  { path: "/vs/viberank", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/tokenmaxxer", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/whoburnedmore", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/aiusage", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/ccburn", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/ccflare", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/ccstatusline", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/token-forest", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/sessionwatcher", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/omnara", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/sculptor", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/vibe-island", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/notch-pilot", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/opcode", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/lineman", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/codeburn", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/claudecount", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/ccgather", priority: 0.7, changeFrequency: "monthly" },
  { path: "/vs/clauderank", priority: 0.7, changeFrequency: "monthly" },

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
  {
    path: "/alternatives/ai-coding-efficiency-tools",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/alternatives/claude-code-usage-tools",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/alternatives/cursor-ai-metrics-tools",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/alternatives/ai-operator-ranking-tools",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/alternatives/token-cost-tracking-tools",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/alternatives/ai-coding-benchmark-platforms",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/alternatives/ai-coding-roi-tools",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/alternatives/mcp-ai-developer-tools",
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
  {
    path: "/guides/cache-write-convergence",
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
    path: "/metrics/efficiency",
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
  { path: "/token-cascade", priority: 0.7, changeFrequency: "monthly" },
  { path: "/ai-operator-scoring", priority: 0.6, changeFrequency: "monthly" },
  // NS-02.04 named category pages (301 redirects to nearest equivalents)
  { path: "/ai-operator-benchmark", priority: 0.6, changeFrequency: "monthly" },
  { path: "/token-efficiency", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy-preserving-ai-telemetry", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ai-coding-analytics", priority: 0.6, changeFrequency: "monthly" },

  // AI evaluation topic pages — from content brief (2026-09-15)
  { path: "/ai-evaluation", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ai-evaluation-tools", priority: 0.7, changeFrequency: "monthly" },
  { path: "/best-ai-evaluation-tools-for-production", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ai-evaluation-frameworks", priority: 0.7, changeFrequency: "monthly" },
  { path: "/ai-agent-evaluation", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ai-evaluator", priority: 0.7, changeFrequency: "monthly" },
  { path: "/ai-evaluation-platform", priority: 0.7, changeFrequency: "monthly" },
  { path: "/evaluating-ai", priority: 0.6, changeFrequency: "monthly" },
  { path: "/ai-evaluation-news", priority: 0.7, changeFrequency: "weekly" },
  { path: "/ai-compliance-standards", priority: 0.7, changeFrequency: "monthly" },
  { path: "/ai-model-evaluation", priority: 0.7, changeFrequency: "monthly" },
  { path: "/confirmation-hacking-ai-evaluation", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ai-model-safety-evaluation-benchmark-continuous-testing", priority: 0.7, changeFrequency: "monthly" },

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
  {
    path: "/blog/the-tool-is-the-person",
    priority: 0.6,
    changeFrequency: "monthly",
  },
  {
    path: "/blog/how-to-answer-best-ai-user",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/blog/best-ai-coding-metrics-for-engineering-managers",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/blog/best-ai-coding-efficiency-tools-for-solo-developers",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/blog/best-token-tracking-for-claude-code-power-users",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/blog/best-ai-coding-benchmarking-for-agencies",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/blog/best-ai-operator-scoring-for-teams",
    priority: 0.7,
    changeFrequency: "monthly",
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  // Static content pages use a fixed last-modified date (the last content update)
  // instead of `now` — this prevents Google from seeing every URL as "just changed"
  // on every sitemap fetch, which dilutes the lastmod signal.
  const STATIC_LAST_MODIFIED = new Date("2026-08-14T09:50:00Z");

  // Static routes
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_ORIGIN}${r.path}`,
    lastModified: STATIC_LAST_MODIFIED,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Board window routes (/board/7d, /board/30d, /board/90d, /board/all)
  // /board/off is excluded — it 307-redirects to /board/all, which causes
  // "Duplicate without user-selected canonical" in Google Search Console.
  const boardEntries: MetadataRoute.Sitemap = BOARD_WINDOWS.map((w) => ({
    url: `${SITE_ORIGIN}/board/${w.slug}`,
    lastModified: now,
    changeFrequency: "hourly" as const,
    priority: 0.9,
  }));

  // Operator profile routes — fetch the leaderboard to get every ranked codename.
  // This is the highest-value sitemap content (each operator's profile is unique +
  // shareable). Falls back to an empty array if the API is unreachable.
  let operatorEntries: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${SITE_ORIGIN}/api/v1/leaderboard?limit=500`, {
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
