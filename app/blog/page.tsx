/**
 * app/blog/page.tsx — Blog index.
 *
 * Lists all markdown posts in content/blog/. Server component, ISR (1h).
 * Not in the nav — preview mode.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import matter from "gray-matter";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";

const CONTENT_DIR = join(process.cwd(), "content", "blog");

interface PostSummary {
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
];

async function getAllPosts(): Promise<PostSummary[]> {
  const posts: PostSummary[] = [...STATIC_POSTS];
  try {
    const files = await readdir(CONTENT_DIR);
    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const raw = await readFile(join(CONTENT_DIR, file), "utf-8");
      const { data } = matter(raw);
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

export const metadata: Metadata = withOG({
  title: "Blog — SigRank",
  description:
    "Analysis and research on AI operator efficiency, token cascade economics, and outlier detection.",
  path: "/blog",
});

export const revalidate = 86400;

export default async function BlogIndex() {
  const posts = await getAllPosts();

  return (
    <div className="flex flex-col gap-8 py-2">
      <JsonLd data={breadcrumb([{ name: "Blog", path: "/blog" }])} />
      <JsonLd
        data={faqPage([
          {
            question: "What is the SigRank blog about?",
            answer:
              "The SigRank blog covers AI operator efficiency, token cascade economics, and outlier detection methodology. Posts analyze why raw token volume is noise, how Yield measures real skill, and what the token cascade reveals about how effectively someone uses AI coding tools.",
          },
          {
            question: "Why isn't token volume a good measure of AI coding skill?",
            answer:
              "Raw token count measures spending, not skill. An operator who burns 10M input tokens with no cache reuse has high volume but low signal. Yield (Υ = cache_read × output / input²) penalizes un-cached volume and rewards compounding — the quadratic input penalty means waste is non-linear. Two operators with the same token count can have 100× different Yield.",
          },
          {
            question: "What is the token cascade economy?",
            answer:
              "The token cascade economy describes how the four token pillars (input, output, cache-read, cache-write) interact. An operator who reuses cached context produces more output per fresh input — their cascade compounds. An operator who sends fresh input every turn burns tokens without compounding. SigRank measures this cascade shape, not just volume.",
          },
        ])}
      />
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          ◈ SigRank Blog
        </p>
        <h1 className="font-sans text-3xl font-bold text-text-primary md:text-4xl">
          Analysis & Research
        </h1>
        <p className="text-base leading-relaxed text-text-secondary">
          Deep dives into AI operator efficiency, the token cascade economy,
          and outlier detection methodology.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-gold/40"
          >
            <h2 className="font-sans text-xl font-bold text-text-primary group-hover:text-gold">
              {post.title}
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              {post.description}
            </p>
            <div className="flex items-center gap-3 font-mono text-xs text-text-muted">
              {post.date && (
                <time>
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              )}
              {post.tags.length > 0 && (
                <>
                  <span>·</span>
                  <span>{post.tags.slice(0, 3).join(", ")}</span>
                </>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
