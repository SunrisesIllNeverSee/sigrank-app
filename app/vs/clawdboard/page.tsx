/**
 * app/vs/clawdboard/page.tsx — "SigRank vs clawdboard".
 *
 * Rebuilt 2026-11-11 from clawdboard's own pages (leaderboard, /stats, GitHub
 * repo) plus a dated read of the public SigRank board. Every clawdboard claim
 * below is linked to the page it came from; each figure carries its own read
 * date (constants below). Canon names only (lib/identity/canon-ids.ts, token-era board).
 *
 * RSC only — no client JS.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, comparisonArticle } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

const READ_ON = "11 November 2026";
const SIGRANK_READ_ON = "11 November 2026";
const SIGRANK_OPERATORS_30D = 7;

const SRC = {
  board: "https://clawdboard.ai/",
  stats: "https://clawdboard.ai/stats",
  repo: "https://github.com/morgen-so/clawdboard-oss",
};

export const metadata: Metadata = withOG({
  title: "SigRank vs clawdboard — Spend and Streaks vs Yield",
  description:
    "clawdboard ranks by estimated API cost, with streaks and active days. SigRank ranks by Yield. How they differ, with figures dated 11 Nov 2026.",
  path: "/vs/clawdboard",
});

const FACTS: { label: string; value: string; href: string; readOn: string }[] = [
  {
    label: "Default ranking column",
    value: "Estimated cost (API-equivalent), with tokens, active days, streak and a project column beside it",
    href: SRC.board,
    readOn: READ_ON,
  },
  {
    label: "Time views",
    value: "today, 7d, 30d, month, ytd and a custom range",
    href: SRC.board,
    readOn: READ_ON,
  },
  {
    label: "Registered developers",
    value: "96",
    href: SRC.stats,
    readOn: READ_ON,
  },
  {
    label: "Tools it reads",
    value: "The agent CLIs listed on its stats page, read from local logs",
    href: SRC.stats,
    readOn: READ_ON,
  },
  {
    label: "What leaves your machine",
    value: "Aggregate token counts and a model name per session, per its methodology section",
    href: SRC.stats,
    readOn: READ_ON,
  },
  {
    label: "Licence",
    value: "MIT (open-source repository morgen-so/clawdboard-oss)",
    href: SRC.repo,
    readOn: READ_ON,
  },
];

const WHEN_ROWS: { need: string; pick: string; why: string }[] = [
  {
    need: "See how much AI coding you do, at API prices, against other developers",
    pick: "clawdboard",
    why: "Cost is its main column and the page is built around it.",
  },
  {
    need: "Keep a daily habit going",
    pick: "clawdboard",
    why: "Streaks and active days sit next to cost on its board.",
  },
  {
    need: "Track a team on one page",
    pick: "clawdboard",
    why: "It has a Teams tab next to the individual board.",
  },
  {
    need: "Find out whether your reused context is turning into output",
    pick: "SigRank",
    why: "Leverage and Velocity are built from exactly that ratio.",
  },
  {
    need: "Compare two operators who spend about the same",
    pick: "SigRank",
    why: "Spend ties; Yield separates them.",
  },
  {
    need: "Hand a verifiable score to someone else",
    pick: "SigRank",
    why: "Submissions are signed with your device key and re-scored server-side.",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is a cost ranking the same as an efficiency ranking?",
    answer:
      "No. A cost figure is tokens multiplied by a price per model, so it grows with how much you run. It does not say how much output that traffic produced. Yield is computed from token ratios instead, so a light user can outrank a heavy one.",
  },
  {
    question: "Why can a cost-ranked board and a token-ranked board disagree?",
    answer:
      "Because price per token depends on the model. Heavy cache reuse on a cheaper model counts for a lot of tokens and not many dollars, so a cost ranking and a token ranking can order the same people differently. Neither says how much output that traffic produced; that is the gap Yield is built to close.",
  },
  {
    question: "Is a streak a skill signal?",
    answer:
      "A streak counts days of use, so it rewards regularity. A short test session and an eight-hour session both keep it alive. Treat it as a habit tracker, not a measure of how well you drive; Yield is the measure of output per fresh input.",
  },
  {
    question: "Does SigRank replace clawdboard?",
    answer:
      "No. They answer different questions and read the same kind of local logs. clawdboard tells you how much you ran and how consistently. SigRank tells you how much output you got per unit of fresh input you sent. Many people will want both.",
  },
  {
    question: "Will my cost rank on clawdboard match my SigRank rank?",
    answer:
      "Not necessarily, and often not. SigRank's Yield is leverage times velocity, computed from token counts and not from price. Two operators with the same dollar spend can sit far apart on Yield, and a small spender can outrank a big one.",
  },
  {
    question: "Is the SigRank field big enough to compare against clawdboard's?",
    answer:
      "No. The public SigRank board is small, so treat its percentiles as a small-sample reference rather than a population norm. See the dated figure in the body of this page and the live board for current numbers.",
  },
];

export default function VsClawdboardPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs clawdboard", path: "/vs/clawdboard" },
          ]),
          comparisonArticle({
            title: "SigRank vs clawdboard — Spend and Streaks vs Yield",
            description:
              "clawdboard ranks by estimated API cost, with streaks and active days. SigRank ranks by Yield. How they differ, with figures dated 11 Nov 2026.",
            path: "/vs/clawdboard",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs clawdboard"
        title="One Board Counts Spend. The Other Counts Return."
        subtitle={
          <>
            clawdboard is a free community board for how much AI coding you do
            and how often. SigRank asks a narrower question:{" "}
            <span className="text-gold">how much output did each fresh input token buy?</span>{" "}
            The two sit side by side without conflict.
          </>
        }
      />

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What clawdboard is, in its own words
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          clawdboard is a free, open-source leaderboard for AI coding agents.
          Its{" "}
          <a href={SRC.board} className="text-gold underline underline-offset-2">
            leaderboard page
          </a>{" "}
          invites you to sign in with GitHub and run{" "}
          <span className="font-mono text-text-primary">npx clawdboard auth</span>
          , and ranks developers on a cost column beside tokens, active days,
          streak and a project column. Each fact below links to the page it
          came from and shows the date we read it.
        </p>
        <dl className="grid gap-px overflow-hidden rounded-lg border border-bg-border bg-bg-border sm:grid-cols-2">
          {FACTS.map((f) => (
            <div key={f.label} className="flex flex-col gap-1 bg-bg-surface p-4">
              <dt className="font-mono text-xs uppercase tracking-wide text-text-muted">
                {f.label}
              </dt>
              <dd className="font-sans text-sm leading-relaxed text-text-secondary">
                {f.value}{" "}
                <a
                  href={f.href}
                  className="text-gold underline underline-offset-2"
                >
                  (source, read {f.readOn})
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What clawdboard does better
        </h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">Breadth of tools.</strong>{" "}
            It reads the long list of agent tools on its stats page.
            SigRank&apos;s cascade is built around token pillars, so a tool is
            only useful to it if those four counts can be read out.
          </li>
          <li>
            <strong className="text-text-primary">Dollar framing.</strong> If
            your question is &quot;what would this have cost at API prices?&quot;,
            a cost column answers it directly. SigRank does not rank on price.
          </li>
          <li>
            <strong className="text-text-primary">Habit and social loop.</strong>{" "}
            Streaks and a project column give people a reason to
            come back and a place to point at what they ship.
          </li>
          <li>
            <strong className="text-text-primary">A larger crowd.</strong> On{" "}
            {READ_ON} its{" "}
            <a href={SRC.stats} className="text-gold underline underline-offset-2">
              stats page
            </a>{" "}
            reported 96 registered developers, more than the public SigRank
            board had on the same date.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The methodological difference
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Both tools start from the same four token counts: input, output,
          cache-read and cache-write. clawdboard prices them. SigRank takes
          ratios of them. The headline metric is{" "}
          <span className="font-mono text-gold">
            Υ Yield = Leverage × Velocity
          </span>
          , where Leverage is cache-read per fresh input token and Velocity is
          output per fresh input token (a ratio, not a speed). SNR, the output
          share of fresh traffic, sits alongside.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            Worked example (hypothetical numbers, for illustration only)
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse font-sans text-sm">
              <thead>
                <tr className="border-b border-bg-border text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  <th className="py-2 pr-4"> </th>
                  <th className="py-2 pr-4">Operator A</th>
                  <th className="py-2">Operator B</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                <tr className="border-b border-bg-border-subtle">
                  <td className="py-2 pr-4 text-text-primary">Fresh input</td>
                  <td className="py-2 pr-4">1M</td>
                  <td className="py-2">8M</td>
                </tr>
                <tr className="border-b border-bg-border-subtle">
                  <td className="py-2 pr-4 text-text-primary">Output</td>
                  <td className="py-2 pr-4">4M</td>
                  <td className="py-2">4M</td>
                </tr>
                <tr className="border-b border-bg-border-subtle">
                  <td className="py-2 pr-4 text-text-primary">Cache-read</td>
                  <td className="py-2 pr-4">200M</td>
                  <td className="py-2">200M</td>
                </tr>
                <tr className="border-b border-bg-border-subtle">
                  <td className="py-2 pr-4 text-text-primary">Leverage</td>
                  <td className="py-2 pr-4">200 / 1 = 200</td>
                  <td className="py-2">200 / 8 = 25</td>
                </tr>
                <tr className="border-b border-bg-border-subtle">
                  <td className="py-2 pr-4 text-text-primary">Velocity</td>
                  <td className="py-2 pr-4">4 / 1 = 4</td>
                  <td className="py-2">4 / 8 = 0.5</td>
                </tr>
                <tr className="border-b border-bg-border-subtle">
                  <td className="py-2 pr-4 text-text-primary">SNR</td>
                  <td className="py-2 pr-4">4 / (4 + 1) = 0.80</td>
                  <td className="py-2">4 / (4 + 8) = 0.33</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-text-primary">Υ Yield</td>
                  <td className="py-2 pr-4 font-medium text-gold">800</td>
                  <td className="py-2 font-medium text-gold">12.5</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            Same output, same cache-read, and B sends eight times the fresh
            input. B also moves more tokens in total, so on a board that sorts
            by volume or by a cost that tracks it, B edges ahead. On Yield, A
            is 64 times higher. A streak would not separate them at all if both
            ran every day.
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
          Use clawdboard when, use SigRank when
        </h2>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-elevated text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3">If you want to</th>
                <th className="px-4 py-3">Reach for</th>
                <th className="px-4 py-3">Because</th>
              </tr>
            </thead>
            <tbody>
              {WHEN_ROWS.map((r) => (
                <tr
                  key={r.need}
                  className="border-b border-bg-border-subtle last:border-0"
                >
                  <td className="px-4 py-2.5 text-text-primary">{r.need}</td>
                  <td
                    className={`px-4 py-2.5 font-medium ${
                      r.pick === "SigRank" ? "text-gold" : "text-text-secondary"
                    }`}
                  >
                    {r.pick}
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          A workflow that uses both
        </h2>
        <ol className="flex list-decimal flex-col gap-2 pl-5 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            Leave clawdboard syncing in the background. Check it for spend and
            streak.
          </li>
          <li>
            Once a week, run a SigRank dry run and read Leverage and Velocity.
          </li>
          <li>
            If clawdboard cost climbs while Velocity falls, you are sending
            more fresh input for the same output. Look at what got re-sent
            instead of cached.
          </li>
          <li>
            If cost is flat and Velocity climbs, the work is getting denser.
            That is the case clawdboard cannot show you.
          </li>
        </ol>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Adding SigRank if you already use clawdboard
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Nothing to remove. SigRank reads local usage separately, so
          clawdboard keeps working as it does today. Create a connect code in
          Settings on signalaf.com, then:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
            {`npx sigrank                    # look at your local usage first
npx sigrank enroll             # bind this device with the connect code
npx sigrank submit --dry-run   # see the payload; nothing is sent
npx sigrank submit             # publish a signed snapshot`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Want the numbers without an account? The{" "}
          <Link href="/score" className="text-gold underline underline-offset-2">
            /score calculator
          </Link>{" "}
          takes your four token counts and returns Υ Yield, Leverage,
          Velocity and SNR in the browser.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Questions people ask about clawdboard and SigRank
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
          Keep clawdboard for spend and streaks. Paste four token counts into the calculator to see Υ
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
          clawdboard facts link to{" "}
          <a href={SRC.board} className="text-gold underline underline-offset-2">
            its leaderboard
          </a>
          ,{" "}
          <a href={SRC.stats} className="text-gold underline underline-offset-2">
            its stats page
          </a>{" "}
          and{" "}
          <a href={SRC.repo} className="text-gold underline underline-offset-2">
            its repository
          </a>
          , all read on {READ_ON}. The SigRank operator count is from the
          30-day board, read on {SIGRANK_READ_ON}. clawdboard changes often;
          check its pages for anything that matters to you.
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
            href="/board/all"
            className="text-gold underline underline-offset-2"
          >
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
