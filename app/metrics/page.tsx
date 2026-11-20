/**
 * app/metrics/page.tsx — Metrics index.
 *
 * Hub page listing the SigRank metric definition pages and carrying short
 * definitions (anchored sections) for metrics without their own page. Each child page carries
 * DefinedTerm + FAQPage + BreadcrumbList schema. This index adds an ItemList
 * so AI engines see the full metric set as a structured collection.
 *
 * JSON-LD: breadcrumb() + ItemList.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG, SITE_ORIGIN } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { WaveHero } from "@/components/ui/WaveHero";
import { MetricsWorkspaceFrame } from "@/components/metrics/MetricsWorkspaceFrame";
import { breadcrumb, alternativesItemList, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Metrics — AI Operator Token Efficiency Definitions",
  description:
    "The SigRank metrics: Yield (Υ), Cache Hit Rate, Leverage, Velocity, Signal-to-Noise Ratio and Efficiency, plus short definitions of Scale V, Output Flow Share, Context Activity Ratio, Active Output Share, and Compression Ratio (a word-era metric).",
  path: "/metrics",
});

export const revalidate = 86400;

const METRICS = [
  {
    href: "/metrics/yield-cascade",
    title: "Yield (Υ) — Token Cascade Efficiency",
    desc: "Υ = (cache_read × output) / input² — the headline SigRank metric. What cascade yield measures, how to improve it, and class tier mapping.",
  },
  {
    href: "/metrics/cache-hit-rate",
    title: "Cache Hit Rate — Context Reuse Efficiency",
    desc: "cache_read / (cache_read + cache_write) — how well you reuse prompt-cached context. The highest-leverage AI coding metric.",
  },
  {
    href: "/metrics/leverage",
    title: "Leverage — Cached Context Amplification",
    desc: "cache_read / input — how much cached context amplifies your fresh input. What token leverage means and how to increase it.",
  },
  {
    href: "/metrics/velocity",
    title: "Velocity — Output per Fresh Input",
    desc: "output / input — output efficiency ratio in AI coding. Why it's a secondary metric and how it interacts with yield.",
  },
  {
    href: "/metrics/signal-to-noise-ratio",
    title: "Signal-to-Noise Ratio (SNR) — Signal Density",
    desc: "output / (input + output) — output share of fresh conversational traffic. What signal vs noise means and its link to the Conservation Law.",
  },
  {
    href: "/metrics/efficiency",
    title: "Efficiency — Operational Amplification",
    desc: "(cache_read + cache_write + output) / (4 * input) — total operational amplification versus the AA 7:2:1 baseline. The only public metric that includes cache_write.",
  },
];

/**
 * Short definitions moved from the retired /wiki/metrics/* pages and
 * /metrics/compression-ratio (2026-11 consolidation). Each section has an id
 * anchor; the old URLs 308 to /metrics. Text is carried over, not rewritten.
 */
