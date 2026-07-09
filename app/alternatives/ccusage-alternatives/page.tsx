/**
 * app/alternatives/ccusage-alternatives/page.tsx — "Best ccusage Alternatives (2026)"
 *
 * SEO listicle targeting "ccusage alternative", "ccusage replacement",
 * "claude code token tracker". Compares 5 alternatives to ccusage, with the
 * angle that ccusage is great for reading token usage but alternatives add
 * scoring, leaderboards, multi-platform support, and MCP integration.
 *
 * RSC (no "use client"). Uses withOG, JsonLd (breadcrumb + faqPage), WaveHero,
 * and Tailwind theme tokens from the SEO build spec.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Best ccusage Alternatives (2026)",
  description:
    "The 5 best ccusage alternatives in 2026. SigRank, Token Dashboard, manual ccusage + scripts, and Tokscale \u2014 compared on scoring, leaderboards, and MCP.",
  path: "/alternatives/ccusage-alternatives",
});

type Alt = {
  name: string;
  what: string;
  pros: string[];
  cons: string[];
  pricing: string;
  bestFor: string;
  featured?: boolean;
};

const ALTS: Alt[] = [
  {
    name: "SigRank",
    what: "A full operator-scoring platform that bundles ccusage and adds yield scoring, a live leaderboard, class tiers, multi-platform support, and MCP integration. Token counts only, ed25519-signed, privacy-preserving.",
    pros: [
      "Bundles ccusage — you keep the raw token counts and get scoring on top",
      "Scores the operator with Υ Yield (cache_read × output / input²), compression ratio, SNR, leverage, and velocity",
      "Live leaderboard with 7d/30d/90d/all-time windows and head-to-head comparison",
      "Platform-neutral: Claude, ChatGPT, Gemini, Copilot, Cursor, and 15+ platforms",
      "MCP server mode for AI-agent integration — your agent can read its own metrics",
      "Class tiers (IGNITER → TRANSMITTER) give your efficiency a stable label",
    ],
    cons: [
      "More to set up than bare ccusage (enroll + submit vs. just run)",
      "Leaderboard sample is still growing in 2026",
    ],
    pricing: "Free (open-source, MIT-licensed CLI)",
    bestFor: "Operators who want scoring, ranking, and multi-platform coverage",
    featured: true,
  },
  {
    name: "Token Dashboard (tokendash)",
    what: "A token-visualization tool that turns raw token counts into charts and breakdowns. Bundled with SigRank alongside ccusage and tokscale.",
    pros: [
      "Clean visual dashboards for input, output, cache-read, and cache-write",
      "Spot cache-heavy vs input-heavy session patterns at a glance",
      "Free and open-source, bundled with SigRank",
    ],
    cons: [
      "Visualization only — no scoring, ranking, or operator identity",
      "Needs a data source (ccusage or sigrank) to feed it",
      "No multi-platform aggregation on its own",
    ],
    pricing: "Free (open-source, bundled with SigRank)",
    bestFor: "Visualizing token flows once you have the raw counts",
  },
  {
    name: "Manual ccusage + scripts",
    what: "Running ccusage directly and piping its JSON output into your own scripts, spreadsheets, or dashboards for custom analysis.",
    pros: [
      "Maximum flexibility — you build exactly the analysis you want",
      "No new dependencies beyond ccusage itself",
      "Good for one-off investigations or bespoke reporting",
    ],
    cons: [
      "You maintain the scripts — no scoring, no leaderboard, no operator identity",
      "Claude Code only; no multi-platform support without extra glue",
      "No signed submissions, no cross-operator comparison, no MCP integration",
      "Reinvents what SigRank already ships",
    ],
    pricing: "Free (your time is the cost)",
    bestFor:
      "Tinkerers who want full control and have time to maintain glue code",
  },
  {
    name: "Tokscale",
    what: "A token-scaling tool that aggregates token usage across sessions and scales metrics for comparison. Bundled with SigRank.",
    pros: [
      "Aggregates token usage across many sessions into comparable scale metrics",
      "Useful for normalizing operators of very different sizes",
      "Free and open-source, bundled with SigRank",
    ],
    cons: [
      "Scaling tool, not a scorer — no Υ Yield, no class tier, no leaderboard",
      "Needs a data source to feed it",
      "No operator identity or signed submissions on its own",
    ],
    pricing: "Free (open-source, bundled with SigRank)",
    bestFor: "Normalizing token usage across sessions of different scales",
  },
  {
    name: "SigRank MCP server",
    what: "The same SigRank scoring engine exposed as a Model Context Protocol server, so AI agents (Claude, Cursor, Copilot) can read their own token telemetry and submit signed snapshots programmatically.",
    pros: [
      "Agents self-monitor — your AI assistant reads its own cascade metrics",
      "Same scoring, leaderboard, and class tiers as the CLI",
      "Ed25519-signed submissions, privacy-preserving, token counts only",
      "Works with any MCP-compatible agent, not just Claude Code",
    ],
    cons: [
      "Requires an MCP-compatible client to use",
      "More setup than running bare ccusage",
    ],
    pricing: "Free (open-source)",
    bestFor: "AI agents that need to measure and report their own efficiency",
  },
];

const FAQS = [
  {
    question: "What is the best ccusage alternative?",
    answer:
      "SigRank is the best ccusage alternative because it bundles ccusage and adds operator-level scoring (Υ Yield = cache_read × output / input²), a live leaderboard with class tiers, multi-platform support across Claude, ChatGPT, Gemini, Copilot, and Cursor, and MCP server integration for AI agents. You keep the raw token counts ccusage gives you and get scoring, ranking, and cross-platform coverage on top.",
  },
  {
    question: "Does SigRank replace ccusage?",
    answer:
      "No — SigRank bundles ccusage. When you install SigRank (npm install -g sigrank), ccusage is included, so you get the same local Claude Code token reading plus yield scoring, a leaderboard, class tiers, and multi-platform support. ccusage remains the measurement layer; SigRank adds the scoring and ranking layer.",
  },
  {
    question:
      "Is there a ccusage alternative that supports multiple AI platforms?",
    answer:
      "Yes. SigRank is platform-neutral and works across Claude, ChatGPT, Gemini, Copilot, Cursor, and 15+ platforms. ccusage itself only reads Claude Code logs. If you use more than one AI assistant and want unified token-efficiency scoring, SigRank is the natural replacement.",
  },
  {
    question: "Can I use ccusage alternatives with MCP?",
    answer:
      "Yes. SigRank ships an MCP server mode, so any MCP-compatible AI agent can read its own token telemetry and submit signed snapshots programmatically. This lets your AI assistant self-monitor its cascade efficiency without you running a CLI manually.",
  },
  {
    question: "Are ccusage alternatives free?",
    answer:
      'Yes. SigRank, Token Dashboard, Tokscale, and the SigRank MCP server are all free and open-source (MIT-licensed). The only "cost" alternative is manual ccusage + scripts, which is free in money but costs your time to maintain.',
  },
];

export default function CcusageAlternativesPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Alternatives", path: "/alternatives" },
            {
              name: "ccusage Alternatives",
              path: "/alternatives/ccusage-alternatives",
            },
          ]),
          faqPage(FAQS),
        ]}
      />

      <WaveHero
        eyebrow="◈ Alternatives"
        title="Best ccusage Alternatives (2026)"
        subtitle={
          <>
            ccusage is great for reading token usage. These five alternatives
            add{" "}
            <span className="text-gold">
              scoring, leaderboards, multi-platform support,
            </span>{" "}
            and MCP integration.
          </>
        }
      />

      {/* Intro */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What ccusage does well — and where it stops
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">ccusage</strong> is a clean,
          reliable CLI that reads Claude Code token logs locally and reports
          your input, output, cache-read, and cache-write counts. It does one
          thing well: measurement. But it stops there. It does not score your
          efficiency, rank you against other operators, support multiple AI
          platforms, or expose an MCP interface for agents. If you want any of
          those, you need an alternative — and the best one bundles ccusage
          rather than replacing it.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          Here are the five best ccusage alternatives in 2026.
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
                  Scoring?
                </th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  Leaderboard?
                </th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  Multi-platform?
                </th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  MCP?
                </th>
              </tr>
            </thead>
            <tbody>
              {ALTS.map((a) => (
                <tr
                  key={a.name}
                  className={`border-b border-bg-border-subtle last:border-b-0 ${a.featured ? "bg-gold/5" : ""}`}
                >
                  <td className="p-3 font-mono text-sm font-bold text-text-primary">
                    {a.featured ? (
                      <span className="text-gold">{a.name}</span>
                    ) : (
                      a.name
                    )}
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">
                    {a.featured ? <span className="text-gold">Yes</span> : "No"}
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">
                    {a.featured ? <span className="text-gold">Yes</span> : "No"}
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">
                    {a.featured ? <span className="text-gold">Yes</span> : "No"}
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">
                    {a.name === "SigRank MCP server" || a.featured ? (
                      <span className="text-gold">Yes</span>
                    ) : (
                      "No"
                    )}
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
          The 5 alternatives, in detail
        </h2>
        <div className="flex flex-col gap-5">
          {ALTS.map((a, i) => (
            <article
              key={a.name}
              className={`flex flex-col gap-4 rounded-lg border p-6 ${
                a.featured
                  ? "border-gold/40 bg-gold/5"
                  : "border-bg-border bg-bg-surface"
              }`}
            >
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-xs text-text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-mono text-lg font-bold text-text-primary">
                  {a.featured ? (
                    <span className="text-gold">{a.name}</span>
                  ) : (
                    a.name
                  )}
                </h3>
                {a.featured && (
                  <span className="rounded-full border border-gold/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-gold">
                    top pick
                  </span>
                )}
              </div>

              <p className="font-sans text-sm leading-relaxed text-text-secondary">
                {a.what}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                    Pros
                  </span>
                  <ul className="mt-1 flex flex-col gap-1">
                    {a.pros.map((p) => (
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
                    {a.cons.map((c) => (
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
                    {a.pricing}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                    Best for
                  </span>
                  <p className="mt-1 font-sans text-sm text-text-secondary">
                    {a.bestFor}
                  </p>
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
          ccusage is not broken — it is incomplete. It reads your tokens
          accurately but does not tell you whether your cascade is compounding
          or burning, where you rank, or how you compare across platforms.
          SigRank fills every gap: it{" "}
          <strong className="text-text-primary">bundles</strong> ccusage (you
          lose nothing), adds Υ Yield scoring, a live leaderboard, class tiers,
          multi-platform support, and an MCP server for agents. One install,
          full stack:{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            npm install -g sigrank
          </code>
          .
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          If you just want to eyeball token counts and are happy with Claude
          Code only, bare ccusage is fine. If you want to know how efficiently
          you operate AI — and where you stand — SigRank is the upgrade.
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
            href="/vs/ccusage"
            className="text-gold underline underline-offset-2"
          >
            vs ccusage
          </Link>
          {" · "}
          <Link
            href="/wiki/local-agent"
            className="text-gold underline underline-offset-2"
          >
            The Local Agent (MCP)
          </Link>
          {" · "}
          <Link
            href="/tools/yield-calculator"
            className="text-gold underline underline-offset-2"
          >
            Yield Calculator
          </Link>
        </p>
      </section>
    </div>
  );
}
