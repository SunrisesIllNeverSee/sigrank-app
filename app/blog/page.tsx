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

async function getAllPosts(): Promise<PostSummary[]> {
  try {
    const files = await readdir(CONTENT_DIR);
    const posts: PostSummary[] = [];
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
    return posts.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
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
