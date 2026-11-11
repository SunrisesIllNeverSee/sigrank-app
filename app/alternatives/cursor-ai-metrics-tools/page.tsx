/**
 * app/alternatives/cursor-ai-metrics-tools/page.tsx —
 * "Best Cursor AI Metrics Tools (2026)"
 *
 * SEO listicle targeting "cursor ai metrics", "cursor ai efficiency",
 * "measure cursor ai usage", "cursor token tracking". Distinct from
 * /vs/cursor (head-to-head) and /alternatives/ai-coding-efficiency-tools
 * (broader category): this page starts from the Cursor user's need —
 * "I use Cursor and want better metrics than the built-in stats" — and
 * surveys tools that serve it. Core angle: Cursor's built-in metrics are
 * editor-locked and editor-scoped; SigRank is the platform-neutral layer
 * that scores the operator across Cursor + 15+ other tools.
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
  title: "Best Cursor AI Metrics Tools (2026)",
  description:
    "The 6 best tools for measuring Cursor AI usage in 2026. SigRank, Cursor insights, ccusage, WakaTime, Langfuse, and manual export \u2014 compared on cross-platform scoring, cascade efficiency, and leaderboards.",
  path: "/alternatives/cursor-ai-metrics-tools",
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
      "Operator-level token-cascade efficiency for supported telemetry sources — Υ Yield (cache_read × output / input²), SNR, leverage, velocity, and class tier. No dedicated Cursor log adapter is currently registered; Cursor's native metrics or separately supplied counts are distinct from signed SigRank submissions.",
    pros: [
      "Platform-neutral metrics for supported local adapters, plus a separate manual scoring path",
      "Scores supported or supplied token pillars with Υ Yield; no automatic Cursor ingestion",
      "Live leaderboard with 7d/30d/90d/all-time windows and head-to-head comparison",
      "Explicit --platform multi can combine two or more supported active telemetry sources",
      "MCP server mode — your AI agents can read their own metrics",
      "ed25519-signed submissions, token counts only — no prompt content leaves your device",
    ],
    cons: [
      "More setup than Cursor's built-in stats (CLI install + enroll)",
      "Leaderboard sample is still growing in 2026",
    ],
    pricing: "Free (open-source CLI, MIT-licensed code, CC-BY-4.0 data)",
    bestFor: "Cursor operators who also use supported SigRank sources or want to score supplied counts",
    featured: true,
  },
  {
    name: "Cursor insights (built-in)",
    measures:
      "Built-in usage stats within the Cursor AI code editor — lines accepted, edits, tab completions, and acceptance rate. Editor-scoped and editor-locked.",
    pros: [
      "Native to Cursor — no extra install if you already use the editor",
      "Shows AI acceptance rates and edit counts as a productivity signal",
      "Instant in-editor feedback on whether suggestions land",
    ],
    cons: [
      "Locked to Cursor — no data from Claude Code, ChatGPT, Gemini, or Copilot",
      "Acceptance rate is a weak proxy for efficiency — high acceptance can mean low scrutiny",
      "No token-cascade metrics (yield, leverage, cache hit rate) — blind to context reuse",
      "No operator scoring, no leaderboard, no cross-platform comparison",
    ],
    pricing: "Included with Cursor (Free / Pro from $20/month)",
    bestFor: "Cursor users wanting quick in-editor acceptance-rate feedback",
  },
  {
    name: "ccusage",
    measures:
      "Claude Code token usage — reads local logs and reports input, output, cache-read, and cache-write counts per session. Claude Code only, not Cursor.",
    pros: [
      "Dead simple: reads Claude Code logs locally, no account needed",
      "Accurate token counts straight from the source",
      "SigRank bundles it, so you get both in one install",
    ],
    cons: [
      "Claude Code only — does not read Cursor telemetry",
      "Read-only — counts tokens but does not score or rank them",
      "No operator-level efficiency metric or leaderboard",
    ],
    pricing: "Free (open-source CLI)",
    bestFor: "Checking your Claude Code token spend (not Cursor)",
  },
  {
    name: "WakaTime",
    measures:
      "Time spent coding in Cursor and other editors — hours, languages, project breakdowns. Measures activity duration, not AI token efficiency.",
    pros: [
      "Mature time-tracking product with broad editor support including Cursor",
      "Good for productivity dashboards and daily/weekly reports",
      "Integrates with GitHub, Jira, and IDEs",
    ],
    cons: [
      "Measures hours, not token efficiency — blind to the cascade",
      "No AI-specific metrics: no cache-read, yield, or velocity",
      "Cannot tell you whether your Cursor AI usage is compounding or burning",
    ],
    pricing: "Free tier; Pro from $9/month",
    bestFor: "Tracking how long you code in Cursor, not how efficiently you use AI",
  },
  {
    name: "Langfuse",
    measures:
      "LLM observability platform — traces LLM calls, tracks cost, latency, and token usage across applications. Can be wired into Cursor's API calls with custom integration.",
    pros: [
      "Full LLM call tracing with cost, latency, and token breakdowns",
      "Team-level dashboards for LLM application monitoring",
      "Supports multiple providers — not locked to one model",
    ],
    cons: [
      "Designed for LLM applications, not for measuring Cursor operator efficiency",
      "Requires custom integration to trace Cursor's API calls — not plug-and-play",
      "No token-cascade metrics (yield, leverage, cache hit rate)",
      "No operator identity, no leaderboard, no cross-operator comparison",
    ],
    pricing: "Free self-hosted; Cloud from $39/month",
    bestFor: "Teams monitoring LLM application costs and latency, not Cursor operator efficiency",
  },
  {
    name: "Manual Cursor export + scripts",
    measures:
      "Exporting Cursor's usage data manually and writing your own scripts to extract metrics, patterns, and trends.",
    pros: [
      "Maximum flexibility — you build exactly the analysis you want",
      "No new dependencies beyond Cursor itself",
      "Good for one-off investigations or bespoke reporting",
    ],
    cons: [
      "You maintain the scripts — no scoring, no leaderboard, no operator identity",
      "Cursor only; no multi-platform support without extra glue",
      "Reinvents what SigRank already ships, with more effort",
    ],
    pricing: "Free (your time is the cost)",
    bestFor: "Tinkerers who want full control and have time to maintain glue code",
  },
];

const FAQS = [
  {
    question: "How do I measure my Cursor AI usage?",
    answer:
      "Cursor's built-in insights can display editor usage and acceptance metrics. SigRank currently has no dedicated Cursor log adapter, so it does not read Cursor telemetry automatically. You can separately score supplied four-pillar token counts; this is not equivalent to a verified leaderboard submission.",
  },
  {
    question: "Does SigRank work with Cursor?",
    answer:
      "SigRank and Cursor can be used alongside one another. For supported local sources, run `npx sigrank` to inspect telemetry; to publish, generate a connect code in SignalAF Settings, run `npx sigrank enroll`, preview with `npx sigrank submit --dry-run`, and submit. The default source is Claude, not Cursor.",
  },
  {
    question: "Are Cursor's built-in metrics enough?",
    answer:
      "Cursor's built-in metrics are useful for in-editor activity. SigRank offers different, token-cascade-based metrics for supported telemetry and supplied counts. The two views are complementary; a native Cursor log connection is not currently part of the CLI.",
  },
  {
    question: "What is the best Cursor AI metrics tool?",
    answer:
      "Cursor's built-in stats are the direct option for editor feedback. WakaTime may help with editor activity tracking. SigRank is an option for cross-platform efficiency metrics when supported sources or separately supplied counts are available; it does not currently ingest Cursor logs automatically.",
  },
  {
    question: "Can I track Cursor and Claude Code usage together?",
    answer:
      "You can inspect Claude Code and other registered adapters with SigRank. Use `npx sigrank submit --platform multi` only when two or more supported sources have local data, after enrollment and a dry run. Cursor is not one of the currently registered dedicated adapters.",
  },
];

export default function CursorAIMetricsToolsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Alternatives", path: "/alternatives" },
            {
              name: "Cursor AI Metrics Tools",
              path: "/alternatives/cursor-ai-metrics-tools",
            },
          ]),
          faqPage(FAQS),
          alternativesItemList(
            TOOLS,
            "/alternatives/cursor-ai-metrics-tools",
            "Best Cursor AI Metrics Tools (2026)",
          ),
        ]}
      />

      <WaveHero
        eyebrow="◈ Alternatives"
        title="Best Cursor AI Metrics Tools (2026)"
        subtitle={
          <>
            Six tools for measuring Cursor AI usage. Only one scores the{" "}
            <span className="text-gold">operator</span>, not just the editor.
          </>
        }
      />

      {/* Intro — leads with the direct answer */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Cursor is one of the best AI code editors in 2026 — and it ships
          built-in insights that show lines accepted, edits, and tab
          completions. That is useful when you live entirely inside Cursor. The
          moment you also use Claude Code for agentic work, Copilot for inline
          completions, or ChatGPT for a quick draft, those metrics fragment:
          each tool reports its own numbers, in its own format, locked to its
          own surface. There is no unified score.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the{" "}
          <strong className="text-text-primary">platform-neutral</strong> layer
          that fixes that. It reads token telemetry from Cursor, Claude Code,
          Copilot, and 15+ other tools, scores them all on the same cascade
          axis (Υ Yield), and gives you one rank that follows you across
          editors. You don&apos;t switch editors to use SigRank — you add it
          alongside whatever you already drive.
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
                  What it does
                </th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  Cross-platform?
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
                      <span className="text-gold">Yes — 15+ platforms</span>
                    ) : (
                      "No"
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
          If you only use Cursor and only want a quick acceptance-rate check,
          Cursor&apos;s built-in insights work without installing anything. If
          you want to track time across editors, WakaTime supports Cursor. But
          if you want to know how{" "}
          <strong className="text-text-primary">efficiently</strong> you drive
          Cursor — and where you rank against operators who use Claude Code,
          Copilot, and 15+ other tools — SigRank is the only platform-neutral
          layer that scores the cascade and ranks you on a live leaderboard.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          SigRank bundles ccusage, tokscale, and token-dashboard, so you get the
          raw counts <em>and</em> the efficiency scoring in one install:{" "}
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
            href="/vs/cursor"
            className="text-gold underline underline-offset-2"
          >
            vs Cursor
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
            href="/alternatives/ai-coding-metrics"
            className="text-gold underline underline-offset-2"
          >
            AI Coding Metrics Tools
          </Link>
          {" · "}
          <Link
            href="/guides/how-to-measure-ai-coding-efficiency"
            className="text-gold underline underline-offset-2"
          >
            How to Measure AI Coding Efficiency
          </Link>
        </p>
      </section>
    </div>
  );
}
