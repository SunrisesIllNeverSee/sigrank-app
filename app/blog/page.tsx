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
import { WorkspaceShell } from "@/components/live/WorkspaceShell";

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
      {/* Blog index inside the shared SignalAF workspace shell — same
          transfer contract as Hall/Compare/Wiki/Field: post index in the
          left rail, the card list is the stage, right rail carries the
          about module. */}
      <WorkspaceShell
        active="blog"
        title="BLOG"
        leftTitle="INDEX"
        left={
          <>
            <div className="mod">
              <div className="mini-h"><span className="sq"></span>ALL POSTS</div>
              <nav className="ws-nav">
                {posts.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`}>
                    {post.title}
                    {post.date && (
                      <span className="sub">
                        {new Date(post.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          </>
        }
        rightTitle="ABOUT"
        right={
          <>
            <div className="mod">
              <div className="mini-h"><span className="sq"></span>THE BLOG</div>
              <div className="ws-kv">
                <div className="row"><span className="k">posts</span><span className="v acc">{posts.length}</span></div>
              </div>
              <p className="ws-note" style={{ marginTop: 8 }}>
                Deep dives into AI operator efficiency, the token cascade
                economy, and outlier detection methodology.
              </p>
            </div>
            <div className="mod">
              <div className="mini-h"><span className="sq"></span>MORE SIGNAL</div>
              <nav className="ws-nav">
                <Link href="/wiki">Wiki</Link>
                <Link href="/field">Field analysis</Link>
                <Link href="/learn">Learn</Link>
              </nav>
            </div>
          </>
        }
        leftWidth={280}
        rightWidth={240}
        status={<>{posts.length} POSTS · ANALYSIS &amp; RESEARCH · SIGNALAF × SIGRANK · MO§ES™</>}
      >
        <div className="ws-doc">
          <p className="text-sm leading-relaxed text-text-secondary">
            Analysis &amp; research — deep dives into AI operator efficiency,
            the token cascade economy, and outlier detection methodology.
          </p>

      <div className="blog-index">
        {posts[0] && (
          <Link href={`/blog/${posts[0].slug}`} className="blog-feature group">
            <div className="blog-kicker">LATEST · FIELD NOTE</div>
            <h2>{posts[0].title}</h2>
            <p>{posts[0].description}</p>
            <div className="blog-meta">
              {posts[0].date && (
                <time>
                  {new Date(posts[0].date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              )}
              {posts[0].tags.length > 0 && (
                <span>{posts[0].tags.slice(0, 3).join(" · ")}</span>
              )}
            </div>
            <span className="blog-read">READ ARTICLE →</span>
          </Link>
        )}

        <div className="blog-list">
          {posts.slice(1).map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-row group">
              <div className="blog-row-main">
                <h2>{post.title}</h2>
                <p>{post.description}</p>
              </div>
              <div className="blog-row-meta">
                {post.date && (
                  <time>
                    {new Date(post.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                )}
                {post.tags.length > 0 && (
                  <span>{post.tags.slice(0, 2).join(" · ")}</span>
                )}
                <span className="arrow">↗</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
        </div>
      </WorkspaceShell>
    </div>
  );
}
