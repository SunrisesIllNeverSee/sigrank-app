/**
 * app/vs/ccgather/page.tsx — "SigRank vs ccgather".
 *
 * ccgather is an open-source, Claude Code-only leaderboard with country
 * leagues and a community layer; it ranks by token and cost totals and says
 * itself that token usage is not a skill measure. SigRank ranks by Υ Yield.
 * Competitor facts: ccgather.com and github.com/DHxWhy/CCgather, read
 * 2026-11-11. SigRank numbers: public board via analyst MCP, same day.
 *
 * RSC only — no client JS. Metric names follow lib/identity/canon-ids.ts.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, comparisonArticle } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

const AS_OF = "11 November 2026";

export const metadata: Metadata = withOG({
  title: "SigRank vs ccgather — Claude Code Community Board vs Yield Board",
  description:
    "ccgather is an open-source Claude Code leaderboard with country leagues and levels; SigRank ranks operators by Υ Yield. What each measures, a worked example, and how to join both.",
  path: "/vs/ccgather",
});

const COMPARE_ROWS: { feature: string; ccgather: string; sigrank: string }[] = [
  {
    feature: "What the board orders by",
    ccgather: "Token and cost totals for Claude Code usage",
    sigrank: "Υ Yield, published with Leverage, Velocity, SNR, 10xDEV and Scale V",
  },
  {
    feature: "Scope",
    ccgather: "Claude Code (its README and homepage)",
    sigrank: "Token pillars from local logs; the board can be filtered by platform (README)",
  },
  {
    feature: "Grouping",
    ccgather: "Global board plus country leagues; 7D, 30D and All views",
    sigrank: "7d, 30d, 90d and all-time windows; no country league",
  },
  {
    feature: "Progression",
    ccgather: "10 levels (Rookie to Immortal) and 27 badges",
    sigrank: "Class tiers and computed archetypes",
  },
  {
    feature: "Community features",
    ccgather: "Multilingual posts with AI translation, 3D globe, activity heatmap, PWA push",
    sigrank: "Operator profiles and head-to-head compare",
  },
  {
    feature: "Licence",
    ccgather: "Apache 2.0, source on GitHub",
    sigrank: "Public app source; see the repository for terms",
  },
  {
    feature: "Sign-up and sync",
    ccgather: "GitHub sign-in, npx ccgather, optional daily auto-submit",
    sigrank: "Connect code from Settings, npx sigrank enroll, npx sigrank submit",
  },
  {
    feature: "Stated view of token totals",
    ccgather: "“Token usage is NOT a measure of skill” (its README)",
    sigrank: "Totals are context; Yield is the ranking measure",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "I use Claude Code only. Is there any reason to add SigRank?",
    answer:
      "Yes, if you want to know how well your cached context is being reused. A total tells you how much you used; Yield, Leverage and Velocity tell you what each fresh input token bought.",
  },
  {
    question: "Does SigRank have country leagues or a community feed?",
    answer:
      "No. SigRank has no country grouping and no translated community posts. If belonging to a national league or a multilingual community matters to you, SigRank does not offer that.",
  },
  {
    question: "What does SigRank do with my data?",
    answer:
      "SigRank's CLI reads local usage logs and submits token counts, not prompt text, responses or source code, together with identity, device/signature, platform and report metadata. The dry run shows the payload before anything is sent; see the CLI privacy details linked from the SigRank README. For what ccgather does with yours, read its own README and privacy pages.",
  },
  {
    question: "How often should I submit to SigRank?",
    answer:
      "On whatever schedule suits you, since the CLI runs on demand. Local logs do not last forever, so submitting before older days expire keeps your windows complete. Run the dry run first if you want to see the payload.",
  },
  {
    question: "Does a high Yield mean better work?",
    answer:
      "No. Yield describes token-processing patterns, not model quality or the value of what you shipped. Read it with Velocity and SNR rather than on its own.",
  },
];

const hostLink = "text-gold underline underline-offset-2";

export default function VsCcgatherPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs ccgather", path: "/vs/ccgather" },
          ]),
          comparisonArticle({
            title: "SigRank vs ccgather — Claude Code Community Board vs Yield Board",
            description:
              "ccgather is an open-source Claude Code leaderboard with country leagues and levels; SigRank ranks operators by Υ Yield.",
            path: "/vs/ccgather",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs ccgather"
        title="A Place to Gather, and a Ratio to Read"
        subtitle={
          <>
            ccgather is a free, open-source home for Claude Code users, with
            country leagues and a community. SigRank is a{" "}
            <span className="text-gold">measurement of operator efficiency</span>.
            They ask different things, and neither replaces the other.
          </>
        }
      />

      {/* What ccgather is */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What ccgather is, as of {AS_OF}
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <a href="https://ccgather.com" target="_blank" rel="noopener" className={hostLink}>
            ccgather.com
          </a>{" "}
          describes itself as a free, open-source Claude Code leaderboard and
          community. Its{" "}
          <a
            href="https://github.com/DHxWhy/CCgather"
            target="_blank"
            rel="noopener"
            className={hostLink}
          >
            GitHub repository
          </a>{" "}
          is Apache 2.0 and shows commits within weeks of our reading.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The board ranks users by tokens and cost, globally or within a
          country, over 7-day, 30-day or all-time views. Around that sit ten
          levels from Rookie to Immortal, 27 badges, a 3D globe, a GitHub-style
          activity heatmap, community posts with automatic translation, and a
          PWA with push notifications. You sign in with GitHub, run{" "}
          <span className="font-mono text-text-primary">npx ccgather</span>, and
          usage syncs; an <span className="font-mono text-text-primary">autosubmit</span>{" "}
          mode schedules a daily submission. Its README explains why it
          exists: Claude Code keeps only about 30 days of local history, and
          a durable record plus a community was the goal.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          We did not verify live user counts: the homepage counters were
          animating from zero when we fetched it, and its demo leaderboard uses
          placeholder names.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          Sources: ccgather.com homepage and the DHxWhy/CCgather README, read{" "}
          {AS_OF}.
        </p>
      </section>

      {/* Where we agree */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Where the two projects already agree
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The ccgather README is direct about its own number: token usage is{" "}
          <em>not</em> a measure of skill, since more tokens can mean more
          attempts and more exploration. That is a fair reading, and it is the
          premise SigRank starts from. A board ordered by totals shows how much
          you did. It cannot show whether the work compounded. SigRank exists
          to fill that gap with ratios drawn from the same four logged
          quantities: input, output, cache-write and cache-read.
        </p>
      </section>

      {/* Comparison table */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Comparison at a glance
        </h2>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-elevated">
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  Aspect
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  ccgather
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-gold">
                  SigRank
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((r) => (
                <tr key={r.feature} className="border-b border-bg-border-subtle last:border-0">
                  <td className="px-4 py-2.5 text-text-primary">{r.feature}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.ccgather}</td>
                  <td className="px-4 py-2.5 font-medium text-gold">{r.sigrank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Worked example */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Worked example: two Claude Code habits, one total
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Two <strong className="text-text-primary">hypothetical</strong> users each
          log exactly 1,000M tokens over thirty days, so a total-ordered board
          ranks them level. Canon: Leverage = cache_read / input; Velocity =
          output / input (output per fresh input, not speed); Υ Yield =
          Leverage × Velocity; SNR = output / (output + input).
        </p>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-elevated">
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  Hypothetical, tokens in millions
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  Sprinter
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-gold">
                  Builder
                </th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              <tr className="border-b border-bg-border-subtle">
                <td className="px-4 py-2.5 text-text-primary">Input / output</td>
                <td className="px-4 py-2.5">300 / 100</td>
                <td className="px-4 py-2.5">10 / 40</td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="px-4 py-2.5 text-text-primary">Cache-write / cache-read</td>
                <td className="px-4 py-2.5">100 / 500</td>
                <td className="px-4 py-2.5">50 / 900</td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="px-4 py-2.5 text-text-primary">Total</td>
                <td className="px-4 py-2.5">1,000</td>
                <td className="px-4 py-2.5">1,000</td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="px-4 py-2.5 text-text-primary">Leverage</td>
                <td className="px-4 py-2.5">1.67</td>
                <td className="px-4 py-2.5">90</td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="px-4 py-2.5 text-text-primary">Velocity</td>
                <td className="px-4 py-2.5">0.33</td>
                <td className="px-4 py-2.5">4</td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="px-4 py-2.5 text-text-primary">SNR</td>
                <td className="px-4 py-2.5">0.25</td>
                <td className="px-4 py-2.5">0.80</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-text-primary">Υ Yield</td>
                <td className="px-4 py-2.5">0.56</td>
                <td className="px-4 py-2.5 font-medium text-gold">360</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Same total, same tool, different shape. The Sprinter keeps feeding
          the model fresh input and gets one output token for every three in.
          The Builder sends a thirtieth as much fresh input, reuses a large cache and
          gets four out for every one in. A total-based league sees a tie; Yield
          separates them by a factor of roughly 650. That gap is what
          ccgather&apos;s own README says a token count cannot tell you.
        </p>
      </section>

      {/* Real data */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The SigRank field today
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          As of 2026-11-11 the{" "}
          <Link href="/board/30d" className={hostLink}>
            30-day board
          </Link>{" "}
          had 7 public operators, so SigRank is a measurement to try, not yet a
          crowd to compete in. The board does not publish per-row verification;
          read rows as self-reported snapshots. Live values are on{" "}
          <Link href="/board/all" className={hostLink}>
            /board/all
          </Link>
          , and{" "}
          <Link href="/methodology" className={hostLink}>
            the methodology
          </Link>{" "}
          defines each measure.
        </p>
      </section>

      {/* When to use which */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Pick by what you are after
        </h2>
        <ul className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">Use ccgather</strong> for a
            durable log of Claude Code usage, a country league, levels and
            badges, a community in your language, or a codebase you can read
            and fork.
          </li>
          <li>
            <strong className="text-text-primary">Use SigRank</strong> to see how
            efficiently your fresh input turns into output and reuse, to compare
            workflows by ratio, or to track Yield across 7, 30 and 90 days.
          </li>
          <li>
            <strong className="text-text-primary">Use both</strong> if you want
            the community and the ratio: they read the same kind of local
            logs and do not interfere.
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep Yield in proportion. It describes token-processing patterns, not
          model quality or the value of what you shipped.
        </p>
      </section>

      {/* Setup */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Using ccgather already? Enrol in SigRank next to it
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep your ccgather daily auto-submit as it is. Sign in at
          signalaf.com, create a connect code in Settings, and run:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
            {`npx sigrank enroll             # bind this device
npx sigrank submit --dry-run   # inspect the payload first
npx sigrank submit             # publish a signed snapshot`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Want the numbers before enrolling? Paste your token counts into the{" "}
          <Link href="/score" className={hostLink}>
            /score calculator
          </Link>
          .
        </p>
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          ccgather and SigRank: questions
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

      <section className="flex flex-wrap gap-3">
        <Link
          href="/score"
          className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
        >
          Try the calculator
        </Link>
        <Link
          href="/board/all"
          className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
        >
          View /board/all
        </Link>
      </section>

      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link href="/vs/viberank" className={hostLink}>
            SigRank vs viberank
          </Link>
          {" · "}
          <Link href="/alternatives/ccusage-alternatives" className={hostLink}>
            ccusage Alternatives
          </Link>
          {" · "}
          <Link href="/tools/yield-calculator" className={hostLink}>
            Yield Calculator
          </Link>
          {" \u00B7 "}
          <Link href="/guides/how-to-measure-ai-coding-efficiency" className={hostLink}>
            Measuring coding efficiency
          </Link>
        </p>
      </section>
    </div>
  );
}
