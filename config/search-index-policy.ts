/**
 * config/search-index-policy.ts — static-route sitemap classification manifest
 * (SEARCH-RECOVERY Phase 2, addendum §F).
 *
 * Separates "the page exists" from "we actively propose it to Google."
 * This manifest is the source of truth for static sitemap membership.
 *
 * Classes:
 *   CORE      — primary SignalAF product/research/search-authority pages.
 *               Sitemap candidates; the recovery cohort lives here.
 *   SUPPORTED — distinct pages with independent user intent + defensible value.
 *               Sitemap candidates.
 *   HOLD      — page stays live but is not promoted via sitemap while its
 *               independent value/overlap is assessed. Sitemap omission ≠
 *               noindex — HOLD pages keep serving index,follow.
 *   UTILITY   — not intended to rank (auth/config/share/legal/form surfaces).
 *               Excluded from sitemap; noindex only where needed.
 *   REDIRECT  — legacy route; must never appear in the sitemap.
 *
 * Operator profile URLs (/user/*) are governed separately by
 * lib/seo/indexing-policy.ts — they never appear here.
 */

export type RouteClass = "CORE" | "SUPPORTED" | "HOLD" | "UTILITY" | "REDIRECT";

export const ROUTE_CLASSES: Record<string, RouteClass> = {
  // ── CORE — product/research/search authority ────────────────────────────
  "/": "CORE",
  "/methodology": "CORE",
  "/science": "CORE",
  "/research": "CORE",
  "/wiki": "CORE",
  "/token-telemetry": "CORE",
  "/score": "CORE",
  "/hall": "CORE",
  "/compare": "CORE",
  "/field": "CORE",
  "/live": "CORE",
  "/upsilon": "CORE",
  "/standard": "CORE",
  "/mcp": "CORE",
  "/plugin": "CORE",
  "/token-cascade": "CORE",
  "/pricing": "CORE",
  "/ai-operator-scoring": "CORE",

  // ── Board windows (emitted via BOARD_WINDOWS, classified here) ──────────
  "/board/all": "CORE",
  "/board/7d": "SUPPORTED",
  "/board/30d": "SUPPORTED",
  "/board/90d": "SUPPORTED",
  "/board/off": "REDIRECT", // 307 → /board/all; never in sitemap

  // ── Topic hubs + company/product surfaces ───────────────────────────────
  "/metrics": "SUPPORTED",
  "/vs": "SUPPORTED",
  "/guides": "SUPPORTED",
  "/tools": "SUPPORTED",
  "/alternatives": "SUPPORTED",
  "/blog": "SUPPORTED",
  "/about": "SUPPORTED",
  "/contact": "SUPPORTED",
  "/support": "SUPPORTED",
  "/faq": "SUPPORTED",
  "/learn": "SUPPORTED",
  "/developers": "SUPPORTED",
  "/fieldhub": "SUPPORTED",
  "/platforms": "SUPPORTED",
  "/standard/open-vs-proprietary": "SUPPORTED",
  "/ai-coding-metrics": "SUPPORTED",
  "/operator-performance": "SUPPORTED",
  "/ai-benchmarking": "SUPPORTED",
  "/cascade-analysis": "SUPPORTED",
  "/privacy-preserving-ai-telemetry": "SUPPORTED",
  "/docs/integrations/vercel": "SUPPORTED",
  "/exchange": "SUPPORTED",
  "/exchange/signals": "SUPPORTED",

  // ── Metric definitions (definitional intent; 3 are sentinel-backed) ─────
  "/metrics/yield-cascade": "SUPPORTED",
  "/metrics/compression-ratio": "SUPPORTED",
  "/metrics/signal-to-noise-ratio": "SUPPORTED",
  "/metrics/efficiency": "SUPPORTED",
  "/metrics/cache-hit-rate": "SUPPORTED",
  "/metrics/leverage": "SUPPORTED",
  "/metrics/velocity": "SUPPORTED",

  // ── Tools (tool intent; 2 are sentinel-backed) ──────────────────────────
  "/tools/yield-calculator": "SUPPORTED",
  "/tools/cascade-comparator": "SUPPORTED",
  "/tools/operator-class-checker": "SUPPORTED",
  "/tools/token-waste-calculator": "SUPPORTED",

  // ── Guides (educational intent; 1 sentinel-backed) ─────────────────────
  "/guides/how-to-measure-ai-coding-efficiency": "SUPPORTED",
  "/guides/how-to-track-token-cascade": "SUPPORTED",
  "/guides/how-to-improve-your-yield": "SUPPORTED",
  "/guides/how-to-benchmark-ai-coding-workflow": "SUPPORTED",
  "/guides/how-to-reduce-token-waste": "SUPPORTED",
  "/guides/how-to-compare-ai-operators": "SUPPORTED",
  "/guides/how-to-read-your-cascade": "SUPPORTED",
  "/guides/cache-write-convergence": "SUPPORTED",

  // ── Established comparisons (major-tool intent; 3 sentinel-backed) ──────
  "/vs/ccusage": "SUPPORTED",
  "/vs/cursor": "SUPPORTED",
  "/vs/lmsys-arena": "SUPPORTED",
  "/vs/vals-ai": "SUPPORTED",
  "/vs/copilot": "SUPPORTED",
  "/vs/braintrust": "SUPPORTED",
  "/vs/langchain": "SUPPORTED",
  "/vs/langfuse": "SUPPORTED",
  "/vs/clawdboard": "SUPPORTED",
  "/vs/costhawk": "SUPPORTED",
  "/vs/mytokentracker": "SUPPORTED",
  "/vs/tokenrank": "SUPPORTED",
  "/vs/tokentracker": "SUPPORTED",
  "/vs/tokscale": "SUPPORTED",
  "/vs/wakatime": "SUPPORTED",
  "/vs/aider": "SUPPORTED",
  "/vs/cline": "SUPPORTED",
  "/vs/continue": "SUPPORTED",
  "/vs/roo-code": "SUPPORTED",
  "/vs/windsurf": "SUPPORTED",
  "/vs/zed": "SUPPORTED",
  "/vs/tabnine": "SUPPORTED",
  "/vs/amazon-q": "SUPPORTED",
  "/vs/sourcegraph-cody": "SUPPORTED",
  "/vs/swe-bench": "SUPPORTED",
  "/vs/chatbot-arena": "SUPPORTED",
  "/vs/ai-productivity-dashboards": "SUPPORTED",

  // ── Alternatives / listicles (commercial intent; 2 sentinel-backed) ─────
  "/alternatives/ai-coding-metrics": "SUPPORTED",
  "/alternatives/ccusage-alternatives": "SUPPORTED",
  "/alternatives/ai-benchmarking-tools": "SUPPORTED",
  "/alternatives/token-tracking-tools": "SUPPORTED",
  "/alternatives/ai-coding-efficiency-tools": "SUPPORTED",
  "/alternatives/claude-code-usage-tools": "SUPPORTED",
  "/alternatives/cursor-ai-metrics-tools": "SUPPORTED",
  "/alternatives/ai-operator-ranking-tools": "SUPPORTED",
  "/alternatives/token-cost-tracking-tools": "SUPPORTED",
  "/alternatives/ai-coding-benchmark-platforms": "SUPPORTED",
  "/alternatives/ai-coding-roi-tools": "SUPPORTED",
  "/alternatives/mcp-ai-developer-tools": "SUPPORTED",

  // ── Wiki — original articles + metric definitions ───────────────────────
  "/wiki/local-agent": "SUPPORTED",
  "/wiki/measured-alongside": "SUPPORTED",
  "/wiki/methodology-refinement": "SUPPORTED",
  "/wiki/signal-drift": "SUPPORTED",
  "/wiki/four-degrees": "SUPPORTED",
  "/wiki/verification": "SUPPORTED",
  "/wiki/metrics/yield": "SUPPORTED",
  "/wiki/metrics/leverage": "SUPPORTED",
  "/wiki/metrics/velocity": "SUPPORTED",
  "/wiki/metrics/snr": "SUPPORTED",
  "/wiki/metrics/output-flow-share": "SUPPORTED",
  "/wiki/metrics/context-activity-ratio": "SUPPORTED",
  "/wiki/metrics/active-output-share": "SUPPORTED",

  // ── Blog — established essays (1 sentinel-backed) ───────────────────────
  "/blog/volume-isnt-yield": "SUPPORTED",
  "/blog/how-to-benchmark-ai-coding-workflow": "SUPPORTED",
  "/blog/the-human-in-the-loop-is-unmeasured": "SUPPORTED",
  "/blog/sigrank-dashboards": "SUPPORTED",
  "/blog/how-sigrank-measures-operator-efficiency": "SUPPORTED",
  "/blog/token-cascade-vs-raw-token-consumption": "SUPPORTED",
  "/blog/why-yield-beats-tokenmaxxing": "SUPPORTED",
  "/blog/the-tool-is-the-person": "SUPPORTED",

  // ── HOLD — newer AI-evaluation cluster (2026-09-15 batch, unproven) ─────
  "/ai-evaluation": "HOLD",
  "/ai-evaluation-tools": "HOLD",
  "/best-ai-evaluation-tools-for-production": "HOLD",
  "/ai-evaluation-frameworks": "HOLD",
  "/ai-agent-evaluation": "HOLD",
  "/ai-evaluator": "HOLD",
  "/ai-evaluation-platform": "HOLD",
  "/evaluating-ai": "HOLD",
  "/ai-evaluation-news": "HOLD",
  "/ai-compliance-standards": "HOLD",
  "/ai-model-evaluation": "HOLD",
  "/confirmation-hacking-ai-evaluation": "HOLD",
  "/ai-model-safety-evaluation-benchmark-continuous-testing": "HOLD",

  // ── HOLD — late competitor comparison batches (2026-08-27 + 09-26) ──────
  "/vs/viberank": "HOLD",
  "/vs/tokenmaxxer": "HOLD",
  "/vs/whoburnedmore": "HOLD",
  "/vs/aiusage": "HOLD",
  "/vs/ccburn": "HOLD",
  "/vs/ccflare": "HOLD",
  "/vs/ccstatusline": "HOLD",
  "/vs/token-forest": "HOLD",
  "/vs/sessionwatcher": "HOLD",
  "/vs/omnara": "HOLD",
  "/vs/sculptor": "HOLD",
  "/vs/vibe-island": "HOLD",
  "/vs/notch-pilot": "HOLD",
  "/vs/opcode": "HOLD",
  "/vs/lineman": "HOLD",
  "/vs/codeburn": "HOLD",
  "/vs/claudecount": "HOLD",
  "/vs/ccgather": "HOLD",
  "/vs/clauderank": "HOLD",
  "/vs/ccrank": "HOLD",
  "/vs/tokenmaxxing": "HOLD",
  "/vs/straude": "HOLD",
  "/vs/ccclub": "HOLD",
  "/vs/ccwarriors": "HOLD",
  "/vs/devburn": "HOLD",

  // ── HOLD — persona/listicle blog variants (thin differentiation) ────────
  "/blog/best-ai-coding-tools-2026": "HOLD",
  "/blog/how-to-answer-best-ai-user": "HOLD",
  "/blog/ai-power-user-benchmarking": "HOLD",
  "/blog/best-ai-coding-metrics-for-engineering-managers": "HOLD",
  "/blog/best-ai-coding-efficiency-tools-for-solo-developers": "HOLD",
  "/blog/best-token-tracking-for-claude-code-power-users": "HOLD",
  "/blog/best-ai-coding-benchmarking-for-agencies": "HOLD",
  "/blog/best-ai-operator-scoring-for-teams": "HOLD",

  // ── HOLD — Evidence Layer wiki expansion (dense taxonomy, unproven) ─────
  "/wiki/measurement/operator": "HOLD",
  "/wiki/measurement/system": "HOLD",
  "/wiki/measurement/operator-system-dyad": "HOLD",
  "/wiki/measurement/composition": "HOLD",
  "/wiki/measurement/trajectory": "HOLD",
  "/wiki/measurement/cohort": "HOLD",
  "/wiki/measurement/reference-field": "HOLD",
  "/wiki/tests/lineage": "HOLD",
  "/wiki/tests/compression": "HOLD",
  "/wiki/tests/purpose-coherence": "HOLD",
  "/wiki/tests/modularity": "HOLD",
  "/wiki/tests/verifiability": "HOLD",
  "/wiki/tests/recursive-self-evaluation": "HOLD",
  "/wiki/validation/test-retest": "HOLD",
  "/wiki/validation/operator-separability": "HOLD",
  "/wiki/validation/operator-system-interaction": "HOLD",
  "/wiki/validation/transportability": "HOLD",
  "/wiki/validation/task-conditioning": "HOLD",
  "/wiki/validation/convergent-validity": "HOLD",
  "/wiki/governance/alignment-vs-governance": "HOLD",
  "/wiki/governance/persistent-governing-state": "HOLD",
  "/wiki/governance/execution-layer-governance": "HOLD",
  "/wiki/governance/abstention": "HOLD",
  "/wiki/governance/lineage-preservation": "HOLD",
  "/wiki/governance/re-grounding": "HOLD",
  "/wiki/ct/blackhole-law": "HOLD",
  "/wiki/ct/commitment": "HOLD",
  "/wiki/ct/conservation": "HOLD",
  "/wiki/ct/resonance": "HOLD",
  "/wiki/ct/semantic-entropy": "HOLD",
  "/wiki/ct/transformation": "HOLD",

  // ── UTILITY — not meant to rank; excluded from sitemap ──────────────────
  "/privacy": "UTILITY",
  "/eula": "UTILITY",
  "/vercel": "UTILITY",
  "/share/mcp": "UTILITY",
  "/score/paste": "UTILITY", // interactive input form; /tools/* carry the intent
  "/upgrade": "UTILITY",
  "/exchange/propose": "UTILITY", // submission form
  "/agents.md": "UTILITY", // agent-facing doc route
  "/marketplace": "UTILITY", // serves noindex,nofollow — removed from STATIC_ROUTES (closeout A)
  "/vercel/config": "UTILITY", // serves noindex,nofollow — removed from STATIC_ROUTES (closeout A)

  // ── REDIRECT — known redirecting routes (never sitemap members) ─────────
  "/leaderboard": "REDIRECT", // → /board/all
  "/ai-operator-benchmark": "REDIRECT", // 308 → /ai-operator-scoring
  "/token-efficiency": "REDIRECT", // 308 → /metrics/yield-cascade
  "/ai-coding-analytics": "REDIRECT", // 308 → /ai-coding-metrics
};

/** Classes that are candidates for sitemap promotion. */
const SITEMAP_CLASSES: ReadonlySet<RouteClass> = new Set(["CORE", "SUPPORTED"]);

/**
 * Is this path promoted through the sitemap? Unknown paths are NOT promoted —
 * a new route must be deliberately classified before it's advertised.
 */
export function isSitemapPromoted(path: string): boolean {
  const cls = ROUTE_CLASSES[path];
  return cls !== undefined && SITEMAP_CLASSES.has(cls);
}

/** All routes in a class (deterministic order for tests/audits). */
export function routesInClass(cls: RouteClass): string[] {
  return Object.keys(ROUTE_CLASSES).filter((p) => ROUTE_CLASSES[p] === cls).sort();
}
