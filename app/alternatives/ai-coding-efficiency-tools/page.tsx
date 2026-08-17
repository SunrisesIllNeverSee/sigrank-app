/**
 * app/alternatives/ai-coding-efficiency-tools/page.tsx —
 * "Best AI Coding Efficiency Tools (2026)"
 *
 * SEO listicle targeting "ai coding efficiency tools", "ai coding
 * efficiency metrics", "developer efficiency ai tools". Distinct from
 * /alternatives/ai-coding-metrics (which covers measurement broadly):
 * this page focuses on tools that claim to measure or improve *efficiency*
 * — yield, acceptance rate, cost-per-task, time-per-task — and argues that
 * only SigRank scores true token-cascade efficiency (Υ Yield).
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
  title: "Best AI Coding Efficiency Tools (2026)",
  description:
    "The 7 best AI coding efficiency tools in 2026. SigRank, Cursor insights, Copilot metrics, aider, Langfuse, WakaTime, and ccusage \u2014 which actually measures efficiency, not just usage.",
  path: "/alternatives/ai-coding-efficiency-tools",
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
      "Operator-level token-cascade efficiency — Υ Yield (cache_read × output / input²), compression ratio, SNR, cache hit rate, leverage, velocity, and class tier. The only tool that scores whether your AI usage is compounding or burning.",
    pros: [
      "Scores the operator, not the model — the only tool that ranks the human driving the AI",
      "Platform-neutral: works across Claude, ChatGPT, Gemini, Copilot, Cursor, and 15+ platforms",
      "Privacy-preserving: on-device scanning, token counts only, ed25519-signed submissions",
      "Live leaderboard with 7d/30d/90d/all-time windows and head-to-head comparison",
      "Bundles ccusage, tokscale, and token-dashboard — one install, full telemetry stack",
    ],
    cons: [
      "Newer ecosystem — leaderboard sample still growing",
      "Requires a CLI install and enrollment to submit",
    ],
    pricing: "Free (open-source CLI, MIT-licensed code, CC-BY-4.0 data)",
    bestFor: "Operators who want to know if their AI usage is efficient, not just how much they used",
    featured: true,
  },
  {
    name: "Cursor insights",
    measures:
      "Built-in usage stats within the Cursor AI code editor — lines accepted, edits, and tab completions. Acceptance rate is a weak proxy for efficiency.",
    pros: [
      "Native to Cursor — no extra install if you already use the editor",
      "Shows AI acceptance rates and edit counts as a productivity signal",
      "Good for editor-internal feedback on whether suggestions land",
    ],
    cons: [
      "Locked to Cursor — no data from Claude, ChatGPT, Gemini, or Copilot",
      "Acceptance rate is a weak proxy: accepting 100% of suggestions is not the same as using AI efficiently",
      "No token-cascade metrics (yield, leverage, cache hit rate) — blind to context reuse",
    ],
    pricing: "Included with Cursor (Free / Pro from $20/month)",
    bestFor: "Cursor users wanting quick in-editor acceptance-rate feedback",
  },
  {
    name: "GitHub Copilot metrics",
    measures:
      "Copilot acceptance and suggestion stats surfaced in GitHub organization dashboards. Team-level adoption and acceptance-rate visibility.",
    pros: [
      "Built into GitHub for orgs already using Copilot",
      "Team-level adoption and acceptance-rate visibility for managers",
      "No separate tool to install",
    ],
    cons: [
      "GitHub Copilot only — no multi-platform support",
      "Acceptance rate is a weak proxy for efficiency — high acceptance can mean low scrutiny",
      "No token-cascade metrics, no operator-level scoring or ranking",
    ],
    pricing: "Included with Copilot Business/Enterprise",
    bestFor: "Org admins monitoring Copilot adoption across a team",
  },
  {
    name: "aider",
    measures:
      "Built-in /usage command showing token costs and session totals for aider's terminal-based AI coding. Reports input, output, and cost per session.",
    pros: [
      "Built into aider — no separate install if you already use it",
      "Shows per-session token costs and running totals",
      "Open-source and terminal-native, fits CLI workflows",
    ],
    cons: [
      "aider only — no data from Cursor, Claude Code, Copilot, or other tools",
      "Reports costs, not efficiency — no yield, leverage, or cascade metrics",
      "No operator scoring, no leaderboard, no cross-platform comparison",
    ],
    pricing: "Free (open-source); you pay for the underlying LLM API",
    bestFor: "aider users checking their per-session token spend",
  },
  {
    name: "Langfuse",
    measures:
      "LLM observability platform — traces LLM calls, tracks cost, latency, and token usage across applications. Designed for teams shipping LLM features, not for individual operator efficiency.",
    pros: [
      "Full LLM call tracing with cost, latency, and token breakdowns",
      "Team-level dashboards for LLM application monitoring",
      "Supports multiple providers — not locked to one model",
    ],
    cons: [
      "Designed for LLM applications, not for measuring operator coding efficiency",
      "No token-cascade metrics (yield, leverage, cache hit rate)",
      "No operator identity, no leaderboard, no cross-operator comparison",
    ],
    pricing: "Free self-hosted; Cloud from $39/month",
    bestFor: "Teams monitoring LLM application costs and latency, not operator efficiency",
  },
  {
    name: "WakaTime",
    measures:
      "Time spent coding — hours, languages, editors, and project breakdowns. Measures activity duration as a proxy for productivity, not token efficiency.",
    pros: [
      "Mature time-tracking product with broad editor support",
      "Good for productivity dashboards and daily/weekly reports",
      "Integrates with GitHub, Jira, and IDEs",
    ],
    cons: [
      "Measures hours, not token efficiency — blind to the cascade",
      "No AI-specific metrics: no cache-read, yield, or compression ratio",
      "Cannot tell you whether your AI usage is compounding or burning",
    ],
    pricing: "Free tier; Pro from $9/month",
    bestFor: "Tracking how long you code, not how efficiently you use AI",
  },
  {
    name: "ccusage",
    measures:
      "Claude Code token usage — reads local logs and reports input, output, cache-read, and cache-write counts per session. Counts tokens but does not score efficiency.",
    pros: [
      "Dead simple: reads Claude Code logs locally, no account needed",
      "Accurate token counts straight from the source",
      "SigRank bundles it, so you get both in one install",
    ],
    cons: [
      "Read-only — counts tokens but does not score or rank them",
      "Claude Code only; no multi-platform support",
      "No efficiency metric — raw counts without yield, leverage, or cascade scoring",
    ],
    pricing: "Free (open-source CLI)",
    bestFor: "Quickly checking your Claude Code token spend before you care about efficiency",
  },
];

const FAQS = [
  {
    question: "What are AI coding efficiency tools?",
    answer:
      "AI coding efficiency tools measure whether your AI usage is efficient — not just how much you use. They range from acceptance-rate proxies (Cursor, Copilot) to time trackers (WakaTime) to token counters (ccusage). SigRank is the only tool that scores true token-cascade efficiency with the Υ Yield metric (cache_read × output / input²) and ranks operators on a live, cross-platform leaderboard.",
  },
  {
    question: "How is efficiency different from usage?",
    answer:
      "Usage is volume — how many tokens you spent, how many suggestions you accepted, how many hours you coded. Efficiency is whether that usage compounded: did your cache reads grow faster than your inputs, or did you burn fresh tokens every turn? A developer who spends 50K tokens with a high cache-read ratio is more efficient than one who spends 20K tokens with zero cache reuse. SigRank's Υ Yield measures this directly; most other tools measure usage and call it efficiency.",
  },
  {
    question:
      "Which AI coding efficiency tool is best for measuring operator performance?",
    answer:
      "SigRank is the only tool that scores operator-level token-cascade efficiency and ranks you against other operators on a live leaderboard. Cursor and Copilot report acceptance rates (a weak proxy). WakaTime reports hours. ccusage reports raw token counts. Only SigRank computes Υ Yield, compression ratio, SNR, leverage, and velocity — and assigns a class tier from IGNITER to ARCH+ based on your cascade architecture.",
  },
  {
    question: "Is acceptance rate a good measure of AI coding efficiency?",
    answer:
      "No. Acceptance rate (the percentage of AI suggestions you accept) is a weak proxy. A developer who accepts 100% of suggestions without scrutiny has a high acceptance rate but may be producing low-quality code. A developer who accepts 30% of suggestions — the right 30% — is more efficient per accepted token. SigRank measures the cascade (how well you reuse context across a session), which correlates with actual efficiency, not blind acceptance.",
  },
  {
    question: "Are AI coding efficiency tools free?",
    answer:
      "Most are free or have a free tier. SigRank, ccusage, and aider are free and open-source. WakaTime has a free tier with Pro from $9/month. Langfuse is free self-hosted with Cloud from $39/month. Cursor insights and GitHub Copilot metrics are included with their respective paid products.",
  },
];

export default function AICodingEfficiencyToolsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Alternatives", path: "/alternatives" },
            {
              name: "AI Coding Efficiency Tools",
              path: "/alternatives/ai-coding-efficiency-tools",
            },
          ]),
          faqPage(FAQS),
          alternativesItemList(
            TOOLS,
            "/alternatives/ai-coding-efficiency-tools",
            "Best AI Coding Efficiency Tools (2026)",
          ),
        ]}
      />

      <WaveHero
        eyebrow="◈ Alternatives"
        title="Best AI Coding Efficiency Tools (2026)"
        subtitle={
          <>
            Seven tools that claim to measure AI coding efficiency. Only one
            scores the <span className="text-gold">cascade</span>, not just the
            count.
          </>
        }
      />

      {/* Intro — leads with the direct answer */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Most "AI coding efficiency" tools measure <em>usage</em> and call it
          efficiency. Cursor reports acceptance rate. Copilot reports acceptance
          rate. WakaTime reports hours. ccusage reports token counts. None of
          these tell you whether your AI usage is <strong className="text-text-primary">compounding</strong> —
          whether your cache reads are growing faster than your inputs — or
          <strong className="text-text-primary"> burning</strong> fresh tokens
          every turn.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the only tool that scores true token-cascade efficiency
          with the Υ Yield metric (<span className="font-mono text-gold">cache_read × output / input²</span>)
          and ranks operators on a live, cross-platform leaderboard. The six
          tools below each measure some slice of efficiency. Here is how they
          compare.
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
                  Efficiency metric
                </th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  Cascade scoring?
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
          The 7 tools, in detail
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
          If you want to know how many suggestions you accepted, Cursor or
          Copilot will tell you. If you want to know how many hours you coded,
          WakaTime will tell you. If you want to know how many tokens you spent,
          ccusage will tell you. But if you want to know whether your AI usage
          is <strong className="text-text-primary">efficient</strong> — whether
          your context is compounding or burning — SigRank is the only tool
          that scores the cascade and ranks you against every other operator.
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
            href="/alternatives/ai-coding-metrics"
            className="text-gold underline underline-offset-2"
          >
            AI Coding Metrics Tools
          </Link>
          {" · "}
          <Link
            href="/alternatives/token-tracking-tools"
            className="text-gold underline underline-offset-2"
          >
            Token Tracking Tools
          </Link>
          {" · "}
          <Link
            href="/vs/cursor"
            className="text-gold underline underline-offset-2"
          >
            vs Cursor
          </Link>
          {" · "}
          <Link
            href="/guides/how-to-improve-your-yield"
            className="text-gold underline underline-offset-2"
          >
            How to Improve Your Yield
          </Link>
        </p>
      </section>
    </div>
  );
}
