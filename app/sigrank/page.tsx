import { getHomepageStats } from "@/lib/board";
import { MotionPause } from "@/components/home/MotionPause";
import { DeletedNotice } from "@/components/home/DeletedNotice";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { IpBoundary } from "@/components/marketing/IpBoundary";
import { PricingCards } from "@/components/marketing/PricingCards";
import { FourDegreesChart } from "@/components/marketing/FourDegreesChart";
import { getAverageUsersColumn } from "@/lib/marketing/top-operator-column";
import { Draft2Masthead, Draft2Intro } from "@/components/draft/Draft2Hero";
import { Draft2LiveActivity } from "@/components/draft/Draft2LiveActivity";
import { Draft2CtaBand } from "@/components/draft/Draft2CtaBand";
import { VercelMarketplaceBadge } from "@/components/vercel/VercelMarketplaceBadge";
import type { Metadata } from "next";
import { withOG, formatTokens } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { cliTool, aggregateStats } from "@/lib/jsonld";
import { faqGroupId } from "@/components/seo/FaqSection";
import { SIGRANK_FAQ_GROUPS } from "@/lib/seo/page-faqs";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { FieldFamilyNav } from "@/components/field/FieldWorkspaceFrame";
import Link from "next/link";

// ISR: the Four Degrees chart auto-pulls the top operator's live all-time metrics
// (lib/marketing/top-operator-column.ts). Revalidate daily — the homepage aggregate
// stats + four degrees columns don't need to be fresher than that (board pages have
// their own 1h ISR for real-time data). Data-layer unstable_cache (5min) still
// refreshes the underlying DB reads independently. Metadata/brand edits propagate
// within 24h, or instantly on deploy (Vercel rebuilds all static pages).
export const revalidate = 86400;

// Home title carries the canonical brand: SigRank SignalAF. Sub-pages get
// "· SigRank SignalAF" via the root template (SITE_NAME); the home title is the
// root segment so it's set in full here. Description is the hero's voice (kept
// in sync with SITE_TAGLINE).
export const metadata: Metadata = withOG({
  title: "SigRank SignalAF — The Evaluation Platform for AI Operators",
  // Full title already carries the brand — skip the template suffix.
  titleAbsolute: "SigRank SignalAF — The Evaluation Platform for AI Operators",
  description:
    "Models are benchmarked constantly; their operators are not. SigRank turns privacy-preserving token telemetry into your Yield, workflow signature, and rank.",
  path: "/sigrank",
});

/**
 * Homepage (`/`) — the landing.
 *
 * Order (owner 2026-06-22): Hero → Live board (activity tracker — the 4 MiniBoards
 * were archived; "Real operators. Real cascades." headline moved into the tracker) →
 * Four Degrees of Leverage chart (the show-stopper, with sources/footnotes above it +
 * a link to the full wiki description) → How it works → IP/privacy → Tiers → CTA.
 * Indexable — no draft banner, no #keys overlay, no noindex. The previous HF-Space-style
 * landing (wordmark + ticker + 3-box rows) is archived + disconnected:
 * Devins_Plans/_archive/old-landing-page-2026-06-21.tsx.txt. Draft2BoardsGrid archived:
 * Devins_Plans/_archive/components/Draft2BoardsGrid.tsx.txt.
 *
 * Server component: all data reads here; the client islands (CascadeHeader,
 * MotionPause) render as children. The Draft2* component names are retained for
 * now (functional; rename is a later cleanup).
 */
