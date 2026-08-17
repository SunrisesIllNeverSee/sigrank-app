/**
 * app/alternatives/claude-code-usage-tools/page.tsx —
 * "Best Claude Code Usage Tracking Tools (2026)"
 *
 * SEO listicle targeting "claude code usage tools", "claude code token
 * tracker", "claude code metrics", "track claude code usage". Distinct
 * from /alternatives/ccusage-alternatives (which frames ccusage as the
 * incumbent and lists replacements): this page starts from the user's
 * need — "I use Claude Code and want to track my usage" — and surveys
 * the tools that serve it, positioning SigRank as the only one that
 * scores efficiency rather than just counting.
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
  title: "Best Claude Code Usage Tracking Tools (2026)",
  description:
    "The 6 best tools for tracking Claude Code usage in 2026. SigRank, ccusage, Token Dashboard, Tokscale, Claude Code native /cost, and manual log parsing \u2014 compared on scoring, dashboards, and multi-platform.",
  path: "/alternatives/claude-code-usage-tools",
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
      "Operator-level token-cascade efficiency for Claude Code and 15+ other platforms — Υ Yield (cache_read × output / input²), compression ratio, SNR, cache hit rate, leverage, velocity, and class tier. Bundles ccusage so you keep the raw counts and gain scoring.",
    pros: [
      "Bundles ccusage — reads the same Claude Code logs and adds scoring on top",
      "Scores the operator with Υ Yield — tells you if your context is compounding or burning",
      "Live leaderboard with 7d/30d/90d/all-time windows and head-to-head comparison",
      "Platform-neutral: also covers ChatGPT, Gemini, Copilot, Cursor, and 15+ others",
      "MCP server mode — your Claude Code agent can read its own metrics",
      "ed25519-signed submissions, token counts only — no prompt content leaves your device",
    ],
    cons: [
      "More setup than bare ccusage (enroll + submit vs. just run)",
      "Leaderboard sample is still growing in 2026",
    ],
    pricing: "Free (open-source CLI, MIT-licensed code, CC-BY-4.0 data)",
    bestFor: "Claude Code operators who want to know how efficiently they drive the model, not just how much they spent",
    featured: true,
  },
  {
    name: "ccusage",
    measures:
      "Claude Code token usage — reads local logs and reports input, output, cache-read, and cache-write counts per session. The standard tool for raw Claude Code token counting.",
    pros: [
      "Dead simple: reads Claude Code logs locally, no account needed",
      "Accurate token counts straight from the source logs",
      "SigRank bundles it, so you get both in one install",
    ],
    cons: [
      "Read-only — counts tokens but does not score or rank them",
      "Claude Code only; no multi-platform support",
      "No operator-level efficiency metric or leaderboard",
    ],
    pricing: "Free (open-source CLI)",
    bestFor: "Quickly checking your Claude Code token spend without caring about efficiency",
  },
  {
    name: "Token Dashboard (tokendash)",
    measures:
      "Token-usage visualization — charts and breakdowns of input, output, cache-read, and cache-write across Claude Code sessions. Turns ccusage's raw counts into visual dashboards.",
    pros: [
      "Clean visual dashboards for Claude Code token flows",
      "Spot cache-heavy vs input-heavy session patterns at a glance",
      "Free and open-source, bundled with SigRank",
    ],
    cons: [
      "Visualization only — no scoring, ranking, or operator identity",
      "Needs a data source (ccusage or sigrank) to feed it",
      "No leaderboard or cross-operator comparison on its own",
    ],
    pricing: "Free (open-source, bundled with SigRank)",
    bestFor: "Visualizing Claude Code token flows once you have the raw counts",
  },
  {
    name: "Tokscale",
    measures:
      "Token-scaling tool that aggregates Claude Code token usage across sessions and normalizes metrics for comparison. Bundled with SigRank.",
    pros: [
      "Aggregates Claude Code usage across many sessions into comparable scale metrics",
      "Useful for normalizing operators of very different sizes",
      "Free and open-source, bundled with SigRank",
    ],
    cons: [
      "Scaling tool, not a scorer — no Υ Yield, no class tier, no leaderboard",
      "Claude Code-focused; multi-platform aggregation needs SigRank",
      "No operator identity or signed submissions on its own",
    ],
    pricing: "Free (open-source, bundled with SigRank)",
    bestFor: "Normalizing Claude Code token usage across sessions of different scales",
  },
  {
    name: "Claude Code native /cost",
    measures:
      "Built-in /cost command in Claude Code itself — shows token usage and cost for the current session. No external tool needed.",
    pros: [
      "Built into Claude Code — no install, no setup",
      "Instant per-session cost feedback",
      "Always available in your Claude Code terminal",
    ],
    cons: [
      "Session-scoped only — no history, no aggregation, no cross-session view",
      "No efficiency metrics — just raw cost and counts",
      "No leaderboard, no operator identity, no cross-platform comparison",
    ],
    pricing: "Free (built into Claude Code)",
    bestFor: "Quick per-session cost check without leaving Claude Code",
  },
  {
    name: "Manual log parsing",
    measures:
      "Reading Claude Code's local log files directly and writing your own scripts to extract token counts, costs, and patterns.",
    pros: [
      "Maximum flexibility — you build exactly the analysis you want",
      "No new dependencies beyond Claude Code itself",
      "Good for one-off investigations or bespoke reporting",
    ],
    cons: [
      "You maintain the scripts — no scoring, no leaderboard, no operator identity",
      "Claude Code only; no multi-platform support without extra glue",
      "Reinvents what ccusage and SigRank already ship, with more effort",
    ],
    pricing: "Free (your time is the cost)",
    bestFor: "Tinkerers who want full control and have time to maintain glue code",
  },
];

const FAQS = [
  {
    question: "What is the best tool for tracking Claude Code usage?",
    answer:
      "It depends on what you want. For raw token counts, ccusage is the standard — it reads Claude Code logs locally and reports input, output, cache-read, and cache-write per session. For visualization, Token Dashboard turns those counts into charts. For efficiency scoring and ranking, SigRank bundles ccusage and adds Υ Yield (cache_read × output / input²), a live leaderboard, class tiers, and multi-platform support. If you only want a quick per-session cost check, Claude Code's built-in /cost command works without any install.",
  },
  {
    question: "How do I track my Claude Code token usage?",
    answer:
      "The simplest way is ccusage — install it, run it, and it reads your Claude Code logs and reports token counts per session. If you want efficiency scoring on top of the raw counts, install SigRank (which bundles ccusage) and run `sigrank enroll` then `sigrank submit`. SigRank reads the same logs, computes your Υ Yield, and publishes a signed snapshot to the leaderboard. For a quick per-session check without installing anything, use Claude Code's built-in /cost command.",
  },
  {
    question: "Does SigRank work with Claude Code?",
    answer:
      "Yes. SigRank bundles ccusage, which reads Claude Code's local logs directly. Run `npm install -g sigrank`, then `sigrank enroll` to create your operator identity, and `sigrank submit` to score and publish. Your Claude Code sessions contribute to the same leaderboard rank as your ChatGPT, Gemini, Copilot, or Cursor sessions — unified, not siloed. SigRank reads token counts only, never prompt content, and signs snapshots with ed25519 before they leave your device.",
  },
  {
    question: "How is SigRank different from ccusage for Claude Code?",
    answer:
      "ccusage reads Claude Code logs and reports raw token counts — it is a measurement tool. SigRank bundles ccusage and adds scoring (Υ Yield, compression ratio, SNR, leverage, velocity), operator identity, ed25519-signed submissions, a live leaderboard with class tiers, and multi-platform support across Claude, ChatGPT, Gemini, Copilot, Cursor, and 15+ platforms. ccusage tells you what you spent; SigRank tells you how efficiently you spent it and where you rank.",
  },
  {
    question: "Can I see Claude Code token usage without installing anything?",
    answer:
      "Yes — Claude Code has a built-in /cost command that shows token usage and cost for the current session. This is session-scoped only: no history, no aggregation, no efficiency metrics, and no cross-session view. For anything beyond a quick per-session check, you need ccusage (for raw counts) or SigRank (for counts + scoring + leaderboard).",
  },
];

export default function ClaudeCodeUsageToolsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Alternatives", path: "/alternatives" },
            {
              name: "Claude Code Usage Tools",
              path: "/alternatives/claude-code-usage-tools",
            },
          ]),
          faqPage(FAQS),
          alternativesItemList(
            TOOLS,
            "/alternatives/claude-code-usage-tools",
            "Best Claude Code Usage Tracking Tools (2026)",
          ),
        ]}
      />

      <WaveHero
        eyebrow="◈ Alternatives"
        title="Best Claude Code Usage Tracking Tools (2026)"
        subtitle={
          <>
            Six tools for tracking Claude Code usage. Only one scores the{" "}
            <span className="text-gold">cascade</span>, not just the count.
          </>
        }
      />

      {/* Intro — leads with the direct answer */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Claude Code is the most popular AI coding agent in 2026 — and most
          operators have no idea whether their usage is{" "}
          <em>efficient</em>. The built-in <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">/cost</code> command
          tells you what a session cost. ccusage tells you the raw token counts.
          Token Dashboard visualizes them. None of these tell you whether your
          context is <strong className="text-text-primary">compounding</strong>{" "}
          — whether your cache reads are growing faster than your inputs — or{" "}
          <strong className="text-text-primary">burning</strong> fresh tokens
          every turn.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the only tool that scores Claude Code usage with the{" "}
          Υ Yield metric (<span className="font-mono text-gold">cache_read × output / input²</span>)
          and ranks you on a live leaderboard. It bundles ccusage, so you keep
          the raw counts and gain the scoring. Here is how the six leading
          Claude Code usage tools compare.
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
                  Efficiency scoring?
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
          For a quick per-session cost check, Claude Code&apos;s built-in{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">/cost</code> command
          works without installing anything. For raw token counts across
          sessions, ccusage is the standard. For visualization, Token Dashboard
          turns those counts into charts. But if you want to know how{" "}
          <strong className="text-text-primary">efficiently</strong> you drive
          Claude Code — and where you rank against every other operator — SigRank
          is the only tool that scores the cascade and ranks you on a live
          leaderboard.
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
            href="/alternatives/ccusage-alternatives"
            className="text-gold underline underline-offset-2"
          >
            ccusage Alternatives
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
            href="/vs/ccusage"
            className="text-gold underline underline-offset-2"
          >
            vs ccusage
          </Link>
          {" · "}
          <Link
            href="/guides/how-to-track-token-cascade"
            className="text-gold underline underline-offset-2"
          >
            How to Track Your Token Cascade
          </Link>
        </p>
      </section>
    </div>
  );
}
