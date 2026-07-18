/**
 * app/alternatives/page.tsx — Alternatives index.
 *
 * Hub page listing all four alternatives/listicle pages. Each child page
 * carries ItemList + FAQPage + BreadcrumbList schema. This index adds an
 * ItemList so AI engines see the full alternatives set as a structured collection.
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
  title: "Alternatives — Best AI Coding, Benchmarking, and Token Tracking Tools",
  description:
    "Ranked alternatives for AI coding metrics, ccusage replacements, AI benchmarking tools, and token tracking tools. Compared on scoring, leaderboards, multi-platform support, and MCP integration.",
  path: "/alternatives",
});

export const revalidate = 86400;

const ALTS = [
  {
    href: "/alternatives/ai-coding-metrics",
    title: "Best AI Coding Metrics Tools (2026)",
    desc: "The 7 best AI coding metrics tools in 2026. SigRank, ccusage, WakaTime, LMSYS, Cursor, Copilot, and Token Dashboard — what each measures and best for.",
  },
  {
    href: "/alternatives/ccusage-alternatives",
    title: "Best ccusage Alternatives (2026)",
    desc: "The 5 best ccusage alternatives in 2026. SigRank, Token Dashboard, manual ccusage + scripts, and Tokscale — compared on scoring, leaderboards, and MCP.",
  },
  {
    href: "/alternatives/ai-benchmarking-tools",
    title: "Best AI Benchmarking Tools (2026)",
    desc: "The 6 best AI benchmarking tools in 2026. SigRank, LMSYS Arena, HELM, Open LLM Leaderboard, and HumanEval — what each benchmarks, pros, cons, and best for.",
  },
  {
    href: "/alternatives/token-tracking-tools",
    title: "Best Token Tracking Tools (2026)",
    desc: "The 5 best token tracking tools in 2026. SigRank, ccusage, Tokscale, Token Dashboard, and Tiktoken — compared on counting, scoring, and multi-platform.",
  },
];

export default function AlternativesIndex() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([{ name: "Alternatives", path: "/alternatives" }]),
          alternativesItemList(ALTS.map((a) => ({ name: a.title })), "/alternatives", "SigRank Alternatives — All Listicles"),
        ]}
      />

      <WaveHero
        eyebrow="◈ Alternatives"
        title="Best AI Tools — Ranked Alternatives"
        subtitle={
          <>
            Ranked <span className="text-gold">alternatives and comparisons</span>{" "}
            for AI coding metrics, benchmarking, token tracking, and ccusage
            replacements.
          </>
        }
      />

      <div className="flex flex-col gap-6">
        {ALTS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-gold/40"
          >
            <h2 className="font-sans text-xl font-bold text-text-primary group-hover:text-gold">
              {a.title}
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              {a.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