export default async function HomePage() {
  const [homeStats, averageColumn] = await Promise.all([getHomepageStats(), getAverageUsersColumn()]);
  const operatorCount = homeStats.total_operators;
  const medianYield = averageColumn ? Number(averageColumn.yield_) : null;

  return (
    <WorkspaceShell
      active="home"
      editorialStage
      title="SIGRANK"
      bareTitle
      hero={<div className="sigrank-column-hero"><Draft2Masthead /></div>}
      leftTitle="SIGRANK"
      topic="home"
      left={<FieldFamilyNav current="home" />}
      rightTitle="SIGNAL"
      right={
        <>
          <div className="mod">
            <div className="mini-h"><span className="sq" />SNAPSHOT</div>
            <div className="ws-kv">
              <div className="row"><span className="k">OPERATORS</span><span className="v">{operatorCount.toLocaleString()}</span></div>
              <div className="row"><span className="k">TOKENS</span><span className="v">{formatTokens(homeStats.total_tokens_scored)}</span></div>
              <div className="row"><span className="k">PLATFORMS</span><span className="v">17</span></div>
              <div className="row"><span className="k">MEDIAN Υ</span><span className="v acc">{medianYield != null ? medianYield.toFixed(2) : "—"}</span></div>
            </div>
          </div>
          <div className="mod">
            <div className="mini-h"><span className="sq" />GO DEEPER</div>
            <nav className="ws-nav">
              <Link href="/methodology">Methodology</Link>
              <Link href="/research">State of the Index</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/developers">Developers</Link>
            </nav>
          </div>
        </>
      }
      leftWidth={280}
      rightWidth={240}
      status={<>{operatorCount.toLocaleString()} OPERATORS · {formatTokens(homeStats.total_tokens_scored)} TOKENS · SIGNALAF × SIGRANK · MO§ES™</>}
    >
    <div className="ws-doc ws-doc-wide sigrank-stage-reflow flex flex-col gap-8">
      {/* the scrolling half of the SigRank hero (masthead is pinned above) */}
      <Draft2Intro />
      {/* JSON-LD: SoftwareApplication — the sigrank CLI tool (GEO: machine-readable software product).
          Single SoftwareApplication block on homepage — includes canonical @id, isBasedOn,
          about, mentions for entity disambiguation (merged from product()). */}
      <JsonLd data={cliTool()} />

      {/* JSON-LD: Dataset — aggregate stats for AEO (Item 2c). Quantified stats
          improve AI citation rates by up to 41% (Princeton GEO-Bench). */}
      <JsonLd
        data={aggregateStats({
          totalOperators: operatorCount,
          totalTokens: homeStats.total_tokens_scored,
          totalSnapshots: homeStats.total_snapshots,
          transmitterCount: homeStats.transmitter_count,
          topOperator: homeStats.top_operator_codename,
          topYield: homeStats.top_yield,
          medianYield: medianYield ?? undefined,
          platformCount: 17,
          modelCount: 3304,
        })}
      />

      {/* FAQPage JSON-LD moved to /faq with the questions (owner 2026-10-28):
          the page now links to them, so structured data matches each page. */}

      <DeletedNotice />
      <VercelMarketplaceBadge />

      {/* ── Stats bar (AEO Item 2b) — visible aggregate stats for AI engine citation ── */}
      <section
        aria-label="SigRank aggregate statistics"
        className="grid grid-cols-2 gap-4 rounded-lg border border-bg-border bg-bg-surface px-6 py-5 sm:grid-cols-5"
      >
        <div className="flex flex-col gap-0.5 text-center">
          <span className="font-mono text-2xl font-bold text-gold">
            {operatorCount.toLocaleString()}
          </span>
          <span className="font-sans text-sm text-text-dim">operators ranked</span>
        </div>
        <div className="flex flex-col gap-0.5 text-center">
          <span className="font-mono text-2xl font-bold text-gold">
            {formatTokens(homeStats.total_tokens_scored)}
          </span>
          <span className="font-sans text-sm text-text-dim">tokens analyzed</span>
        </div>
        <div className="flex flex-col gap-0.5 text-center">
          <span className="font-mono text-2xl font-bold text-gold">17</span>
          <span className="font-sans text-sm text-text-dim">platforms tracked</span>
        </div>
        <div className="flex flex-col gap-0.5 text-center">
          <span className="font-mono text-2xl font-bold text-gold">3,304</span>
          <span className="font-sans text-sm text-text-dim">models measured</span>
        </div>
        <div className="flex flex-col gap-0.5 text-center">
          <span className="font-mono text-2xl font-bold text-gold">
            {medianYield === null ? "—" : medianYield.toFixed(2)}
          </span>
          <span className="font-sans text-sm text-text-dim">all-time real-operator median Yield (Υ)</span>
        </div>
      </section>

      {/* ── Plain-text product description (AEO + content efficiency) — gives AI
          crawlers a dense, indexable summary of what SigRank is and does. ── */}
      <section className="sigrank-prose mx-auto w-full max-w-3xl">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the evaluation platform for AI operators — the accounts using
          AI tools, not the AI models themselves. It ranks operators by Yield
          (Υ = cache_read × output / input²), a composite efficiency metric
          computed from four token pillars: cache_read (reused context),
          cache_write (new context stored), input (tokens sent to the model),
          and output (tokens produced). Unlike model leaderboards such as LMSYS
          Chatbot Arena that rank AI models by human voting, SigRank measures
          the operator factor — how efficiently each operator uses AI capabilities.
          The platform supports 17 AI tools including Claude Code, ChatGPT,
          Cursor, Copilot, Windsurf, and Codex. Operators run a local scanner
          that reads token telemetry and submits signed, privacy-preserving
          snapshots. No prompt content, code, or conversation text ever leaves
          the machine — only four token counts. The leaderboard ranks operators
          across 7-day, 30-day, 90-day, and all-time windows, with operator
          classes from IGNITER through ARCH+ based on total tokens accumulated.
          TRANSMITTER is a separate peak-activity badge, not a tier. The public
          REST API, OpenAPI specification, MCP server, and CLI tool are
          documented at{" "}
          <Link href="/developers" className="text-gold underline underline-offset-2">
            /developers
          </Link>
          . Pricing is free during the build stage at{" "}
          <Link href="/pricing" className="text-gold underline underline-offset-2">
            /pricing
          </Link>
          .
        </p>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          The dataset spans {operatorCount.toLocaleString()} operators
          across 17 platforms and 3,304 models, with{" "}
          {formatTokens(homeStats.total_tokens_scored)} tokens analyzed. The
          all-time real-operator median Yield is {medianYield === null ? "unavailable" : medianYield.toFixed(2)}, and the top operator
          achieves a 30-day Yield of {homeStats.top_yield.toLocaleString()}. The
          full methodology, metric definitions, and evidence boundary are
          documented at{" "}
          <Link href="/methodology" className="text-gold underline underline-offset-2">
            /methodology
          </Link>
          . The anonymized research dataset is available on Zenodo (DOI:
          10.5281/zenodo.21900519) under a CC-BY-4.0 license. The theoretical
          foundation, the Conservation Law of Commitment, is published
          separately (Zenodo: 10.5281/zenodo.20029607). Operators can check
          their efficiency without installing anything using the{" "}
          <Link href="/score" className="text-gold underline underline-offset-2">
            score calculator
          </Link>
          , or run the full local scanner with{" "}
          <code className="font-mono text-text-primary">npx sigrank</code> to
          submit a signed snapshot to the leaderboard. The CLI also runs a
          local MCP server exposing leaderboard, operator profile, and
          rank-paste tools to AI agents via the Model Context Protocol.
        </p>
      </section>

      {/* The four degrees of leverage — our show-stopper, directly under the hero
          (owner 2026-07-02: moved above the live board so the comparison table leads,
          with the explanation underneath). Sources/footnotes + a link to the full wiki
          description live inside the section. */}
      <span className="-mb-8 h-0" id="ws-page-four-degrees" />
      <FourDegreesChart variant="embed" averageColumn={averageColumn} />

      {/* Live board — the activity tracker now owns the whole section (owner 2026-06-22:
          the 4 MiniBoards were archived; "Real operators. Real cascades." moved into it).
          Now sits under the Four Degrees section. */}
      <span className="-mb-8 h-0" id="ws-page-activity" />
      <Draft2LiveActivity stats={homeStats} />

      <span className="-mb-8 h-0" id="ws-page-how" />
      <HowItWorks />
      <span className="-mb-8 h-0" id="ws-page-privacy" />
      <IpBoundary />
      <span className="-mb-8 h-0" id="ws-page-pricing" />
      <PricingCards />

      <span className="-mb-8 h-0" id="ws-page-questions" />
      {/* ── Ask AI about us (AEO Item 8b) — copy-pasteable prompts for AI search engines ── */}
      <section className="mx-auto w-full max-w-4xl rounded-lg border border-bg-border bg-bg-surface px-6 py-6">
        <h2 className="font-sans text-lg font-bold text-text-primary">
          Ask AI about us
        </h2>
        <p className="mt-1 font-sans text-sm text-text-secondary">
          Copy these prompts into ChatGPT, Perplexity, or Google AI Overviews
          to see how AI search engines answer questions about SigRank.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {[
            { q: "What is SigRank?", link: "/faq" },
            { q: "Who is the best AI user?", link: "/hall" },
            { q: "What is Yield in AI usage?", link: "/metrics/yield-cascade" },
            { q: "How do I check my AI coding efficiency?", link: "/score" },
            { q: "How does SigRank compare to LMSYS Arena?", link: "/vs/lmsys-arena" },
            { q: "What AI coding tools does SigRank support?", link: "/platforms" },
            { q: "What is the SigRank MCP server?", link: "/mcp" },
            { q: "What is the token cascade?", link: "/wiki/four-degrees" },
          ].map((item) => (
            <Link
              key={item.q}
              href={item.link}
              className="flex items-center gap-2 rounded-md border border-bg-border bg-bg-base px-3 py-2 font-sans text-sm text-text-secondary transition-colors hover:border-gold/30 hover:text-text-primary"
            >
              <span className="font-mono text-gold">?</span>
              {item.q}
            </Link>
          ))}
        </div>
      </section>

      <Draft2CtaBand />

      {/* Research + methodology links — internal links from the indexed homepage
          to /methodology and /research so Google discovers + indexes them (G3/G4).
          Also gives visitors a path to the citation/data sources. */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pb-4 text-center">
        <Link
          href="/methodology"
          className="font-mono text-sm text-text-muted transition-colors hover:text-text-secondary"
        >
          Methodology & data →
        </Link>
        <Link
          href="/research"
          className="font-mono text-sm text-text-muted transition-colors hover:text-text-secondary"
        >
          Q1 2026 report →
        </Link>
        <Link
          href="/science"
          className="font-mono text-sm text-text-muted transition-colors hover:text-text-secondary"
        >
          Academic foundation →
        </Link>
      </div>

      {/* ── Topic hubs ── */}
      <section className="sigrank-learn flex flex-col gap-3 border-t border-bg-border-subtle pt-6">
        <h2 className="font-mono text-sm font-bold text-text-primary">
          Learn more
        </h2>
        <p className="font-sans text-sm text-text-muted">
          <Link
            href="/hall"
            className="text-gold underline underline-offset-2"
          >
            Best AI Users
          </Link>
          {" · "}
          <Link
            href="/score"
            className="text-gold underline underline-offset-2"
          >
            Benchmark Your AI Usage
          </Link>
          {" · "}
          <Link
            href="/ai-operator-scoring"
            className="text-gold underline underline-offset-2"
          >
            AI Operator Evaluation
          </Link>
          {" · "}
          <Link
            href="/ai-benchmarking"
            className="text-gold underline underline-offset-2"
          >
            AI Benchmarking
          </Link>
          {" · "}
          <Link
            href="/ai-coding-metrics"
            className="text-gold underline underline-offset-2"
          >
            AI Coding Metrics
          </Link>
          {" · "}
          <Link
            href="/research"
            className="text-gold underline underline-offset-2"
          >
            AI Power User Statistics
          </Link>
          {" · "}
          <Link
            href="/vs/lmsys-arena"
            className="text-gold underline underline-offset-2"
          >
            Operator vs Model Performance
          </Link>
          {" · "}
          <Link
            href="/privacy"
            className="text-gold underline underline-offset-2"
          >
            Privacy-Preserving AI Measurement
          </Link>
          {" · "}
          <Link
            href="/operator-performance"
            className="text-gold underline underline-offset-2"
          >
            Operator Performance
          </Link>
          {" · "}
          <Link
            href="/cascade-analysis"
            className="text-gold underline underline-offset-2"
          >
            Cascade Analysis
          </Link>
          {" · "}
          <Link
            href="/token-telemetry"
            className="text-gold underline underline-offset-2"
          >
            Token Telemetry
          </Link>
          {" · "}
          <Link
            href="/metrics/cache-hit-rate"
            className="text-gold underline underline-offset-2"
          >
            Cache Hit Rate
          </Link>
        </p>
      </section>

      {/* ── Enterprise CTA ── */}
      <section className="mx-auto w-full max-w-4xl rounded-lg border border-bg-border bg-bg-surface px-6 py-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Working across a team?
        </h2>
        <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
          The public leaderboard ranks individual operators. If you need a
          private baseline for a team or workflow, MO§ES™ offers a 30-day
          baseline assessment using the same content-free telemetry — with
          cohort-level analysis, intervention testing, and a defensible
          baseline report.
        </p>
        <a
          href="https://mos2es.org/baseline-assessment"
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-bg-border-subtle bg-bg-elevated px-5 py-2.5 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold hover:text-gold"
        >
          Explore the baseline assessment →
        </a>
      </section>

      {/* ── FAQ — the questions live on /faq (owner 2026-10-28); this card
          links to each category. Keeps the #faq anchor for old links. ── */}
      <section id="faq" aria-labelledby="faq-heading" className="my-16 flex scroll-mt-20 flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center">
          <div className="font-mono text-xs uppercase tracking-widest text-gold">
            ⊙ FAQ
          </div>
          <h2 id="faq-heading" className="mt-3 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
            Questions, answered.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
            Who&apos;s at the top, how the leaderboard ranks operators, how the
            score works, and what never leaves your machine.
          </p>
        </div>
        <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-2">
          {SIGRANK_FAQ_GROUPS.map((g) => (
            <Link
              key={g.label}
              href={"/faq#" + faqGroupId("faq", g.label)}
              className="flex items-center justify-between gap-3 rounded-lg border border-bg-border bg-bg-surface px-4 py-3 text-left font-mono text-sm text-text-primary transition-colors hover:border-gold/40 hover:text-gold"
            >
              <span>{g.label}</span>
              <span aria-hidden="true" className="text-text-dim">→</span>
            </Link>
          ))}
        </div>
        <Link
          href="/faq"
          className="inline-flex items-center gap-2 rounded-lg border border-bg-border-subtle bg-bg-elevated px-5 py-2.5 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold hover:text-gold"
        >
          Read every question →
        </Link>
      </section>

      <MotionPause />
    </div>
    </WorkspaceShell>
  );
}
