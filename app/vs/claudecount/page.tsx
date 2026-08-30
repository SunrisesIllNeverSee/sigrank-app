/**
 * app/vs/claudecount/page.tsx — "SigRank vs claudecount" SEO comparison page.
 *
 * Angle: claudecount counts Claude Code tokens. SigRank scores cascades.
 * Counting is not scoring. A counter tells you what you spent; a scorecard
 * tells you whether the spend was worth it.
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
  title: "SigRank vs claudecount",
  description:
    "claudecount counts Claude Code tokens. SigRank scores cascades. Counting is not scoring. A counter tells you what you spent; a scorecard tells you whether the spend was worth it.",
  path: "/vs/claudecount",
});

const COMPARE_ROWS: { feature: string; claudecount: string; sigrank: string }[] = [
  {
    feature: "What it does",
    claudecount: "Counts Claude Code tokens",
    sigrank: "Scores operator cascade yield (Υ = cache_read × output / input²)",
  },
  {
    feature: "Cascade efficiency score (Υ Yield)",
    claudecount: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    claudecount: "No (raw counts)",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    claudecount: "No",
    sigrank: "Yes",
  },
  { feature: "Global operator leaderboard", claudecount: "No", sigrank: "Yes" },
  {
    feature: "Operator profiles + head-to-head compare",
    claudecount: "No",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    claudecount: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    claudecount: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform-neutral (Claude Code, Cursor, Copilot, Gemini, 15+)",
    claudecount: "Claude Code only",
    sigrank: "Yes",
  },
  {
    feature: "Bundled tools (tokscale, token-dashboard)",
    claudecount: "No",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    claudecount: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a claudecount alternative?",
    answer:
      "They overlap on reading Claude Code token telemetry but diverge on what they do with it. claudecount counts tokens — input, output, cache creation, cache read. SigRank scores the cascade those tokens describe. If you want a counter, claudecount is that. If you want to know whether your token usage is efficient, SigRank answers that. You can run both — they read the same logs.",
  },
  {
    question: "Why is counting not scoring?",
    answer:
      "Counting tells you what you spent; scoring tells you whether the spend was worth it. Two operators can burn the same 50K input tokens and get wildly different outcomes. One reuses cached context efficiently and produces 30K output tokens; the other re-sends the same context every turn and produces 3K. Same count, ten-fold difference in signal. On a counter, they look identical. On a yield leaderboard, the gap is obvious.",
  },
  {
    question: "What does claudecount not measure that SigRank does?",
    answer:
      "claudecount reports raw token counts per session. SigRank reads the same four pillars and derives the cascade architecture: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). claudecount tells you what you spent; SigRank tells you whether the cascade it describes is compounding or burning.",
  },
  {
    question: "Can I use both claudecount and SigRank?",
    answer:
      "Yes. claudecount gives you the raw token counts. SigRank gives you the scoring layer that counting cannot provide. Run `sigrank submit` to publish your cascade score to the SigRank leaderboard, and keep claudecount for the raw view. The two are complementary, not mutually exclusive. The same local logs feed both.",
  },
  {
    question: "Which is better for improving my AI coding efficiency?",
    answer:
      "SigRank. Counting can tell you when you're burning a lot, but it can't tell you why. Yield tracks the root cause: an operator whose Υ is low is burning fresh input without compounding cached context. Fix the cascade and the count drops automatically. claudecount shows the number; SigRank shows the meaning.",
  },
];

export default function VsClaudecountPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs claudecount", path: "/vs/claudecount" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs claudecount \u2014 Token Counting vs Cascade Scoring",
            description: "claudecount counts Claude Code tokens. SigRank scores cascades. Counting is not scoring. A counter tells you what you spent; a scorecard tells you whether the spend was worth it.",
            path: "/vs/claudecount",
          }),
        ]}
      />

      <WaveHero
        eyebrow="\u25C8 SigRank vs claudecount"
        title="Counting Is Not Scoring."
        subtitle={
          <>
            claudecount counts Claude Code tokens. SigRank scores
            <span className="text-gold"> the cascade</span> those tokens
            describe. A counter tells you what you spent; a scorecard tells you
            whether the spend was worth it.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: claudecount
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          claudecount is a simple token counter for Claude Code sessions. It
          reads your logs and prints the four pillars — input, output,
          cache-read, cache-write. It does its job: it <em>counts</em>. But
          counting is not scoring. Two operators can burn the same 50K input
          tokens and get wildly different outcomes. claudecount can&apos;t tell
          them apart.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank reads the same token telemetry and asks a different question:
          <strong className="text-text-primary"> is the cascade compounding or
          burning?</strong> The headline metric, Υ Yield = cache_read × output /
          input², rewards the operator who reuses cached context efficiently and
          penalizes the one who burns fresh input without leverage. claudecount
          gives you the numbers; SigRank tells you whether the cascade they
          describe is <em>compounding or burning</em>.
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
                  claudecount
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
                    {r.claudecount}
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

      {/* Why counting isn't scoring */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why counting isn&apos;t scoring
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          claudecount answers <em>&quot;how many tokens did I burn?&quot;</em>
          {" "}That&apos;s necessary but not sufficient. Two operators can burn
          the same 50K input tokens and get wildly different outcomes. One
          reuses cached context efficiently and produces 30K output tokens; the
          other re-sends the same context every turn and produces 3K. Same
          count, ten-fold difference in signal. On a counter, they look
          identical. On a yield leaderboard, the gap is obvious.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh input
          without leverage. claudecount gives you the four integers; SigRank
          tells you whether the cascade they describe is{" "}
          <em>compounding or burning</em>.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            The four token pillars (both tools read these)
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 font-sans text-sm text-text-secondary">
            <li>
              <strong className="text-text-primary">Input</strong>: tokens you
              send to the model
            </li>
            <li>
              <strong className="text-text-primary">Output</strong>: tokens the
              model generates back
            </li>
            <li>
              <strong className="text-text-primary">Cache-read</strong>: cached
              tokens reused from prior context
            </li>
            <li>
              <strong className="text-text-primary">Cache-write</strong>: new
              tokens written to cache for future reuse
            </li>
          </ul>
        </div>
      </section>

      {/* The upgrade path */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          From counting to scoring
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already run claudecount, you have the token counts. SigRank
          reads the same telemetry and adds the scoring layer counting never
          had:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
            {`npm install -g sigrank
sigrank enroll      # create your operator identity
sigrank submit      # reads logs, scores, signs, publishes`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Prefer to inspect before you submit? Run{" "}
          <span className="font-mono text-text-primary">
            sigrank me --dry-run
          </span>{" "}
          to see your scored payload locally, or paste your token counts into
          the{" "}
          <Link href="/score" className="text-gold underline underline-offset-2">
            /score calculator
          </Link>{" "}
          to compute your Υ Yield, class tier, and compression ratio instantly,
          no account, no submission, just the numbers.
        </p>
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
          Ready to see your yield?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep your counter for the raw view. Add the scorecard that turns those
          counts into a ranked, comparable signal. Install SigRank and submit
          your first signed snapshot in under a minute.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/score"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            Calculate your Υ Yield
          </Link>
          <Link
            href="/board/all"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            See the leaderboard
          </Link>
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
            href="/tools/yield-calculator"
            className="text-gold underline underline-offset-2"
          >
            Yield Calculator
          </Link>
          {" \u00B7 "}
          <Link
            href="/wiki/local-agent"
            className="text-gold underline underline-offset-2"
          >
            The Local Agent (MCP)
          </Link>
        </p>
      </section>
    </div>
  );
}
