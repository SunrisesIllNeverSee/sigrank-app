/**
 * app/vs/ccburn/page.tsx — "SigRank vs ccburn" SEO comparison page.
 *
 * Angle: ccburn shows your burn rate in real time. SigRank shows your yield
 * rate. Speed of burning ≠ quality of operating.
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
  title: "SigRank vs ccburn \u2014 Burn Rate vs Yield Rate",
  description:
    "ccburn shows your Claude Code burn rate in real time. SigRank shows your yield rate. Speed of burning is not quality of operating.",
  path: "/vs/ccburn",
});

// Comparison rows — feature-by-feature, ccburn vs SigRank.
const COMPARE_ROWS: { feature: string; ccburn: string; sigrank: string }[] = [
  {
    feature: "What it shows",
    ccburn: "Real-time Claude Code burn rate",
    sigrank: "Cascade yield rate + class tier + leaderboard rank",
  },
  {
    feature: "Headline metric",
    ccburn: "Tokens burned per unit time",
    sigrank: "Yield (\u03A5) = (cache_read \u00D7 output) / input\u00B2",
  },
  {
    feature: "Cascade efficiency score (Υ Yield)",
    ccburn: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    ccburn: "No (burn rate only)",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    ccburn: "No",
    sigrank: "Yes",
  },
  {
    feature: "Global operator leaderboard",
    ccburn: "No",
    sigrank: "Yes (Yield-ranked)",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    ccburn: "No",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    ccburn: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    ccburn: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform-neutral (Claude Code, Cursor, Copilot, Gemini, 15+)",
    ccburn: "Claude Code only",
    sigrank: "Yes",
  },
  {
    feature: "Bundled tools (tokscale, token-dashboard)",
    ccburn: "No",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    ccburn: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a ccburn alternative?",
    answer:
      "They measure different rates. ccburn shows your Claude Code burn rate in real time — how fast you are burning tokens right now. SigRank shows your yield rate: Υ = cache_read × output / input². Burn rate tells you how fast you are spending; yield rate tells you how efficiently you are compounding. Speed of burning is not quality of operating. You can run both — ccburn for the real-time burn dashboard, SigRank for the efficiency score and leaderboard.",
  },
  {
    question: "Why is burn rate not the same as yield rate?",
    answer:
      "Burn rate measures how fast you consume tokens. Yield rate measures how efficiently you compound them. An operator burning tokens fast but re-sending the same context every turn has a high burn rate and a low yield. An operator burning tokens slowly but compounding cached context into high-yield output has a low burn rate and a high yield. Speed of burning is consumption velocity; yield is signal efficiency. The first tells you how fast you are spending; the second tells you whether the spending is worth it.",
  },
  {
    question: "What does ccburn not measure that SigRank does?",
    answer:
      "ccburn reports tokens burned per unit time. SigRank derives the cascade architecture from the same four pillars: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). ccburn tells you how fast you are burning; SigRank tells you whether your cascade is compounding or burning. Burn rate is a speedometer; yield is a lap time.",
  },
  {
    question: "Can I use both ccburn and SigRank?",
    answer:
      "Yes. ccburn is a real-time burn-rate monitor; SigRank is a scoring and ranking tool. Run ccburn for the live burn-rate dashboard while you work. Run `sigrank submit` to get your Yield score, class tier, and leaderboard rank. They read from the same local session logs and do not conflict. ccburn is for real-time awareness; SigRank is for evaluation and competition.",
  },
  {
    question: "Does ccburn work with tools other than Claude Code?",
    answer:
      "No. ccburn is a Claude Code burn-rate tracker — it reads Claude Code logs specifically. SigRank is platform-neutral: it works across Claude Code, Cursor, GitHub Copilot, ChatGPT, Gemini, and 15+ other platforms. If you only use Claude Code, ccburn is fine for real-time burn monitoring. If you use multiple tools and want a comparable efficiency score across all of them, SigRank is the answer.",
  },
];

export default function VsCcburnPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs ccburn", path: "/vs/ccburn" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs ccburn \u2014 Burn Rate vs Yield Rate",
            description: "ccburn shows your Claude Code burn rate in real time. SigRank shows your yield rate. Speed of burning is not quality of operating.",
            path: "/vs/ccburn",
          }),
        ]}
      />

      <WaveHero
        eyebrow="\u25C8 SigRank vs ccburn"
        title="Speed of Burning Is Not Quality of Operating"
        subtitle={
          <>
            ccburn shows your burn rate in real time. SigRank shows your{" "}
            <span className="text-gold">yield rate</span>. A speedometer tells
            you how fast you are spending; a lap time tells you how well you
            are driving.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: ccburn
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          ccburn is a Claude Code burn-rate tracker. It shows how fast you are
          burning tokens in real time — a live speedometer for token
          consumption. It does one thing well: it shows you{" "}
          <em>how fast you are spending</em>. That is useful for awareness —
          knowing when you are burning hot. But burn rate is a consumption
          velocity, not an efficiency metric. Burning fast does not mean
          burning well.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank takes the same token telemetry and asks a different question:
          <strong className="text-text-primary"> how efficiently are you
          compounding?</strong> The headline metric, Υ Yield = cache_read ×
          output / input², rewards the operator who reuses cached context
          efficiently and penalizes the one who burns fresh input without
          leverage. ccburn is the speedometer; SigRank is the lap time. Both
          matter. Only one tells you if you are winning.
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
                  ccburn
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
                    {r.ccburn}
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

      {/* Why burn rate isn't yield rate */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why burn rate isn&apos;t yield rate
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          ccburn answers <em>&quot;how fast am I burning tokens?&quot;</em>{" "}
          That is a consumption velocity, not an efficiency metric. Two
          operators can burn tokens at the same rate and get wildly different
          outcomes. One reuses cached context efficiently and produces 30K
          output tokens; the other re-sends the same context every turn and
          produces 3K. Same burn rate, ten-fold difference in signal. ccburn
          sees the same speed either way.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh input
          without leverage. ccburn gives you the burn rate; SigRank tells you
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
          From burn rate to yield rate
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already run ccburn, you have the token telemetry. SigRank reads
          the same logs and adds the scoring layer burn-rate monitors never had:
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
          Keep your ccburn dashboard for real-time burn awareness. Add the
          scoring, the leaderboard, and the operator profile that turns that
          burn rate into a rank. Install SigRank and submit your first signed
          snapshot in under a minute.
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
