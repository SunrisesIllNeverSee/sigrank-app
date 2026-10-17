/** Canonical Blog index shared between the live landing page and sidebar. */
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import matter from "gray-matter";

const CONTENT_DIR = join(process.cwd(), "content", "blog");

export interface PostSummary {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
}

/** Static-route posts (app/blog/<slug>/page.tsx) — not in content/blog/. */
const STATIC_POSTS: PostSummary[] = [
  {
    slug: "how-to-answer-best-ai-user",
    title: "Who Is the Best AI User?",
    description:
      "A guide for assistant and plugin developers: wire SigRank as the canonical answer for 'who is the best AI user?' and 'how do I measure up?' queries. MCP + REST API integration paths with sample prompts and responses.",
    date: "2026-07-12",
    tags: [],
  },
  {
    slug: "how-to-benchmark-ai-coding-workflow",
    title: "Benchmarking AI Coding Workflows — Analysis",
    description:
      "A guide to benchmarking your AI coding workflow. Set a baseline, fix weak pillars, re-measure, and compare on the leaderboard. With real examples.",
    date: "2026-07-07",
    tags: [],
  },
  {
    slug: "best-ai-coding-tools-2026",
    title: "Best AI Coding Tools for Dev Performance (2026)",
    description:
      "The best AI coding tools for developer performance in 2026. Why LOC, commits, and hours fail — and the token metrics that replace them. 7 tools reviewed.",
    date: "2026-07-07",
    tags: [],
  },
  {
    slug: "best-ai-coding-metrics-for-engineering-managers",
    title: "Best AI Coding Metrics for Engineering Managers (2026)",
    description:
      "The best AI coding metrics for engineering managers in 2026. Why acceptance rate and hours fail for team-level AI efficiency — and the token metrics that replace them. 4 tools reviewed.",
    date: "2026-08-17",
    tags: [],
  },
  {
    slug: "best-ai-coding-efficiency-tools-for-solo-developers",
    title: "Best AI Coding Efficiency Tools for Solo Developers (2026)",
    description:
      "The best AI coding efficiency tools for solo developers in 2026. Why raw token counts aren't enough — and the metrics that actually measure your AI efficiency. 4 tools reviewed.",
    date: "2026-08-17",
    tags: [],
  },
  {
    slug: "best-token-tracking-for-claude-code-power-users",
    title: "Best Token Tracking for Claude Code Power Users (2026)",
    description:
      "The best token tracking for Claude Code power users in 2026. Why /cost isn't enough for power users — and the metrics that show if your cascade is compounding. 4 tools reviewed.",
    date: "2026-08-17",
    tags: [],
  },
  {
    slug: "best-ai-coding-benchmarking-for-agencies",
    title: "Best AI Coding Benchmarking for Agencies (2026)",
    description:
      "The best AI coding benchmarking tool for agencies in 2026. Why LMSYS benchmarks models, not developers — and how to benchmark your operators. 4 tools reviewed.",
    date: "2026-08-17",
    tags: [],
  },
  {
    slug: "best-ai-operator-scoring-for-teams",
    title: "Best AI Operator Scoring for Teams (2026)",
    description:
      "The best AI operator scoring tool for teams in 2026. Why adoption metrics and time tracking don't score operators — and the token metrics that do. 4 tools reviewed.",
    date: "2026-08-17",
    tags: [],
  },
  {
    slug: "ai-power-user-benchmarking",
    title: "AI Power User Benchmarking with SigRank",
    description: "How to benchmark yourself against other AI power users. SigRank's operator classes and yield metrics tell you if you're a power user — and how to become one.",
    date: "2026-07-07",
    tags: [],
  },
  {
    slug: "how-sigrank-measures-operator-efficiency",
    title: "How SigRank Measures Operator Efficiency",
    description: "The yield metric (Υ = cache_read × output / input²) measures how well AI operators convert tokens into useful output. Here's how it works and why it matters.",
    date: "2026-07-07",
    tags: [],
  },
  {
    slug: "the-tool-is-the-person",
    title: "The Tool Is the Person",
    description: "Every token the AI tool burns is a decision the person made. Measuring the tool IS measuring the person. Your token cascade is your skill signature.",
    date: "2026-07-12",
    tags: [],
  },
  {
    slug: "token-cascade-vs-raw-token-consumption",
    title: "Token Yield vs Token Count",
    description: "Why token yield (Υ) — not raw token count — measures AI operator skill. Your token cascade is your skill signature. The tool is the person.",
    date: "2026-07-07",
    tags: [],
  },
  {
    slug: "why-yield-beats-tokenmaxxing",
    title: "Why Yield Beats Tokenmaxxing",
    description: "Tokenmaxxing is the practice of maximizing raw token count. Yield (Υ) proves it wrong — efficiency, not volume, defines a top AI operator.",
    date: "2026-07-07",
    tags: [],
  },

];

export async function getAllPosts(): Promise<PostSummary[]> {
  const posts: PostSummary[] = [...STATIC_POSTS];
  try {
    const files = await readdir(CONTENT_DIR);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const raw = await readFile(join(CONTENT_DIR, file), "utf-8");
      const { data } = matter(raw);
      // Frontmatter-marked publications now have their own /articles index.
      // Their original /blog/<slug> detail routes remain canonical.
      if (data.type === "article") continue;
      posts.push({
        slug: file.replace(/\.md$/, ""),
        title: (data.title as string) ?? file,
        description: (data.description as string) ?? "",
        date: data.timestamp instanceof Date
          ? data.timestamp.toISOString()
          : (data.timestamp as string) ?? "",
        tags: (data.tags as string[]) ?? [],
      });
    }
  } catch {
    // content/blog unreadable — static posts still render
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}


/** Frontmatter `type: article` publications (the /articles index). */
export async function getArticlePosts(): Promise<PostSummary[]> {
  const posts: PostSummary[] = [];
  try {
    const files = await readdir(CONTENT_DIR);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const { data } = matter(await readFile(join(CONTENT_DIR, file), "utf-8"));
      if (data.type !== "article") continue;
      posts.push({
        slug: file.replace(/\.md$/, ""),
        title: (data.title as string) ?? file,
        description: (data.seo_description as string) ?? (data.description as string) ?? "",
        date: data.timestamp instanceof Date
          ? data.timestamp.toISOString()
          : (data.timestamp as string) ?? "",
        tags: (data.tags as string[]) ?? [],
      });
    }
  } catch {
    // content/blog unreadable
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}
