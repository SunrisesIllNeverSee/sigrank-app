/**
 * app/guides/page.tsx — Guides index.
 *
 * Hub page listing all eight how-to guides. Each child page carries HowTo +
 * FAQPage + BreadcrumbList schema. This index adds an ItemList so AI engines
 * see the full guide set as a structured collection.
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
  title: "Guides — How to Measure, Improve, and Track AI Coding Efficiency",
  description:
    "Eight how-to guides: measure AI coding efficiency, improve your yield, reduce token waste, read your token cascade, track it, benchmark your workflow, compare operators, and troubleshoot cache write convergence.",
  path: "/guides",
});

export const revalidate = 86400;

const GUIDES = [
  {
    href: "/guides/how-to-measure-ai-coding-efficiency",
    title: "How to Measure AI Coding Efficiency",
    desc: "Measure your AI coding efficiency using the four token pillars and the Υ Yield metric with ccusage and sigrank. A privacy-preserving, on-device workflow.",
  },
  {
    href: "/guides/how-to-improve-your-yield",
    title: "How to Improve Your AI Coding Yield",
    desc: "Seven strategies to increase your Υ Yield: better context windows, prompt caching, structured inputs, fewer re-rolls, cache reuse patterns, and more.",
  },
  {
    href: "/guides/how-to-reduce-token-waste",
    title: "How to Reduce Token Waste",
    desc: "Identify and fix the four common sources of token waste: repeated context, poor prompt caching, verbose prompts, and unnecessary re-rolls.",
  },
  {
    href: "/guides/how-to-read-your-cascade",
    title: "How to Read Your Token Cascade",
    desc: "Examine the four token pillars to diagnose your AI coding workflow. What high cache-read, high input/low output, and balanced cascades reveal.",
  },
  {
    href: "/guides/how-to-track-token-cascade",
    title: "How to Track Your Token Cascade",
    desc: "Install sigrank to automatically track the four token pillars from your local AI coding logs. Privacy-preserving, on-device, signed submissions.",
  },
  {
    href: "/guides/how-to-benchmark-ai-coding-workflow",
    title: "How to Benchmark Your AI Coding Workflow",
    desc: "Establish a baseline yield, track the four token pillars across time windows, and compare yourself against the SigRank leaderboard.",
  },
  {
    href: "/guides/how-to-compare-ai-operators",
    title: "How to Compare AI Operators",
    desc: "Use the SigRank compare tool to benchmark operators head-to-head on yield, cache hit rate, leverage, and class tier.",
  },
  {
    href: "/guides/cache-write-convergence",
    title: "Cache Write Convergence — Troubleshooting",
    desc: "When ChatGPT/Codex reports cache_write as zero, use reference operating ratios to split the combined input. Validate against real operator data.",
  },
];

export default function GuidesIndex() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([{ name: "Guides", path: "/guides" }]),
          alternativesItemList(GUIDES.map((g) => ({ name: g.title })), "/guides", "SigRank Guides — All How-To Guides"),
        ]}
      />

      <WaveHero
        eyebrow="◈ Guides"
        title="How-To Guides"
        subtitle={
          <>
            From <span className="text-gold">measuring</span> your first cascade
            to <span className="text-gold">improving</span> your yield —
            step-by-step guides for every stage of AI operator efficiency.
          </>
        }
      />

      <div className="flex flex-col gap-6">
        {GUIDES.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="group flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-gold/40"
          >
            <h2 className="font-sans text-xl font-bold text-text-primary group-hover:text-gold">
              {g.title}
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              {g.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
