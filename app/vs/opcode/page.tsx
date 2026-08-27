/**
 * app/vs/opcode/page.tsx — "SigRank vs opcode" SEO comparison page.
 *
 * Angle: opcode is a coding CLI — a tool you drive. SigRank scores the operator
 * driving any CLI. The tool isn't the skill; the cascade yield is.
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
  title: "SigRank vs opcode \u2014 The CLI vs The Operator Score",
  description:
    "opcode is an AI coding CLI. SigRank scores the operator using any CLI. The tool isn't the skill; the cascade yield is what gets measured and ranked.",
  path: "/vs/opcode",
});

const COMPARE_ROWS: { feature: string; opcode: string; sigrank: string }[] = [
  {
    feature: "What it is",
    opcode: "AI coding CLI / command-line tool",
    sigrank: "AI operator scoring + ranking platform",
  },
  {
    feature: "What it measures",
    opcode: "Nothing — it executes, doesn't measure",
    sigrank: "Operator cascade yield (Υ = cache_read × output / input²)",
  },
  {
    feature: "Cascade efficiency score (Υ Yield)",
    opcode: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    opcode: "No",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    opcode: "No",
    sigrank: "Yes",
  },
  { feature: "Global operator leaderboard", opcode: "No", sigrank: "Yes" },
  {
    feature: "Operator profiles + head-to-head compare",
    opcode: "No",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    opcode: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    opcode: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform-neutral (Claude Code, Cursor, Copilot, Gemini, 15+)",
    opcode: "Single tool",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    opcode: "N/A",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank an opcode alternative?",
    answer:
      "They solve different problems. opcode is an AI coding CLI — a tool you drive from the terminal. SigRank scores the operator driving any CLI. You don't choose between them; you use opcode (or Claude Code, Cursor, or any of 15+ tools) to code, then run `sigrank submit` to score how efficiently you drove it. The tool is not the skill; the cascade yield is.",
  },
  {
    question: "Why would I need SigRank if I already use opcode?",
    answer:
      "opcode helps you write code from the terminal but tells you nothing about how efficiently you're operating it. Are you compounding cached context or burning fresh input every turn? Is your yield high or low? Where do you rank against other operators? SigRank answers all three by reading the token telemetry your CLI generates and scoring it. The CLI is the tool; SigRank is the scorecard.",
  },
  {
    question: "What does opcode not measure that SigRank does?",
    answer:
      "opcode doesn't measure anything about the operator — it's a tool, not a measurement system. SigRank reads the four token pillars (input, output, cache-read, cache-write) from your AI coding sessions and derives the cascade architecture: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). opcode executes commands; SigRank scores the operator.",
  },
  {
    question: "Can I use both opcode and SigRank?",
    answer:
      "Yes — that's the intended setup. Use opcode (or any supported CLI) to write code. Run `sigrank submit` to read the token telemetry from those sessions, score your cascade yield, sign it with ed25519, and publish to the leaderboard. The CLI and the scorecard are complementary, not competitive.",
  },
  {
    question: "Which is better for improving my AI coding skill?",
    answer:
      "SigRank. opcode can make you faster at writing code, but it can't tell you whether you're getting better at operating AI. Yield tracks that: an operator whose Υ is rising is compounding cached context more efficiently over time. The CLI can't see that; the scorecard can.",
  },
];

export default function VsOpcodePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs opcode", path: "/vs/opcode" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs opcode \u2014 The CLI vs The Operator Score",
            description: "opcode is an AI coding CLI. SigRank scores the operator using any CLI. The tool isn't the skill; the cascade yield is what gets measured and ranked.",
            path: "/vs/opcode",
          }),
        ]}
      />

      <WaveHero
        eyebrow="\u25C8 SigRank vs opcode"
        title="The CLI Isn't the Skill. The Yield Is."
        subtitle={
          <>
            opcode is an AI coding CLI you drive from the terminal. SigRank
            scores <span className="text-gold">the operator</span>, not the
            tool. The CLI isn&apos;t the skill; the cascade yield is what gets
            measured and ranked.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: opcode
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          opcode is an AI coding CLI — a command-line tool that helps you write
          code from the terminal. It does its job: it executes, generates, and
          assists. But it tells you nothing about <em>how efficiently you&apos;re
          operating it</em>. Are you compounding cached context or burning fresh
          input every turn? Is your yield high or low? Where do you rank against
          other operators driving the same or different tools? opcode can&apos;t
          answer any of those questions.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank reads the token telemetry your CLI generates and scores the
          operator behind it. The headline metric,{" "}
          <strong className="text-text-primary">Υ Yield = cache_read ×
          output / input²</strong>, measures whether your cascade is compounding
          or burning. opcode is the tool; SigRank is the scorecard. Both matter.
          Only one tells you whether you&apos;re winning.
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
                  opcode
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
                    {r.opcode}
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

      {/* Why the tool isn't the skill */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The tool isn&apos;t the skill
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          opcode answers <em>&quot;can it execute?&quot;</em> Yes. But that&apos;s
          the wrong question for anyone who wants to know whether they&apos;re
          getting better at operating AI. Two operators can use the same CLI and
          get wildly different outcomes. One reuses cached context efficiently
          and produces 30K output tokens; the other re-sends the same context
          every turn and produces 3K. Same tool, ten-fold difference in signal.
          opcode can&apos;t see that gap.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh input
          without leverage. opcode gives you the CLI; SigRank tells you whether
          the cascade it produces is <em>compounding or burning</em>.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            The four token pillars (SigRank reads these from your CLI sessions)
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
          From CLI to scored operator
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already use opcode, you&apos;re generating the telemetry SigRank
          needs. Add the scoring layer the CLI can&apos;t provide:
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
          Keep your CLI. Add the scorecard that turns your sessions into a
          ranked, comparable signal. Install SigRank and submit your first
          signed snapshot in under a minute.
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