const MOVED = [
  {
    id: "scale-v",
    title: "Scale V — Recorded Token Activity",
    definition:
      "The base-10 logarithm of the sum of recorded input, output, cache-write, and cache-read token counts over the selected measurement window. Every increase of 1 corresponds to ten times the recorded activity volume. The raw Total Tokens figure remains separately available.",
    formula: "Scale V = log₁₀(I + O + W + R), for positive recorded totals. A total of one million tokens gives Scale V = 6; ten million gives 7.",
    inputs: "Input (I), Output (O), Cache-write (W), Cache-read (R), as nonnegative recorded token counts from the same window.",
    claim:
      "Scale V measures order-of-magnitude token activity, not whether tokens are unique, meaningful, relevant, newly generated, or successfully retrieved. Cache-read tokens can be reused context; these still count as recorded activity, not distinct content.",
    limitations:
      "A large token total can reflect repeated context rather than new information. Scale V is not Yield, Leverage, efficiency, unique-content volume, a quality measure, or a validated \u201cneedle in a haystack\u201d detection metric. Unavailable or zero totals cannot produce a meaningful positive logarithmic scale.",
    test:
      "For a positive total, sum the four raw counters and take log₁₀ of their total; multiplying all counters by ten must increase Scale V by one. Compare against the raw Total Tokens column and CSV export.",
    observable: "Scale V and raw Total Tokens in the leaderboard\u2019s selected time window.",
    falsifiers:
      "If Scale V differs from log₁₀ of the four recorded pillars (for a positive total) or is presented as a retrieval-success signal, the presentation is incorrect.",
    evidence:
      "Deterministic formula over token-only telemetry; leaderboard export retains exact recorded total. No assessment of underlying prompt or response content is performed.",
    evidenceLevel: "Production evidence",
    lineage: "Four-pillar token telemetry, derived measurement. The distinct efficiency and reuse metrics are explained separately.",
    lastUpdated: "2026-10-12",
    related: [{ label: "Yield (Υ)", href: "/metrics/yield-cascade" }, { label: "Leverage", href: "/metrics/leverage" }, { label: "Velocity", href: "/metrics/velocity" }, { label: "Leaderboard", href: "/board/all" }],
  },
  {
    id: "output-flow-share",
    title: "Output Flow Share",
    definition:
      "The fraction of total token flow that is output. Measures what proportion of all token movement is productive output.",
    formula: "output_flow_share = output / (input + output + cache_creation + cache_read)",
    inputs: "output, input, cache_creation, cache_read.",
    claim:
      "Output flow share measures how much of the total token throughput is actual output vs cache operations and input.",
    limitations:
      "Does not distinguish useful output from verbose output. Confounded by cache-heavy workflows.",
    test:
      "Verify the formula for known inputs. Check that it sums to 1 with other flow shares.",
    observable: "The numeric output flow share value (0 to 1).",
    falsifiers:
      "If output flow share does not equal output / total_tokens, the implementation is wrong.",
    evidence:
      "Computed from field data. Used in composition analysis.",
    evidenceLevel: "Repeated experiment",
    lineage: "SigRank composition analysis, cascade ontology. Architecture: mos2es.com/architecture.",
    lastUpdated: "2026-09-01",
    related: [{ label: "Context Activity Ratio", href: "#context-activity-ratio" }, { label: "Active Output Share", href: "#active-output-share" }, { label: "Composition", href: "/wiki/measurement/composition" }],
  },
  {
    id: "context-activity-ratio",
    title: "Context Activity Ratio",
    definition:
      "The ratio of cache activity (creation + read) to fresh input. Measures how much an operator invests in context vs fresh prompting.",
    formula: "context_activity_ratio = (cache_creation + cache_read) / max(input, 1)",
    inputs: "cache_creation, cache_read, input.",
    claim:
      "Context activity ratio measures the operator\u2019s investment in building and reusing context relative to fresh input.",
    limitations:
      "High ratio may indicate efficient context reuse OR may indicate excessive caching overhead.",
    test:
      "Verify the formula for known inputs.",
    observable: "The numeric context activity ratio value.",
    falsifiers:
      "If the ratio does not equal (cache_creation + cache_read) / max(input, 1), the implementation is wrong.",
    evidence:
      "Computed from field data. Used in workflow friction analysis.",
    evidenceLevel: "Repeated experiment",
    lineage: "Upsilon workflow friction analysis. Architecture: mos2es.com/architecture.",
    lastUpdated: "2026-09-01",
    related: [{ label: "Output Flow Share", href: "#output-flow-share" }, { label: "Active Output Share", href: "#active-output-share" }],
  },
  {
    id: "active-output-share",
    title: "Active Output Share",
    definition:
      "The fraction of output relative to all active token movement (output + cache_creation). Measures how much active generation is output vs cache building.",
    formula: "active_output_share = output / max(output + cache_creation, 1)",
    inputs: "output, cache_creation.",
    claim:
      "Active output share measures the proportion of active generation that is output vs cache creation \u2014 distinguishing productive output from context investment.",
    limitations:
      "Does not account for cache_read (reuse). A high share may indicate insufficient context building.",
    test:
      "Verify the formula for known inputs.",
    observable: "The numeric active output share value (0 to 1).",
    falsifiers:
      "If the share does not equal output / (output + cache_creation), the implementation is wrong.",
    evidence:
      "Computed from field data. Used in composition analysis.",
    evidenceLevel: "Repeated experiment",
    lineage: "SigRank composition analysis. Architecture: mos2es.com/architecture.",
    lastUpdated: "2026-09-01",
    related: [{ label: "Output Flow Share", href: "#output-flow-share" }, { label: "Context Activity Ratio", href: "#context-activity-ratio" }],
  },
] as const;

