"use client";

/**
 * Shared SignalAF editorial navigation: TOPIC > DOCUMENT TREE > PAGE.
 * Topic chooser is mounted in WorkspaceShell's left railhead.
 * No content/telemetry source or route is modified by this navigation layer.
 */
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTION_PAGES } from "@/lib/editorial/section-pages";

export type WorkspaceTopic =
  | "home" | "field" | "articles" | "blog" | "wiki"
  | "guides" | "tools" | "compare" | "alternatives" | "evaluation"
  | "support" | "legal";
export type TextPage =
  | "home" | "fieldhub" | "field" | "research" | "science" | "about" | "methodology"
  | "articles" | "blog" | "wiki"
  | "guides" | "tools" | "compare" | "alternatives" | "evaluation"
  | "support" | "legal";

const TOPICS: ReadonlyArray<{ id: WorkspaceTopic; label: string; href: string }> = [
  { id: "home", label: "SigRank", href: "/sigrank" },
  { id: "field", label: "Field", href: "/fieldhub" },
  { id: "articles", label: "Articles", href: "/articles" },
  { id: "blog", label: "Blog", href: "/blog" },
  { id: "wiki", label: "Wiki", href: "/wiki" },
  { id: "guides", label: "Guides", href: "/guides" },
  { id: "tools", label: "Tools", href: "/tools" },
  { id: "compare", label: "Compare", href: "/vs" },
  { id: "alternatives", label: "Alternatives", href: "/alternatives" },
  { id: "evaluation", label: "AI Evaluation", href: "/ai-evaluation" },
  { id: "support", label: "Support", href: "/support" },
  { id: "legal", label: "Legal", href: "/terms" },
];

const PAGES: Record<WorkspaceTopic, ReadonlyArray<{ label: string; href: string }>> = {
  home: [
    { label: "Overview", href: "/sigrank" },
  ],
  field: [
    { label: "Field Hub", href: "/fieldhub" },
    { label: "Field Analysis", href: "/field" },
    { label: "State of the Index", href: "/research" },
    { label: "Methodology", href: "/methodology" },
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
  ...SECTION_PAGES,
  support: [
    { label: "Support", href: "/support" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact", href: "/contact" },
    { label: "Settings", href: "/settings" },
  ],
  legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "EULA", href: "/eula" },
  ],
};

/** Topics whose href is a real index page (the reader picks a document there).
 *  The others (AI Evaluation, Support, Legal) land on an ordinary document, so their branch opens. */
const INDEX_TOPICS: ReadonlySet<WorkspaceTopic> = new Set([
  "home", "field", "articles", "blog", "wiki", "guides", "tools", "compare", "alternatives",
]);

const topicForPage = (page: TextPage): WorkspaceTopic => {
  if (page === "home") return "home";
  if (page !== "fieldhub" && page !== "field" && page !== "research" && page !== "science"
    && page !== "about" && page !== "methodology") return page;
  return "field";
};

const NATIVE_HOME_DROPDOWN = "(function(){\n  if(window.__signalafHomeNavInstalled)return;\n  window.__signalafHomeNavInstalled=true;\n  document.addEventListener(\"click\",function(event){\n    var label=event.target.closest?.(\".ws-topic-link-label\");\n    if(label)label.closest(\"details\")?.removeAttribute(\"open\");\n  },true);\n  document.addEventListener(\"keydown\",function(event){\n    if(event.key!==\"Enter\" && event.key!==\" \")return;\n    var label=event.target.closest?.('label[for=\"ws-home-mode\"]');\n    if(!label)return;\n    event.preventDefault();\n    document.getElementById(\"ws-home-mode\")?.click();\n    label.closest(\"details\")?.removeAttribute(\"open\");\n  },true);\n})();";

export function EditorialHeaderNav({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  return <div className="ws-header-nav" onMouseEnter={() => setOpen(true)}
    onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); event.stopPropagation(); } }}>
    <button type="button" aria-expanded={open} aria-label="SignalAF navigation"
      onClick={() => setOpen(!open)}>{label} <span aria-hidden="true">▾</span></button>
    {open && <nav aria-label="SignalAF topics">
      {TOPICS.map((item) => <Link key={item.id} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>)}
    </nav>}
  </div>;
}

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
  "/sigrank": [
    { id: "ws-page-four-degrees", label: "Four Degrees of Leverage" },
    { id: "ws-page-activity", label: "Live Operator Activity" },
    { id: "ws-page-how", label: "How It Works" },
    { id: "ws-page-privacy", label: "Privacy & IP" },
    { id: "ws-page-pricing", label: "Free & Support" },
    { id: "ws-page-questions", label: "Ask AI About Us" },
    { id: "faq", label: "FAQ" },
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
      {/* No inline pre-hydration script here: mutating this React-owned nav
          (and heading ids) before hydration caused React #418. The effect
          above discovers headings after hydration instead. */}
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
  return (
    <div className="mod ws-document-tree ws-topic-index">
      <div className="mini-h"><span className="sq" />TOPICS</div>
      <nav className="ws-tree-list" aria-label="Editorial sections">
        {TOPICS.map(item => {
          const selected = item.id === topic;
          const entries = selected && documents ? documents : PAGES[item.id];
          const listed = entries.some(entry => entry.href === pathname);
          const activeLabel = pathname.split("/").filter(Boolean).at(-1)?.replace(/-/g, " ") ?? "Current page";
          const pages = selected && !listed
            ? [...entries, { label: activeLabel, href: pathname }]
            : entries;
          return (
            /* owner 2026-10-17: landing on a section's index page (/articles,
               /blog, …) leaves every dropdown closed — the index page is where
               a reading is picked; the ▸ toggle still opens the list. A reading
               page opens its own section so the current piece is visible. */
            <details key={item.id + pathname} open={selected && (pathname !== item.href || !INDEX_TOPICS.has(item.id))} className="ws-tree-details ws-topic-branch">
              <summary className={"ws-tree-row" + (selected ? " active" : "")}>
                <Link href={item.href} className="ws-tree-title"
                  aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>
                <span className="ws-tree-toggle" aria-hidden="true" />
              </summary>
              <div className="ws-topic-documents">
                {pages.map(entry => {
                  const active = selected && pathname === entry.href;
                  return active && (pathname !== item.href || !INDEX_TOPICS.has(item.id) || item.id === "home" || item.id === "wiki") ? (
                    <details key={entry.href} open className="ws-tree-details ws-document-branch">
                      <summary className="ws-tree-row active">
                        <Link href={entry.href} className="ws-tree-title" aria-current="page">{entry.label}</Link>
                        <span className="ws-tree-toggle" aria-hidden="true" />
                      </summary>
                      <div className="ws-tree-sections">
                        <PageSections key={pathname} pageContents={pageContents} />
                      </div>
                    </details>
                  ) : (
                    <Link key={entry.href} href={entry.href} className="ws-tree-row ws-tree-doc-link">
                      <span className="ws-tree-title">{entry.label}</span>
                    </Link>
                  );
                })}
              </div>
            </details>
          );
        })}
      </nav>
    </div>
  );
}
