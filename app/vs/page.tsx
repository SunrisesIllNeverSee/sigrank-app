/**
 * app/vs/page.tsx — Comparisons index.
 *
 * Hub page listing all eight head-to-head comparison pages. Each child page
 * carries TechArticle + FAQPage + BreadcrumbList schema. This index adds an
 * ItemList so AI engines see the full comparison set as a structured collection.
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
  title: "SigRank vs Other Tools — AI Operator Measurement Comparisons",
  description:
    "How SigRank compares to ccusage, WakaTime, LMSYS Arena, Cursor, Copilot, Braintrust, LangChain, and Langfuse. Operator measurement vs time tracking, model leaderboards, and observability.",
  path: "/vs",
});

export const revalidate = 86400;

const COMPARISONS = [
  {
    href: "/vs/ccusage",
    title: "SigRank vs ccusage — Sensor to Instrument Panel",
    desc: "ccusage reads Claude Code token logs. SigRank bundles ccusage and adds cascade scoring, leaderboards, operator profiles, and MCP integration.",
  },
  {
    href: "/vs/wakatime",
    title: "SigRank vs WakaTime — Time vs Token Efficiency",
    desc: "WakaTime tracks hours coding. SigRank tracks token cascade efficiency. Time ≠ signal — an hour with good cache reuse beats 10 hours of burning input.",
  },
  {
    href: "/vs/lmsys-arena",
    title: "SigRank vs LMSYS Arena — Rank Driver, Not Car",
    desc: "LMSYS ranks AI models by preference votes. SigRank ranks operators by cascade efficiency. Models don't drive — operators do. Rank the driver, not the car.",
  },
  {
    href: "/vs/cursor",
    title: "SigRank vs Cursor — Cross-Tool Token Metrics",
    desc: "Cursor is an AI editor with built-in metrics. SigRank is platform-neutral — works with Cursor, Claude Code, Copilot, and 15+ tools.",
  },
  {
    href: "/vs/copilot",
    title: "SigRank vs Copilot — Token Tracking for AI Tools",
    desc: "Copilot is an AI pair programmer. SigRank measures how efficiently you drive it. Copilot shows what you wrote; SigRank shows how you drove the AI.",
  },
  {
    href: "/vs/braintrust",
    title: "SigRank vs Braintrust — Marketplace vs Measurement",
    desc: "Braintrust connects you with AI talent. SigRank measures how efficiently that talent drives AI. Braintrust finds AI workers; SigRank scores how well they use AI.",
  },
  {
    href: "/vs/langchain",
    title: "SigRank vs LangChain — Framework vs Operator Measurement",
    desc: "LangChain builds AI apps with chains, agents, and RAG. SigRank ranks the humans driving AI tools. Different layers entirely — framework vs operator measurement.",
  },
  {
    href: "/vs/langfuse",
    title: "SigRank vs Langfuse — Observability vs Competition",
    desc: "Langfuse traces LLM calls for debugging and evaluation. SigRank scores the operator's token efficiency for ranking. Observability vs competition.",
  },
];

export default function VsIndex() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([{ name: "Comparisons", path: "/vs" }]),
          alternativesItemList(COMPARISONS.map((c) => ({ name: c.title })), "/vs", "SigRank vs Other Tools — All Comparisons"),
        ]}
      />

      <WaveHero
        eyebrow="◈ Comparisons"
        title="SigRank vs Other Tools"
        subtitle={
          <>
            How SigRank compares to{" "}
            <span className="text-gold">time trackers, model leaderboards,
            observability platforms, and AI coding tools</span>{" "}
            — and where operator measurement fits.
          </>
        }
      />

      <div className="flex flex-col gap-6">
        {COMPARISONS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-gold/40"
          >
            <h2 className="font-sans text-xl font-bold text-text-primary group-hover:text-gold">
              {c.title}
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              {c.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
