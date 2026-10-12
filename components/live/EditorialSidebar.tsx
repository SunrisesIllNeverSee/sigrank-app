"use client";

/**
 * Shared SignalAF editorial navigation: TOPIC > TOPIC INDEX > PAGE.
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
          <Link key={item.id} href={item.href} aria-current={topic === item.id ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
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
  ) : <p className="ws-note">No section headings on this page.</p>;
}

/** Left rail body: the selected topic's page index + real in-page anchors. */
export function EditorialNav({
  current = "home",
  pageContents,
  topicIndex,
}: {
  current?: TextPage;
  pageContents?: ReactNode;
  topicIndex?: ReactNode;
}) {
  const pathname = usePathname();
  const topic = topicForPage(current);
  // The SigRank landing page navigates its own sections only; Field Hub is
  // the page index itself, so a second in-page menu would duplicate its cards.
  const hasTopicIndex = pathname !== "/";
  const hasPageSections = pathname !== "/fieldhub";
  const emphasizeTopicPages = pathname === "/fieldhub";
  const emphasizePageSections = ["/", "/field", "/research", "/science"].includes(pathname);
  return (
    <>
      {hasTopicIndex && (
        <div className={`mod ws-topic-index${emphasizeTopicPages ? " ws-nav-bold" : ""}`}>
          <div className="mini-h"><span className="sq" />TOPIC INDEX</div>
          <nav className="ws-nav" aria-label="Pages in this topic">
            {topicIndex ?? PAGES[topic].map((page) => (
              <Link
                href={page.href}
                key={page.href}
                aria-current={pathname === page.href ? "page" : undefined}
                className={pathname === page.href ? "ws-secondary-active" : ""}
              >{page.label}</Link>
            ))}
          </nav>
        </div>
      )}
      {hasPageSections && (
        <div className={`mod ws-page-index${emphasizePageSections ? " ws-nav-bold" : ""}`}>
          <div className="mini-h"><span className="sq" />{pathname === "/" ? "SECTIONS" : "PAGE"}</div>
          <PageSections pageContents={pageContents} />
        </div>
      )}
    </>
  );
}

