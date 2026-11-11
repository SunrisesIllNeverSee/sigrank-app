/**
 * app/metrics/compression-ratio/page.tsx — "Compression Ratio — Word-Era Metric"
 *
 * Per canon (lib/identity/canon-ids.ts M.01, ticker COMP, era "word"),
 * Compression Ratio is a WORD-ERA SigRank metric, retained as background and not
 * part of the live token-era board. canon defines no token formula for it. On the
 * live board the output-per-fresh-input ratio is Velocity (Y.04, T.01 / T.02).
 * This page states that and points to Velocity and Yield.
 *
 * JSON-LD: breadcrumb + definedTerm + faqPage.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { WaveHero } from "@/components/ui/WaveHero";
import { MetricsWorkspaceFrame } from "@/components/metrics/MetricsWorkspaceFrame";
import { breadcrumb, definedTerm, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Compression Ratio — Word-Era Metric",
  description:
    "Compression Ratio is a word-era SigRank metric. On the live token-era board, the output-per-fresh-input ratio is Velocity (output / input). See Velocity and Yield.",
  path: "/metrics/compression-ratio",
});

const DEFINITION =
  "Compression Ratio is a word-era SigRank metric, retained as background and not part of the live token-era board. On the live token-era board, the output-per-fresh-input ratio is Velocity (output / input), a secondary metric to Yield (Υ).";

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
          faqPage([
            {
              question: "What is Compression Ratio in SigRank?",
              answer:
                "Compression Ratio (ticker COMP) is a word-era SigRank metric. It is retained as background for the planned evolution to word-based ranking and is not part of the live token-era board.",
            },
            {
              question: "Which metric measures output per fresh input on the live board?",
              answer:
                "Velocity. On the live token-era board, Velocity = output / input — output tokens per fresh input token. It is a secondary metric; Yield (Υ) is the headline.",
            },
            {
              question: "How does this relate to Yield?",
              answer:
                "Yield (Υ) = (cache_read / input) × (output / input) — leverage × velocity. The output-per-fresh-input term inside Yield is Velocity.",
            },
          ]),
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
            <strong className="text-text-primary">COMP</strong>) is a{" "}
            <strong className="text-text-primary">word-era</strong> SigRank
            metric. It is retained as background for the planned evolution to
            word-based ranking and is not part of the live token-era board.
          </p>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The live SigRank board ranks on the token cascade: Yield, SNR,
          Leverage, Velocity, and the other token-era metrics, all derived from
          the four raw token pillars.
        </p>
      </section>

      {/* ── Where output per input lives now ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Output per fresh input on the live board: Velocity
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you are looking for the ratio of output tokens to fresh input
          tokens, that metric is{" "}
          <Link
            href="/metrics/velocity"
            className="text-gold underline underline-offset-2"
          >
            Velocity
          </Link>
          : <span className="font-mono text-text-primary">Velocity = output / input</span>
          . Velocity is a secondary metric; Yield is the headline.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Velocity is one of the two terms of{" "}
          <Link
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            Yield (Υ)
          </Link>
          : Υ = (cache_read / input) × (output / input), which is leverage ×
          velocity.
        </p>
      </section>

      {/* ── FAQ ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">FAQ</h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is Compression Ratio in SigRank?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Compression Ratio (COMP) is a word-era SigRank metric, retained as
              background and not part of the live token-era board.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Which metric measures output per fresh input on the live board?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Velocity. On the live token-era board, Velocity = output / input —
              output tokens per fresh input token. It is a secondary metric;
              Yield (Υ) is the headline.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How does this relate to Yield?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Yield (Υ) = (cache_read / input) × (output / input) — leverage ×
              velocity. The output-per-fresh-input term inside Yield is
              Velocity.
            </dd>
          </div>
        </dl>
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
