"use client";

/**
 * Shared SignalAF editorial navigation: TOPIC > DOCUMENT TREE > PAGE.
 * Topic chooser is mounted in WorkspaceShell's left railhead.
 * No content/telemetry source or route is modified by this navigation layer.
 */
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type WorkspaceTopic = "home" | "field" | "articles" | "blog" | "wiki";
export type TextPage =
  | "home" | "fieldhub" | "field" | "research" | "science" | "about"
  | "articles" | "blog" | "wiki";

const TOPICS: ReadonlyArray<{ id: WorkspaceTopic; label: string; href: string }> = [
  { id: "home", label: "SigRank", href: "/" },
  { id: "field", label: "Field", href: "/fieldhub" },
  { id: "articles", label: "Articles", href: "/articles" },
  { id: "blog", label: "Blog", href: "/blog" },
  { id: "wiki", label: "Wiki", href: "/wiki" },
];

const PAGES: Record<WorkspaceTopic, ReadonlyArray<{ label: string; href: string }>> = {
  home: [
    { label: "Overview", href: "/" },
    { label: "Leaderboard", href: "/board/all" },
    { label: "Compare", href: "/compare" },
    { label: "Hall of Signal", href: "/hall" },
    { label: "Methodology", href: "/methodology" },
  ],
  field: [
    { label: "Field Hub", href: "/fieldhub" },
    { label: "Field Analysis", href: "/field" },
    { label: "State of the Index", href: "/research" },
    { label: "Academic Foundation · Science", href: "/science" },
    { label: "About", href: "/about" },
  ],
  articles: [
    { label: "All Articles", href: "/articles" },
    { label: "The Human in the Loop Is Unmeasured", href: "/blog/the-human-in-the-loop-is-unmeasured" },
    { label: "Volume Isn't Yield", href: "/blog/volume-isnt-yield" },
    { label: "The Three Modes", href: "/blog/the-three-modes-behind-the-ai-operator-board" },
    { label: "Interactive Dashboards", href: "/blog/sigrank-dashboards" },
  ],
  blog: [
    { label: "All Posts", href: "/blog" },
    { label: "Benchmarking Workflows", href: "/blog/how-to-benchmark-ai-coding-workflow" },
    { label: "AI Coding Tools", href: "/blog/best-ai-coding-tools-2026" },
    { label: "Operator Scoring", href: "/blog/best-ai-operator-scoring-for-teams" },
  ],
  wiki: [
    { label: "Wiki Index", href: "/wiki" },
    { label: "Metrics & Four Degrees", href: "/wiki/four-degrees" },
    { label: "Verification", href: "/wiki/verification" },
    { label: "Methodology Refinement", href: "/wiki/methodology-refinement" },
    { label: "Local Agent", href: "/wiki/local-agent" },
  ],
};

const topicForPage = (page: TextPage): WorkspaceTopic => {
  if (page === "home") return "home";
  if (page === "articles" || page === "blog" || page === "wiki") return page;
  return "field";
};

const NATIVE_HOME_DROPDOWN = "(function(){\n  if(window.__signalafHomeNavInstalled)return;\n  window.__signalafHomeNavInstalled=true;\n  document.addEventListener(\"click\",function(event){\n    var label=event.target.closest?.(\".ws-topic-link-label\");\n    if(label)label.closest(\"details\")?.removeAttribute(\"open\");\n  },true);\n  document.addEventListener(\"keydown\",function(event){\n    if(event.key!==\"Enter\" && event.key!==\" \")return;\n    var label=event.target.closest?.('label[for=\"ws-home-mode\"]');\n    if(!label)return;\n    event.preventDefault();\n    document.getElementById(\"ws-home-mode\")?.click();\n    label.closest(\"details\")?.removeAttribute(\"open\");\n  },true);\n})();";

