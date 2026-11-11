/**
 * app/vs/tokscale/page.tsx — "SigRank vs Tokscale".
 *
 * Rebuilt 2026-11-11 from Tokscale's own README (github.com/junhoyeo/tokscale),
 * its leaderboard (tokscale.ai/leaderboard) and the GitHub API, plus a live read
 * of the public SigRank board. Tokscale claims below are things its own pages
 * state; SigRank numbers were fetched on the as-of date. Canon names only
 * (lib/identity/canon-ids.ts, token-era board).
 *
 * RSC only — no client JS.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, comparisonArticle } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

const README_READ_ON = "11 November 2026";
const BOARD_READ_ON = "10 November 2026";
const SIGRANK_READ_ON = "11 November 2026";
const SIGRANK_OPERATORS_30D = 7;

const SRC = {
  readme: "https://github.com/junhoyeo/tokscale#readme",
  board: "https://tokscale.ai/leaderboard",
};

// Figures as published on Tokscale's board in the view read on BOARD_READ_ON.
const BOARD = {
  rankedUsers: "2,452",
  rows: [
    { rank: "#7", tokens: "1.32T", cost: "$288.21K", perMillion: "about $0.22" },
    { rank: "#45", tokens: "450.0B", cost: "$4.50M", perMillion: "about $10.00" },
  ],
};

export const metadata: Metadata = withOG({
  title: "SigRank vs Tokscale — Token Volume vs Yield",
  description:
    "Tokscale tracks tokens and cost across many agent tools; its board sorts by tokens or cost. SigRank ranks by Yield. Figures dated Nov 2026.",
  path: "/vs/tokscale",
});

const SIDE_BY_SIDE: { aspect: string; tokscale: string; sigrank: string }[] = [
  {
    aspect: "Primary job",
    tokscale: "Local usage and cost reports across many agent tools, plus a public board",
    sigrank: "Operator-efficiency ranking from four token pillars",
  },
  {
    aspect: "Public board sorts by",
    tokscale: "Tokens or cost (a switch on the page)",
    sigrank: "Υ Yield (Leverage × Velocity)",
  },
  {
    aspect: "Price enters the score",
    tokscale: "Yes: pricing from LiteLLM, with OpenRouter fallback",
    sigrank: "No, ranking uses token ratios (cost per 1M is shown as its own metric)",
  },
  {
    aspect: "Submission check",
    tokscale: "Level 1 validation: totals consistent, no future dates, required fields, duplicates",
    sigrank: "Signed snapshot, verified and re-scored by the server",
  },
  {
    aspect: "Local viewing without publishing",
    tokscale: "Yes: interactive terminal UI with ten views, JSON export",
    sigrank: "Yes: npx sigrank, and submit --dry-run",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is a cost sort the same as an efficiency sort?",
    answer:
      "No. A cost figure is tokens multiplied by a price per model, so it grows with how much you run. Yield is computed from token ratios, so a light user can outrank a heavy one.",
  },
  {
    question: "Why can a tokens sort and a cost sort order people differently?",
    answer:
      "Dollars per token varies by model and by how much of the traffic is cheap cache reads. The body of this page shows a dated example from a public board.",
  },
  {
    question: "Does SigRank work alongside a usage tracker like Tokscale?",
    answer:
      "Yes. SigRank reads local usage on its own, so a tracker keeps working as it does today. Use the tracker for inventory and spend and SigRank for the output-per-fresh-input ratio.",
  },
  {
    question: "Can I submit to both boards?",
    answer:
      "Yes, they are independent. Tokscale submits with its own CLI and API token; SigRank enrolls a device with a connect code and submits a signed snapshot. Neither needs the other installed.",
  },
  {
    question: "Is Yield a better number than tokens or cost?",
    answer:
      "It answers a different question. Tokens and cost say how much you ran. Yield says how much output you got per fresh input once cached context is counted. Yield ignores scale on purpose, so a light user can score high, and it does not say anything about the quality of the work produced. Scale V, the log of total tokens, is shown beside it for exactly that reason.",
  },
  {
    question: "How large is the SigRank field?",
    answer:
      "Small. The public SigRank board is a small field, so use its figures as a snapshot rather than a population norm. See the dated figure in the body of this page and the live board.",
  },
];

export default function VsTokscalePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs Tokscale", path: "/vs/tokscale" },
          ]),
          comparisonArticle({
            title: "SigRank vs Tokscale — Token Volume vs Yield",
            description:
              "Tokscale tracks tokens and cost across many agent tools; its board sorts by tokens or cost. SigRank ranks by Yield. Figures dated Nov 2026.",
            path: "/vs/tokscale",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs Tokscale"
        title="Tokscale Counts What You Burned. SigRank Counts What It Bought."
        subtitle={
          <>
            Tokscale is a broad, fast tracker with the larger public board.
            SigRank is a narrow instrument that ranks the{" "}
            <span className="text-gold">ratio</span> between fresh input, cached
            context and output. If you run Tokscale already, this page shows
            what a second number adds.
          </>
        }
      />

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What Tokscale is, from its README and leaderboard
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Per its{" "}
          <a href={SRC.readme} className="text-gold underline underline-offset-2">
            README
          </a>{" "}
          (read {README_READ_ON}), Tokscale is a CLI and visualization
          dashboard for token usage and cost across AI coding agents. It reads
          local session files for many clients, including Claude Code, prices
          them with LiteLLM data, and shows the result in a terminal UI or as
          JSON. It is MIT licensed. Publishing is optional:{" "}
          <span className="font-mono text-text-primary">tokscale submit</span>{" "}
          sends your totals to tokscale.ai, where the{" "}
          <a href={SRC.board} className="text-gold underline underline-offset-2">
            all-time leaderboard
          </a>{" "}
          listed {BOARD.rankedUsers} ranked users when read on {BOARD_READ_ON}.
        </p>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-elevated text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3">Aspect</th>
                <th className="px-4 py-3">Tokscale</th>
                <th className="px-4 py-3 text-gold">SigRank</th>
              </tr>
            </thead>
            <tbody>
              {SIDE_BY_SIDE.map((r) => (
                <tr
                  key={r.aspect}
                  className="border-b border-bg-border-subtle last:border-0"
                >
                  <td className="px-4 py-2.5 text-text-primary">{r.aspect}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.tokscale}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.sigrank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          Tokscale column: its{" "}
          <a href={SRC.readme} className="text-gold underline underline-offset-2">
            README
          </a>{" "}
          (read {README_READ_ON}) and{" "}
          <a href={SRC.board} className="text-gold underline underline-offset-2">
            leaderboard
          </a>{" "}
          (read {BOARD_READ_ON}).
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Where Tokscale is the better tool
        </h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">Coverage.</strong> If you
            switch between several agents in a week, one tool that reads all of
            them gives a single total. SigRank is not trying to be that
            inventory.
          </li>
          <li>
            <strong className="text-text-primary">Local reporting.</strong>{" "}
            Per-workspace and per-machine groupings, date filters, custom price
            overrides and an autosubmit schedule are real working features for
            anyone who has to account for spend.
          </li>
          <li>
            <strong className="text-text-primary">Honest pricing rules.</strong>{" "}
            Its{" "}
            <a href={SRC.readme} className="text-gold underline underline-offset-2">
              README
            </a>{" "}
            says unpriced usage is excluded from submission rather
            than guessed, and lists the reasons a message is skipped. That is a
            careful choice, and worth copying.
          </li>
          <li>
            <strong className="text-text-primary">Reach.</strong> A board of
            {" "}{BOARD.rankedUsers} users ({BOARD_READ_ON}) and a profile embed
            you can paste into a GitHub README give it social reach SigRank does not have yet.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          One board, a wide spread in price per token
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Tokscale&apos;s leaderboard makes a good case study for why a single
          volume or cost figure hides a lot. In the all-time view read on{" "}
          {BOARD_READ_ON}, two entries looked like this:
        </p>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-elevated text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3">Tokscale rank</th>
                <th className="px-4 py-3">Tokens</th>
                <th className="px-4 py-3">Cost shown</th>
                <th className="px-4 py-3">Cost per 1M tokens</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              {BOARD.rows.map((r) => (
                <tr
                  key={r.rank}
                  className="border-b border-bg-border-subtle last:border-0"
                >
                  <td className="px-4 py-2.5 text-text-primary">{r.rank}</td>
                  <td className="px-4 py-2.5">{r.tokens}</td>
                  <td className="px-4 py-2.5">{r.cost}</td>
                  <td className="px-4 py-2.5">{r.perMillion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Sorted by tokens, #7 is well ahead. Sorted by cost, #45 is. Neither
          row says how much of that traffic was fresh input versus cache reads
          versus output, which is what decides whether the work was dense. The
          per-million column is our own division of the figures Tokscale
          published on that date; it is not a Tokscale metric. SigRank carries the same idea as its own
          canonical metric, Cost per 1M, next to the ranking one.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The methodological difference, worked through
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Tokscale reads the four token counts and totals them (with a price on
          top). SigRank keeps them apart and takes ratios:{" "}
          <span className="font-mono text-gold">Leverage</span> is cache-read
          per fresh input token, <span className="font-mono text-gold">Velocity</span>{" "}
          is output per fresh input token, and{" "}
          <span className="font-mono text-gold">Υ Yield = Leverage × Velocity</span>.
          Velocity here is a ratio, not a rate over time.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            Hypothetical, for illustration only
          </p>
          <ul className="mt-3 flex flex-col gap-3 font-sans text-sm leading-relaxed text-text-secondary">
            <li>
              <strong className="text-text-primary">Operator C:</strong> 10M
              fresh input, 5M output, 2,000M cache-read. About 2.0B tokens in
              total. Leverage 200, Velocity 0.5, Yield 100, SNR 0.33.
            </li>
            <li>
              <strong className="text-text-primary">Operator D:</strong> 1M
              fresh input, 3M output, 300M cache-read. About 0.3B tokens in
              total. Leverage 300, Velocity 3, Yield 900, SNR 0.75.
            </li>
          </ul>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            On a tokens board C sits roughly 6.6 times above D. On Yield D is 9
            times above C. C re-reads a great deal of context and sends a lot
            of fresh input for each unit of output it gets back; D sends little
            and gets a lot.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How big is the SigRank field?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Small. On {SIGRANK_READ_ON} the{" "}
          <Link href="/board/30d" className="text-gold underline underline-offset-2">
            30-day board
          </Link>{" "}
          had {SIGRANK_OPERATORS_30D} public operators, so read SigRank
          percentiles as a snapshot of a few people, not a population norm. The{" "}
          <Link href="/board/all" className="text-gold underline underline-offset-2">
            all-time board
          </Link>{" "}
          is current, and the definitions are in the{" "}
          <Link href="/methodology" className="text-gold underline underline-offset-2">
            methodology
          </Link>
          .
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Use Tokscale when, use SigRank when
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
              Use Tokscale when
            </p>
            <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 font-sans text-sm leading-relaxed text-text-secondary">
              <li>You use more than one agent and want one total.</li>
              <li>You need spend by workspace, machine or model.</li>
              <li>You want an automatic scheduled submission to a public board.</li>
              <li>You like a README card and a year-in-review image.</li>
            </ul>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-xs uppercase tracking-wide text-gold">
              Use SigRank when
            </p>
            <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 font-sans text-sm leading-relaxed text-text-secondary">
              <li>You want to know if reused context is becoming output.</li>
              <li>You want to compare operators of very different size.</li>
              <li>You want a signed, server-verified score to point to.</li>
              <li>You want one ratio to track from week to week.</li>
            </ul>
          </div>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Using both.</strong> Let Tokscale
          hold the inventory: which tools, which models, what it cost. Once a
          week, run a SigRank dry run and look at Leverage and Velocity. A
          rising Tokscale total with falling Velocity means more fresh input is
          going in for the same output.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Adding SigRank next to Tokscale
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Tokscale users already know the shape of this: run it once, preview,
          then publish. Where Tokscale uses{" "}
          <span className="font-mono text-text-primary">bunx tokscale@latest submit</span>,
          SigRank first binds the device with a connect code from Settings on
          signalaf.com:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
            {`npx sigrank                    # inspect local usage in the terminal
npx sigrank enroll             # bind this device using the connect code
npx sigrank submit --dry-run   # inspect the payload without sending it
npx sigrank submit             # publish a signed snapshot`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Prefer to test by hand? Paste four token counts into the{" "}
          <Link href="/score" className="text-gold underline underline-offset-2">
            /score calculator
          </Link>{" "}
          or the{" "}
          <Link
            href="/tools/yield-calculator"
            className="text-gold underline underline-offset-2"
          >
            Yield calculator
          </Link>
          . You can copy the four totals out of a Tokscale JSON export.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Questions about Tokscale and SigRank
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

      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          See your own Yield
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep Tokscale for inventory and cost. Paste four token counts into the calculator to see Υ
          Yield, Leverage, Velocity and SNR, or read how to{" "}
          <Link
            href="/guides/how-to-measure-ai-coding-efficiency"
            className="text-gold underline underline-offset-2"
          >
            measure AI coding efficiency
          </Link>
          .
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

      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Sources and read dates
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Tokscale facts link to its{" "}
          <a href={SRC.readme} className="text-gold underline underline-offset-2">
            README
          </a>{" "}
          (read {README_READ_ON}) and{" "}
          <a href={SRC.board} className="text-gold underline underline-offset-2">
            leaderboard
          </a>{" "}
          (view read {BOARD_READ_ON}). The SigRank operator count is from the
          30-day board, read on {SIGRANK_READ_ON}. Tokscale ships often, so
          check its README for current details.
        </p>
      </section>

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
            href="/vs/clawdboard"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs clawdboard
          </Link>
          {" · "}
          <Link href="/board/all" className="text-gold underline underline-offset-2">
            The leaderboard
          </Link>
          {" · "}
          <Link href="/methodology" className="text-gold underline underline-offset-2">
            Methodology
          </Link>
        </p>
      </section>
    </div>
  );
}
