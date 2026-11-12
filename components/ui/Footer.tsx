import React from "react";
import Link from "next/link";

/**
 * Footer link columns. Owner 2026-11-12: the site-wide link directory "was
 * never supposed to be on every page". The footer keeps a short set of core
 * pages; full section lists live on their hub pages (/blog, /guides, /wiki,
 * /vs, /alternatives, /tools, /metrics) and in the sitemap.
 */
const FOOTER_COLUMNS: {
  heading: string;
  headingHref?: string;
  links: { href: string; label: string }[];
}[] = [
  {
    heading: "Board",
    headingHref: "/",
    links: [
      { href: "/board/all", label: "All-Time Leaderboard" },
      { href: "/hall", label: "Hall of Signal" },
      { href: "/compare", label: "Compare Operators" },
    ],
  },
  {
    heading: "Research",
    headingHref: "/research",
    links: [
      { href: "/field", label: "Field Analysis" },
      { href: "/blog/volume-isnt-yield", label: "Volume Isn't Yield" },
      { href: "/blog/the-operator-explains-95-percent-of-the-difference", label: "The Operator Explains 95%" },
      { href: "/methodology", label: "Methodology" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    heading: "Your score",
    headingHref: "/score",
    links: [
      { href: "/claude-code-usage", label: "Claude Code Usage" },
      { href: "/codex-usage", label: "Codex Usage" },
      { href: "/mcp", label: "CLI & MCP" },
      { href: "/guides", label: "Guides" },
    ],
  },
  {
    heading: "Standard",
    headingHref: "/standard",
    links: [
      { href: "/standard/open-vs-proprietary", label: "Open vs Proprietary" },
      { href: "/upsilon", label: "Upsilon" },
    ],
  },
  {
    heading: "Ecosystem",
    links: [
      { href: "https://mos2es.com/products", label: "MO§ES™ Enterprise →" },
      { href: "https://mos2es.com", label: "Governance Framework →" },
      { href: "https://signomy.xyz", label: "Signomy City-State →" },
      { href: "https://aquaidp.xyz", label: "AQUA Application Hub →" },
    ],
  },
];

/**
 * Site footer chrome. Server component.
 *
 * One footer, one bar (owner 2026-06-21: "we seem to have two"). The previous
 * version stacked two bordered rows that each re-stated the brand + a competing
 * tagline, so it read as two footers. Merged into a single bar: brand + nav on top,
 * one thin legal/privacy line below — no duplicate SIGRANK, no competing taglines.
 *
 * Link columns trimmed 2026-11-12 (owner): core pages only, not a site directory.
 */
export function Footer() {
  return (
    <footer className="mt-16 w-full border-t border-bg-border bg-bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        {/* Brand + CLI */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base text-accent">◈</span>
            <span className="font-mono text-sm font-bold tracking-widest text-accent">
              SIGRANK
            </span>
          </div>
          <code className="rounded-md border border-bg-border bg-bg-elevated px-3 py-1.5 font-mono text-xs text-text-secondary">
            <span className="text-text-muted">$ </span>
            <span className="text-gold">npx sigrank</span>
          </code>
        </div>

        {/* Core link columns */}
        <div className="grid grid-cols-2 gap-6 border-t border-bg-border pt-6 sm:grid-cols-4 lg:grid-cols-5">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-2">
              {col.headingHref ? (
                <Link
                  href={col.headingHref}
                  className="text-[11px] font-semibold uppercase tracking-wider text-text-muted transition-colors hover:text-gold"
                >
                  {col.heading}
                </Link>
              ) : (
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  {col.heading}
                </p>
              )}
              <ul className="flex flex-col gap-1.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[11px] text-text-muted transition-colors hover:text-text-primary"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal links + one legal/privacy line */}
        <div className="flex flex-col gap-2 border-t border-bg-border pt-4">
          <nav
            aria-label="Legal"
            className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-muted"
          >
            <Link
              href="/about"
              className="transition-colors hover:text-text-primary"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="transition-colors hover:text-text-primary"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-text-primary"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="transition-colors hover:text-text-primary"
            >
              Contact
            </Link>
          </nav>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-mono text-[11px] text-text-secondary">
              powered by <span className="font-bold text-gold">MO§ES™</span> · ©
              2026 Ello Cello LLC
            </span>
            <span className="font-sans text-[11px] leading-snug text-text-muted">
              Token counts only — never prompt content. Your sessions stay on
              your machine.
            </span>
          </div>
          {/* Directory badges */}
          <div className="flex items-center gap-2 pt-2">
            <a
              href="https://whatsthebigdata.com/ai-tools/"
              target="_blank"
              rel="noopener"
              title="Whatsthebigdata AI Tools Directory"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://whatsthebigdata.com/badges/featured-on-whatsthebigdata-color.png"
                alt="Featured on Whatsthebigdata"
                width={200}
                height={42}
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </a>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <a href="https://saascity.io" target="_blank" rel="noopener">
              <img src="https://saascity.io/badges/featured-dark.svg" alt="Featured on SaaSCity" width="150" height="54" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
