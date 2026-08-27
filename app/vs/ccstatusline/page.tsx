/**
 * app/vs/ccstatusline/page.tsx — "SigRank vs ccstatusline" SEO comparison page.
 *
 * Angle: ccstatusline shows a token count in your terminal status bar. SigRank
 * turns that number into a ranked score. A status widget ≠ an instrument panel.
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
  title: "SigRank vs ccstatusline \u2014 Status Widget vs Instrument Panel",
  description:
    "ccstatusline shows a token count in your terminal status bar. SigRank turns that number into a ranked score. A status widget is not an instrument panel.",
  path: "/vs/ccstatusline",
});

// Comparison rows — feature-by-feature, ccstatusline vs SigRank.
const COMPARE_ROWS: { feature: string; ccstatusline: string; sigrank: string }[] = [
  {
    feature: "What it does",
    ccstatusline: "Shows token count in terminal status bar",
    sigrank: "Scores cascade efficiency and ranks operators globally",
  },
  {
    feature: "Headline output",
    ccstatusline: "A number in your status line",
    sigrank: "Yield (\u03A5) = (cache_read \u00D7 output) / input\u00B2",
  },
  {
    feature: "Cascade efficiency score (Υ Yield)",
    ccstatusline: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    ccstatusline: "No (single count)",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    ccstatusline: "No",
    sigrank: "Yes",
  },
  {
    feature: "Global operator leaderboard",
    ccstatusline: "No",
    sigrank: "Yes (Yield-ranked)",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    ccstatusline: "No",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    ccstatusline: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    ccstatusline: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform-neutral (Claude Code, Cursor, Copilot, Gemini, 15+)",
    ccstatusline: "Claude Code only",
    sigrank: "Yes",
  },
  {
    feature: "Bundled tools (tokscale, token-dashboard)",
    ccstatusline: "No",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    ccstatusline: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a ccstatusline alternative?",
    answer:
      "They serve different scales. ccstatusline is a status line widget for Claude Code — it shows a token count in your terminal status bar. It is a glanceable, ambient display: you see a number while you work. SigRank is an instrument panel: it takes that same number and turns it into a cascade efficiency score (Υ Yield), a class tier, a global leaderboard rank, and an operator profile. ccstatusline is the widget; SigRank is the panel. A status widget is not an instrument panel.",
  },
  {
    question: "Why is a status widget not an instrument panel?",
    answer:
      "A status widget shows you a single number — your current token count — in your status bar. It is ambient awareness, not evaluation. An instrument panel takes that number and derives meaning from it: is the cascade compounding or burning? What is your yield? What is your class tier? Where do you rank globally? ccstatusline shows you the oxygen sensor reading; SigRank turns that reading into a lap time, a ranking, and a pit strategy. Both matter. Only one tells you if you are winning.",
  },
  {
    question: "What does ccstatusline not measure that SigRank does?",
    answer:
      "ccstatusline shows a token count in your status bar. SigRank derives the cascade architecture from the same four pillars: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). ccstatusline tells you a number; SigRank tells you whether your cascade is compounding or burning. A widget is a display; a score is an evaluation.",
  },
  {
    question: "Can I use both ccstatusline and SigRank?",
    answer:
      "Yes, and they complement each other well. ccstatusline gives you the ambient token count in your terminal while you work. SigRank gives you the scored, ranked, comparable efficiency layer. Run ccstatusline for real-time awareness. Run `sigrank submit` to get your Yield score, class tier, and leaderboard rank. They read from the same local session logs and do not conflict. The widget is for glancing; the panel is for evaluating.",
  },
  {
    question: "Does ccstatusline work with tools other than Claude Code?",
    answer:
      "No. ccstatusline is a Claude Code status line widget — it reads Claude Code telemetry specifically. SigRank is platform-neutral: it works across Claude Code, Cursor, GitHub Copilot, ChatGPT, Gemini, and 15+ other platforms. If you only use Claude Code, ccstatusline is fine for ambient awareness. If you use multiple tools and want a comparable efficiency score across all of them, SigRank is the answer.",
  },
];

export default function VsCcstatuslinePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs ccstatusline", path: "/vs/ccstatusline" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs ccstatusline \u2014 Status Widget vs Instrument Panel",
            description: "ccstatusline shows a token count in your terminal status bar. SigRank turns that number into a ranked score. A status widget is not an instrument panel.",
            path: "/vs/ccstatusline",
          }),
        ]}
      />

      <WaveHero
        eyebrow="\u25C8 SigRank vs ccstatusline"
        title="A Status Widget Is Not an Instrument Panel"
        subtitle={
          <>
            ccstatusline shows a number in your status bar. SigRank turns that
            number into a <span className="text-gold">ranked score</span>. A
            widget is for glancing; a panel is for evaluating. Both matter.
            Only one tells you if you are winning.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: ccstatusline
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          ccstatusline is a status line widget for Claude Code. It shows a
          token count in your terminal status bar — a glanceable, ambient
          display of where your token usage stands right now. It does one thing
          well: it puts <em>a number in your peripheral vision</em> while you
          work. That is useful for awareness. But a single number in a status
          bar is not an evaluation. It does not tell you if you are efficient,
          where you rank, or whether your cascade is compounding.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank takes that same number and turns it into an{" "}
          <strong className="text-text-primary">instrument panel</strong>: a
          cascade-efficiency score (Υ Yield), a class tier, a global
          leaderboard, operator profiles, head-to-head comparisons, and an MCP
          server your AI agents can query. ccstatusline is the widget; SigRank
          is the panel. You don&apos;t throw away the widget — you graduate
          from it.
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
                  ccstatusline
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
                    {r.ccstatusline}
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

      {/* Why a widget isn't a panel */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why a status widget isn&apos;t an instrument panel
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          ccstatusline answers <em>&quot;what is my token count right
          now?&quot;</em> That is ambient awareness, not evaluation. Two
          operators can see the same number in their status bar and have wildly
          different efficiency. One reuses cached context efficiently and
          produces 30K output tokens; the other re-sends the same context every
          turn and produces 3K. Same status bar number, ten-fold difference in
          signal. ccstatusline shows the same widget either way.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh input
          without leverage. ccstatusline gives you the number; SigRank tells you
          whether the cascade it describes is{" "}
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
          From widget to panel
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already run ccstatusline, you have the token count. SigRank
          reads the same telemetry and turns that number into a scored, ranked,
          comparable signal:
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
          Keep your ccstatusline widget for ambient awareness. Add the scoring,
          the leaderboard, and the operator profile that turns that number into
          a rank. Install SigRank and submit your first signed snapshot in
          under a minute.
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
