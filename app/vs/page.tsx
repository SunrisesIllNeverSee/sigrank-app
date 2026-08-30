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
import { breadcrumb, alternativesItemList, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "SigRank vs Other Tools",
  description:
    "How SigRank compares to ccusage, VALS AI, LMSYS Arena, Cursor, Copilot, Braintrust, LangChain, and Langfuse. Operator evaluation vs system evaluation, time tracking, model leaderboards, and observability.",
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
    href: "/vs/vals-ai",
    title: "SigRank vs VALS AI - Operator Evaluation vs System Evaluation",
    desc: "VALS evaluates AI systems. SigRank evaluates AI operators and their workflows. Models are benchmarked constantly - the people operating them are not. The leaderboard is proof, not the product.",
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
  {
    href: "/vs/aider",
    title: "SigRank vs aider — Cross-Tool Scoring for Terminal AI Agents",
    desc: "aider is a terminal AI coding agent with /usage. SigRank is platform-neutral — scores the operator across aider, Claude Code, Copilot, and 15+ tools.",
  },
  {
    href: "/vs/cline",
    title: "SigRank vs Cline — Cross-Tool Scoring for VS Code AI Agents",
    desc: "Cline is a VS Code AI agent. SigRank is platform-neutral — scores the operator across Cline, Claude Code, Copilot, Cursor, and 15+ tools.",
  },
  {
    href: "/vs/continue",
    title: "SigRank vs Continue — Cross-Tool Scoring for IDE Autocomplete",
    desc: "Continue is an open-source IDE extension for AI autocomplete and chat. SigRank scores how efficiently you drive any AI tool, including Continue.",
  },
  {
    href: "/vs/roo-code",
    title: "SigRank vs Roo Code — Cross-Tool Scoring for VS Code AI Agents",
    desc: "Roo Code is a VS Code AI agent (Cline fork). SigRank is platform-neutral — scores the operator across Roo Code, Claude Code, Copilot, and 15+ tools.",
  },
  {
    href: "/vs/windsurf",
    title: "SigRank vs Windsurf — Cross-Tool Scoring for AI-Native IDEs",
    desc: "Windsurf is an AI-native IDE (formerly Codeium). SigRank is platform-neutral — scores the operator across Windsurf, Claude Code, Copilot, and 15+ tools.",
  },
  {
    href: "/vs/zed",
    title: "SigRank vs Zed — Cross-Tool Scoring for High-Performance Editors",
    desc: "Zed is a high-performance editor with Zed AI. SigRank is platform-neutral — scores the operator across Zed, Claude Code, Copilot, and 15+ tools.",
  },
  {
    href: "/vs/tabnine",
    title: "SigRank vs Tabnine — Cross-Tool Scoring for Code Completion",
    desc: "Tabnine is an AI code completion tool. SigRank is platform-neutral — scores the operator across Tabnine, Claude Code, Copilot, and 15+ tools.",
  },
  {
    href: "/vs/amazon-q",
    title: "SigRank vs Amazon Q Developer — Cross-Cloud Operator Scoring",
    desc: "Amazon Q Developer is AWS's AI coding assistant. SigRank is platform-neutral — scores the operator across Amazon Q, Claude Code, Copilot, and 15+ tools.",
  },
  {
    href: "/vs/sourcegraph-cody",
    title: "SigRank vs Sourcegraph Cody — Cross-Tool Scoring for Codebase-Aware AI",
    desc: "Sourcegraph Cody is a code-aware AI assistant. SigRank is platform-neutral — scores the operator across Cody, Claude Code, Copilot, and 15+ tools.",
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
      <JsonLd
        data={faqPage([
          {
            question: "How does SigRank compare to ccusage?",
            answer:
              "ccusage reads Claude Code token logs and shows usage stats. SigRank bundles ccusage's data and adds cascade scoring (Yield), a public leaderboard, operator profiles, class tiers, and MCP integration. ccusage tells you how much you spent; SigRank tells you how well you spent it.",
          },
          {
            question: "How does SigRank compare to LMSYS Arena?",
            answer:
              "LMSYS Arena ranks AI models by human preference votes. SigRank ranks AI operators by cascade efficiency (Yield). LMSYS asks 'which model is best?' SigRank asks 'who uses AI best?' They measure different things — models vs operators.",
          },
          {
            question: "How does SigRank compare to VALS AI?",
            answer:
              "VALS AI evaluates AI systems. SigRank evaluates AI operators — the humans driving the systems. VALS asks whether the AI is safe and effective. SigRank asks whether the person using the AI is efficient. The leaderboard is proof of operator skill, not system quality.",
          },
          {
            question: "How does SigRank compare to Cursor?",
            answer:
              "Cursor is an AI code editor with built-in usage metrics. SigRank is platform-neutral — it works with Cursor, Claude Code, Copilot, and 15+ other tools. Cursor shows what you wrote; SigRank shows how efficiently you drove the AI to write it.",
          },
          {
            question: "How does SigRank compare to Langfuse?",
            answer:
              "Langfuse traces LLM calls for debugging and evaluation observability. SigRank scores the operator's token efficiency for ranking and competition. Langfuse is for engineers debugging AI systems; SigRank is for operators competing on efficiency.",
          },
        ])}
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
