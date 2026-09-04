/**
 * app/vs/codeburn/page.tsx — "SigRank vs CodeBurn" SEO comparison page.
 *
 * Angle: CodeBurn is a local-first cost and waste optimizer across 41 tools —
 * it finds inefficiency in your setup and can apply fixes. SigRank scores the
 * operator's cascade efficiency (Υ) and ranks them on a public leaderboard.
 * CodeBurn optimizes your spend; SigRank measures your skill. Both read the
 * same token logs. They answer different questions and can run side by side.
 *
 * RSC only — no client JS. Uses withOG(), JsonLd (breadcrumb + faqPage),
 * WaveHero, and a styled comparison table matching the repo's table conventions.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, comparisonArticle } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

export const metadata: Metadata = withOG({
  title: "SigRank vs CodeBurn \u2014 Spend Optimization vs Operator Scoring",
  description:
    "CodeBurn optimizes AI coding spend across 41 tools — waste scanning, model comparison, budget guarding, and git-linked yield. SigRank scores operator cascade efficiency (Υ) and ranks on a public leaderboard. Different questions, same token logs.",
  path: "/vs/codeburn",
});

const COMPARE_ROWS: { feature: string; codeburn: string; sigrank: string }[] = [
  {
    feature: "Primary question",
    codeburn: "\u201CHow do I reduce my AI coding spend?\u201D",
    sigrank: "\u201CHow efficiently am I driving my AI tools?\u201D",
  },
  {
    feature: "What it measures",
    codeburn: "Cost, waste patterns, model efficiency, git-linked productivity",
    sigrank: "Operator cascade yield (\u03A5 = cache_read \u00D7 output / input\u00B2) + derived metrics",
  },
  {
    feature: "Tools supported",
    codeburn: "41 tools and agents (Claude Code, Cursor, Codex, Gemini, Grok, \u2026)",
    sigrank: "15+ platforms via on-device scanner (bundles ccusage for Claude Code)",
  },
  {
    feature: "Waste scanning + fix application",
    codeburn: "Yes (optimize + --apply, with undo and auto-revert)",
    sigrank: "No (scores the outcome, does not modify your config)",
  },
  {
    feature: "Budget guarding (session caps)",
    codeburn: "Yes (guard hooks with soft/hard caps)",
    sigrank: "No",
  },
  {
    feature: "Model comparison",
    codeburn: "Yes (one-shot rate, retry rate, cost per edit, cache hit)",
    sigrank: "No (ranks operators, not models)",
  },
  {
    feature: "Git-linked yield (did spend ship?)",
    codeburn: "Yes (correlates sessions to commits: productive/reverted/abandoned)",
    sigrank: "No (cascade yield is a token-efficiency metric, not a git-attribution metric)",
  },
  {
    feature: "Cascade efficiency score (\u03A5 Yield)",
    codeburn: "No",
    sigrank: "Yes (\u03A5 = cache_read \u00D7 output / input\u00B2)",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    codeburn: "No (cost and waste metrics, not cascade architecture)",
    sigrank: "Yes (derived cascade metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    codeburn: "No",
    sigrank: "Yes",
  },
  {
    feature: "Global operator leaderboard",
    codeburn: "No",
    sigrank: "Yes (public, ed25519-signed, 7d/30d/90d/all-time)",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    codeburn: "No",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    codeburn: "Yes",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    codeburn: "No",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    codeburn: "Yes (local-first, nothing leaves your machine)",
    sigrank: "Yes (token counts only, never prompts)",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a CodeBurn alternative?",
    answer:
      "They overlap on reading AI coding token logs but answer different questions. CodeBurn optimizes your spend — it scans for waste patterns (re-read files, low read:edit ratio, unused MCP servers, bloated CLAUDE.md), can apply fixes automatically, guards your budget with session caps, compares models, and correlates sessions to git commits. SigRank scores your cascade efficiency (Υ Yield) and ranks you on a public leaderboard against other operators. If you want to reduce your AI bill, CodeBurn is built for that. If you want to know how efficiently you drive your AI tools compared to everyone else, SigRank answers that. You can run both — they read the same logs.",
  },
  {
    question: "CodeBurn has a \u201Cyield\u201D feature. How is it different from SigRank\u2019s Yield?",
    answer:
      "They use the same word for different things. CodeBurn\u2019s yield correlates AI sessions to git commits — it classifies spend as productive, reverted, abandoned, or ambiguous based on whether commits landed in main. It answers \u201Cdid the money I spent actually ship?\u201D SigRank\u2019s Yield (Υ = cache_read × output / input²) measures the architecture of your token cascade — whether cached context is compounding into output or fresh input is burning without leverage. It answers \u201Cam I driving my AI tools efficiently?\u201D One is a git-attribution metric; the other is a token-efficiency metric. Both are useful; they are not the same thing.",
  },
  {
    question: "What does CodeBurn do that SigRank doesn\u2019t?",
    answer:
      "CodeBurn does several things SigRank doesn\u2019t: (1) waste scanning — it identifies specific inefficiencies like re-read files, low read:edit ratios, unused MCP servers, and bloated CLAUDE.md files; (2) fix application — it can apply fixes to your config interactively, with undo and auto-revert; (3) budget guarding — it installs hooks into Claude Code that warn or stop sessions at configurable cost caps; (4) model comparison — it compares models on one-shot rate, retry rate, cost per edit, and cache hit rate; (5) git-linked yield — it attributes sessions to commits to classify spend as productive or abandoned. SigRank doesn\u2019t modify your config, guard your budget, or compare models. It scores the operator.",
  },
  {
    question: "What does SigRank do that CodeBurn doesn\u2019t?",
    answer:
      "SigRank scores and ranks operators. The headline metric, Υ Yield = cache_read × output / input², measures cascade architecture — whether signal is compounding or burning. SigRank derives compression ratio, SNR, Leverage, Velocity, and 10xDEV from the same four token pillars. It assigns class tiers (IGNITER to ARCH+), publishes ed25519-signed snapshots to a public leaderboard, and supports head-to-head operator comparisons. CodeBurn optimizes your local setup; SigRank measures where you stand against the field. If you want to improve your spending efficiency, CodeBurn is the tool. If you want to know whether your cascade architecture is competitive, SigRank is the tool.",
  },
  {
    question: "Can I use both CodeBurn and SigRank?",
    answer:
      "Yes, and they complement each other well. Run CodeBurn to find and fix waste in your setup, guard your budget, and see whether your spend actually ships. Run SigRank to score your cascade efficiency and see where you rank. Both read the same local token logs — CodeBurn reads session files from 41 tools, SigRank\u2019s scanner reads token counts on-device. Install SigRank with \u2018npm install -g sigrank\u2019, enroll, and submit a signed snapshot to the leaderboard. Keep CodeBurn for the budget and waste view.",
  },
];

export default function VsCodeburnPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs CodeBurn", path: "/vs/codeburn" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs CodeBurn \u2014 Spend Optimization vs Operator Scoring",
            description: "CodeBurn optimizes AI coding spend across 41 tools. SigRank scores operator cascade efficiency and ranks on a public leaderboard. Different questions, same token logs.",
            path: "/vs/codeburn",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs CodeBurn"
        title="Spend Optimization vs Operator Scoring"
        subtitle={
          <>
            CodeBurn finds and fixes waste in your AI coding spend across 41
            tools. SigRank scores <span className="text-gold">how efficiently
            you drive them</span>. Both read the same token logs. They answer
            different questions.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          CodeBurn is a free, local-first tool that tracks AI coding token
          usage and cost across 41 tools and agents. It goes beyond cost
          tracking: it scans for waste patterns (re-read files, low read:edit
          ratio, unused MCP servers, bloated CLAUDE.md), can apply fixes
          automatically with undo, guards your budget with session caps,
          compares models on one-shot rate and cost per edit, and correlates
          sessions to git commits to see whether spend actually shipped. It
          is a serious spend-optimization tool.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank reads the same token telemetry and asks a different question:
          <strong className="text-text-primary"> is your cascade compounding
          or burning?</strong> The headline metric, Υ Yield = cache_read ×
          output / input², measures the architecture of your token cascade.
          SigRank derives compression ratio, SNR, Leverage, Velocity, and
          10xDEV, assigns class tiers, and publishes ed25519-signed snapshots
          to a public leaderboard. CodeBurn optimizes your setup; SigRank
          scores your skill. Both matter. They are not substitutes.
        </p>
      </section>

      {/* Comparison table */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Feature comparison
        </h2>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-elevated">
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  Feature
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  CodeBurn
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-gold">
                  SigRank
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((r) => (
                <tr
                  key={r.feature}
                  className="border-b border-bg-border-subtle last:border-0"
                >
                  <td className="px-4 py-2.5 text-text-primary">{r.feature}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {r.codeburn}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gold">
                    {r.sigrank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Two "yield" concepts */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Two “yield” concepts, different meanings
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Both tools use the word “yield,” but they measure different
          things. CodeBurn’s <span className="font-mono text-gold">yield</span>{" "}
          correlates AI sessions to git commits — it classifies spend as
          productive, reverted, abandoned, or ambiguous based on whether commits
          landed in main. It answers “did the money I spent actually
          ship?”
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank’s <span className="font-mono text-gold">Υ Yield</span>{" "}
          (cache_read × output / input²) measures the architecture of
          your token cascade — whether cached context is compounding into output
          or fresh input is burning without leverage. It answers “am I
          driving my AI tools efficiently?” One is a git-attribution
          metric; the other is a token-efficiency metric. Both are useful; they
          are not the same thing.
        </p>
      </section>

      {/* When to use which */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          When to use which
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <h3 className="font-mono text-sm font-bold text-text-primary">
              Use CodeBurn if…
            </h3>
            <ul className="mt-3 flex flex-col gap-1.5 font-sans text-sm text-text-secondary">
              <li>You want to reduce your AI coding spend</li>
              <li>You want to find and fix waste in your Claude Code setup</li>
              <li>You want budget caps that warn or stop expensive sessions</li>
              <li>You want to compare models on cost and one-shot rate</li>
              <li>You want to see whether your sessions actually shipped to git</li>
            </ul>
          </div>
          <div className="rounded-lg border border-gold/30 bg-gold/5 p-5">
            <h3 className="font-mono text-sm font-bold text-text-primary">
              Use SigRank if…
            </h3>
            <ul className="mt-3 flex flex-col gap-1.5 font-sans text-sm text-text-secondary">
              <li>You want to know how efficiently you drive your AI tools</li>
              <li>You want a cascade efficiency score (Υ Yield) and class tier</li>
              <li>You want to compare yourself against other operators on a leaderboard</li>
              <li>You want head-to-head operator comparisons with radar visuals</li>
              <li>You want an MCP server that lets your agent read its own metrics</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Frequently asked questions
        </h2>
        <dl className="flex flex-col gap-5">
          {FAQS.map((f) => (
            <div key={f.question} className="flex flex-col gap-1.5">
              <dt className="font-semibold text-text-primary">{f.question}</dt>
              <dd className="font-sans text-sm leading-relaxed text-text-secondary">
                {f.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Run both
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep CodeBurn for spend optimization and budget guarding. Add SigRank
          to score your cascade efficiency and see where you rank. Both read
          the same local token logs.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/score"
            className="rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 font-mono text-xs uppercase tracking-wide text-gold transition-colors hover:bg-gold/20"
          >
            Calculate your Υ Yield
          </Link>
          <Link
            href="/board/all"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            See the leaderboard
          </Link>
          <a
            href="https://github.com/getagentseal/codeburn"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
            rel="external"
          >
            CodeBurn on GitHub
          </a>
        </div>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/alternatives/ccusage-alternatives"
            className="text-gold underline underline-offset-2"
          >
            ccusage Alternatives
          </Link>
          {" \u00B7 "}
          <Link
            href="/vs/tokscale"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs Tokscale
          </Link>
          {" \u00B7 "}
          <Link
            href="/methodology"
            className="text-gold underline underline-offset-2"
          >
            Methodology
          </Link>
          {" \u00B7 "}
          <Link
            href="/tools/yield-calculator"
            className="text-gold underline underline-offset-2"
          >
            Yield Calculator
          </Link>
        </p>
      </section>
    </div>
  );
}
