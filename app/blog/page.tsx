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
import { breadcrumb, faqPage } from "@/lib/jsonld";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { WaveHero } from "@/components/ui/WaveHero";

import { getAllPosts } from "@/lib/editorial/blog-index";

export const metadata: Metadata = withOG({
  title: "Blog — SigRank",
  description:
    "Practical guides, benchmarking walkthroughs, tool comparisons, and updates for AI operators.",
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
        </div>
      </WorkspaceShell>
    </div>
  );
}
