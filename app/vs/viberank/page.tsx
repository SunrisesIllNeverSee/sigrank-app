/**
 * app/vs/viberank/page.tsx — "SigRank vs viberank".
 *
 * viberank ranks developers by API-equivalent spend and token totals
 * (a volume board). SigRank ranks by operator efficiency (Υ Yield).
 * Competitor facts come from viberank.app, fetched 2026-11-11. SigRank
 * numbers come from the public board (analyst MCP), fetched the same day.
 *
 * RSC only — no client JS. Metric names follow lib/identity/canon-ids.ts.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, comparisonArticle } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";
import { FieldEvidence } from "@/components/compare/FieldEvidence";

const AS_OF = "11 November 2026";

export const metadata: Metadata = withOG({
  title: "SigRank vs viberank — Two Ways to Read AI Coding Usage",
  description:
    "What viberank shows (API-equivalent cost, token totals, tiers) and what SigRank shows (Υ Yield, Leverage, Velocity, SNR), with a worked example and how to submit to both.",
  path: "/vs/viberank",
});

const COMPARE_ROWS: { feature: string; viberank: string; sigrank: string }[] = [
  {
    feature: "Sorts offered",
    viberank: "Cost, Tokens and Efficiency, as listed on its homepage (the page does not define Efficiency)",
    sigrank: "Υ Yield = Leverage × Velocity, shown with SNR, 10xDEV and Scale V",
  },
  {
    feature: "Windows",
    viberank: "All, 7d, 30d, plus a Verified filter",
    sigrank: "7d, 30d, 90d, all time",
  },
  {
    feature: "Tools counted",
    viberank: "Everything ccusage tracks, summed into one number; filterable per tool",
    sigrank: "Token pillars from local logs; the board can be filtered by platform (README)",
  },
  {
    feature: "How you submit",
    viberank: "npx viberank-cli, or upload a cc.json export",
    sigrank: "npx sigrank enroll, then npx sigrank submit",
  },
  {
    feature: "Identity",
    viberank: "GitHub sign-in earns a verified badge; CLI-only rows are marked cli",
    sigrank: "Device enrolled with a connect code; submissions are signed",
  },
  {
    feature: "Checks on submitted data",
    viberank: "Server-side validation of token math, cost/token ratio and date sanity (its FAQ)",
    sigrank: "Server verifies and re-scores the snapshot",
  },
  {
    feature: "Progression",
    viberank: "Spend tiers from Spark ($0+) to Hypernova ($250K+)",
    sigrank: "Class tiers and archetypes computed from the snapshot",
  },
  {
    feature: "Bundled tools (ccusage, tokscale, token-dashboard)",
    viberank: "No",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "My viberank spend is high. Will my SigRank Yield be high?",
    answer:
      "Not necessarily, and the two can move in opposite directions. Spend grows with every token you send, including repeated fresh input. Yield divides by fresh input twice, so a workflow that re-sends large context each turn can post a big spend and a modest Yield.",
  },
  {
    question: "Which inputs does SigRank use that a spend board does not?",
    answer:
      "Both start from local usage logs. SigRank reads the four token pillars (input, output, cache-write, cache-read) and derives Leverage, Velocity, SNR, Yield, 10xDEV and Scale V from them, so cache reuse shows up as its own number instead of being folded into a cost total.",
  },
  {
    question: "Will submitting to SigRank change my viberank rank?",
    answer:
      "No. The two services are independent. Submitting to one does not send anything to the other, and each keeps its own copy of what you submitted.",
  },
  {
    question: "Is a high Yield always good?",
    answer:
      "No. Yield describes token-processing patterns, not model quality or the value of what you shipped. A workflow that mostly re-reads a large cache can post a high Yield, so read it alongside Velocity and SNR.",
  },
  {
    question: "Can I try the numbers before enrolling?",
    answer:
      "Yes. The yield calculator takes token counts you paste in and returns Leverage, Velocity, SNR and Yield without creating an account or sending anything.",
  },
];

const hostLink = "text-gold underline underline-offset-2";

export default function VsViberankPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs viberank", path: "/vs/viberank" },
          ]),
          comparisonArticle({
            title: "SigRank vs viberank — Two Ways to Read AI Coding Usage",
            description:
              "What viberank shows (API-equivalent cost, token totals, tiers) and what SigRank shows (Υ Yield, Leverage, Velocity, SNR).",
            path: "/vs/viberank",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs viberank"
        title="Usage Totals Beside a Yield Ratio"
        subtitle={
          <>
            viberank&apos;s board is organised around API-equivalent cost and
            token totals. SigRank publishes{" "}
            <span className="text-gold">ratios between the four token pillars</span>,
            headed by Υ Yield. They answer different questions, and you can
            sit on both.
          </>
        }
      />

      {/* What viberank is */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What viberank is, as of {AS_OF}
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <a href="https://www.viberank.app" target="_blank" rel="noopener" className={hostLink}>
            viberank.app
          </a>{" "}
          is a public leaderboard of AI coding usage. Its homepage describes the
          audience as developers ranked by API spend and token usage across
          Claude Code, OpenAI Codex, Gemini CLI, Copilot and the other agents
          that ccusage tracks. On the day we read it, its header strip showed about 1.4K developers on the board. That is a far larger crowd than SigRank has, which is a fair reason to be listed there if you want to see where your raw usage stands.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Mechanics, from the same page: you run{" "}
          <span className="font-mono text-text-primary">npx viberank-cli</span>,
          which reads local logs with ccusage and, per the site, keeps code and
          prompts on your machine. Every tool is summed into one number, and a
          per-tool filter is available. The board can be sorted by cost or by
          tokens. Your best submission sets a spend tier, from Spark ($0+)
          through Ember, Flame, Blaze, Inferno and Supernova up to Hypernova
          ($250K+). Signing in with GitHub marks a row verified; unverified CLI
          rows carry a <em>cli</em> badge. Its FAQ says submissions are checked
          server-side for token math, cost-to-token ratio and date sanity.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          Its homepage also lists an Efficiency sort next to Cost and Tokens; the page does not define it, so we make no claim about what it computes. Sources: viberank.app homepage and FAQ, read {AS_OF}. Figures change
          continuously; open the site for current values.
        </p>
      </section>

      {/* Comparison table */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Side by side
        </h2>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-elevated">
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  Aspect
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
                <tr key={r.feature} className="border-b border-bg-border-subtle last:border-0">
                  <td className="px-4 py-2.5 text-text-primary">{r.feature}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{r.viberank}</td>
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
          Worked example: the biggest spender is not the best operator
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Canon definitions: Leverage = cache_read / input. Velocity = output /
          input (output per fresh input, not a rate over time). Υ Yield =
          Leverage × Velocity. SNR = output / (output + input). The two
          operators below are <strong className="text-text-primary">hypothetical</strong>,
          invented to show the arithmetic.
        </p>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-elevated">
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  Hypothetical
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  Operator A
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-gold">
                  Operator B
                </th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              <tr className="border-b border-bg-border-subtle">
                <td className="px-4 py-2.5 text-text-primary">Fresh input</td>
                <td className="px-4 py-2.5">200M</td>
                <td className="px-4 py-2.5">5M</td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="px-4 py-2.5 text-text-primary">Output</td>
                <td className="px-4 py-2.5">100M</td>
                <td className="px-4 py-2.5">10M</td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="px-4 py-2.5 text-text-primary">Cache-read</td>
                <td className="px-4 py-2.5">2,000M</td>
                <td className="px-4 py-2.5">500M</td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="px-4 py-2.5 text-text-primary">Leverage</td>
                <td className="px-4 py-2.5">10</td>
                <td className="px-4 py-2.5">100</td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="px-4 py-2.5 text-text-primary">Velocity</td>
                <td className="px-4 py-2.5">0.5</td>
                <td className="px-4 py-2.5">2</td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="px-4 py-2.5 text-text-primary">SNR</td>
                <td className="px-4 py-2.5">0.33</td>
                <td className="px-4 py-2.5">0.67</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-text-primary">Υ Yield</td>
                <td className="px-4 py-2.5">5</td>
                <td className="px-4 py-2.5 font-medium text-gold">200</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Operator A sends forty times the fresh input and moves roughly four
          and a half times the total tokens, so any board sorted by volume or
          spend puts A first. Operator B gets two output tokens for every fresh
          input token and reuses a hundred cached tokens per fresh one. B&apos;s
          Yield is forty times A&apos;s. Neither number is wrong; they answer
          different questions.
        </p>
      </section>

      {/* Real data */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How big is the SigRank field?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Small. As of 2026-11-11 the{" "}
          <Link href="/board/30d" className={hostLink}>
            30-day board
          </Link>{" "}
          had 7 public operators. Percentiles on a field this size move when one person joins,
          and the board does not publish per-row verification, so read rows as
          self-reported snapshots. Current values are on the{" "}
          <Link href="/board/all" className={hostLink}>
            live board
          </Link>
          ; the definitions are in the{" "}
          <Link href="/methodology" className={hostLink}>
            methodology
          </Link>
          .
        </p>
      </section>

      {/* When to use which */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Use viberank when, use SigRank when
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
              viberank fits
            </p>
            <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-4 font-sans text-sm text-text-secondary">
              <li>You want to see your raw spend against a large crowd.</li>
              <li>You use several agents and want one summed total.</li>
              <li>You enjoy tier ladders and shareable rank cards.</li>
            </ul>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-xs uppercase tracking-wide text-gold">
              SigRank fits
            </p>
            <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-4 font-sans text-sm text-text-secondary">
              <li>You want to know whether your context reuse is paying off.</li>
              <li>You are tuning a workflow and need a ratio, not a total.</li>
              <li>You want Leverage, Velocity and SNR broken out beside Yield.</li>
            </ul>
          </div>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Yield has limits. It describes token-processing patterns, not model
          quality, work quality or business outcomes, and a high value can come
          from a workflow that mostly re-reads a big cache. Read it with
          Velocity and SNR, not alone.
        </p>
      </section>

      {/* Setup */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Already on viberank? Add SigRank in four commands
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Nothing to uninstall. Create a connect code from Settings after
          signing in at signalaf.com, then:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
            {`npx sigrank                    # inspect local usage in the terminal
npx sigrank enroll             # bind this device with your connect code
npx sigrank submit --dry-run   # see the payload; nothing is sent
npx sigrank submit             # publish a signed snapshot`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          No account yet? The{" "}
          <Link href="/score" className={hostLink}>
            /score calculator
          </Link>{" "}
          takes pasted token counts and returns Yield without a submission.
        </p>
      </section>

      {/* FAQ */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          viberank and SigRank: questions
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
          Score your own totals
        </Link>
        <Link
          href="/board/all"
          className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
        >
          Open the Yield board
        </Link>
      </section>

      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link href="/vs/ccgather" className={hostLink}>
            SigRank vs ccgather
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
      <FieldEvidence tool="viberank" alreadyUsing />
    </div>
  );
}