export function EditorialTopicDropdown({ topic }: { topic: WorkspaceTopic }) {
  const selected = TOPICS.find((item) => item.id === topic);
  // Native disclosure and ordinary links also work when JS is unavailable.
  return (
    <details className="ws-topic-dropdown">
      <summary aria-label="Select topic">
        <span>{selected?.label ?? "SigRank"}</span><span aria-hidden="true">▾</span>
      </summary>
      <nav aria-label="Topics" className="ws-topic-menu">
        {TOPICS.map((item) => (
          topic === "home" && item.id === "home" ? (
            <label key={item.id} htmlFor="ws-home-mode" className="ws-topic-link-label"
              role="button" tabIndex={0}>
              {item.label}
            </label>
          ) : (
            <Link key={item.id} href={item.href} aria-current={topic === item.id ? "page" : undefined}>
              {item.label}
            </Link>
          )
        ))}
      </nav>
      {topic === "home" && <script dangerouslySetInnerHTML={{ __html: NATIVE_HOME_DROPDOWN }} />}
    </details>
  );
}

type PageAnchor = { id: string; label: string };

/** Server-rendered real anchors. Optional client heading discovery adds depth. */
const PAGE_ANCHORS: Record<string, PageAnchor[]> = {
  "/": [
    { id: "ws-page-four-degrees", label: "Four Degrees of Leverage" },
    { id: "ws-page-activity", label: "Live Operator Activity" },
    { id: "ws-page-how", label: "How It Works" },
    { id: "ws-page-privacy", label: "Privacy & IP" },
    { id: "ws-page-pricing", label: "Free & Support" },
    { id: "ws-page-questions", label: "Ask AI About Us" },
  ],
  "/science": [
    { id: "ws-page-science-law", label: "The Law" },
    { id: "ws-page-science-evidence", label: "The Evidence" },
    { id: "ws-page-science-theory", label: "Commitment Theory" },
    { id: "ws-page-science-moses", label: "MO§ES Enforcement" },
    { id: "ws-page-science-deposits", label: "Zenodo Deposits" },
    { id: "ws-page-science-author", label: "Author" },
  ],
  "/field": [
    { id: "volume-vs-yield", label: "Volume ≠ Yield" },
    { id: "token-cascade", label: "The Token Cascade" },
    { id: "snr-separation", label: "The SNR Separation" },
    { id: "leverage-velocity", label: "Leverage × Velocity" },
    { id: "platform-dominance", label: "Platform Dominance" },
    { id: "cascade-composition", label: "Cascade Composition" },
    { id: "yield-quartiles", label: "Yield Quartiles" },
    { id: "distribution-band", label: "Where 80% Live" },
    { id: "percentile-ladder", label: "Where Are You?" },
    { id: "ghost-ranks", label: "Ghost Ranks" },
    { id: "archetypes", label: "Build Archetypes" },
    { id: "outliers", label: "Outlier Detection" },
  ],
  "/research": [
    { id: "finding", label: "The Finding" },
    { id: "source", label: "The Source" },
    { id: "dataset", label: "The Dataset" },
    { id: "field", label: "Field Analysis" },
    { id: "methodology", label: "Methodology" },
    { id: "cite", label: "Cite this Dataset" },
    { id: "license", label: "License" },
  ],
  "/articles": [{ id: "all-articles", label: "All Articles" }],
  "/blog": [{ id: "ws-page-posts", label: "All Posts" }],
  "/about": [
    { id: "about-faq", label: "Frequently Asked Questions" },
    { id: "about-contact", label: "Contact" },
  ],
};


const slug = (value: string) =>
  value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 56);

