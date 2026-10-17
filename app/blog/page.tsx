/**
 * app/blog/page.tsx — Blog index.
 *
 * Lists all markdown posts in content/blog/. Server component, ISR (1h).
 * Not in the nav — preview mode.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { FieldFamilyNav } from "@/components/field/FieldWorkspaceFrame";
import { breadcrumb, collectionPage, faqPage } from "@/lib/jsonld";
import { FaqSection } from "@/components/seo/FaqSection";
import { BLOG_INDEX_FAQS } from "@/lib/seo/page-faqs";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { WaveHero } from "@/components/ui/WaveHero";

import { getAllPosts } from "@/lib/editorial/blog-index";

export const metadata: Metadata = withOG({
  title: "Blog — SigRank",
  description:
    "Practical guides, benchmarking walkthroughs, tool comparisons, and updates for AI operators measuring token-cascade efficiency and Yield with SigRank.",
  path: "/blog",
});

export const revalidate = 86400;

export default async function BlogIndex() {
  const posts = await getAllPosts();

  return (
    <div className="flex flex-col gap-8 py-2">
      <JsonLd data={breadcrumb([{ name: "Blog", path: "/blog" }])} />
      <JsonLd
        data={collectionPage({
          path: "/blog",
          name: "SigRank Blog",
          description: "Practical guides, benchmarking walkthroughs, tool comparisons, and updates for AI operators.",
          items: posts.map((p) => ({ name: p.title, path: `/blog/${p.slug}` })),
        })}
      />
      <JsonLd data={faqPage(BLOG_INDEX_FAQS)} />
      {/* Blog index inside the shared SignalAF workspace shell — same
          transfer contract as Hall/Compare/Wiki/Field: post index in the
          left rail, the card list is the stage, right rail carries the
          about module. */}
      <WorkspaceShell
        active="blog"
        editorialStage
        title="BLOG"
        bareTitle
        hero={
          <WaveHero
            eyebrow="📊 SigRank"
            terminalText="BLOG"
            title="Blog"
            subtitle={
              <>
                Guides, benchmarking walkthroughs, tool comparisons,
                and practical updates for AI operators.
              </>
            }
          />
        }
        leftTitle="INDEX"
        topic="blog"
        left={<FieldFamilyNav current="blog" documents={posts.map(post => ({ label: post.title, href: "/blog/" + post.slug }))} />}
        rightTitle="ABOUT"
        right={
          <>
            <div className="mod">
              <div className="mini-h"><span className="sq"></span>THE BLOG</div>
              <div className="ws-kv">
                <div className="row"><span className="k">posts</span><span className="v acc">{posts.length}</span></div>
              </div>
              <p className="ws-note" style={{ marginTop: 8 }}>
                Practical guides, workflow benchmarks, and tool comparisons
                for AI operators.
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
      <div className="ws-doc ws-article-list">

      <div className="blog-index" id="ws-page-posts">
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
      <FaqSection faqs={BLOG_INDEX_FAQS} />
        </div>
      </WorkspaceShell>
    </div>
  );
}
