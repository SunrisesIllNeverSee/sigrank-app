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
];

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
