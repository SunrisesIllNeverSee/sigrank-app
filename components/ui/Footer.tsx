import React from "react";
import Link from "next/link";

/**
 * Footer link categories — SEO content discoverability (2026-07-07).
 * Each category links to the pages built in the SEO expansion.
 * Kept compact: 3-4 links per column, small text, hover to primary.
 */
const FOOTER_COLUMNS: {
  heading: string;
  headingHref?: string;
  links: { href: string; label: string }[];
}[] = [
  {
    heading: "Analysis",
    links: [
      { href: "/research", label: "State of the Index" },
      { href: "/fieldhub", label: "Field Hub" },
      { href: "/field", label: "Field Analysis" },
      { href: "/blog/volume-isnt-yield", label: "Volume Isn't Yield" },
      { href: "/blog/the-human-in-the-loop-is-unmeasured", label: "The Human in the Loop" },
      { href: "/blog/sigrank-dashboards", label: "Interactive Dashboards" },
      { href: "/blog/the-tool-is-the-person", label: "The Tool Is the Person" },
      { href: "/blog/token-cascade-vs-raw-token-consumption", label: "Token Yield vs Token Count" },
      { href: "/blog/why-yield-beats-tokenmaxxing", label: "Why Yield Beats Tokenmaxxing" },
      { href: "/blog/how-sigrank-measures-operator-efficiency", label: "How SigRank Measures" },
      { href: "/blog/ai-power-user-benchmarking", label: "AI Power User Benchmarking" },
    ],
  },
  {
    heading: "Metrics",
    headingHref: "/metrics",
    links: [
      { href: "/metrics/yield-cascade", label: "Yield (Υ)" },
      { href: "/metrics/leverage", label: "Leverage" },
      { href: "/metrics/velocity", label: "Velocity" },
      { href: "/metrics/signal-to-noise-ratio", label: "Signal-to-Noise Ratio" },
      { href: "/metrics/efficiency", label: "10xDEV" },
      { href: "/metrics/cache-hit-rate", label: "Cache Hit Rate" },
      { href: "/metrics/compression-ratio", label: "Compression Ratio" },
    ],
  },
  {
    heading: "Guides",
    headingHref: "/guides",
    links: [
      {
        href: "/guides/how-to-measure-ai-coding-efficiency",
        label: "Measure AI Coding Efficiency",
      },
      {
        href: "/guides/how-to-improve-your-yield",
        label: "Improve Your Yield",
      },
      {
        href: "/guides/how-to-reduce-token-waste",
        label: "Reduce Token Waste",
      },
      { href: "/guides/how-to-read-your-cascade", label: "Read Your Cascade" },
    ],
  },
  {
    heading: "Tools",
    headingHref: "/tools",
    links: [
      { href: "/tools/yield-calculator", label: "Yield Calculator" },
      { href: "/tools/cascade-comparator", label: "Cascade Comparator" },
      { href: "/tools/operator-class-checker", label: "Class Checker" },
      {
        href: "/tools/token-waste-calculator",
        label: "Token Waste Calculator",
      },
    ],
  },
  {
    heading: "Compare",
    headingHref: "/vs",
    links: [
      { href: "/vs/ccusage", label: "vs ccusage" },
      { href: "/vs/vals-ai", label: "vs VALS AI" },
      { href: "/vs/lmsys-arena", label: "vs LMSYS Arena" },
      { href: "/vs/cursor", label: "vs Cursor" },
      { href: "/vs/braintrust", label: "vs Braintrust" },
      { href: "/vs/langchain", label: "vs LangChain" },
      { href: "/vs/langfuse", label: "vs Langfuse" },
      { href: "/vs/tokscale", label: "vs Tokscale" },
      { href: "/vs/mytokentracker", label: "vs mytokentracker" },
      { href: "/vs/clawdboard", label: "vs clawdboard" },
      { href: "/vs/tokenrank", label: "vs TokenRank" },
      { href: "/vs/tokentracker", label: "vs Token Tracker" },
      { href: "/vs/costhawk", label: "vs CostHawk" },
    ],
  },
  {
    heading: "Platforms",
    headingHref: "/platforms",
    links: [
      { href: "/platforms", label: "All supported platforms" },
      { href: "/platforms", label: "Claude Code" },
      { href: "/platforms", label: "Codex CLI" },
      { href: "/platforms", label: "Gemini CLI" },
      { href: "/platforms", label: "Copilot CLI" },
      { href: "/platforms", label: "OpenCode" },
      { href: "/platforms", label: "Goose" },
      { href: "/platforms", label: "Hermes Agent" },
      { href: "/platforms", label: "OMP (Oh My Pi)" },
      { href: "/platforms", label: "Devin" },
    ],
  },
  {
    heading: "Explore",
    links: [
      { href: "/hall", label: "Best AI Users — Hall of Signal" },
      { href: "/score", label: "Benchmark Your AI Usage" },
      { href: "/research", label: "AI Power User Statistics" },
      { href: "/vs/lmsys-arena", label: "Human vs Model Performance" },
      { href: "/privacy", label: "Privacy-Preserving AI Measurement" },
      {
        href: "/alternatives/ai-coding-metrics",
        label: "AI Coding Metrics Tools",
      },
      {
        href: "/alternatives/ccusage-alternatives",
        label: "ccusage Alternatives",
      },
      {
        href: "/alternatives/ai-benchmarking-tools",
        label: "AI Benchmarking Tools",
      },
      {
        href: "/alternatives/token-tracking-tools",
        label: "Token Tracking Tools",
      },
    ],
  },
  {
    heading: "Topics",
    links: [
      { href: "/upsilon", label: "Upsilon Measurement Engine" },
      { href: "/ai-benchmarking", label: "AI Benchmarking" },
      { href: "/ai-coding-metrics", label: "AI Coding Metrics" },
      { href: "/ai-operator-scoring", label: "AI Operator Scoring" },
      { href: "/standard", label: "SigRank Standard" },
      {
        href: "/standard/open-vs-proprietary",
        label: "Open vs Proprietary",
      },
      { href: "/operator-performance", label: "Operator Performance" },
      { href: "/cascade-analysis", label: "Cascade Analysis" },
    ],
  },
  {
    heading: "Ecosystem",
    links: [
      {
        href: "https://mos2es.org",
        label: "MO§ES™ Enterprise →",
      },
      {
        href: "https://mos2es.com",
        label: "Governance Framework →",
      },
      {
        href: "https://signomy.xyz",
        label: "Signomy City-State →",
      },
      {
        href: "https://sigeconomy.com",
        label: "SigEconomy Leaderboard →",
      },
      {
        href: "https://mos2es.xyz",
        label: "AQUA Application Hub →",
      },
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
 * SEO link columns added 2026-07-07 — makes the 34 new content pages discoverable
 * from every page on the site (internal linking is a top SEO ranking factor).
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

        {/* SEO link columns */}
        <div className="grid grid-cols-2 gap-6 border-t border-bg-border pt-6 sm:grid-cols-4 lg:grid-cols-9">
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
                  <li key={l.href}>
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
