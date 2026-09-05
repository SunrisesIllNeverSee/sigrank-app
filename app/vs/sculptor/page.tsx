/**
 * app/vs/sculptor/page.tsx — "SigRank vs sculptor" SEO comparison page.
 *
 * Angle: sculptor is a coding agent. SigRank scores the operator driving any
 * agent. The tool ≠ the operator.
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
  title: "SigRank vs sculptor \u2014 The Tool vs The Operator",
  description:
    "sculptor is an AI coding agent. SigRank scores the operator driving any agent. The tool is not the operator. Measure the driver, not the car.",
  path: "/vs/sculptor",
});

// Comparison rows — feature-by-feature, sculptor vs SigRank.
const COMPARE_ROWS: { feature: string; sculptor: string; sigrank: string }[] = [
  {
    feature: "What it is",
    sculptor: "AI coding agent / tool",
    sigrank: "Operator scoring and ranking system",
  },
  {
    feature: "What it evaluates",
    sculptor: "Writes code with AI (the tool itself)",
    sigrank: "The operator driving any AI tool",
  },
  {
    feature: "Cascade efficiency score (Υ Yield)",
    sculptor: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    sculptor: "No",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    sculptor: "No",
    sigrank: "Yes",
  },
  {
    feature: "Global operator leaderboard",
    sculptor: "No",
    sigrank: "Yes (Yield-ranked)",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    sculptor: "No",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    sculptor: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    sculptor: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform-neutral (Claude Code, Cursor, Copilot, Gemini, 15+)",
    sculptor: "Is one specific tool",
    sigrank: "Yes (scores operators across all tools)",
  },
  {
    feature: "Bundled tools (tokscale, token-dashboard)",
    sculptor: "No",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    sculptor: "N/A (is the tool, not a tracker)",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a sculptor alternative?",
    answer:
      "They are not the same category. sculptor is an AI coding agent — a tool that helps you write code with AI. SigRank is an operator scoring system — it evaluates the operator who drives any AI coding agent, including sculptor. sculptor is the tool; SigRank scores the operator who uses it. The tool is not the operator. You do not choose between them — you use sculptor to code, and SigRank to measure how efficiently you drove it.",
  },
  {
    question: "Why is the tool not the operator?",
    answer:
      "A coding agent is a tool — it executes instructions, generates code, processes context. The operator is the operator who drives it: what context they provide, how they manage the cascade, how efficiently they compound cached context into output. Two operators can use the same sculptor agent and have wildly different efficiency. One reuses cached context efficiently and produces 30K output tokens; the other re-sends the same context every turn and produces 3K. Same tool, ten-fold difference in signal. The tool does not determine the operator's skill.",
  },
  {
    question: "Can SigRank score me if I use sculptor?",
    answer:
      "Yes. SigRank is platform-neutral — it scores operators across Claude Code, Cursor, GitHub Copilot, Gemini, and 15+ other platforms. If sculptor produces token telemetry that SigRank can read, your cascade efficiency will be scored. Run `sigrank submit` to publish your cascade score to the leaderboard. SigRank measures the operator, not the tool, so your score is comparable to operators using any other AI coding agent.",
  },
  {
    question: "What does sculptor not measure that SigRank does?",
    answer:
      "sculptor is a coding agent — it does not measure operator efficiency at all. It is the tool being driven, not the instrument panel. SigRank derives the cascade architecture from the operator's token telemetry: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). sculptor writes the code; SigRank tells you whether the operator behind it is compounding or burning.",
  },
  {
    question: "Should I use sculptor or SigRank?",
    answer:
      "Both — they serve different purposes. Use sculptor as your AI coding agent to write code. Use SigRank to measure how efficiently you drive it and where you rank against other operators. The tool and the score are not competitors. sculptor is the car; SigRank is the lap time. You need the car to drive; you need the lap time to know if you are winning.",
  },
];

export default function VsSculptorPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs sculptor", path: "/vs/sculptor" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs sculptor \u2014 The Tool vs The Operator",
            description: "sculptor is an AI coding agent. SigRank scores the operator driving any agent. The tool is not the operator. Measure the driver, not the car.",
            path: "/vs/sculptor",
          }),
        ]}
      />

      <WaveHero
        eyebrow="\u25C8 SigRank vs sculptor"
        title="The Tool Is Not the Operator"
        subtitle={
          <>
            sculptor is a coding agent. SigRank{" "}
            <span className="text-gold">scores the operator</span> driving any
            agent. The car is not the driver. Measure the driver, not the car.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: sculptor
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          sculptor is an AI coding agent — a tool that helps you write code
          with AI. It is one of many coding agents available: Claude Code,
          Cursor, Copilot, Gemini, and sculptor among them. It does the coding
          agent layer well: it processes your instructions, generates code,
          manages context. But sculptor is the <em>tool</em>, not the operator.
          The tool does not measure the skill of the operator driving it.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is a different thing entirely: an{" "}
          <strong className="text-text-primary">operator scoring system</strong>.
          It reads token telemetry from any AI tool an operator drives —
          including sculptor — computes the cascade efficiency (Υ Yield), and
          ranks them globally. sculptor is the car; SigRank is the lap time.
          You need the car to drive; you need the lap time to know if you are
          winning.
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
                  sculptor
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
                    {r.sculptor}
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

      {/* Why the tool isn't the operator */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why the tool isn&apos;t the operator
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          sculptor is a coding agent — it executes instructions and generates
          code. The operator is the operator who drives it: what context they
          provide, how they manage the cascade, how efficiently they compound
          cached context into output. Two operators can use the same sculptor
          agent and have wildly different efficiency. One reuses cached context
          efficiently and produces 30K output tokens; the other re-sends the
          same context every turn and produces 3K. Same tool, ten-fold
          difference in signal. The tool does not determine the skill.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh input
          without leverage. sculptor writes the code; SigRank tells you whether
          the operator behind it is{" "}
          <em>compounding or burning</em>.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            The four token pillars (SigRank reads these from any tool)
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
          Score your sculptor sessions
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you use sculptor as your coding agent, SigRank can score your
          operator efficiency and rank you globally:
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
          Ready to see your cascade?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep sculptor as your coding agent. Add the scoring, the leaderboard,
          and the operator profile that measures the driver, not the car.
          Install SigRank and submit your first signed snapshot in under a
          minute.
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
