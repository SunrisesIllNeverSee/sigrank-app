/**
 * app/vs/ccwarriors/page.tsx — "SigRank vs ccwarriors" SEO comparison page.
 *
 * Angle: ccwarriors.xyz is the burn-rate arena — collectible warrior cards,
 * badges, GitHub-verified profiles, and org boards (Network School runs the
 * first one). It is the most game-complete burn board in the category.
 * SigRank is the efficiency framework: what the burn becomes.
 *
 * RSC only — no client JS. Uses withOG(), JsonLd (breadcrumb + faqPage +
 * comparisonArticle), WaveHero, and a styled comparison table.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, comparisonArticle } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

export const metadata: Metadata = withOG({
  title: "SigRank vs ccwarriors — The Burn Arena vs the Efficiency Score",
  description:
    "ccwarriors ranks token burn with collectible warrior cards, badges, GitHub-verified profiles, and org boards. SigRank scores what the burn produced — Υ Yield, Leverage, SNR, class tiers, signed snapshots.",
  path: "/vs/ccwarriors",
});

const COMPARE_ROWS: { feature: string; ccw: string; sigrank: string }[] = [
  {
    feature: "What it ranks",
    ccw: "Token burn rate — who burns the most",
    sigrank: "Cascade yield (Υ = cache_read × output / input²)",
  },
  {
    feature: "Identity",
    ccw: "GitHub OAuth + collectible warrior cards + README badges",
    sigrank: "Operator codename + ed25519-signed profile",
  },
  {
    feature: "Org boards",
    ccw: "Yes — org skins (first: Network School)",
    sigrank: "Class tiers + cohort-relative ranking",
  },
  {
    feature: "Efficiency metrics (Υ, SNR, Leverage, Velocity)",
    ccw: "No — burn rate, tiers, streaks",
    sigrank: "Yes",
  },
  {
    feature: "Server-authoritative pricing",
    ccw: "Yes — uploads per-model counts, prices server-side",
    sigrank: "Yes — plus plausibility gates",
  },
  {
    feature: "Signed, verifiable submissions",
    ccw: "Token-authenticated ingest",
    sigrank: "ed25519-signed snapshots",
  },
  {
    feature: "MCP server for AI-agent integration",
    ccw: "No",
    sigrank: "Yes",
  },
  {
    feature: "Tool coverage",
    ccw: "15 agents + Other bucket (anything ccusage reads)",
    sigrank: "15+ platforms",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    ccw: "Yes — counts only by default; optional consented deep-mode",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is ccwarriors a SigRank alternative?",
    answer:
      "It is the most game-complete burn board in the category — and the parts it got right are worth naming: collectible warrior cards, GitHub-verified profiles, README badges, server-authoritative pricing, and org boards so communities like Network School can run their own skinned leaderboard. If you want a burn-rate arena with real identity and org support, ccwarriors is it. SigRank is the different question on the same telemetry: not who burned the most, but whose cascade compounded.",
  },
  {
    question: "What does ccwarriors measure?",
    answer:
      "Burn rate — tokens consumed per tool, per day, per model, priced server-side and ranked, refreshed hourly, with tiers and collectible cards. It also has an optional consented deep-mode for profile insights. It is honest about what it ranks: burn. SigRank starts from the same four token pillars and derives the efficiency layer instead — Υ Yield (cache_read × output / input²), Leverage, SNR, Velocity, archetypes, and class tiers. The arena measures appetite; the framework measures efficiency.",
  },
  {
    question: "Can I use ccwarriors and SigRank together?",
    answer:
      "Yes — same local logs feed both. Keep the warrior card and the README badge for the burn crowd; the org-board model is a genuinely good idea and worth supporting. Then run `sigrank submit` to put a signed Υ score on the global efficiency board. Burn rate for the arena, yield for the record.",
  },
  {
    question: "Which is better for evaluating operators?",
    answer:
      "SigRank. Burn-rate boards reward the operator who runs the longest sessions, not the one who drives them best — two warriors with the same burn can be ten-fold apart in output-per-input. Υ Yield makes that gap the ranking: cache reuse and output amplify the score while fresh input penalizes it quadratically. ccwarriors crowns the biggest burner; SigRank identifies the most efficient operator.",
  },
];

export default function VsCcwarriorsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs ccwarriors", path: "/vs/ccwarriors" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs ccwarriors — The Burn Arena vs the Efficiency Score",
            description:
              "ccwarriors ranks token burn with warrior cards, badges, and org boards. SigRank scores what the burn produced — Υ Yield, Leverage, SNR, class tiers.",
            path: "/vs/ccwarriors",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs ccwarriors"
        title="The Arena Crowns Burners. The Score Crowns Operators."
        subtitle={
          <>
            ccwarriors built the most complete burn arena in the category —
            cards, badges, org boards, hourly refresh. SigRank scores{" "}
            <span className="text-gold">what the burn became</span>.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: ccwarriors
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <a
            href="https://ccwarriors.xyz"
            target="_blank"
            rel="noopener"
            className="text-gold underline underline-offset-2"
          >
            ccwarriors
          </a>{" "}
          is a live burn-rate leaderboard covering 15 agents plus an
          &quot;Other&quot; bucket — whatever ccusage can read counts. GitHub
          OAuth verifies profiles, collectible warrior cards and README badges
          make ranks shareable, per-model uploads are priced server-side, and
          org boards let communities run their own skinned leaderboard —
          Network School runs the first one. It is the most game-complete
          implementation of the burn board, and the org-board model in
          particular is a genuinely good idea.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank reads the same telemetry and asks the other question:
          <strong className="text-text-primary">
            {" "}not how much burned, but what the burn compounded into.
          </strong>{" "}
          Υ Yield = cache_read × output / input² ranks the efficiency of the
          cascade itself. The arena tells you who burns hottest; the score
          tells you who drives best.
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
                  ccwarriors
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
                  <td className="px-4 py-2.5 text-text-secondary">{r.ccw}</td>
                  <td className="px-4 py-2.5 font-medium text-gold">
                    {r.sigrank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* The distinction */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Burn rate is a crowd metric; yield is an operator metric
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Burn leaderboards answer a social question: who is going hardest
          right now. ccwarriors does that well — hourly refresh, verified
          identity, collectible cards, org skins. What burn cannot express is
          efficiency: the leaderboard&apos;s top spot goes to whoever ran the
          most tokens through the most sessions, and two operators at the same
          burn can be an order of magnitude apart in what they got back.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Υ Yield makes the invisible part the ranking. Cache reuse and output
          compound the score; fresh input penalizes it quadratically. Add
          Leverage, SNR, Velocity, archetypes, and class tiers and the burn
          becomes a description of skill — the difference between watching the
          arena and reading the scouting report.
        </p>
      </section>

      {/* Upgrade path */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          From the arena to the score
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Already burning on the board? The same telemetry produces a signed
          efficiency score:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
            {`npm install -g sigrank
sigrank enroll      # create your operator identity
sigrank submit      # reads logs, scores, signs, publishes`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Or paste token counts into the{" "}
          <Link href="/score" className="text-gold underline underline-offset-2">
            /score calculator
          </Link>{" "}
          for an instant Υ Yield and class tier.
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
          Score the burn
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep the warrior card. Add the number that says whether the burn was
          worth it.
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
            href="/vs/ccclub"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs ccclub
          </Link>
          {" · "}
          <Link
            href="/vs/tokenmaxxing"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs tokenmaxxing.sh
          </Link>
          {" · "}
          <Link
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            The Yield Metric
          </Link>
        </p>
      </section>
    </div>
  );
}
