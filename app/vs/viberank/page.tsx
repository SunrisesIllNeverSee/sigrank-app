/**
 * app/vs/viberank/page.tsx — "SigRank vs viberank" SEO comparison page.
 *
 * Angle: viberank ranks developers by token burn — a public leaderboard for
 * vibe coding token usage. SigRank ranks by cascade yield. Burn rate is
 * participation; cascade yield is skill.
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
  title: "SigRank vs viberank \u2014 Burn Rate vs Cascade Yield",
  description:
    "viberank ranks developers by token burn for vibe coding. SigRank ranks by cascade yield efficiency. Burn rate is participation; cascade yield is skill.",
  path: "/vs/viberank",
});

// Comparison rows — feature-by-feature, viberank vs SigRank.
const COMPARE_ROWS: { feature: string; viberank: string; sigrank: string }[] = [
  {
    feature: "What it ranks",
    viberank: "Token burn (total tokens consumed)",
    sigrank: "Cascade yield (Υ = cache_read × output / input²)",
  },
  {
    feature: "Leaderboard type",
    viberank: "Public, gamified, burn-ranked",
    sigrank: "Public, signed, yield-ranked",
  },
  {
    feature: "Cascade efficiency score (Υ Yield)",
    viberank: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    viberank: "No (raw counts)",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    viberank: "No",
    sigrank: "Yes",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    viberank: "Partial (profile pages)",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    viberank: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    viberank: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform-neutral (Claude Code, Cursor, Copilot, Gemini, 15+)",
    viberank: "Web-based, limited tool coverage",
    sigrank: "Yes",
  },
  {
    feature: "Bundled tools (tokscale, token-dashboard)",
    viberank: "No",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    viberank: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a viberank alternative?",
    answer:
      "They overlap on having a public leaderboard but diverge on what they rank. viberank ranks developers by token burn — how many tokens you consumed in your vibe coding sessions. SigRank ranks by cascade yield: Υ = cache_read × output / input². If you want a gamified burn-rate competition, viberank is that. If you want to know who is actually efficient at driving AI, SigRank answers that. You can run both — they read the same token telemetry.",
  },
  {
    question: "Why is burn rate not a skill metric?",
    answer:
      "Burn rate measures participation, not skill. An operator who re-sends the same context every turn and burns 50M input tokens will top a burn-rate leaderboard. An operator who compounds cached context and produces the same output with 5M tokens will rank lower on burn but higher on yield. Burning more tokens is the opposite of efficient operating. viberank celebrates the biggest burners; SigRank celebrates the most efficient operators. Fuel consumption is not lap time.",
  },
  {
    question: "What does viberank not measure that SigRank does?",
    answer:
      "viberank reports total tokens burned and ranks by that single number. SigRank derives the cascade architecture from the same four pillars: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). viberank tells you who burned the most; SigRank tells you who got the most signal per token spent. Burn rate rewards the operator who never stops typing; yield rewards the one who compounds.",
  },
  {
    question: "Can I use both viberank and SigRank?",
    answer:
      "Yes. viberank gives you the gamified burn-rate competition and the vibe coding community. SigRank gives you the efficiency layer that burn rankings cannot provide. Run `sigrank submit` to publish your cascade score to the SigRank leaderboard, and keep your viberank profile for the burn crowd. The two are complementary, not mutually exclusive. The same local logs feed both.",
  },
  {
    question: "Which is better for finding the most skilled AI operators?",
    answer:
      "SigRank. Burn-rate leaderboards conflate activity with skill. An operator who burns 50M tokens re-sending the same context every turn will outrank one who burns 5M tokens but compounds cached context into high-yield output. Yield filters out that noise: it rewards the operator whose cascade is compounding, not the one whose burn rate is highest. If you want to find the best drivers, look at lap times, not fuel consumption.",
  },
];

export default function VsViberankPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs viberank", path: "/vs/viberank" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs viberank \u2014 Burn Rate vs Cascade Yield",
            description: "viberank ranks developers by token burn for vibe coding. SigRank ranks by cascade yield efficiency. Burn rate is participation; cascade yield is skill.",
            path: "/vs/viberank",
          }),
        ]}
      />

      <WaveHero
        eyebrow="\u25C8 SigRank vs viberank"
        title="Burn Rate Is Participation. Yield Is Skill."
        subtitle={
          <>
            viberank ranks developers by how much they burn. SigRank ranks by{" "}
            <span className="text-gold">how efficiently they compound</span>.
            Burn rate is participation; cascade yield is skill. Same data,
            different question.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: viberank
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          viberank is a public leaderboard for AI coding token usage with a vibe
          coding focus. It ranks developers by token burn — how many tokens you
          consumed across your sessions. It is gamified, web-based, and built
          around a simple premise: <em>more tokens burned = higher rank</em>.
          That is a participation metric, not a skill metric. An operator who
          re-sends the same context every turn and burns 50M input tokens will
          top the board. An operator who compounds cached context and produces
          the same output with 5M tokens will rank lower.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank takes the same token telemetry and asks a different question:
          <strong className="text-text-primary"> is the cascade compounding or
          burning?</strong> The headline metric, Υ Yield = cache_read × output /
          input², rewards the operator who reuses cached context efficiently and
          penalizes the one who burns fresh input without leverage. viberank
          counts the fuel; SigRank measures the lap time. Both matter. Only one
          tells you who is winning.
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
                  viberank
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
                    {r.viberank}
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

      {/* Why burn rate isn't skill */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why burn rate isn&apos;t a skill metric
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          viberank answers <em>&quot;who burned the most tokens?&quot;</em>{" "}
          That is a participation contest, not a skill ranking. Two operators
          can spend the same 50K input tokens and get wildly different outcomes.
          One reuses cached context efficiently and produces 30K output tokens;
          the other re-sends the same context every turn and produces 3K. Same
          spend, ten-fold difference in signal. On a burn-rate leaderboard, they
          tie. On a yield leaderboard, the gap is obvious.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh input
          without leverage. viberank gives you the total; SigRank tells you
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
          From burn rate to yield
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already run viberank, you have the token counts. SigRank reads
          the same telemetry and adds the scoring layer burn rankings never had:
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
          Ready to see your yield?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep your viberank profile for the burn crowd. Add the efficiency
          layer that burn rankings cannot provide. Install SigRank and submit
          your first signed snapshot in under a minute.
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
            href="/alternatives/ccusage-alternatives"
            className="text-gold underline underline-offset-2"
          >
            ccusage Alternatives
          </Link>
          {" \u00B7 "}
          <Link
            href="/tools/yield-calculator"
            className="text-gold underline underline-offset-2"
          >
            Yield Calculator
          </Link>
          {" \u00B7 "}
          <Link
            href="/wiki/local-agent"
            className="text-gold underline underline-offset-2"
          >
            The Local Agent (MCP)
          </Link>
        </p>
      </section>
    </div>
  );
}
