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
import { withOG, SITE_ORIGIN } from "@/lib/seo";
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
    desc: "LangChain builds AI apps with chains, agents, and RAG. SigRank ranks the operators driving AI tools. Different layers entirely — framework vs operator measurement.",
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
  {
    href: "/vs/swe-bench",
    title: "SigRank vs SWE-bench — Model Benchmark vs Operator Benchmark",
    desc: "SWE-bench evaluates AI models on real software engineering tasks. SigRank evaluates operators by token cascade efficiency. SWE-bench asks can the model fix the bug. SigRank asks how efficiently did you drive it.",
  },
  {
    href: "/vs/chatbot-arena",
    title: "SigRank vs Chatbot Arena — Rank the Driver, Not the Car",
    desc: "Chatbot Arena ranks AI models by human preference votes. SigRank ranks operators by cascade efficiency. Models don't drive — operators do. Rank the driver, not the car.",
  },
  {
    href: "/vs/ai-productivity-dashboards",
    title: "SigRank vs AI Productivity Dashboards — Dashboards vs Competition",
    desc: "AI productivity dashboards show usage metrics. SigRank scores operators by token cascade efficiency and ranks them on a public leaderboard. Dashboards show what you spent; SigRank scores how well you spent it.",
  },
  {
    href: "/vs/wakatime",
    title: "SigRank vs WakaTime — Time vs Token Efficiency",
    desc: "WakaTime tracks hours coding. SigRank tracks token cascade efficiency. Time ≠ signal — an hour with good cache reuse beats 10 hours of burning input.",
  },
  {
    href: "/vs/clawdboard",
    title: "SigRank vs clawdboard — Cascade vs Streaks",
    desc: "clawdboard ranks by cost, tokens, streaks, and active days. SigRank ranks by cascade efficiency. Streaks measure consistency; Yield measures skill.",
  },
  {
    href: "/vs/costhawk",
    title: "SigRank vs CostHawk — Yield vs Consumption",
    desc: "CostHawk has an anonymized AI tools leaderboard ranked by total token consumption. SigRank ranks by Yield efficiency. Consumption counts. Efficiency matters.",
  },
  {
    href: "/vs/mytokentracker",
    title: "SigRank vs mytokentracker — Efficiency vs Spend",
    desc: "mytokentracker ranks operators by dollars spent across 2,300+ models. SigRank ranks by Yield efficiency. Spend is a receipt; Yield is a result.",
  },
  {
    href: "/vs/tokenrank",
    title: "SigRank vs TokenRank — Yield vs Burn-to-Rank",
    desc: "TokenRank uses burn-to-rank: aggregate token activity across Codex, Claude, Gemini, Qwen, Cursor, Copilot. SigRank ranks by Yield efficiency. Burning to rank vs building to rank.",
  },
  {
    href: "/vs/tokentracker",
    title: "SigRank vs Token Tracker — Efficiency vs Tracking",
    desc: "Token Tracker monitors 29 AI coding tools with desktop widgets. SigRank measures cascade efficiency with Yield. Tracking tokens vs measuring skill.",
  },
  {
    href: "/vs/tokscale",
    title: "SigRank vs Tokscale — Yield vs Volume Leaderboard",
    desc: "Tokscale ranks by total tokens burned across 40+ tools. SigRank ranks by Yield efficiency. Volume is noise; Yield is signal.",
  },
  {
    href: "/vs/aiusage",
    title: "SigRank vs aiusage — Call Counting vs Cascade Scoring",
    desc: "aiusage tracks API calls and token usage across providers. SigRank scores operator skill. Counting calls is accounting; scoring cascades is evaluation.",
  },
  {
    href: "/vs/ccburn",
    title: "SigRank vs ccburn — Burn Rate vs Yield Rate",
    desc: "ccburn shows your Claude Code burn rate in real time. SigRank shows your yield rate. Speed of burning is not quality of operating.",
  },
  {
    href: "/vs/ccflare",
    title: "SigRank vs ccflare — Charts vs Scores",
    desc: "ccflare visualizes Claude Code token consumption with pretty charts. SigRank scores production. Charts of what you spent is not a score for what you produced.",
  },
  {
    href: "/vs/ccgather",
    title: "SigRank vs ccgather — One Platform vs the Whole Field",
    desc: "ccgather ranks Claude Code users by usage stats. SigRank ranks operators by cascade yield across 15+ platforms. Claude Code only is not the whole field.",
  },
  {
    href: "/vs/ccstatusline",
    title: "SigRank vs ccstatusline — Status Widget vs Instrument Panel",
    desc: "ccstatusline shows a token count in your terminal status bar. SigRank turns that number into a ranked score. A status widget is not an instrument panel.",
  },
  {
    href: "/vs/claudecount",
    title: "SigRank vs claudecount — Counting vs Scoring",
    desc: "claudecount counts Claude Code tokens. SigRank scores cascades. Counting is not scoring. A counter tells you what you spent; a scorecard tells you whether the spend was worth it.",
  },
  {
    href: "/vs/clauderank",
    title: "SigRank vs clauderank — One Tool vs Every Platform",
    desc: "clauderank ranks Claude Code users. SigRank ranks AI operators across every platform. One tool is not the whole field. Cascade yield is platform-neutral.",
  },
  {
    href: "/vs/codeburn",
    title: "SigRank vs CodeBurn — Spend Optimization vs Operator Scoring",
    desc: "CodeBurn optimizes AI coding spend across 41 tools — waste scanning, model comparison, budget guarding, and git-linked yield. SigRank scores operator cascade efficiency (Υ) and ranks on a public leaderboard. Different questions, same token logs.",
  },
  {
    href: "/vs/lineman",
    title: "SigRank vs lineman — Cost Input vs Yield Output",
    desc: "lineman tracks Claude Code spend. SigRank scores yield. Spend tracking is accounting; yield scoring is evaluation. Cost is the input; yield is the output.",
  },
  {
    href: "/vs/notch-pilot",
    title: "SigRank vs notch-pilot — The Pilot, Not the Plane",
    desc: "notch-pilot is an AI coding copilot. SigRank scores the pilot, not the plane. The assistant isn't the operator; the operator at the wheel is what gets measured.",
  },
  {
    href: "/vs/omnara",
    title: "SigRank vs omnara — Monitoring vs Evaluation",
    desc: "omnara monitors AI agents with broad observability. SigRank scores AI operators. Monitoring infrastructure is not evaluating the operator at the wheel.",
  },
  {
    href: "/vs/opcode",
    title: "SigRank vs opcode — The CLI vs The Operator Score",
    desc: "opcode is an AI coding CLI. SigRank scores the operator using any CLI. The tool isn't the skill; the cascade yield is what gets measured and ranked.",
  },
  {
    href: "/vs/sculptor",
    title: "SigRank vs sculptor — The Tool vs The Operator",
    desc: "sculptor is an AI coding agent. SigRank scores the operator driving any agent. The tool is not the operator. Measure the driver, not the car.",
  },
  {
    href: "/vs/sessionwatcher",
    title: "SigRank vs sessionwatcher — One Session vs Every Operator",
    desc: "sessionwatcher monitors individual Claude Code sessions for token usage. SigRank scores and ranks operators globally. Watching one session is not ranking every operator.",
  },
  {
    href: "/vs/token-forest",
    title: "SigRank vs token-forest — Counting Trees vs Measuring Yield",
    desc: "token-forest tracks AI token usage with a forest/growth metaphor. SigRank measures cascade yield. Counting trees is not measuring the forest's yield.",
  },
  {
    href: "/vs/tokenmaxxer",
    title: "SigRank vs tokenmaxxer — Maxxing vs Efficiency",
    desc: "tokenmaxxer gamifies token burning with streaks and badges. SigRank measures token efficiency. Maxxing tokens is the opposite of efficient operating.",
  },
  {
    href: "/vs/vibe-island",
    title: "SigRank vs vibe-island — Community vs Competition",
    desc: "vibe-island is a vibe coding community. SigRank is an operator ranking system. Vibing is not operating. Community is not competition.",
  },
  {
    href: "/vs/viberank",
    title: "SigRank vs viberank — Burn Rate vs Cascade Yield",
    desc: "viberank ranks developers by token burn for vibe coding. SigRank ranks by cascade yield efficiency. Burn rate is participation; cascade yield is skill.",
  },
  {
    href: "/vs/whoburnedmore",
    title: "SigRank vs whoburnedmore — Burning vs Compounding",
    desc: "whoburnedmore celebrates the biggest token burners. SigRank celebrates the most efficient operators. Burning more tokens is not a skill — compounding them is.",
  },
];

export default function VsIndex() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([{ name: "Comparisons", path: "/vs" }]),
          alternativesItemList(COMPARISONS.map((c) => ({ name: c.title, url: `${SITE_ORIGIN}${c.href}` })), "/vs", "SigRank vs Other Tools — All Comparisons"),
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
              "VALS AI evaluates AI systems. SigRank evaluates AI operators — the operators driving the systems. VALS asks whether the AI is safe and effective. SigRank asks whether the person using the AI is efficient. The leaderboard is proof of operator skill, not system quality.",
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
