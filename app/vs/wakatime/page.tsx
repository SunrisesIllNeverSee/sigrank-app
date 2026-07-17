/**
 * app/vs/wakatime/page.tsx — "SigRank vs WakaTime" SEO comparison page.
 *
 * Angle: WakaTime tracks time spent coding. SigRank tracks token efficiency.
 * Time ≠ signal. An hour with good cache reuse beats 10 hours of burning
 * input tokens.
 *
 * RSC only — no client JS. Uses withOG(), JsonLd (breadcrumb + faqPage),
 * WaveHero, and a styled comparison table matching the repo's conventions.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

export const metadata: Metadata = withOG({
  title: "SigRank vs WakaTime — Time vs Token Efficiency",
  description:
    "WakaTime tracks hours coding. SigRank tracks token cascade efficiency. Time \u2260 signal \u2014 an hour with good cache reuse beats 10 hours of burning input.",
  path: "/vs/wakatime",
});

const COMPARE_ROWS: { feature: string; wakatime: string; sigrank: string }[] = [
  {
    feature: "Primary unit of measurement",
    wakatime: "Time (hours/minutes)",
    sigrank: "Token cascade efficiency (Υ Yield)",
  },
  {
    feature: "Tracks AI coding specifically",
    wakatime: "No (general coding time)",
    sigrank: "Yes (AI operator scoring)",
  },
  {
    feature: "Token pillar breakdown (input/output/cache-read/cache-write)",
    wakatime: "No",
    sigrank: "Yes",
  },
  {
    feature: "Cache reuse measurement",
    wakatime: "No",
    sigrank: "Yes (cache hit rate, Leverage)",
  },
  {
    feature: "Compression ratio (output per input)",
    wakatime: "No",
    sigrank: "Yes",
  },
  { feature: "Signal-to-noise ratio", wakatime: "No", sigrank: "Yes" },
  {
    feature: "Velocity (tokens per unit time)",
    wakatime: "No",
    sigrank: "Yes",
  },
  {
    feature: "Class tier (IGNITER → TRANSMITTER)",
    wakatime: "No",
    sigrank: "Yes",
  },
  { feature: "Global operator leaderboard", wakatime: "No", sigrank: "Yes" },
  {
    feature: "Operator profiles + head-to-head compare",
    wakatime: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform-neutral (Cursor, Copilot, Claude, 15+)",
    wakatime: "Yes (editors)",
    sigrank: "Yes (AI tools)",
  },
  {
    feature: "Privacy-preserving (no prompt content read)",
    wakatime: "Yes",
    sigrank: "Yes (token counts only)",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a WakaTime replacement for AI coding?",
    answer:
      "They measure different things. WakaTime tracks how long you code — the clock. SigRank tracks how efficiently your token cascade flows — the signal. In AI-assisted coding, time spent is a weak proxy for productivity: an hour with good cache reuse and tight prompts can produce more useful output than ten hours of re-sending bloated context. SigRank is the AI coding tracker that measures the thing that actually varies between operators: token efficiency, not seat time.",
  },
  {
    question: "Why is time a bad metric for AI coding?",
    answer:
      "In traditional coding, time-on-task correlates with output — you type the lines. In AI coding, the model types the lines; your job is to drive it efficiently. Two operators can spend the same hour and get a 10× difference in signal. One reuses cached context (cache_read) and produces high-leverage output; the other burns fresh input tokens re-explaining the same context every turn. Time measures the hour; Υ Yield = cache_read × output / input² measures who actually drove better during it.",
  },
  {
    question: "Can I use SigRank alongside WakaTime?",
    answer:
      "Yes — they are complementary, not exclusive. WakaTime tells you how many hours you coded; SigRank tells you how efficiently you drove the AI during those hours. Together they answer &quot;how much did I work?&quot; and &quot;how well did I work?&quot; SigRank even computes Velocity (output tokens per unit session time), which bridges the two views — productivity per hour, measured in signal rather than keystrokes.",
  },
  {
    question: "What does WakaTime not see that SigRank does?",
    answer:
      "WakaTime sees editor activity — file opens, keystrokes, language, project. It does not see the token cascade: how much input you sent, how much output came back, how much context you reused from cache versus re-paid for. SigRank reads exactly those four pillars (input, output, cache-read, cache-write) and derives the cascade architecture — Υ Yield, compression ratio, SNR, Leverage, and Velocity. That cascade is where AI coding efficiency lives, and it is invisible to a time tracker.",
  },
  {
    question: "Does SigRank track time at all?",
    answer:
      "Yes, as one input to Velocity (output tokens per unit session time) — but time is a denominator, not the headline. SigRank&apos;s primary metric is Υ Yield, which is unitless and measures cascade efficiency independent of how long you sat there. An operator who produces more signal per token ranks higher regardless of whether they worked 20 minutes or 2 hours. Time rewards presence; Υ rewards driving.",
  },
];

export default function VsWakatimePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs WakaTime", path: "/vs/wakatime" },
          ]),
          faqPage(FAQS),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs WakaTime"
        title="Time Spent vs Token Efficiency"
        subtitle={
          <>
            WakaTime tracks the <span className="text-gold">clock</span>.
            SigRank tracks the <span className="text-gold">cascade</span>. Time
            ≠ signal — an hour with good cache reuse beats 10 hours of burning
            input tokens.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: WakaTime
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          WakaTime is a time tracker. It measures how many hours your editor was
          active — a metric built for traditional coding, where{" "}
          <em>you type the lines</em> and time-on-task roughly tracks output. AI
          coding broke that assumption. When the model types the lines, your job
          is to <strong className="text-text-primary">drive</strong> it
          efficiently — and driving efficiency is invisible to a clock.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank measures the thing that actually varies between AI operators:{" "}
          <strong className="text-text-primary">
            token cascade efficiency
          </strong>
          . An hour with good cache reuse and tight prompts can produce more
          signal than ten hours of re-sending bloated context. WakaTime would
          rank both sessions by duration. SigRank ranks them by{" "}
          <span className="font-mono text-gold">Υ Yield</span> — and the
          one-hour session wins.
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
                  WakaTime
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
                    {r.wakatime}
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

      {/* Time != signal */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Time ≠ signal
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The core disagreement between a time tracker and a cascade tracker is
          what counts as <em>work</em>. In traditional coding, work ≈ time ×
          keystrokes. In AI coding, the model does the keystrokes — so work ≈
          how efficiently you steered the model&apos;s token flow. Two
          operators, same hour:
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
              Operator A — 1 hour
            </p>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              Reuses cached context. Sends 5K fresh input, gets 30K output.
              Cache-read does the heavy lifting.{" "}
              <span className="font-mono text-gold">Υ is high</span>.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
              Operator B — 10 hours
            </p>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              Re-sends the same context every turn. Burns 200K input, gets 15K
              output. No cache reuse.{" "}
              <span className="font-mono text-text-muted">Υ is low</span>.
            </p>
          </div>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          WakaTime ranks Operator B higher — 10× the hours. SigRank ranks
          Operator A higher — 10× the signal per token. In a world where the
          model writes the code, the second ranking is the one that reflects
          skill.
        </p>
      </section>

      {/* The bridge: Velocity */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Where time still matters: Velocity
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank doesn&apos;t ignore time — it demotes it to a denominator.
          Velocity = output / input measures how much signal you produce
          per unit time. That bridges the WakaTime view (productivity per hour)
          with the cascade view (signal per token). An operator with high Υ{" "}
          <em>and</em> high Velocity is the full picture: efficient{" "}
          <strong className="text-text-primary">and</strong> fast. WakaTime can
          only see the speed, never the efficiency behind it.
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
          Stop tracking hours. Start tracking signal.
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          WakaTime told you how long you sat there. SigRank tells you how well
          you drove. Install the CLI, submit a signed snapshot, and see your Υ
          Yield, class tier, and global rank in under a minute.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/score"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            Calculate your Υ Yield
          </a>
          <a
            href="/methodology"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            Read the methodology
          </a>
        </div>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/alternatives/ai-coding-metrics"
            className="text-gold underline underline-offset-2"
          >
            AI Coding Metrics Tools
          </Link>
          {" · "}
          <Link
            href="/metrics/velocity"
            className="text-gold underline underline-offset-2"
          >
            Velocity
          </Link>
          {" · "}
          <Link
            href="/guides/how-to-measure-ai-coding-efficiency"
            className="text-gold underline underline-offset-2"
          >
            Measure AI Coding Efficiency
          </Link>
        </p>
      </section>
    </div>
  );
}
