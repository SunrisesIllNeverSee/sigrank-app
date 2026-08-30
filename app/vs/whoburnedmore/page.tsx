/**
 * app/vs/whoburnedmore/page.tsx — "SigRank vs whoburnedmore" SEO comparison page.
 *
 * Angle: whoburnedmore celebrates the biggest burners. SigRank celebrates the
 * most efficient operators. Burning more tokens is not a skill — compounding
 * them is.
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
  title: "SigRank vs whoburnedmore",
  description:
    "whoburnedmore celebrates the biggest token burners. SigRank celebrates the most efficient operators. Burning more tokens is not a skill — compounding them is.",
  path: "/vs/whoburnedmore",
});

// Comparison rows — feature-by-feature, whoburnedmore vs SigRank.
const COMPARE_ROWS: { feature: string; whoburnedmore: string; sigrank: string }[] = [
  {
    feature: "What it ranks",
    whoburnedmore: "Total tokens burned (most burned = #1)",
    sigrank: "Cascade yield (Υ = cache_read × output / input²)",
  },
  {
    feature: "Leaderboard type",
    whoburnedmore: "Pure burn-rate competition",
    sigrank: "Signed, yield-ranked operator board",
  },
  {
    feature: "Cascade efficiency score (Υ Yield)",
    whoburnedmore: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    whoburnedmore: "No (raw counts)",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    whoburnedmore: "No",
    sigrank: "Yes",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    whoburnedmore: "No",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    whoburnedmore: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    whoburnedmore: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform-neutral (Claude Code, Cursor, Copilot, Gemini, 15+)",
    whoburnedmore: "Limited",
    sigrank: "Yes",
  },
  {
    feature: "Bundled tools (tokscale, token-dashboard)",
    whoburnedmore: "No",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    whoburnedmore: "Yes",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a whoburnedmore alternative?",
    answer:
      "They are opposites in what they celebrate. whoburnedmore ranks developers by who burned the most tokens — it is a pure burn-rate competition. SigRank ranks by cascade yield: Υ = cache_read × output / input². If you want to compete on who burned the most, whoburnedmore is that. If you want to compete on who operated the most efficiently, SigRank answers that. Burning more tokens is not a skill — compounding them is.",
  },
  {
    question: "Why is burning more tokens not a skill?",
    answer:
      "Burning more tokens measures consumption, not competence. An operator who re-sends the same context every turn and burns 50M input tokens to produce 3K output has burned a lot and produced little. An operator who compounds cached context and burns 5M tokens to produce 30K output has burned less and produced more. The first operator tops whoburnedmore. The second tops SigRank. Fuel consumption is not lap time. Burning more is the opposite of efficient operating.",
  },
  {
    question: "What does whoburnedmore not measure that SigRank does?",
    answer:
      "whoburnedmore reports total tokens burned and ranks by that single number. SigRank derives the cascade architecture from the same four pillars: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). whoburnedmore tells you who burned the most; SigRank tells you who got the most signal per token spent.",
  },
  {
    question: "Can I use both whoburnedmore and SigRank?",
    answer:
      "Yes. whoburnedmore gives you the burn-rate competition. SigRank gives you the efficiency layer that burn rankings cannot provide. Run `sigrank submit` to publish your cascade score to the SigRank leaderboard, and keep your whoburnedmore profile for the burn crowd. The two are complementary, not mutually exclusive. The same local logs feed both. Just know that a high whoburnedmore rank and a high SigRank yield are not the same thing.",
  },
  {
    question: "Which is better for finding skilled AI operators?",
    answer:
      "SigRank. Burn-rate leaderboards conflate activity with skill. The operator who burns the most tokens is not the most skilled — they are the most active, or the most wasteful. Yield filters out that noise: it rewards the operator whose cascade is compounding, not the one whose burn rate is highest. If you want to find the best drivers, look at lap times, not fuel consumption.",
  },
];

export default function VsWhoburnedmorePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs whoburnedmore", path: "/vs/whoburnedmore" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs whoburnedmore \u2014 Most Burned vs Best Yield",
            description: "whoburnedmore celebrates the biggest token burners. SigRank celebrates the most efficient operators. Burning more tokens is not a skill — compounding them is.",
            path: "/vs/whoburnedmore",
          }),
        ]}
      />

      <WaveHero
        eyebrow="\u25C8 SigRank vs whoburnedmore"
        title="Burning More Is Not a Skill. Compounding Is."
        subtitle={
          <>
            whoburnedmore celebrates the biggest burners. SigRank celebrates
            the <span className="text-gold">most efficient operators</span>.
            Same data, opposite values. Fuel consumption is not lap time.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: whoburnedmore
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          whoburnedmore is a leaderboard that ranks developers by who burned
          the most tokens. It is a pure burn-rate competition — the premise is
          in the name. <em>Who burned more? That person wins.</em> It is honest
          about what it measures: consumption. But consumption is not skill. An
          operator who re-sends the same context every turn and burns 50M input
          tokens will top the board. An operator who compounds cached context
          and produces the same output with 5M tokens will rank lower.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank takes the same token telemetry and asks a different question:
          <strong className="text-text-primary"> who compounded the best?</strong>
          The headline metric, Υ Yield = cache_read × output / input², rewards
          the operator who reuses cached context efficiently and penalizes the
          one who burns fresh input without leverage. whoburnedmore counts the
          fuel; SigRank measures the lap time. Both matter. Only one tells you
          who is winning.
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
                  whoburnedmore
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
                    {r.whoburnedmore}
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

      {/* Why burning more isn't a skill */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why burning more isn&apos;t a skill
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          whoburnedmore answers <em>&quot;who burned the most tokens?&quot;</em>{" "}
          That is a consumption contest, not a skill ranking. Two operators can
          spend the same 50K input tokens and get wildly different outcomes. One
          reuses cached context efficiently and produces 30K output tokens; the
          other re-sends the same context every turn and produces 3K. Same
          spend, ten-fold difference in signal. On whoburnedmore, they tie. On a
          yield leaderboard, the gap is obvious.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh input
          without leverage. whoburnedmore gives you the total; SigRank tells you
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
          From burn to yield
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you already run whoburnedmore, you have the token counts. SigRank
          reads the same telemetry and adds the scoring layer burn rankings
          never had:
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
          Keep your whoburnedmore profile for the burn crowd. Add the
          efficiency layer that burn rankings cannot provide. Install SigRank
          and submit your first signed snapshot in under a minute.
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
