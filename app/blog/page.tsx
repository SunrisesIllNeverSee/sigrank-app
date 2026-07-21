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
        date: (data.timestamp as string) ?? "",
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
