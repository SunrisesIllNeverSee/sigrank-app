/**
 * app/alternatives/token-cost-tracking-tools/page.tsx —
 * "Best Token Cost Tracking Tools (2026)"
 *
 * SEO listicle targeting "token cost tracking tools", "ai token spend
 * tracker", "llm cost monitoring". Distinct from /alternatives/token-tracking-
 * tools (which is about counting tokens): this page focuses on tools that
 * track $/token spend and argues that cost without efficiency is blind —
 * SigRank scores whether your spend was efficient (Υ Yield), not just how
 * much it cost.
 *
 * RSC (no "use client"). Uses withOG, JsonLd (breadcrumb + faqPage +
 * ItemList), WaveHero, and Tailwind theme tokens matching the repo convention.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, alternativesItemList } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Best Token Cost Tracking Tools (2026)",
  description:
    "The 6 best token cost tracking tools in 2026. SigRank, ccusage, Langfuse, Token Dashboard, aider /usage, and Claude Code /cost — which tracks cost efficiently, not just how much you spent.",
  path: "/alternatives/token-cost-tracking-tools",
});

type Tool = {
  name: string;
  measures: string;
  pros: string[];
  cons: string[];
  pricing: string;
  bestFor: string;
  featured?: boolean;
};

const TOOLS: Tool[] = [
  {
    name: "SigRank",
    measures:
      "Operator-level token-cascade efficiency — Υ Yield (cache_read × output / input²), compression ratio, SNR, cache hit rate, leverage, velocity, and class tier. The only tool that scores whether your token spend was efficient, not just how much it cost.",
    pros: [
      "Scores spend efficiency, not just spend volume — tells you if your dollars compounded or burned",
      "Platform-neutral: works across Claude, ChatGPT, Gemini, Copilot, Cursor, and 15+ platforms",
      "Privacy-preserving: on-device scanning, token counts only, ed25519-signed submissions",
      "Live leaderboard with 7d/30d/90d/all-time windows — compare your cost efficiency to other operators",
      "Bundles ccusage, tokscale, and token-dashboard — one install, full cost + efficiency stack",
    ],
    cons: [
      "Newer ecosystem — leaderboard sample still growing",
      "Requires a CLI install and enrollment to submit",
    ],
    pricing: "Free (open-source CLI, MIT-licensed code, CC-BY-4.0 data)",
    bestFor: "Operators who want to know if their token spend was efficient, not just how much it cost",
    featured: true,
  },
  {
    name: "ccusage",
    measures:
      "Claude Code token usage and cost — reads local logs and reports input, output, cache-read, cache-write counts and estimated cost per session. Counts dollars but does not score efficiency.",
    pros: [
      "Dead simple: reads Claude Code logs locally, no account needed",
      "Accurate token counts and cost estimates straight from the source",
      "SigRank bundles it, so you get both cost tracking and efficiency scoring in one install",
    ],
    cons: [
      "Read-only — counts cost but does not score whether the spend was efficient",
      "Claude Code only; no multi-platform cost tracking",
      "No efficiency metric — raw dollar amounts without yield, leverage, or cascade scoring",
    ],
    pricing: "Free (open-source CLI)",
    bestFor: "Quickly checking your Claude Code token spend before you care about efficiency",
  },
  {
    name: "Langfuse",
    measures:
      "LLM observability platform — traces LLM calls, tracks cost, latency, and token usage across applications. Designed for teams shipping LLM features, not for individual operator cost efficiency.",
    pros: [
      "Full LLM call tracing with cost, latency, and token breakdowns",
      "Team-level cost dashboards for LLM application monitoring",
      "Supports multiple providers — not locked to one model",
    ],
    cons: [
      "Designed for LLM applications, not for measuring operator coding cost efficiency",
      "No token-cascade metrics (yield, leverage, cache hit rate) — cost without efficiency context",
      "No operator identity, no leaderboard, no cross-operator cost-efficiency comparison",
    ],
    pricing: "Free self-hosted; Cloud from $39/month",
    bestFor: "Teams monitoring LLM application costs and latency, not operator cost efficiency",
  },
  {
    name: "Token Dashboard",
    measures:
      "Token spend visualization — aggregates token counts and estimated costs into a dashboard view. Shows where tokens went but not whether the spend was efficient.",
    pros: [
      "Visual dashboard for token spend breakdowns",
      "Aggregates across sessions for a cumulative cost view",
      "SigRank bundles it alongside ccusage and efficiency scoring",
    ],
    cons: [
      "Visualization only — shows cost but does not score efficiency",
      "No token-cascade metrics (yield, leverage, cache hit rate)",
      "No operator ranking, no cross-operator cost-efficiency comparison",
    ],
    pricing: "Free (open-source, bundled with SigRank)",
    bestFor: "Visualizing your token spend before you ask whether it was efficient",
  },
  {
    name: "aider /usage",
    measures:
      "Built-in /usage command showing token costs and session totals for aider's terminal-based AI coding. Reports input, output, and cost per session.",
    pros: [
      "Built into aider — no separate install if you already use it",
      "Shows per-session token costs and running totals",
      "Open-source and terminal-native, fits CLI workflows",
    ],
    cons: [
      "aider only — no cost data from Cursor, Claude Code, Copilot, or other tools",
      "Reports costs, not efficiency — no yield, leverage, or cascade metrics",
      "No operator scoring, no leaderboard, no cross-platform cost comparison",
    ],
    pricing: "Free (open-source); you pay for the underlying LLM API",
    bestFor: "aider users checking their per-session token spend",
  },
  {
    name: "Claude Code /cost",
    measures:
      "Built-in /cost command in Claude Code showing cumulative token cost for the current session. A quick inline check of spend, not an efficiency score.",
    pros: [
      "Built into Claude Code — no extra install needed",
      "Instant inline check of current session spend",
      "Accurate — reads directly from the session's token ledger",
    ],
    cons: [
      "Claude Code only — no cost data from other tools or platforms",
      "Session-scoped — no cumulative, cross-session, or historical cost view",
      "Reports cost only — no efficiency metric, no yield, no cascade scoring",
    ],
    pricing: "Free (built into Claude Code)",
    bestFor: "Claude Code users doing a quick inline cost check mid-session",
  },
];

const FAQS = [
  {
    question: "What are token cost tracking tools?",
    answer:
      "Token cost tracking tools monitor how much you spend on LLM tokens — typically in dollars per session, per day, or per project. They range from inline commands (Claude Code /cost, aider /usage) to dashboards (Token Dashboard, Langfuse) to CLI log readers (ccusage). SigRank is the only tool that scores whether that spend was efficient with the Υ Yield metric (cache_read × output / input²), not just how much it cost.",
  },
  {
    question: "How is cost tracking different from efficiency scoring?",
    answer:
      "Cost tracking tells you how much you spent. Efficiency scoring tells you whether that spend was worth it. A developer who spends $50 with a high cache-read ratio and strong output yield is more efficient than one who spends $20 burning fresh tokens every turn. Cost tracking is necessary but not sufficient — without efficiency scoring, you know your bill but not whether your dollars compounded or burned. SigRank's Υ Yield measures this directly.",
  },
  {
    question: "Which tool is best for tracking AI token costs?",
    answer:
      "For raw cost tracking, ccusage and Claude Code /cost are the simplest for Claude Code users; aider /usage for aider users; Langfuse for teams monitoring LLM application spend. But for cost tracking that also scores efficiency, SigRank is the only tool that computes Υ Yield, compression ratio, leverage, and velocity — and ranks you against other operators on cost-adjusted cascade efficiency.",
  },
  {
    question: "Do these tools show cost per session?",
    answer:
      "Most do. Claude Code /cost shows current-session cost inline. aider /usage shows per-session token costs. ccusage reports cost per session from Claude Code logs. Token Dashboard aggregates session costs into a visual view. Langfuse traces cost per LLM call. SigRank goes further: it scores whether each session's spend was efficient (Υ Yield), not just what it cost.",
  },
  {
    question: "Are token cost tracking tools free?",
    answer:
      "Most are free or open-source. SigRank, ccusage, Token Dashboard, aider /usage, and Claude Code /cost are all free. Langfuse is free self-hosted with Cloud from $39/month. The difference is that only SigRank scores spend efficiency — the rest show cost without telling you whether your dollars were well spent.",
  },
];

export default function TokenCostTrackingToolsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Alternatives", path: "/alternatives" },
            {
              name: "Token Cost Tracking Tools",
              path: "/alternatives/token-cost-tracking-tools",
            },
          ]),
          faqPage(FAQS),
          alternativesItemList(
            TOOLS,
            "/alternatives/token-cost-tracking-tools",
            "Best Token Cost Tracking Tools (2026)",
          ),
        ]}
      />

      <WaveHero
        eyebrow="◈ Alternatives"
        title="Best Token Cost Tracking Tools (2026)"
        subtitle={
          <>
            Six tools that track token spend. Only one scores whether those
            dollars <span className="text-gold">compounded</span>.
          </>
        }
      />

      {/* Intro — leads with the direct answer */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Most token cost tracking tools tell you <em>how much</em> you spent.
          Claude Code /cost shows your current session bill. aider /usage shows
          per-session token costs. ccusage reads Claude Code logs and reports
          spend. Langfuse traces LLM call costs across applications. Token
          Dashboard visualizes where your tokens went. None of these tell you
          whether that spend was <strong className="text-text-primary">efficient</strong> —
          whether your cache reads grew faster than your inputs, or whether you
          burned fresh tokens every turn.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the only tool that scores token-spend efficiency with the
          Υ Yield metric (
          <span className="font-mono text-gold">cache_read × output / input²</span>).
          It bundles ccusage and Token Dashboard, so you get the raw cost
          tracking <em>and</em> the efficiency scoring in one install. The five
          tools below each track cost. Here is how they compare.
        </p>
      </section>

      {/* Comparison table */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          At-a-glance comparison
        </h2>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-bg-border">
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  Tool
                </th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  Cost metric
                </th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  Scores spend efficiency?
                </th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  Pricing
                </th>
              </tr>
            </thead>
            <tbody>
              {TOOLS.map((t) => (
                <tr
                  key={t.name}
                  className={`border-b border-bg-border-subtle last:border-b-0 ${t.featured ? "bg-gold/5" : ""}`}
                >
                  <td className="p-3 font-mono text-sm font-bold text-text-primary">
                    {t.featured ? (
                      <span className="text-gold">{t.name}</span>
                    ) : (
                      t.name
                    )}
                  </td>
                  <td className="p-3 font-sans text-xs leading-relaxed text-text-secondary">
                    {t.measures.split("—")[0].trim()}
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">
                    {t.featured ? (
                      <span className="text-gold">Yes — the only one</span>
                    ) : (
                      "No — cost only"
                    )}
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">
                    {t.pricing}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detailed cards */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The 6 tools, in detail
        </h2>
        <div className="flex flex-col gap-5">
          {TOOLS.map((t, i) => (
            <article
              key={t.name}
              className={`flex flex-col gap-4 rounded-lg border p-6 ${
                t.featured
                  ? "border-gold/40 bg-gold/5"
                  : "border-bg-border bg-bg-surface"
              }`}
            >
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-xs text-text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-mono text-lg font-bold text-text-primary">
                  {t.featured ? (
                    <span className="text-gold">{t.name}</span>
                  ) : (
                    t.name
                  )}
                </h3>
                {t.featured && (
                  <span className="rounded-full border border-gold/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-gold">
                    editor&apos;s pick
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                    What it measures
                  </span>
                  <p className="mt-1 font-sans text-sm leading-relaxed text-text-secondary">
                    {t.measures}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                      Pros
                    </span>
                    <ul className="mt-1 flex flex-col gap-1">
                      {t.pros.map((p) => (
                        <li
                          key={p}
                          className="font-sans text-xs leading-relaxed text-text-secondary"
                        >
                          <span className="text-gold">+</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                      Cons
                    </span>
                    <ul className="mt-1 flex flex-col gap-1">
                      {t.cons.map((c) => (
                        <li
                          key={c}
                          className="font-sans text-xs leading-relaxed text-text-secondary"
                        >
                          <span className="text-text-muted">−</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                      Pricing
                    </span>
                    <p className="mt-1 font-sans text-sm text-text-secondary">
                      {t.pricing}
                    </p>
                  </div>
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                      Best for
                    </span>
                    <p className="mt-1 font-sans text-sm text-text-secondary">
                      {t.bestFor}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Verdict */}
      <section className="flex flex-col gap-3 rounded-lg border border-gold/30 bg-gold/5 p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The verdict
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you want to know what your current Claude Code session cost, /cost
          will tell you. If you want per-session aider costs, /usage will tell
          you. If you want Claude Code log costs, ccusage will tell you. If you
          want a visual dashboard, Token Dashboard will show you. If you want
          team-level LLM application costs, Langfuse will trace them. But if
          you want to know whether your token spend was{" "}
          <strong className="text-text-primary">efficient</strong> — whether
          your dollars compounded or burned — SigRank is the only tool that
          scores the cascade and ranks you against every other operator.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          SigRank bundles ccusage, tokscale, and token-dashboard, so you get
          the raw cost tracking <em>and</em> the efficiency scoring in one
          install:{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            npm install -g sigrank
          </code>
          .
        </p>
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">FAQ</h2>
        <dl className="flex flex-col gap-4">
          {FAQS.map((f) => (
            <div key={f.question} className="flex flex-col gap-1">
              <dt className="font-mono text-sm font-bold text-text-primary">
                {f.question}
              </dt>
              <dd className="font-sans text-sm leading-relaxed text-text-secondary">
                {f.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/alternatives/token-tracking-tools"
            className="text-gold underline underline-offset-2"
          >
            Token Tracking Tools
          </Link>
          {" · "}
          <Link
            href="/alternatives/ai-coding-efficiency-tools"
            className="text-gold underline underline-offset-2"
          >
            AI Coding Efficiency Tools
          </Link>
          {" · "}
          <Link
            href="/vs/ccusage"
            className="text-gold underline underline-offset-2"
          >
            vs ccusage
          </Link>
          {" · "}
          <Link
            href="/guides/how-to-reduce-token-waste"
            className="text-gold underline underline-offset-2"
          >
            How to Reduce Token Waste
          </Link>
        </p>
      </section>
    </div>
  );
}
