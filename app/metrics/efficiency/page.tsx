/**
 * app/metrics/efficiency/page.tsx — "Efficiency — Operational Amplification"
 *
 * Defines Efficiency: (R + W + O) / (4I) — total operational amplification
 * versus the Artificial Analysis 7:2:1 baseline. Measures how much operating
 * activity an operator generates per unit of fresh input, including cache
 * creation. Not economic efficiency — operational amplification.
 *
 * JSON-LD: breadcrumb + definedTerm + faqPage.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Efficiency — Operational Amplification",
  description:
    "Efficiency = (cache_read + cache_write + output) / (4 * input) — total operational amplification versus the AA 7:2:1 baseline. Measures how much operating activity an operator generates per unit of fresh input.",
  path: "/metrics/efficiency",
});

export default function EfficiencyPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Metrics", path: "/metrics" },
            { name: "Efficiency", path: "/metrics/efficiency" },
          ]),
          definedTerm(
            "Efficiency (Operational Amplification)",
            "Efficiency = (cache_read + cache_write + output) / (4 * input). Total operational amplification versus the Artificial Analysis 7:2:1 baseline. Measures how much operating activity (reused context + new context + output) an operator generates per unit of fresh input. The 4.0 divisor calibrates the AA baseline to 1.00. Not economic efficiency — operational amplification.",
            "/metrics/efficiency",
          ),
          faqPage([
            {
              question: "What is Efficiency in SigRank?",
              answer:
                "Efficiency = (cache_read + cache_write + output) / (4 * input). It measures total operational amplification — how much operating activity an operator generates per unit of fresh input, including cache reads, cache writes, and output. The 4.0 divisor calibrates the Artificial Analysis 7:2:1 baseline to 1.00, so an efficiency of 1.0 means the operator matches the modeled average user.",
            },
            {
              question: "Why is it called Efficiency and not Amplification?",
              answer:
                "The name is established in the production system. The formula rewards cache reads, cache writes, and output equally per token, which makes it mathematically closer to operational amplification or compounding intensity than ordinary economic efficiency. The definition makes clear that it measures operational amplification versus the AA baseline, not monetary efficiency or proven quality.",
            },
            {
              question: "What does the 4.0 baseline mean?",
              answer:
                "The 4.0 divisor comes from the Artificial Analysis pricing baseline, which models a 7:2:1 cache-read:cache-write:input ratio. The derivation: 4.0 = (7+1)/2. At the AA baseline pillars (I=1, O=0.5, R=3.5, W~0), the numerator (R+W+O)/I = 4.0, so Efficiency = 4.0/4.0 = 1.00 by construction. Every operator is measured against this reference point.",
            },
            {
              question: "How does Efficiency relate to the other cascade metrics?",
              answer:
                "Efficiency = (Leverage + Velocity + W/I) / 4. It is the only public metric that includes cache_write (Commitment). If Efficiency, Leverage, and Velocity are public, then W/I = 4*Efficiency - Leverage - Velocity is algebraically recoverable. This means Commitment is already embedded in the public metric stack, even though it is not displayed directly.",
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Operational Amplification"
        terminalText="E"
        title="Efficiency"
        subtitle={
          <>
            10xDEV is a logarithmic efficiency score that measures whether an
            operator&rsquo;s leverage exceeds 10x. It&rsquo;s the log&#8321;&#8320;
            of Leverage — if your cached context amplifies your input by 10x or
            more, you&rsquo;re a 10xDEV operator. Total operational
            amplification versus the{" "}
            <span className="text-gold">AA 7:2:1 baseline</span>.
          </>
        }
      />

      {/* ── The formula ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The Efficiency formula
        </h2>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-6">
          <p className="text-center font-mono text-2xl text-gold">
            E = (R + W + O) / (4I)
          </p>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Where <strong className="text-text-primary">R</strong> = cache_read,{" "}
          <strong className="text-text-primary">W</strong> = cache_write,{" "}
          <strong className="text-text-primary">O</strong> = output, and{" "}
          <strong className="text-text-primary">I</strong> = input. The
          numerator is total non-input operating activity: reused context plus
          new context plus generated output. The denominator is 4 times fresh
          input.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Efficiency can be decomposed as{" "}
          <strong className="text-text-primary">E = (L + V + W/I) / 4</strong> —
          the average of Leverage, Velocity, and Commitment (cache_write per
          input). It is the only public metric that includes cache_write,
          restoring the commitment dimension that Yield and Leverage omit.
        </p>
      </section>

      {/* ── What it measures ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What Efficiency measures
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Efficiency measures{" "}
          <strong className="text-text-primary">operational amplification</strong>{" "}
          — how much operating activity an operator generates per unit of fresh
          input. It rewards cache reads, cache writes, and output equally per
          token. This makes it closer to compounding intensity or system
          utilization than to ordinary economic efficiency.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The name &ldquo;Efficiency&rdquo; is established in the production
          system. The definition makes clear what it actually measures:
          operational amplification versus the AA baseline, not monetary
          efficiency or proven quality. An operator with high Efficiency is
          generating a lot of operating activity per unit of input — but that
          activity could be cache reads, cache writes, or output, and the
          formula does not distinguish between them.
        </p>
      </section>

      {/* ── The 4.0 baseline ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-gold/30 bg-gold/5 p-5">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The 4.0 baseline
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The 4.0 divisor comes from the{" "}
          <strong className="text-text-primary">
            Artificial Analysis pricing baseline
          </strong>
          , which models a 7:2:1 cache-read:cache-write:input ratio for the
          &ldquo;average AI user.&rdquo; The derivation:
        </p>
        <pre className="overflow-x-auto rounded-md border border-bg-border bg-bg-base px-4 py-3 font-mono text-xs leading-relaxed text-text-secondary">
{`  4.0 = (7 + 1) / 2

  At the AA baseline pillars:
  I = 1, O = 0.5, R = 3.5, W ~ 0
  (R + W + O) / I = (3.5 + 0 + 0.5) / 1 = 4.0
  Efficiency = 4.0 / 4.0 = 1.00  (by construction)`}
        </pre>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The two 4.0s are the same number by design — that is the calibration.
          An Efficiency of 1.00 means the operator matches the modeled average
          user. Above 1.00 means more amplification than the baseline; below
          1.00 means less. The baseline comes from published model pricing data,
          not from SigRank&apos;s own sample.
        </p>
      </section>

      {/* ── Commitment recovery ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The Commitment identity
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Because Efficiency = (L + V + W/I) / 4, the commitment ratio
          (cache_write per input) is algebraically recoverable from public
          metrics:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-6">
          <p className="text-center font-mono text-xl text-gold">
            W/I = 4E - L - V
          </p>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If Efficiency, Leverage, and Velocity are public, then Commitment is
          already public — even though it is not displayed directly. This is
          not a problem; it is a consequence of the algebraic architecture. The
          metric stack is internally consistent by construction.
        </p>
      </section>

      {/* ── FAQ ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">FAQ</h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is Efficiency in SigRank?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Efficiency = (cache_read + cache_write + output) / (4 * input).
              It measures total operational amplification — how much operating
              activity an operator generates per unit of fresh input. The 4.0
              divisor calibrates the AA baseline to 1.00.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Why is it called Efficiency and not Amplification?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The name is established in the production system. The formula
              rewards cache reads, cache writes, and output equally per token,
              which makes it mathematically closer to operational amplification
              than ordinary economic efficiency. The definition makes clear what
              it measures.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What does the 4.0 baseline mean?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The 4.0 divisor comes from the Artificial Analysis 7:2:1 baseline.
              The derivation: 4.0 = (7+1)/2. At the AA baseline pillars,
              Efficiency = 4.0/4.0 = 1.00 by construction. Every operator is
              measured against this reference point.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How does Efficiency relate to the other cascade metrics?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Efficiency = (Leverage + Velocity + W/I) / 4. It is the only
              public metric that includes cache_write (Commitment). If
              Efficiency, Leverage, and Velocity are public, then W/I = 4E - L -
              V is algebraically recoverable.
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            Yield (Y)
          </Link>
          {" · "}
          <Link
            href="/metrics/leverage"
            className="text-gold underline underline-offset-2"
          >
            Leverage
          </Link>
          {" · "}
          <Link
            href="/metrics/velocity"
            className="text-gold underline underline-offset-2"
          >
            Velocity
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