const PAGE_FALLBACK_SCRIPT = "(function(){\n  var host=document.currentScript?.closest(\".ws-page-auto\");\n  if(!host)return;\n  var nav=host.querySelector(\".ws-page-auto-nav\");\n  var note=host.querySelector(\".ws-page-auto-note\");\n  var complete=false;\n  function scan(){\n    if(complete||!host.isConnected)return;\n    var stage=document.querySelector(\".lbw-root .stagecol main.stage .board\");\n    if(!stage)return;\n    var headings=stage.querySelectorAll(\"h2\"),seen=new Set(),found=[];\n    for(var i=0;i<headings.length&&found.length<24;i++){\n      var h=headings[i];\n      if(h.closest(\".blog-row,.blog-list,.ws-nav,.rail,[data-ws-nav-skip]\"))continue;\n      var label=(h.textContent||\"\").replace(/\\s+/g,\" \").trim();\n      if(!label)continue;\n      var enclosing=h.closest(\"section[id]\");\n      var id=h.id||(enclosing&&enclosing.id)||\"\";\n      if(!id){\n        var base=\"ws-page-\"+label.toLowerCase().normalize(\"NFKD\")\n          .replace(/[^a-z0-9]+/g,\"-\").replace(/^-|-$/g,\"\").slice(0,56);\n        id=base||\"ws-page-section\";\n        var stem=id,sequence=2;\n        while(document.getElementById(id))id=stem+\"-\"+(sequence++);\n        h.id=id;\n      }\n      if(seen.has(id))continue;\n      seen.add(id);found.push({id:id,label:label});\n    }\n    if(!found.length)return;\n    for(var k=0;k<found.length;k++){\n      var a=document.createElement(\"a\");\n      a.href=\"#\"+encodeURIComponent(found[k].id);\n      a.textContent=found[k].label;\n      nav.appendChild(a);\n    }\n    if(note)note.hidden=true;\n    complete=true;\n  }\n  if(document.readyState===\"loading\")document.addEventListener(\"DOMContentLoaded\",scan,{once:true});\n  else scan();\n  window.addEventListener(\"load\",scan,{once:true});\n  setTimeout(scan,250);setTimeout(scan,900);setTimeout(scan,2000);\n})();";

function PageSections({ pageContents }: { pageContents?: ReactNode }) {
  const pathname = usePathname();
  const [sections, setSections] = useState<PageAnchor[]>(() => PAGE_ANCHORS[pathname] ?? []);

  useEffect(() => {
    if (pageContents || PAGE_ANCHORS[pathname]?.length) return;
    let cancelled = false;
    const discover = () => {
      const stage = document.querySelector<HTMLElement>(".lbw-root .stagecol main.stage .board");
      if (!stage || cancelled) return;
      const found: PageAnchor[] = [];
      const seen = new Set<string>();
      const headings = stage.querySelectorAll<HTMLHeadingElement>("h2");
      for (const heading of headings) {
        if (heading.closest(".blog-row, .blog-list, .ws-nav, .rail, [data-ws-nav-skip]")) continue;
        const label = (heading.textContent ?? "").replace(/\s+/g, " ").trim();
        if (!label) continue;
        const section = heading.closest<HTMLElement>("section[id]");
        let id = heading.id || section?.id || "";
        if (!id) {
          const stem = "ws-page-" + (slug(label) || "section");
          id = stem;
          let suffix = 2;
          while (document.getElementById(id)) id = stem + "-" + suffix++;
          heading.id = id; // Anchor only; text/layout and canonical page content remain unchanged.
        }
        if (seen.has(id)) continue;
        seen.add(id);
        found.push({ id, label });
        if (found.length >= 22) break; // Long wiki/analysis pages keep rail scrollable.
      }
      if (found.length === 0) {
        const index = stage.querySelector<HTMLElement>("#all-articles, .blog-index");
        if (index) {
          if (!index.id) index.id = "ws-page-posts";
          found.push({ id: index.id, label: pathname === "/articles" ? "All Articles" : "All Posts" });
        }
      }
      setSections(found.length > 0 ? found : (PAGE_ANCHORS[pathname] ?? []));
    };
    // Streaming server components can insert headings after this client effect.
    // Observe content additions, not attributes (our new heading IDs are benign).
    const stage = document.querySelector<HTMLElement>(".lbw-root .stagecol main.stage .board");
    const observer = new MutationObserver(() => requestAnimationFrame(discover));
    if (stage) observer.observe(stage, { childList: true, subtree: true });
    const raf = requestAnimationFrame(discover);
    return () => { cancelled = true; observer.disconnect(); cancelAnimationFrame(raf); };
  }, [pathname, pageContents]);

  if (pageContents) return <div className="ws-page-custom">{pageContents}</div>;
  return sections.length ? (
    <nav className="ws-nav ws-page-links" aria-label="Sections on this page">
      {sections.map((section) => (
        <a key={section.id} href={"#" + encodeURIComponent(section.id)}>{section.label}</a>
      ))}
    </nav>
  ) : (
    <div className="ws-page-auto">
      <nav className="ws-nav ws-page-links ws-page-auto-nav"
        aria-label="Sections on this page" />
      <p className="ws-note ws-page-auto-note">Finding page sections…</p>
      {/* Static JSX articles can be streamed without working dev hydration.
          This native enhancement derives links only from real page headings. */}
      <script dangerouslySetInnerHTML={{ __html: PAGE_FALLBACK_SCRIPT }} />
    </div>
  );
}

