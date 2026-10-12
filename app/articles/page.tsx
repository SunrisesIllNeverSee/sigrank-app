/** Articles are existing type:article publications, not a new content fork.
 * Their individual canonical /blog/<slug> URLs remain unchanged. */
import type { Metadata } from "next";
import Link from "next/link";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import matter from "gray-matter";
import { withOG } from "@/lib/seo";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { FieldFamilyNav } from "@/components/field/FieldWorkspaceFrame";
import { JsonLd } from "@/components/seo/JsonLd";
import { WaveHero } from "@/components/ui/WaveHero";
import { breadcrumb } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Articles — SignalAF Research and Analysis",
  description: "Original published analyses and essays on AI operator evaluation and token-cascade measurement.",
  path: "/articles",
});
export const revalidate = 86400;

interface Publication {
  slug: string;
  title: string;
  description: string;
  date: string;
  doi?: string;
}

async function getPublications(): Promise<Publication[]> {
  const directory = join(process.cwd(), "content", "blog");
  const files = await readdir(directory);
  const result = await Promise.all(files.filter((file) => file.endsWith(".md")).map(async (file) => {
    const { data } = matter(await readFile(join(directory, file), "utf8"));
    if (data.type !== "article") return null;
    return {
      slug: file.slice(0, -3),
      title: String(data.title || file.slice(0, -3)),
      description: String(data.description || ""),
      date: data.timestamp instanceof Date
        ? data.timestamp.toISOString()
        : String(data.timestamp || ""),
      doi: data.doi ? String(data.doi) : undefined,
    };
  }));
  return result.filter((item): item is NonNullable<typeof item> => item != null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export default async function ArticlesPage() {
  const articles = await getPublications();
  return (
    <WorkspaceShell
      active="blog"
      editorialStage
      bareTitle
      title="ARTICLES"
      leftTitle="PUBLICATIONS"
      topic="articles"
      left={<FieldFamilyNav current="articles" />}
      leftWidth={280}
      rightWidth={240}
      rightTitle="PUBLICATION DATA"
      right={
        <>
          <div className="mod">
            <div className="mini-h"><span className="sq" />COLLECTION</div>
            <div className="ws-kv">
              <div className="row"><span className="k">articles</span><span className="v acc">{articles.length}</span></div>
              <div className="row"><span className="k">with DOI</span><span className="v">{articles.filter(a => a.doi).length}</span></div>
              <div className="row"><span className="k">source</span><span className="v">original publications</span></div>
            </div>
            <p className="ws-note" style={{ marginTop: 10 }}>
              Publication identifiers are shown only when recorded in the original metadata.
            </p>
          </div>
          <div className="mod">
            <div className="mini-h"><span className="sq" />RELATED</div>
            <nav className="ws-nav">
              <Link href="/fieldhub">Field research</Link>
              <Link href="/research">Data and citation</Link>
              <Link href="/blog">Blog and guides</Link>
              <Link href="/wiki">Wiki</Link>
            </nav>
          </div>
        </>
      }
      status={<>{articles.length} ARTICLES · ANALYSIS &amp; PUBLICATIONS · SIGNALAF × SIGRANK</>}
    >
      <div className="ws-doc ws-article-list">
        <JsonLd data={breadcrumb([{ name: "Articles", path: "/articles" }])} />
        <WaveHero
          eyebrow="◈ Publications · Analysis"
          terminalText="ARTICLES"
          title="Articles"
          subtitle={<>Original essays and documented research on AI operators and token-cascade measurement. Source publications are indexed here without changing their canonical URLs.</>}
        />
        <div className="blog-index" id="all-articles">
          <div className="blog-list">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={"/blog/" + article.slug}
                className="blog-row group"
              >
                <div className="blog-row-main">
                  <h2>{article.title}</h2>
                  <p>{article.description}</p>
                </div>
                <div className="blog-row-meta">
                  {article.date && (
                    <time dateTime={article.date}>
                      {new Date(article.date).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </time>
                  )}
                  {article.doi && <span>DOI {article.doi}</span>}
                  <span className="arrow">↗</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
