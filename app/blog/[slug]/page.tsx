/**
 * app/blog/[slug]/page.tsx — Long-form article renderer.
 *
 * Reads markdown from content/blog/<slug>.md, parses frontmatter with
 * gray-matter, renders with react-markdown + remark-gfm (tables, strikethrough).
 * Server component, ISR (1h). Not in the nav — preview mode.
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import matter from "gray-matter";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { withOG } from "@/lib/seo";
import { SITE_ORIGIN } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, personAuthor } from "@/lib/jsonld";

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
        hero?: string;
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
  const hero = post.frontmatter.hero;
  return withOG({
    title,
    description,
    path: `/blog/${slug}`,
    ...(hero ? { ogImage: { url: hero, alt: title } } : {}),
  });
}

export const revalidate = 86400;

// ─── Custom ReactMarkdown components ────────────────────────────────────────
// Route inline markdown images through next/image for optimization (WebP,
// responsive srcset, lazy loading). Without this, react-markdown renders
// raw <img> tags that bypass Next.js image optimization entirely.
const markdownComponents: Components = {
  img: ({ src, alt, title }) => {
    if (!src || typeof src !== "string") return null;
    // Only optimize local images (skip external URLs — those go through
    // next/image's remote patterns config separately)
    const isLocal = src.startsWith("/") || src.startsWith("./") || !src.startsWith("http");
    if (!isLocal) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={src} alt={alt ?? ""} loading="lazy" />;
    }
    // Normalize relative paths
    const imgSrc = src.startsWith("./") ? src.slice(1) : src;
    return (
      <Image
        src={imgSrc}
        alt={alt ?? ""}
        title={title}
        width={1200}
        height={800}
        className="h-auto w-full rounded-lg border border-bg-border my-6"
        loading="lazy"
      />
    );
  },
};

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
  const hero = frontmatter.hero;

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    author: personAuthor(),
    publisher: { "@id": `${SITE_ORIGIN}/#org` },
    datePublished: date,
    url: `${SITE_ORIGIN}/blog/${slug}`,
    keywords: frontmatter.tags?.join(", "),
  };

  return (
    <article className="px-4 py-8 md:py-12">
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
      <header className="mb-10 flex flex-col gap-4 border-b border-bg-border pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          ◈ SigRank Blog
        </p>
        <h1 className="font-sans text-3xl font-bold leading-tight text-text-primary md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="text-lg leading-relaxed text-text-secondary">
            {description}
          </p>
        )}
        <div className="flex items-center gap-3 font-mono text-xs text-text-muted">
          {date && <time>{new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</time>}
          <span>·</span>
          <span>{author}</span>
        </div>
      </header>

      {/* Hero image */}
      {hero && (
        <div className="mb-10 overflow-hidden rounded-xl border border-bg-border">
          <Image
            src={hero}
            alt={title}
            width={1200}
            height={630}
            className="h-auto w-full object-cover"
          />
        </div>
      )}

      {/* Markdown body */}
      <div className="prose-sigrank mt-2">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>
      </div>

      {/* ── Cross-links ── */}
      <section className="mt-10 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            Yield (Υ) Metric
          </Link>
          {" · "}
          <Link
            href="/field"
            className="text-gold underline underline-offset-2"
          >
            Field Analysis
          </Link>
          {" · "}
          <Link
            href="/guides/how-to-improve-your-yield"
            className="text-gold underline underline-offset-2"
          >
            How to Improve Your Yield
          </Link>
        </p>
      </section>
    </article>
  );
}
