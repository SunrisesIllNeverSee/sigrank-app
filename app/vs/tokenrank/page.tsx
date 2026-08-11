/**
 * app/vs/tokenrank/page.tsx — "SigRank vs TokenRank" SEO comparison page.
 *
 * Angle: TokenRank uses "burn to rank" — aggregate token activity. Similar
 * privacy positioning, supports Codex/Claude/Gemini/Qwen/Cursor/Copilot. But
 * still volume-based.
 *
 * RSC only — no client JS. Uses withOG(), JsonLd (breadcrumb + faqPage),
 * WaveHero, and a styled comparison table matching the repo's table conventions.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, comparisonArticle } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

export const metadata: Metadata = withOG({
  title: "SigRank vs TokenRank \u2014 Yield vs Burn-to-Rank",
  description:
    "TokenRank uses burn-to-rank: aggregate token activity across Codex, Claude, Gemini, Qwen, Cursor, Copilot. SigRank ranks by Yield efficiency. Burning to rank vs building to rank.",
  path: "/vs/tokenrank",
});

// Comparison rows — feature-by-feature, TokenRank vs SigRank.
const COMPARE_ROWS: { feature: string; tokenrank: string; sigrank: string }[] = [
  {
    feature: "Reads Claude Code token logs",
    tokenrank: "Yes",
    sigrank: "Yes (bundles ccusage)",
  },
  {
    feature:
      "Token pillar breakdown (input / output / cache-read / cache-write)",
    tokenrank: "Yes",
    sigrank: "Yes",
  },
  {
    feature: "Cascade efficiency score (Υ = cache_read × output / input²)",
    tokenrank: "No (burn-to-rank by volume)",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    tokenrank: "Partial (raw counts)",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    tokenrank: "No",
    sigrank: "Yes",
  },
  {
    feature: "Build archetype (10 types)",
    tokenrank: "No",
    sigrank: "Yes",
  },
  {
    feature: "Global operator leaderboard",
    tokenrank: "Yes (volume-ranked)",
    sigrank: "Yes (Yield-ranked)",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    tokenrank: "Partial (profile pages)",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    tokenrank: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    tokenrank: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform coverage",
    tokenrank: "Codex, Claude, Gemini, Qwen, Cursor, Copilot",
    sigrank: "15+ platforms (Claude, Cursor, Copilot, Gemini)",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    tokenrank: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a TokenRank alternative?",
    answer:
      "They overlap on data and on privacy positioning, but diverge on the ranking axis. TokenRank uses burn-to-rank: it aggregates token activity across Codex, Claude, Gemini, Qwen, Cursor, and Copilot, then ranks by total volume. SigRank takes the same token telemetry and ranks by Yield efficiency: Υ = cache_read × output / input². If you want a volume leaderboard with wide tool coverage, TokenRank works. If you want to know who is actually efficient, SigRank is the answer. You can run both, they read the same logs.",
  },
  {
    question: "What does TokenRank not measure that SigRank does?",
    answer:
      "TokenRank reports aggregate token activity and ranks by that total. SigRank derives the cascade architecture from the same four pillars: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). TokenRank rewards the operator who burns the most; SigRank rewards the one who compounds the most. Burning to rank is a volume game; building to rank is a skill game.",
  },
  {
    question: "Can I use both TokenRank and SigRank?",
    answer:
      "Yes, and they share a similar privacy stance: both publish token counts only, no code, no prompts, no secrets. TokenRank gives you the volume view across six major platforms. SigRank gives you the efficiency layer that volume rankings cannot. Run `sigrank submit` to publish your cascade score to the SigRank leaderboard, and keep TokenRank for the burn-rate crowd. The same local logs feed both.",
  },
  {
    question: "Which is better for comparing AI operators across platforms?",
    answer:
      "SigRank, for one reason: efficiency is platform-neutral. TokenRank ranks by volume, which favors operators on cheaper or higher-throughput models regardless of skill. SigRank ranks by Υ Yield, a ratio computed from token pillars, so it is comparable across operators regardless of which tool they drove. An operator compounding cached context on Claude and one doing the same on Cursor get comparable Yield scores. Volume is not comparable across platforms; Yield is.",
  },
  {
    question: "TokenRank and SigRank both emphasize privacy. What is the difference?",
    answer:
      "Both publish token counts only and strip code, prompts, and secrets. The difference is what they do with those counts. TokenRank sums them and ranks by total. SigRank computes a signed, cascade-scored, class-tiered snapshot from them and ranks by Yield. Privacy is the input discipline; efficiency is the output signal. TokenRank protects your data and counts it; SigRank protects your data and grades it.",
  },
];

export default function VsTokenrankPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs TokenRank", path: "/vs/tokenrank" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs TokenRank — Yield vs Burn-to-Rank",
            description: "TokenRank uses burn-to-rank: aggregate token activity across Codex, Claude, Gemini, Qwen, Cursor, Copilot. SigRank ranks by Yield efficiency. Burning to rank vs building to rank.",
            path: "/vs/tokenrank",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs TokenRank"
        title="Burning to Rank vs Building to Rank"
        subtitle={
          <>
            TokenRank uses burn-to-rank: aggregate token activity across Codex,
            Claude, Gemini, Qwen, Cursor, Copilot. Similar privacy stance. But
            still volume-based. SigRank ranks by{" "}
            <span className="text-gold">Υ Yield efficiency</span>. Burning to
            rank is a volume game; building to rank is a skill game.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: TokenRank
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          TokenRank aggregates token activity across Codex, Claude, Gemini,
          Qwen, Cursor, and Copilot, then ranks operators by total volume
          burned. It shares SigRank&apos;s privacy stance: token counts only,
          no code, no prompts. But it ranks by the wrong axis.{" "}
          <em>Burn-to-rank is a volume game.</em> An operator who re-sends the
          same context every turn and burns 50M tokens will outrank one who
          compounds cached context and burns 5M. Higher burn, lower skill,
          higher rank.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank takes the same four token pillars and asks a different
          question: <strong className="text-text-primary">is the cascade
          compounding or burning?</strong> The headline metric, Υ Yield =
          cache_read × output / input², rewards the operator who reuses cached
          context efficiently and penalizes the one who burns fresh input
          without leverage. TokenRank counts the fuel burned; SigRank measures
          the lap time. Both matter. Only one tells you who is building, not
          just burning.
        </p>
      </section>

      {/* Comparison table */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Feature comparison
        </h2>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-elevated">
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  Feature
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  TokenRank
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-gold">
                  SigRank
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((r) => (
                <tr
                  key={r.feature}
                  className="border-b border-bg-border-subtle last:border-0"
                >
                  <td className="px-4 py-2.5 text-text-primary">{r.feature}</td>
                  <td className="px-4 py-2.5 text-text-secondary">
                    {r.tokenrank}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gold">
                    {r.sigrank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Why the cascade matters */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why burn-to-rank isn&apos;t enough
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          TokenRank answers <em>&quot;who burned the most tokens?&quot;</em>{" "}
          That is a consumption contest, not a skill ranking. Two operators can
          burn the same 50M tokens and get wildly different outcomes. One
          reuses cached context efficiently and produces 30K output tokens per
          session; the other re-sends the same context every turn and produces
          3K. Same burn, ten-fold difference in signal. On a burn-to-rank
          leaderboard, they tie. On a Yield leaderboard, the gap is obvious.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh
          input without leverage. TokenRank sums the burn; SigRank tells you
          whether the cascade it describes is{" "}
          <em>compounding or burning</em>.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            The four token pillars (both tools read these)
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 font-sans text-sm text-text-secondary">
            <li>
              <strong className="text-text-primary">Input</strong>: tokens you
              send to the model
            </li>
            <li>
              <strong className="text-text-primary">Output</strong>: tokens the
              model generates back
            </li>
            <li>
              <strong className="text-text-primary">Cache-read</strong>: cached
              tokens reused from prior context
            </li>
            <li>
              <strong className="text-text-primary">Cache-write</strong>: new
              tokens written to cache for future reuse
            </li>
          </ul>
        </div>
      </section>

      {/* The upgrade path */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          From burn-to-rank to Yield
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already run TokenRank, you have the logs. SigRank reads the
          same telemetry and adds the efficiency layer burn-to-rank never had:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
            {`npm install -g sigrank
sigrank enroll      # create your operator identity
sigrank submit      # reads logs, scores, signs, publishes`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Prefer to inspect before you submit? Run{" "}
          <span className="font-mono text-text-primary">
            sigrank me --dry-run
          </span>{" "}
          to see your scored payload locally, or paste your token counts into
          the{" "}
          <Link href="/score" className="text-gold underline underline-offset-2">
            /score calculator
          </Link>{" "}
          to compute your Υ Yield, class tier, and compression ratio instantly,
          no account, no submission, just the numbers.
        </p>
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Frequently asked questions
        </h2>
        <dl className="flex flex-col gap-5">
          {FAQS.map((f) => (
            <div key={f.question} className="flex flex-col gap-1.5">
              <dt className="font-semibold text-text-primary">{f.question}</dt>
              <dd className="font-sans text-sm leading-relaxed text-text-secondary">
                {f.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Ready to see your Yield?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep TokenRank for the volume view. Add the efficiency layer that
          burn-to-rank cannot provide. Install SigRank and submit your first
          signed snapshot in under a minute.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/score"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            Calculate your Υ Yield
          </Link>
          <Link
            href="/board/all"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            See the leaderboard
          </Link>
        </div>
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
            href="/tools/yield-calculator"
            className="text-gold underline underline-offset-2"
          >
            Yield Calculator
          </Link>
          {" · "}
          <Link
            href="/vs/tokscale"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs Tokscale
          </Link>
          {" · "}
          <Link
            href="/vs/tokentracker"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs Token Tracker
          </Link>
        </p>
      </section>
    </div>
  );
}