export default function MetricsIndex() {
  return (
    <MetricsWorkspaceFrame
      title="METRICS"
      hero={
        <WaveHero
          eyebrow="SIGRANK"
          terminalText="METRICS"
          title="Metrics"
          subtitle={<>Every comparable operator metric, defined.</>}
        />
      }
    >
    <div className="flex flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([{ name: "Metrics", path: "/metrics" }]),
          alternativesItemList(
            [
              ...METRICS.map((m) => ({ name: m.title, url: `${SITE_ORIGIN}${m.href}` })),
              ...MOVED.map((m) => ({ name: m.title, url: `${SITE_ORIGIN}/metrics#${m.id}` })),
              { name: "Compression Ratio — Word-Era Metric", url: `${SITE_ORIGIN}/metrics#compression-ratio` },
            ],
            "/metrics",
            "SigRank Metrics — All Definitions",
          ),
        ]}
      />
      <JsonLd
        data={faqPage([
          {
            question: "What is Yield (Υ) in AI coding?",
            answer:
              "Yield (Υ) is the headline SigRank metric: Υ = (cache_read × output) / input². It measures how much reusable signal you create from each unit of fresh input. High yield means you're compounding cached context, not burning tokens. Input is squared because re-pasting the same context costs quadratically.",
          },
          {
            question: "What is cache hit rate?",
            answer:
              "Cache hit rate = cache_read / (cache_read + cache_write). It measures how well you reuse prompt-cached context versus writing new context. A high cache hit rate means you're warming the cache and reusing it — the highest-leverage AI coding metric for reducing cost.",
          },
          {
            question: "What is leverage in SigRank?",
            answer:
              "Leverage = cache_read / input. It measures how much cached context amplifies your fresh input. A leverage of 20× means you're reusing 20 tokens of cached context for every 1 token of fresh input. High leverage is the hallmark of efficient AI operators.",
          },
          {
            question: "What is velocity in AI coding?",
            answer:
              "Velocity = output / input. It measures how much real output you get per token of fresh input. Velocity is a secondary metric — high velocity with low leverage means you're productive but not compounding. Yield combines both reuse (leverage) and output (velocity).",
          },
          {
            question: "What is signal-to-noise ratio (SNR)?",
            answer:
              "SNR = output / (input + output). It measures the output share of fresh conversational traffic — what fraction of your token flow is actual output vs input. High SNR means your sessions are output-heavy, not input-heavy. SNR is linked to the Conservation Law of Commitment.",
          },
          {
            question: "What is the efficiency metric?",
            answer:
              "Efficiency = (cache_read + cache_write + output) / (4 × input). It measures total operational amplification versus the AA 7:2:1 baseline. It's the only public SigRank metric that includes cache_write, making it the most complete measure of cascade utilization.",
          },
        ])}
      />

      <div className="flex flex-col gap-6">
        {METRICS.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-gold/40"
          >
            <h2 className="font-sans text-xl font-bold text-text-primary group-hover:text-gold">
              {m.title}
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              {m.desc}
            </p>
          </Link>
        ))}
      </div>

      <section className="flex flex-col gap-2" aria-labelledby="more-definitions">
        <h2 id="more-definitions" className="font-sans text-2xl font-bold text-text-primary">
          More metric definitions
        </h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          Shorter definitions for the remaining metrics. Each stays on this page
          because it has no separate reference page.
        </p>
      </section>

      <div className="flex flex-col gap-6">
        {MOVED.map((m) => (
          <section
            key={m.id}
            id={m.id}
            className="flex scroll-mt-24 flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-5"
          >
            <h3 className="font-sans text-xl font-bold text-text-primary">{m.title}</h3>
            <p className="text-sm leading-relaxed text-text-secondary">{m.definition}</p>
            <p className="font-mono text-sm text-text-primary">{m.formula}</p>
            <p className="text-sm leading-relaxed text-text-secondary">
              <strong className="text-text-primary">Inputs:</strong> {m.inputs}
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              <strong className="text-text-primary">What it measures:</strong> {m.claim}
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              <strong className="text-text-primary">Limitations:</strong> {m.limitations}
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              <strong className="text-text-primary">Test:</strong> {m.test}
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              <strong className="text-text-primary">Observable:</strong> {m.observable}
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              <strong className="text-text-primary">Falsifiers:</strong> {m.falsifiers}
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              <strong className="text-text-primary">Evidence:</strong> {m.evidence}
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              <strong className="text-text-primary">Evidence level:</strong> {m.evidenceLevel}.{" "}
              <strong className="text-text-primary">Spec version:</strong> TTEOP (Token Telemetry
              Evaluation Operator Protocol) v0.1-draft.{" "}
              <strong className="text-text-primary">Last updated:</strong> {m.lastUpdated}.
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              <strong className="text-text-primary">Lineage:</strong> {m.lineage}
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              <strong className="text-text-primary">Related:</strong>{" "}
              {m.related.map((r, i) => (
                <span key={r.href}>
                  {i > 0 && " · "}
                  <Link href={r.href} className="text-gold underline underline-offset-2">
                    {r.label}
                  </Link>
                </span>
              ))}
            </p>
          </section>
        ))}

        <section
          id="compression-ratio"
          className="flex scroll-mt-24 flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-5"
        >
          <h3 className="font-sans text-xl font-bold text-text-primary">
            Compression Ratio — word-era (historical)
          </h3>
          <p className="text-sm leading-relaxed text-text-secondary">
            Compression Ratio (ticker <strong className="text-text-primary">COMP</strong>,
            canonical id M.01) is a <strong className="text-text-primary">word-era</strong> SigRank
            metric. It is retained as background for the planned evolution to word-based ranking,
            and the board still shows it as a legacy Compression view. It is not one of the
            token-era metrics.
          </p>
          <p className="text-sm leading-relaxed text-text-secondary">
            Compression Ratio was the first of SigRank&rsquo;s original Core 5 metrics, alongside
            Prompt Complexity and the others. It was a bounded 0 to 1 score rather than a count:
            the SigRank badge criteria for structural badges such as Compression Forge are written
            as thresholds on that 0 to 1 scale (for example, a Compression score of 0.85 or
            higher). This site does not publish a token formula for Compression Ratio.
          </p>
          <p className="text-sm leading-relaxed text-text-secondary">
            The token-era output-per-fresh-input ratio is{" "}
            <Link href="/metrics/velocity" className="text-gold underline underline-offset-2">
              Velocity
            </Link>
            : <span className="font-mono text-text-primary">Velocity = output / input</span>, a
            secondary metric and one of the two terms of{" "}
            <Link href="/metrics/yield-cascade" className="text-gold underline underline-offset-2">
              Yield (Υ)
            </Link>
            , the headline: Υ = (cache_read / input) × (output / input), which is leverage ×
            velocity. For how the board is built, see the{" "}
            <Link href="/methodology" className="text-gold underline underline-offset-2">
              methodology
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
    </MetricsWorkspaceFrame>
  );
}
