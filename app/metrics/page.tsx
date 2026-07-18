/**
 * app/metrics/page.tsx — Metrics index.
 *
 * Hub page listing all six metric definition pages. Each child page carries
 * DefinedTerm + FAQPage + BreadcrumbList schema. This index adds an ItemList
 * so AI engines see the full metric set as a structured collection.
 *
 * JSON-LD: breadcrumb() + ItemList.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, alternativesItemList } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Metrics — AI Operator Token Efficiency Definitions",
  description:
    "The six SigRank metrics: Yield (Υ), Cache Hit Rate, Compression Ratio, Leverage, Velocity, and Signal-to-Noise Ratio. Definitions, formulas, and how to improve each one.",
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
    href: "/metrics/compression-ratio",
    title: "Compression Ratio — Output per Input",
    desc: "output / input — how much you get back per token sent to an AI model. What it means and how to improve it.",
  },
  {
    href: "/metrics/leverage",
    title: "Leverage — Cached Context Amplification",
    desc: "cache_read / input — how much cached context amplifies your fresh input. What token leverage means and how to increase it.",
  },
  {
    href: "/metrics/velocity",
    title: "Velocity — Token Production Rate",
    desc: "output / input — output efficiency ratio in AI coding. Why it's a secondary metric and how it interacts with yield.",
  },
  {
    href: "/metrics/signal-to-noise-ratio",
    title: "Signal-to-Noise Ratio (SNR) — Signal Density",
    desc: "signal_tokens / total_tokens — signal density in AI coding. What signal vs noise means and its link to the Conservation Law.",
  },
];

export default function MetricsIndex() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([{ name: "Metrics", path: "/metrics" }]),
          alternativesItemList(METRICS.map((m) => ({ name: m.title })), "/metrics", "SigRank Metrics — All Six Definitions"),
        ]}
      />

      <WaveHero
        eyebrow="◈ Metrics"
        title="The Six SigRank Metrics"
        subtitle={
          <>
            Every metric is a different lens on the{" "}
            <span className="text-gold">token cascade</span>. Yield is the
            headline; the other five explain why.
          </>
        }
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
    </div>
  );
}
