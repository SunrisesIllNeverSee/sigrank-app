/**
 * lib/seo/llms-pages.ts — editorial page list for /llms.txt and /llms-full.txt.
 *
 * Generated from the same sources as the site (blog index + content/blog
 * frontmatter) and gated by the sitemap manifest, so HOLD pages are never
 * advertised to agents while they stay unpromoted in the sitemap.
 */
import { getAllPosts, getArticlePosts } from "@/lib/editorial/blog-index";
import { isSitemapPromoted } from "@/lib/seo/search-index-policy";

/** Wiki subpages with stable titles (route → label). Unclassified/HOLD
 *  entries are filtered out by the manifest below. */
export const WIKI_PAGES: { path: string; title: string }[] = [
  { path: "/wiki/four-degrees", title: "The Four Degrees of Leverage" },
  { path: "/wiki/verification", title: "Verification & Integrity Tests" },
  { path: "/wiki/methodology-refinement", title: "How We Got Here — Refining the Index" },
  { path: "/wiki/local-agent", title: "The Local Agent (MCP)" },
  { path: "/wiki/signal-drift", title: "Signature Drift — the tune meter" },
  { path: "/wiki/measured-alongside", title: "Measured Alongside" },
  { path: "/wiki/metrics/yield", title: "Yield (Υ)" },
  { path: "/wiki/metrics/leverage", title: "Leverage" },
  { path: "/wiki/metrics/velocity", title: "Velocity" },
  { path: "/wiki/metrics/snr", title: "Signal-to-Noise Ratio (SNR)" },
  { path: "/wiki/metrics/output-flow-share", title: "Output Flow Share" },
  { path: "/wiki/metrics/context-activity-ratio", title: "Context Activity Ratio" },
  { path: "/wiki/metrics/active-output-share", title: "Active Output Share" },
  { path: "/wiki/metrics/scale-v", title: "Scale V — Recorded Token Activity" },
];

/** Canon naming (owner-approved 2026-08-28): SignalAF presents SigRank;
 *  SigRank is the proof surface for Upsilon. */
export const NAMING_MARKDOWN =
  "**Naming:** SignalAF (signalaf.com) is the website that publishes SigRank. SigRank is the public AI operator leaderboard and benchmark — the proof surface. Upsilon is the measurement engine that produces the numbers. One product family, three roles.";

/** The redesigned workspace (October 2026), section by section, mirroring
 *  the rail: Operators (Leaderboard, Profile, Compare, Hall) and Writings
 *  (SigRank, Field, Articles, Blog, Wiki). */
export function siteMapMarkdown(origin: string, query = ""): string {
  const u = (path: string) => `${origin}${path}${query}`;
  return `## How the site is organized

signalaf.com is one workspace: a rail of sections on the left edge, a sidebar on each side, and the page in the middle. Search in the title bar finds any operator and any page.

**Operators**
- [Leaderboard](${u("/board/all")}): the live board and the home of the site. Filter by workflow (HITL, Hybrid, Auto / Review), time window ([7d](${u("/board/7d")}), [30d](${u("/board/30d")}), [90d](${u("/board/90d")}), all-time), platform and class; switch between derived metrics and the raw token pillars. Selecting a row opens an inspector with rank, class, build, a dual-signature radar and signal history; Top Movers and the Wire show who moved and what just happened.
- Operator profiles (\`${origin}/user/<codename>\`): an identity card (Yield, class, build, headline cascade metrics), the telemetry table with field context for every pillar and metric, rank contexts, and Stats, Analysis, Submissions, Social and Badges tabs. Only claimed operators with a metric snapshot are search-indexed.
- [Compare](${u("/compare")}): two operators side by side (\`/compare?a=<codename>&b=<codename>\`) — raw-pillar and cascade-metric radars for each, a head-to-head ledger with a running count of metric wins, and Yield over time on one axis. Shareable as a link, PNG or matchup card.
- [Hall of Signal](${u("/hall")}): record holders in every metric and token category. [Badge and achievement index](${u("/hall/badges")}): every badge and what it takes to earn.

**Writings**
- [SigRank](${u("/sigrank")}): what SigRank measures, how, and why the operator is the variable.
- [Field](${u("/fieldhub")}): the research hub — [Field Analysis](${u("/field")}) of the operator field and the [State of the Index](${u("/research")}) dataset (DOI 10.5281/zenodo.21900519).
- [Articles](${u("/articles")}), [Blog](${u("/blog")}) and [Wiki](${u("/wiki")}): original analyses, guides, and metric definitions.

**Enterprise:** private team baselines through MO§ES™ — https://mos2es.org/baseline-assessment

Comparisons here are comparisons of operating shape from four token counts. Yield (Υ = cache_read × output / input²) does not measure correctness, code quality, effort, productivity or intelligence.`;
}

function line(origin: string, path: string, title: string, description?: string, query = "") {
  const desc = description ? `: ${description.replace(/\s+/g, " ").trim()}` : "";
  return `- [${title}](${origin}${path}${query})${desc}`;
}

/** Markdown sections (## Articles / ## Blog posts / ## Wiki entries). */
export async function editorialPagesMarkdown(origin: string, query = ""): Promise<string> {
  const [articles, posts] = await Promise.all([getArticlePosts(), getAllPosts()]);
  const promoted = <T extends { slug: string }>(xs: T[]) =>
    xs.filter((p) => isSitemapPromoted(`/blog/${p.slug}`));

  const out: string[] = [];
  out.push("## Articles");
  out.push(line(origin, "/articles", "Articles index", "original published analyses and essays", query));
  for (const a of promoted(articles)) out.push(line(origin, `/blog/${a.slug}`, a.title, a.description, query));
  out.push("");
  out.push("## Blog posts");
  out.push(line(origin, "/blog", "Blog index", "guides, benchmarking walkthroughs, and updates", query));
  for (const p of promoted(posts)) out.push(line(origin, `/blog/${p.slug}`, p.title, p.description, query));
  out.push("");
  out.push("## Wiki entries");
  for (const w of WIKI_PAGES.filter((w) => isSitemapPromoted(w.path))) out.push(line(origin, w.path, w.title, undefined, query));
  return out.join("\n");
}