export type WorkspaceDocument = { label: string; href: string };

/**
 * The approved sidebar navigation:
 * - SigRank: five-topic Landing Zero, switching in-place to page contents.
 * - Wiki: direct page contents/table.
 * - Field / Articles / Blog: collection tree; the active document's sections
 *   appear directly beneath its title, and siblings always remain visible.
 * - Back and Home follow the ENTIRE tree, below the final sibling.
 *
 * Content, canonical routes, and server-provided publication metadata are
 * never changed by this client-side navigation layer.
 */
export function EditorialNav({
  current = "home", pageContents, documents,
}: {
  current?: TextPage;
  pageContents?: ReactNode;
  documents?: WorkspaceDocument[];
  /** Retained for external callers; tree navigation uses real documents. */
  topicIndex?: ReactNode;
}) {
  const pathname = usePathname();
  const topic = topicForPage(current);
  const isHome = pathname === "/";
  const isWiki = topic === "wiki";
  const isLanding = (topic === "field" && pathname === "/fieldhub")
    || (topic === "articles" && pathname === "/articles")
    || (topic === "blog" && pathname === "/blog");
  const isReader = !isHome && !isWiki && !isLanding;
  const collectionHref = topic === "field" ? "/fieldhub"
    : topic === "articles" ? "/articles" : "/blog";
  const collectionLabel = topic === "field" ? "Field"
    : topic === "articles" ? "Articles" : "Blog";
  const entries = documents ?? PAGES[topic];

  return (
    <>
      {isHome && (
        <div className="ws-home-nav">
          {/* A native checkbox guarantees the stage is never remounted.
              Hash navigation preserves this state without client hydration. */}
          <input id="ws-home-mode" type="checkbox" className="ws-home-switch"
            aria-label="Show SigRank page contents" />
          <div className="mod ws-topic-index ws-home-topic-index">
            <div className="mini-h"><span className="sq" />TOPICS</div>
            <nav className="ws-nav ws-home-topics" aria-label="SignalAF topics">
              {TOPICS.map(item => item.id === "home" ? (
                <label key={item.id} htmlFor="ws-home-mode"
                  role="button" tabIndex={0} className="ws-editorial-nav-link">{item.label}</label>
              ) : <Link href={item.href} key={item.id}>{item.label}</Link>)}
            </nav>
          </div>
          <div className="mod ws-page-index ws-home-contents">
            <div className="mini-h"><span className="sq" />PAGE CONTENTS</div>
            <PageSections pageContents={pageContents} />
          </div>
        </div>
      )}
      {isWiki && (
        <div className="mod ws-page-index ws-wiki-contents">
          <div className="mini-h"><span className="sq" />WIKI CONTENTS</div>
          <PageSections pageContents={pageContents} />
        </div>
      )}
      {!isHome && !isWiki && (
        <div className="mod ws-document-tree">
          <div className="mini-h"><span className="sq" />DOCUMENTS</div>
          <nav className="ws-tree-list" aria-label={collectionLabel + " expandable documents"}>
            {entries.map(entry => {
              const active = isReader && pathname === entry.href;
              return (
                <div className="ws-tree-item" key={entry.href}>
                  {active ? (
                    <details open className="ws-tree-details">
                      <summary className="ws-tree-row active" aria-current="page">
                        <span className="ws-tree-title">{entry.label}</span>
                        <span className="ws-tree-toggle" aria-hidden="true" />
                      </summary>
                      <div className="ws-tree-sections">
                        <PageSections pageContents={pageContents} />
                      </div>
                    </details>
                  ) : (
                    <Link href={entry.href} className="ws-tree-row ws-tree-doc-link">
                      <span className="ws-tree-title">{entry.label}</span>
                      <span className="ws-tree-toggle" aria-hidden="true">▸</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
          {isReader && (
            <nav className="ws-tree-exit" aria-label="Leave document">
              <Link href={collectionHref}>← Back</Link>
              <Link href="/">⌂ Home</Link>
            </nav>
          )}
        </div>
      )}
    </>
  );
}
