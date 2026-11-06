/**
 * app/guides/llm-token-usage-spike-alerts/page.tsx
 *
 * Practical guide: "llm token usage spike alert best practices". Baselines,
 * thresholds, per-session vs per-day alerts, cache-hit-rate drops, runaway
 * agent loops. Thresholds are starting heuristics, labelled as such.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG, AUTHOR_NAME } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleJsonLd, breadcrumb, faqPage } from "@/lib/jsonld";

const PATH = "/guides/llm-token-usage-spike-alerts";
const PUBLISHED = "2026-11-06";
const TITLE = "LLM Token Usage Spike Alerts: Best Practices";
const DESCRIPTION =
  "How to alert on LLM token usage spikes without noise: set a baseline, use per-session and per-day thresholds, watch cache hit rate drops, and stop runaway agent loops.";

export const metadata: Metadata = withOG({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  article: {
    publishedTime: PUBLISHED,
    modifiedTime: PUBLISHED,
    authors: [AUTHOR_NAME],
    section: "Guides",
  },
});

const FAQS = [
  {
    question: "What is a good threshold for an LLM token usage spike alert?",
    answer:
      "Start from your own baseline rather than a fixed number. A common starting point is to warn when a day exceeds 1.5 times the 90th percentile (p90) of the trailing 14 days and to page at 3 times p90, and to stop a session at 2 times the p90 session. Tune after two weeks of alerts. These multipliers are working heuristics, not measured standards; the right values depend on how variable your normal usage is.",
  },
  {
    question: "Should I alert per session or per day?",
    answer:
      "Both. Per-session alerts catch a runaway agent loop within minutes, because a single session can burn a day of budget in an hour. Per-day alerts catch slow drift, such as a cache that stopped working or a new workflow that is simply expensive. Use a hard per-session cap as a circuit breaker and a per-day trend alert as the early warning.",
  },
  {
    question: "Why does a drop in cache hit rate cause a token spike?",
    answer:
      "When the cached prefix stops matching, the same context is billed as fresh input or as a new cache write instead of a cheap cache read. Anthropic's documentation prices cache reads at a fraction of base input (0.1x for most models, lower for some newer ones, as of 2026-11-06) and 5-minute cache writes above base input, so a broken cache raises cost sharply even when your prompts have not grown. Check the current multipliers in the linked docs. Anything that changes the cached prefix, such as tool definitions, system prompt edits or a timestamp placed early in the prompt, can cause it. Note that the cache hit rate ratio alone can miss this: if caching stops entirely the ratio is undefined, so also watch cache_read and fresh input per turn.",
  },
  {
    question: "How do I detect a runaway agent loop?",
    answer:
      "Look for sessions where the number of model calls or total tokens keeps climbing while output stays flat or repeats. Practical signals: more than a set number of calls with no new file changes, the same tool call repeated several times in a row, or input tokens per turn growing every turn without a matching increase in useful output. Cap turns and tokens per session so a loop stops itself.",
  },
  {
    question: "What data do I need to build token spike alerts?",
    answer:
      "Per-request token counts split into fresh input, output, cache read and cache write, plus a session identifier and a timestamp. Provider APIs return these in the usage block of each response. For local coding agents, tools such as ccusage read the same counts from session logs. Prompt and response content is not needed.",
  },
];

const ALERT_TABLE = [
  {
    alert: "Per-session token cap",
    signal: "Total tokens in one session",
    start: "Hard stop at 2 times your p90 session",
    catches: "Runaway agent loops, accidental huge-file reads",
  },
  {
    alert: "Per-day spend or token trend",
    signal: "Daily total vs trailing 14-day median",
    start: "Warn above 1.5 times the p90 day, page above 3 times p90",
    catches: "Slow drift, new expensive workflow, broken cache",
  },
  {
    alert: "Cache reuse drop",
    signal:
      "cache_read per turn, plus fresh input per turn; cache hit rate as a companion",
    start:
      "Warn when cache_read per turn falls below half its 14-day median, or cache hit rate drops 15 points below its 14-day median",
    catches:
      "Prefix changes that invalidate prompt caching, including total cache loss where the ratio is undefined",
  },
  {
    alert: "Fresh input per turn",
    signal: "Uncached input tokens per request",
    start: "Warn when the median per-turn value reaches 2 times its 14-day median",
    catches: "Re-pasted context, tool output dumped into the prompt",
  },
  {
    alert: "Output-to-input stall",
    signal: "Output tokens per fresh input token over a window",
    start: "Warn when a long session produces almost no output",
    catches: "Loops that spend input but never finish",
  },
];

const CODE =
  "rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold";
const LINK = "text-gold underline underline-offset-2";

export default function SpikeAlertsGuide() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Guides", path: "/guides" },
            { name: "Token Usage Spike Alerts", path: PATH },
          ]),
          articleJsonLd({
            path: PATH,
            title: TITLE,
            description: DESCRIPTION,
            datePublished: PUBLISHED,
            type: "TechArticle",
            section: "Guides",
            keywords: [
              "llm token usage spike alert",
              "token usage alerts",
              "cache hit rate",
              "runaway agent loop",
            ],
          }),
          faqPage(FAQS),
        ]}
      />

      <WaveHero
        eyebrow="◈ Guide"
        title="LLM Token Usage Spike Alerts"
        subtitle={
          <>
            Alert on the <span className="text-gold">shape</span> of usage, not
            just the total. A baseline, two kinds of threshold, and a cache
            check catch most spikes.
          </>
        }
      />

      <section className="flex flex-col gap-3">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Short answer:</strong> build a
          baseline from your own recent usage, set a hard per-session cap to
          stop runaway agent loops, add a per-day trend alert for slow drift,
          and watch cache hit rate separately, because a broken prompt cache is
          a common cause of a spike with no change in workload behind it.
        </p>
        <p className="font-sans text-xs text-text-muted">
          Last updated 2026-11-06. Pricing facts are from the provider
          documentation linked below. Thresholds are starting heuristics, not
          measured standards.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          1. Measure the right four numbers
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Every provider response reports token counts. For Anthropic models
          the usage block separates <code className={CODE}>input_tokens</code>{" "}
          (uncached input),{" "}
          <code className={CODE}>cache_creation_input_tokens</code>,{" "}
          <code className={CODE}>cache_read_input_tokens</code> and output (
          <a
            href="https://platform.claude.com/docs/en/build-with-claude/prompt-caching"
            className={LINK}
            rel="noopener"
          >
            prompt caching documentation
          </a>
          , checked 2026-11-06). Alert on these four separately. A single
          &ldquo;total tokens&rdquo; line hides the difference between a cheap
          cache read and an expensive fresh token.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          These are the same four pillars SigRank scores. If you run a local
          coding agent, ccusage reads them from session logs, and{" "}
          <Link href="/guides/how-to-track-token-cascade" className={LINK}>
            tracking your token cascade
          </Link>{" "}
          covers the setup. No prompt content is needed for any alert below.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          2. Set a baseline before you set a threshold
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Collect at least 14 days of per-session and per-day totals. Use the
          median and the 90th percentile, not the mean, because one bad day
          drags the mean up and makes later spikes look normal. Re-compute the
          baseline weekly so a deliberate change in workload does not keep
          firing alerts. Keep weekdays and weekends separate if your usage
          differs.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          3. Per-session versus per-day alerts
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          They catch different failures. A per-session cap is a circuit
          breaker: it fires within minutes and should stop the work. A per-day
          alert is an early warning: it fires after the fact and should open a
          conversation. With only a per-day alert, you learn about a loop the
          next morning, after the cost is spent.
        </p>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-bg-border">
                {["Alert", "Signal", "Starting point", "Catches"].map((h) => (
                  <th
                    key={h}
                    className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALERT_TABLE.map((r) => (
                <tr
                  key={r.alert}
                  className="border-b border-bg-border-subtle last:border-b-0"
                >
                  <td className="p-3 font-mono text-sm font-bold text-text-primary">
                    {r.alert}
                  </td>
                  <td className="p-3 font-sans text-xs leading-relaxed text-text-secondary">
                    {r.signal}
                  </td>
                  <td className="p-3 font-sans text-xs leading-relaxed text-text-secondary">
                    {r.start}
                  </td>
                  <td className="p-3 font-sans text-xs leading-relaxed text-text-secondary">
                    {r.catches}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          4. Watch cache hit rate separately
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank defines{" "}
          <Link href="/metrics/cache-hit-rate" className={LINK}>
            cache hit rate
          </Link>{" "}
          as cache_read / (cache_read + cache_write). When it falls, the same
          context is being rebuilt instead of reused. Anthropic&apos;s
          documentation prices cache reads at 0.1x base input for most models
          (lower for some newer ones) and 5-minute cache writes above base
          input, so a cache that stops matching raises cost without any change
          in what you asked the model to do (as of 2026-11-06; check the{" "}
          <a
            href="https://platform.claude.com/docs/en/build-with-claude/prompt-caching"
            className={LINK}
            rel="noopener"
          >
            current multipliers
          </a>
          ). The ratio has a blind spot: if caching stops entirely, both
          cache_read and cache_write are zero and the ratio is undefined, and
          if the broken prefix is billed as fresh input the ratio can look
          unchanged. So also alert on cache_read per turn and fresh input per
          turn.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The usual causes are in the provider docs: a change to tool
          definitions or the system prompt, a timestamp or other per-request
          value placed before the cached section, or a gap longer than the
          cache lifetime (5 minutes by default). When the alert fires, diff the
          start of the prompt between a good request and a bad one. Our guide
          to{" "}
          <Link href="/guides/how-to-reduce-token-waste" className={LINK}>
            reducing token waste
          </Link>{" "}
          covers the fixes.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          5. Stop runaway agent loops
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          A loop is an agent that keeps calling the model without making
          progress. Three controls work together:
        </p>
        <ul className="flex flex-col gap-2">
          {[
            "Cap turns and tokens per session in the agent harness, so the loop ends on its own.",
            "Flag repeated identical tool calls, for example the same command run three times in a row.",
            "Alert when input per turn grows every turn while output stays flat; that pattern means context is piling up without producing work.",
          ].map((t) => (
            <li
              key={t}
              className="rounded-lg border border-bg-border bg-bg-surface p-4 font-sans text-sm leading-relaxed text-text-secondary"
            >
              {t}
            </li>
          ))}
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Route the alert somewhere a person sees it quickly, and make the
          message carry the session ID, the model, and the last few tool calls.
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-gold/30 bg-gold/5 p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Tune after two weeks
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Review every alert that fired. Raise thresholds that fired on normal
          work; lower the ones that fired late. Aim for few enough alerts that
          each one gets read. For tools that count and compare token usage, see{" "}
          <Link href="/alternatives/token-tracking-tools" className={LINK}>
            token tracking tools
          </Link>{" "}
          and{" "}
          <Link href="/alternatives/token-cost-tracking-tools" className={LINK}>
            token cost tracking tools
          </Link>
          .
        </p>
      </section>

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

      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link href="/metrics/cache-hit-rate" className={LINK}>
            Cache Hit Rate
          </Link>
          {" · "}
          <Link href="/guides/how-to-read-your-cascade" className={LINK}>
            How to Read Your Token Cascade
          </Link>
          {" · "}
          <Link href="/methodology" className={LINK}>
            Methodology
          </Link>
        </p>
      </section>
    </div>
  );
}
