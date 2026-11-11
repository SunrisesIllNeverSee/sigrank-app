/**
 * app/metrics/compression-ratio/page.tsx — "Compression Ratio — Word-Era Metric"
 *
 * Per canon (lib/identity/canon-ids.ts M.01, ticker COMP, era "word"),
 * Compression Ratio is a WORD-ERA SigRank metric. The board still shows it as a
 * legacy Compression view. canon defines no token formula for it. The token-era
 * output-per-fresh-input ratio is Velocity (Y.04, T.01 / T.02). This page states
 * that and points to Velocity and Yield.
 *
 * JSON-LD: breadcrumb + definedTerm + faqPage.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { WaveHero } from "@/components/ui/WaveHero";
import { MetricsWorkspaceFrame } from "@/components/metrics/MetricsWorkspaceFrame";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Compression Ratio — Word-Era Metric",
  description:
    "Compression Ratio is a word-era SigRank metric that the board still shows as a legacy Compression view. The token-era output-per-fresh-input ratio is Velocity (output / input). See Velocity and Yield.",
  path: "/metrics/compression-ratio",
});

const DEFINITION =
  "Compression Ratio is a word-era SigRank metric that the board still shows as a legacy Compression view. The token-era output-per-fresh-input ratio is Velocity (output / input), a secondary metric to Yield (Υ).";

export default function CompressionRatioPage() {
  return (
    <MetricsWorkspaceFrame
      title="COMPRESSION RATIO"
      hero={
        <WaveHero
          eyebrow="SIGRANK METRIC"
          terminalText="COMPRESSION"
          title="Compression Ratio"
          subtitle={<>A word-era metric. On the token board, see Velocity.</>}
        />
      }
      current="/metrics/compression-ratio"
    >
    <div className="flex flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Metrics", path: "/metrics" },
            { name: "Compression Ratio", path: "/metrics/compression-ratio" },
          ]),
          definedTerm(
            "Compression Ratio — Word-Era Metric",
            DEFINITION,
            "/metrics/compression-ratio",
          ),
        ]}
      />

      {/* ── Status ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Compression Ratio is a word-era metric
        </h2>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-6">
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            Compression Ratio (ticker{" "}
            <strong className="text-text-primary">COMP</strong>, canonical id
            M.01) is a{" "}
            <strong className="text-text-primary">word-era</strong> SigRank
            metric. It is retained as background for the planned evolution to
            word-based ranking, and the board still shows it as a legacy
            Compression view. It is not one of the token-era metrics.
          </p>
        </div>
      </section>

      {/* ── What it was ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What it was in the word era
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Compression Ratio was the first of SigRank&rsquo;s original Core 5
          metrics, alongside Prompt Complexity and the others. It was a bounded
          0 to 1 score rather than a count: the SigRank badge criteria for
          structural badges such as Compression Forge are written as thresholds
          on that 0 to 1 scale (for example, a Compression score of 0.85 or
          higher).
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Those definitions are kept in the canon registry as background. The
          board still carries a legacy Compression view, and this site does
          not publish a token formula for Compression Ratio.
        </p>
      </section>

      {/* ── Why the token board uses Velocity ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why the token era uses Velocity instead
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The SigRank board ranks on the token cascade. Every token-era
          metric is derived from four raw token pillars: input, output,
          cache-read and cache-write. Within that set, the ratio of output
          tokens to fresh input tokens is{" "}
          <Link
            href="/metrics/velocity"
            className="text-gold underline underline-offset-2"
          >
            Velocity
          </Link>
          : <span className="font-mono text-text-primary">Velocity = output / input</span>
          . It is a secondary metric, and it is one of the two terms of{" "}
          <Link
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            Yield (Υ)
          </Link>
          , the headline: Υ = (cache_read / input) × (output / input), which is
          leverage × velocity.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you were looking for an output-per-input number for your own
          sessions, use Velocity. For how the board is built and what each
          metric means, see the{" "}
          <Link
            href="/methodology"
            className="text-gold underline underline-offset-2"
          >
            methodology
          </Link>
          .
        </p>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related metrics:{" "}
          <Link
            href="/metrics/velocity"
            className="text-gold underline underline-offset-2"
          >
            Velocity
          </Link>
          {" · "}
          <Link
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            Yield (Υ)
          </Link>
          {" · "}
          <Link
            href="/metrics/signal-to-noise-ratio"
            className="text-gold underline underline-offset-2"
          >
            Signal-to-Noise Ratio
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
    </MetricsWorkspaceFrame>
  );
}
