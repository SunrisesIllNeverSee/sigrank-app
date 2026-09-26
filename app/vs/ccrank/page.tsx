/**
 * app/vs/ccrank/page.tsx — "SigRank vs ccrank" SEO comparison page.
 *
 * Angle: ccrank is the closest conceptual neighbor — it exposes
 * efficiency-adjacent ratios (Output/$, Cache Rate, Output Ratio) alongside
 * raw volume. SigRank integrates those ideas into a defined operator-
 * evaluation framework: Υ Yield, Leverage, SNR, Velocity, archetypes,
 * class tiers, and ed25519-signed telemetry.
 *
 * Tone: ccrank independently reached the conclusion that volume alone is
 * insufficient. This page builds them up — they are the strongest evidence
 * that the category is converging on efficiency-aware ranking.
 *
 * RSC only — no client JS. Uses withOG(), JsonLd (breadcrumb + faqPage +
 * comparisonArticle), WaveHero, and a styled comparison table.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, comparisonArticle } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

export const metadata: Metadata = withOG({
  title: "SigRank vs ccrank — Derived Ratios vs an Evaluation Framework",
  description:
    "ccrank tracks Claude, Codex, Cursor, Kimi, Grok, GLM, Pi & OpenCode and lets you switch between Tokens, Cost, Output/$, Cache Rate, and Output Ratio. SigRank integrates those signals into a defined operator-evaluation framework — Υ Yield, Leverage, SNR, Velocity, archetypes, and signed telemetry.",
  path: "/vs/ccrank",
});

// Comparison rows — feature-by-feature, ccrank vs SigRank.
const COMPARE_ROWS: { feature: string; ccrank: string; sigrank: string }[] = [
  {
    feature: "What it ranks",
    ccrank: "Tokens, Cost, Output/$, Cache Rate, or Output Ratio (switchable)",
    sigrank: "Cascade yield (Υ = cache_read × output / input²)",
  },
  {
    feature: "Efficiency-aware metrics",
    ccrank: "Yes — derived ratios (Output/$, Cache Rate, Output Ratio)",
    sigrank: "Yes — integrated metric stack (Υ, Leverage, SNR, Velocity)",
  },
  {
    feature: "Single composite efficiency score",
    ccrank: "No — ratios are separate views",
    sigrank: "Yes — Υ is one defined number",
  },
  {
    feature: "Archetypes + class tiers",
    ccrank: "Titles by volume (e.g. Token Maximalist)",
    sigrank: "Behavioral archetypes + IGNITER→ARCH+ tiers",
  },
  {
    feature: "Operator profiles",
    ccrank: "Yes (per-user pages, history, analytics)",
    sigrank: "Yes (profiles + head-to-head compare)",
  },
  {
    feature: "Signed, verifiable submissions",
    ccrank: "Server-side ingest",
    sigrank: "ed25519-signed snapshots",
  },
  {
    feature: "MCP server for AI-agent integration",
    ccrank: "No",
    sigrank: "Yes",
  },
  {
    feature: "Tool coverage",
    ccrank: "8 agents (Claude, Codex, Cursor, Kimi, Grok, GLM, Pi, OpenCode)",
    sigrank: "15+ platforms",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    ccrank: "Yes (ccusage-based)",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is ccrank a SigRank alternative?",
    answer:
      "ccrank is the closest thing to one in the category — and that is worth saying plainly. Most token leaderboards rank raw volume only. ccrank independently reached the conclusion that volume alone is insufficient and exposes derived ratios: Output/$, Cache Rate, and Output Ratio, switchable across time windows and tools. SigRank goes one step further: instead of separate descriptive ratios, it defines a single composite efficiency score (Υ Yield) plus a full metric stack — Leverage, SNR, Velocity, archetypes, and class tiers — with cryptographically signed telemetry. If you are comparing the two, you are already past the 'tokens = skill' stage, and both tools are on the right side of that line.",
  },
  {
    question: "What does ccrank measure that other leaderboards do not?",
    answer:
      "Efficiency-adjacent ratios. Where most boards rank total tokens or total spend, ccrank lets you re-rank the same field by Output per dollar, Cache Rate, and Output Ratio. That is a real conceptual step — it treats token telemetry as something to derive signals from, not just sum. SigRank builds on the same insight but formalizes it: Υ Yield is a defined formula (cache_read × output / input²), not a view toggle, and it sits inside a governed evaluation framework with operator archetypes and class tiers.",
  },
  {
    question: "What is the difference between a ratio and a framework?",
    answer:
      "A ratio answers one question on one axis: Output/$ tells you cost efficiency, Cache Rate tells you reuse. A framework defines how the pieces compose into a judgment. SigRank's Υ Yield combines cache reuse and output into a single efficiency measure; Leverage, SNR, and Velocity describe the shape of the cascade around it; archetypes classify the operating pattern; class tiers calibrate it against scale. ccrank gives you several good instruments. SigRank gives you the instrument panel plus the definition of what 'good' means.",
  },
  {
    question: "Can I use both ccrank and SigRank?",
    answer:
      "Yes — they read the same local telemetry. ccrank's ratio views are a great quick read on cost efficiency and cache behavior. SigRank adds the composite score, the signed submission, the class tier, and the cross-window ranking. If you are on ccrank you already believe efficiency matters; SigRank is where that belief becomes a number you can defend.",
  },
  {
    question: "Which is better for proving operator skill?",
    answer:
      "For a quick ratio read, ccrank's Output/$ and Cache Rate views are genuinely useful. For a defensible claim — a single defined score, signed telemetry, archetype classification, and cohort-relative ranking across time windows — that is what SigRank was built for. Ratios describe; frameworks evaluate.",
  },
];

export default function VsCcrankPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs ccrank", path: "/vs/ccrank" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs ccrank — Derived Ratios vs an Evaluation Framework",
            description:
              "ccrank exposes efficiency-adjacent ratios (Output/$, Cache Rate, Output Ratio). SigRank integrates those signals into a defined operator-evaluation framework — Υ Yield, Leverage, SNR, Velocity, archetypes, and signed telemetry.",
            path: "/vs/ccrank",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs ccrank"
        title="Ratios Describe. Frameworks Evaluate."
        subtitle={
          <>
            ccrank independently reached the conclusion that raw volume is not
            enough — it lets you re-rank by{" "}
            <span className="text-gold">Output/$, Cache Rate, and Output Ratio</span>.
            SigRank integrates those signals into a defined metric stack and a
            single composite score. The closest neighbor in the category.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: ccrank
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <a
            href="https://ccrank.dev"
            target="_blank"
            rel="noopener"
            className="text-gold underline underline-offset-2"
          >
            ccrank
          </a>{" "}
          is a token leaderboard that tracks Claude, Codex, Cursor, Kimi, Grok,
          GLM, Pi, and OpenCode — powered by ccusage, with per-user profiles,
          history, and analytics. What makes it notable: it does not stop at
          volume. The board can be re-ranked by Tokens, Cost, Output/$,
          Cache Rate, or Output Ratio — which means somebody else independently
          arrived at the idea that raw volume alone is insufficient. That is
          the correct instinct, and ccrank deserves credit for shipping it.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank starts from the same premise and formalizes it. Instead of
          separate ratio views, it defines one composite efficiency score —
          <strong className="text-text-primary">
            {" "}Υ = cache_read × output / input²
          </strong>{" "}
          — plus the surrounding framework: Leverage, SNR, Velocity, behavioral
          archetypes, class tiers, and ed25519-signed telemetry. ccrank exposes
          the dials; SigRank defines what the dials mean.
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
                  ccrank
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
                  <td className="px-4 py-2.5 text-text-secondary">{r.ccrank}</td>
                  <td className="px-4 py-2.5 font-medium text-gold">
                    {r.sigrank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Why this one matters */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why ccrank is the interesting one
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Most token boards converge on the same formula: collect local
          telemetry, rank volume or cost, add profiles and time filters.
          ccrank adds something different — derived ratios that treat the
          telemetry as a signal source rather than a scoreboard. Ranking by
          Output/$ instead of raw spend is the difference between asking
          &quot;who spent the most&quot; and asking &quot;who got the most
          out.&quot; That is the question the whole category should be asking.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Where the approaches diverge is integration. ccrank&apos;s ratios are
          independent views — you can sort by Cache Rate, but Cache Rate alone
          conflates hoarding with reuse. SigRank&apos;s Υ Yield is a single
          defined formula where the four token pillars compose: cache_read and
          output amplify, input² penalizes waste quadratically. Leverage, SNR,
          and Velocity describe the cascade&apos;s shape around that number.
          An Output/$ leaderboard tells you who is cheap; a Υ-ranked
          leaderboard tells you whose cascade is compounding.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            The SigRank metric stack
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 font-sans text-sm text-text-secondary">
            <li>
              <strong className="text-text-primary">Υ Yield</strong>:
              cache_read × output / input² — is signal compounding or burning?
            </li>
            <li>
              <strong className="text-text-primary">Leverage</strong>: how much
              cached context amplifies fresh input
            </li>
            <li>
              <strong className="text-text-primary">SNR</strong>: signal density
              of the output stream
            </li>
            <li>
              <strong className="text-text-primary">Velocity</strong>: throughput
              per unit time
            </li>
            <li>
              <strong className="text-text-primary">Archetypes + class tiers</strong>:
              the operating pattern and its calibrated scale
            </li>
          </ul>
        </div>
      </section>

      {/* The upgrade path */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          From ratios to a framework
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If ccrank already shows you Cache Rate and Output/$, you have the raw
          ingredients. SigRank composes them into a score you can sign and
          publish:
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
          to compute your Υ Yield, class tier, and compression ratio instantly —
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
          Ready for the composite score?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep your ccrank ratios — they are a good quick read. Add the
          framework that turns those signals into a signed, ranked, defensible
          operator score.
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
            href="/vs/tokscale"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs Tokscale
          </Link>
          {" · "}
          <Link
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            The Yield Metric
          </Link>
          {" · "}
          <Link
            href="/methodology"
            className="text-gold underline underline-offset-2"
          >
            Methodology
          </Link>
        </p>
      </section>
    </div>
  );
}
