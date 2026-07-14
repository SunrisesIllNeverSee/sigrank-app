/**
 * app/blog/[slug]/page.tsx — Long-form article renderer.
 *
 * Reads markdown from content/blog/<slug>.md, parses frontmatter with
 * gray-matter, renders with react-markdown + remark-gfm (tables, strikethrough).
 * Server component, ISR (1h). Not in the nav — preview mode.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import matter from "gray-matter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { withOG } from "@/lib/seo";
import { SITE_ORIGIN } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb } from "@/lib/jsonld";

const CONTENT_DIR = join(process.cwd(), "content", "blog");

async function getPost(slug: string) {
  try {
    const raw = await readFile(join(CONTENT_DIR, `${slug}.md`), "utf-8");
    const { data, content } = matter(raw);
    return {
      frontmatter: data as {
        title?: string;
        description?: string;
        timestamp?: string;
        author?: string;
        tags?: string[];
      },
      content,
    };
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const files = await readdir(CONTENT_DIR);
    return files
      .filter((f) => f.endsWith(".md"))
      .map((f) => ({ slug: f.replace(/\.md$/, "") }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const title = post.frontmatter.title ?? slug;
  const description = post.frontmatter.description ?? "";
  return withOG({
    title,
    description,
    path: `/blog/${slug}`,
  });
}

export const revalidate = 3600;

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const { frontmatter, content } = post;
  const title = frontmatter.title ?? slug;
  const description = frontmatter.description ?? "";
  const author = frontmatter.author ?? "SigRank";
  const date = frontmatter.timestamp ?? "";

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: { "@id": `${SITE_ORIGIN}/#org` },
    datePublished: date,
    url: `${SITE_ORIGIN}/blog/${slug}`,
    keywords: frontmatter.tags?.join(", "),
  };

  return (
    <article className="mx-auto max-w-3xl py-2">
      <JsonLd
        data={[
          articleLd,
          breadcrumb([
            { name: "Blog", path: "/blog" },
            { name: title, path: `/blog/${slug}` },
          ]),
        ]}
      />

      {/* Header */}
      <header className="mb-8 flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          ◈ SigRank Blog
        </p>
        <h1 className="font-sans text-3xl font-bold leading-tight text-text-primary md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="text-base leading-relaxed text-text-secondary">
            {description}
          </p>
        )}
        <div className="flex items-center gap-3 font-mono text-xs text-text-muted">
          {date && <time>{new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>}
          <span>·</span>
          <span>{author}</span>
        </div>
      </header>

      {/* Markdown body */}
      <div className="prose-sigrank">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-bg-border pt-6">
        <a
          href="/board/all"
          className="text-gold underline hover:text-text-primary"
        >
          ← Back to the leaderboard
        </a>
      </footer>
    </article>
  );
}
