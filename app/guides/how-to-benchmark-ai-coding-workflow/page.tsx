/**
 * app/guides/how-to-benchmark-ai-coding-workflow/page.tsx
 *
 * SEO guide targeting "ai coding benchmarks" (390 vol, KD 47%) and
 * "ai coding benchmark" (110 vol, KD 41%). Explains what AI coding
 * benchmarks are, types of benchmarks, how to benchmark your workflow
 * with token cascade metrics, and how SigRank ranks operators not models.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "AI Coding Benchmarks — How to Benchmark Your AI Coding Workflow",
  description:
    "Complete guide to AI coding benchmarks. What they are, types of benchmarks, how to measure AI coding productivity with token cascade metrics, and how to compare on the SigRank leaderboard.",
  path: "/guides/how-to-benchmark-ai-coding-workflow",
});

const howTo = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to benchmark your AI coding workflow",
  description:
    "Establish a baseline yield, track the four token pillars across time windows, and compare yourself against the SigRank leaderboard. A complete benchmarking workflow with sigrank.",
  totalTime: "PT15M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Capture your baseline",
      text: "Run `sigrank me` to read your current token cascade across 7d, 30d, 90d, and all-time windows. Record your Υ Yield, cache hit rate, leverage, and class tier as your baseline.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Submit your baseline snapshot",
      text: "Run `sigrank submit` to publish your signed baseline to the SigRank leaderboard. This establishes your starting rank and class tier.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Make a change and re-measure",
      text: "Apply a workflow change (e.g. better context windows, fewer re-rolls). After a week, run `sigrank me` again and compare the new yield against your baseline.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Compare across time periods",
      text: "Use the 7d vs 30d vs 90d windows to see if your change is a spike or a trend. A sustained improvement shows up in the longer windows; a one-off spike shows in 7d only.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Compare against the field",
      text: "Check the SigRank leaderboard to see where your yield ranks globally. Use the compare tool to benchmark yourself against operators in your class tier.",
    },
  ],
};

export default function HowToBenchmarkAICodingWorkflowPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Guides", path: "/guides" },
            {
              name: "Benchmark AI Coding Workflow",
              path: "/guides/how-to-benchmark-ai-coding-workflow",
            },
          ]),
          faqPage([
            {
              question: "What are AI coding benchmarks?",
              answer:
                "AI coding benchmarks measure how effectively AI is used for software development. Model benchmarks (SWE-bench, LiveBench) evaluate which AI writes better code. Operator benchmarks (SigRank) evaluate how well the operator drives the AI. Both matter, but only operator benchmarks improve when you change your workflow.",
            },
            {
              question: "What is the best AI coding benchmark in 2026?",
              answer:
                "It depends on what you are measuring. SWE-bench is the standard for model capability. SigRank is the standard for operator efficiency — it measures real workflows passively, without controlled tasks. The best benchmark is one that measures what you actually do.",
            },
            {
              question: "How do I measure AI coding productivity?",
              answer:
                "Track the four token pillars (input, output, cache-read, cache-write) and derive yield, leverage, velocity, and cache hit rate. SigRank does this automatically — run `sigrank me` to read your cascade. The field average is 4.67M tokens per task; top operators use 810K.",
            },
            {
              question: "Why should I benchmark my AI coding workflow?",
              answer:
                "Without a benchmark, you cannot tell whether a workflow change helped or hurt. Benchmarking gives you a numeric baseline (Υ Yield, cache hit rate, leverage) so you can measure the impact of changes like better prompt caching, structured inputs, or fewer re-rolls. It turns intuition into data.",
            },
            {
              question: "What should I measure to benchmark my workflow?",
              answer:
                "Measure the four token pillars (input, output, cache-read, cache-write) plus the derived metrics: Υ Yield, compression ratio, cache hit rate, leverage, and signal-to-noise ratio. These together describe the full architecture of your token cascade.",
            },
            {
              question: "How do I establish a baseline?",
              answer:
                "Run `sigrank me` to read your current token cascade across 7d, 30d, 90d, and all-time windows. Record your yield, cache hit rate, leverage, and class tier. Submit a signed snapshot with `sigrank submit` to lock in your starting rank on the leaderboard.",
            },
            {
              question: "How do I compare across time periods?",
              answer:
                "SigRank tracks your cascade across 7-day, 30-day, 90-day, and all-time windows. Compare the windows to distinguish a sustained improvement (shows in 30d and 90d) from a one-off spike (shows in 7d only). This tells you whether a change is a trend or noise.",
            },
            {
              question: "How do I compare myself against other operators?",
              answer:
                "The SigRank leaderboard ranks all operators by yield. Check your global rank and class tier. Use the SigRank compare tool to benchmark yourself head-to-head against specific operators in your tier or above.",
            },
          ]),
          howTo,
        ]}
      />

      <WaveHero
        eyebrow="◈ Guide"
        title="AI Coding Benchmarks"
        subtitle={
          <>
            How to benchmark your AI coding workflow with token cascade
            metrics. What AI coding benchmarks are, the types that matter,
            and how to measure your productivity against the field.
          </>
        }
      />

      {/* ── What are AI coding benchmarks ──────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          What are AI coding benchmarks?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          AI coding benchmarks measure how effectively AI tools are used for
          software development. Traditional benchmarks like SWE-bench and
          LiveBench evaluate <em>models</em> — which AI writes better code.
          But they miss the operator side: the operator driving the tool. A
          great operator with a mid-tier model can outperform a poor operator
          with the best model. AI coding benchmarks need to measure the
          <strong className="text-text-primary"> operator</strong>, not just
          the model.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank fills this gap. It benchmarks AI coding workflows using
          token cascade telemetry — four raw measurements (input, output,
          cache-read, cache-write) that capture how efficiently an operator
          drives their AI. No prompts read. No code stored. Just four
          integers signed with ed25519.
        </p>
      </section>

      {/* ── Types of AI coding benchmarks ──────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Types of AI coding benchmarks
        </h2>
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              Model benchmarks
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Evaluate which AI model performs best. SWE-bench, LiveBench,
              HumanEval, Vals AI vibe-code. These test the model in isolation
              — given a task, does it produce correct code? Useful for model
              selection, but they don&rsquo;t tell you how well{" "}
              <em>you</em> use the model.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              Operator benchmarks (SigRank)
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Evaluate the operator driving the AI. SigRank measures token
              cascade efficiency — how much output you generate per token of
              input, how much context you reuse via cache, how much yield you
              compound. This is the benchmark that improves when{" "}
              <em>you</em> get better, not when the model upgrades.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              Productivity metrics
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              AI coding productivity metrics measure throughput: tokens per
              task, time per task, cost per line of code. SigRank tracks
              these alongside yield to give a complete picture of operator
              efficiency. The field average is 4.67M tokens per task; the top
              operator uses 810K — 5.8x fewer.
            </p>
          </div>
        </div>
      </section>

      {/* ── Why benchmarking matters ────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Why benchmarking your workflow matters
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Every time you change your AI coding workflow — switch platforms,
          restructure your prompts, adopt a new context strategy — you&rsquo;re
          running an experiment. Without a benchmark, you&rsquo;re guessing
          whether it helped. A 10% speedup in your subjective experience might
          mask a 40% drop in yield because you started re-pasting context.
          Conversely, a change that <em>feels</em> slower (more planning, fewer
          re-rolls) might double your yield.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Benchmarking turns intuition into data. It gives you a numeric
          baseline — yield, cache hit rate, leverage — that you can compare
          against after each change. And when you submit to the SigRank
          leaderboard, you get an external anchor: your rank among thousands of
          operators worldwide.
        </p>
      </section>

      {/* ── What to measure ─────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          What to measure
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The four token pillars are your raw data. From them, SigRank derives
          five benchmark metrics:
        </p>
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Υ Yield</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-xs text-gold">
                (cache_read × output) / input²
              </code>
              . The headline metric. Measures cascade architecture — compounding
              signal vs burned tokens.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              Compression Ratio
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-xs text-gold">
                output / input
              </code>
              . How much you get out per token you put in. High compression =
              efficient prompting.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              Cache Hit Rate
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-xs text-gold">
                cache_read / (cache_read + cache_write)
              </code>
              . How well you reuse context. Above 80% is excellent; below 50%
              means your context is churning.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Leverage</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-xs text-gold">
                cache_read / input
              </code>
              . How much cached context amplifies your fresh input. High
              leverage = small deltas on a large cached base.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              Signal-to-Noise Ratio (SNR)
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              output / (input + output). Output share of fresh traffic. High
              SNR = most fresh traffic is model output; low SNR = most is input.
            </p>
          </div>
        </div>
      </section>

      {/* ── How to establish a baseline ─────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          How to establish a baseline
        </h2>
        <ol className="flex flex-col gap-4">
          <li className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              Step 1 — Read your cascade
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Run{" "}
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
                sigrank me
              </code>{" "}
              to read your current token cascade across all time windows. Record
              the four pillars and all five derived metrics. This is your
              baseline.
            </p>
          </li>
          <li className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              Step 2 — Submit your baseline
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Run{" "}
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
                sigrank submit
              </code>{" "}
              to publish your signed baseline to the leaderboard. This locks in
              your starting rank and class tier — your external anchor.
            </p>
          </li>
          <li className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              Step 3 — Note your context
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Record what your workflow looks like at baseline: which platform,
              how you structure prompts, how often you re-roll, whether you use
              prompt caching. This context is what you&rsquo;ll change in the
              next step.
            </p>
          </li>
        </ol>
      </section>

      {/* ── How to compare across time periods ──────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          How to compare across time periods
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank tracks your cascade across four windows: 7-day, 30-day,
          90-day, and all-time. Each window tells you something different:
        </p>
        <ul className="flex flex-col gap-3">
          <li className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-text-primary">
              7-day window
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Your most recent week. Sensitive to short-term changes. Use this
              to detect the immediate impact of a workflow change.
            </p>
          </li>
          <li className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-text-primary">
              30-day window
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Your last month. Smooths out one-off spikes. Use this to confirm a
              change is a trend, not noise.
            </p>
          </li>
          <li className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-text-primary">
              90-day window
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Your last quarter. The most stable view. Use this to compare
              quarters or assess long-term trajectory.
            </p>
          </li>
          <li className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-text-primary">
              All-time
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Your full history. The canonical leaderboard rank. Use this for
              your global standing and class tier.
            </p>
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          A sustained improvement shows up in the 30-day and 90-day windows. A
          one-off spike shows in 7-day only. Compare the windows to distinguish
          signal from noise.
        </p>
      </section>

      {/* ── Using the SigRank leaderboard ───────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Using the SigRank leaderboard for external comparison
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Internal benchmarking (you vs your past self) is necessary but not
          sufficient. External benchmarking (you vs the field) tells you whether
          your yield is good in absolute terms. The{" "}
          <Link
            href="/board/all"
            className="text-gold underline underline-offset-2"
          >
            SigRank leaderboard
          </Link>{" "}
          ranks every operator by yield, globally and across time windows.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Check your global rank and class tier. The tiers —{" "}
          <strong className="text-text-primary">
            IGNITER → BEARER → REFINER → SEEKER → BASE → POWER → ARCH → ARCH+
          </strong>{" "}
          — give you a quick read on where you stand. Then use the{" "}
          <Link
            href="/compare"
            className="text-gold underline underline-offset-2"
          >
            compare tool
          </Link>{" "}
          to benchmark yourself head-to-head against specific operators. Find
          someone one tier above you and study their cascade shape — what are
          they doing differently?
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Remember: SigRank ranks{" "}
          <strong className="text-text-primary">operators</strong>, not models.
          The leaderboard doesn&rsquo;t tell you which AI is best — it tells you
          who drives their AI best. That&rsquo;s you vs the field, not Claude vs
          GPT.
        </p>
      </section>

      {/* ── Current AI coding benchmarks landscape ─────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Current AI coding benchmarks in 2026
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The AI coding benchmark landscape has shifted in 2026. Model
          benchmarks (SWE-bench, LiveBench, HumanEval) still dominate
          headlines, but operator benchmarks are emerging as the more
          actionable metric. Here&rsquo;s how the latest AI coding benchmarks
          compare:
        </p>
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              SWE-bench
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Tests whether an AI model can resolve real GitHub issues.
              Measures model capability in isolation. High scores mean the
              model <em>can</em> code — not that <em>you</em> code well with
              it.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              LiveBench
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Continuously updated model evaluation. Tests reasoning, coding,
              and data analysis. Again, model-side — no operator signal.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              Vals AI vibe-code
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Evaluates AI coding agents in controlled environments. Closer to
              real-world usage, but still tests the agent, not the operator.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              SigRank (operator benchmark)
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              The only benchmark that measures the operator behind the AI. Uses
              passive token telemetry — no tasks to complete, no controlled
              environments. Just your real workflow, measured continuously.
              Ranks operators by Yield (&#933;), not by model choice.
            </p>
          </div>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The best AI coding benchmark is one that measures what you actually
          do, not what a model can do in a lab. SigRank runs passively in the
          background, reading only token counts — never prompts, never code,
          never transcripts. It&rsquo;s the only AI coding benchmark that
          improves when <em>you</em> get better at driving your AI.
        </p>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          FAQ
        </h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What are AI coding benchmarks?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              AI coding benchmarks measure how effectively AI is used for
              software development. Model benchmarks (SWE-bench, LiveBench)
              evaluate which AI writes better code. Operator benchmarks
              (SigRank) evaluate how well the operator drives the AI. Both
              matter, but only operator benchmarks improve when you change
              your workflow.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is the best AI coding benchmark in 2026?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              It depends on what you&rsquo;re measuring. SWE-bench is the
              standard for model capability. SigRank is the standard for
              operator efficiency — it measures real workflows passively,
              without controlled tasks. The best benchmark is one that
              measures what you actually do.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I measure AI coding productivity?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Track the four token pillars (input, output, cache-read,
              cache-write) and derive yield, leverage, velocity, and cache hit
              rate. SigRank does this automatically — run{" "}
              <code className="font-mono text-gold">sigrank me</code> to read
              your cascade. The field average is 4.67M tokens per task; top
              operators use 810K.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Why should I benchmark my AI coding workflow?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Without a benchmark, you can&rsquo;t tell whether a workflow
              change helped or hurt. Benchmarking gives you a numeric baseline
              so you can measure the impact of changes. It turns intuition into
              data.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What should I measure?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The four token pillars (input, output, cache-read, cache-write)
              plus yield, compression ratio, cache hit rate, leverage, and SNR.
              Together they describe the full cascade architecture.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I establish a baseline?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Run `sigrank me` to read your current cascade, then `sigrank
              submit` to lock in your starting rank. Record your yield, cache
              hit rate, leverage, and class tier as your baseline.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I compare across time periods?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Use the 7d, 30d, 90d, and all-time windows. A sustained
              improvement shows in 30d and 90d; a one-off spike shows in 7d
              only. Compare windows to distinguish signal from noise.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I compare against other operators?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Check the SigRank leaderboard for your global rank and class tier.
              Use the compare tool for head-to-head benchmarking against
              specific operators.
            </dd>
          </div>
        </dl>
      </section>
      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/ai-benchmarking"
            className="text-gold underline underline-offset-2"
          >
            AI Benchmarking
          </Link>
          {" · "}
          <Link
            href="/vs/lmsys-arena"
            className="text-gold underline underline-offset-2"
          >
            vs LMSYS Arena
          </Link>
          {" · "}
          <Link
            href="/methodology"
            className="text-gold underline underline-offset-2"
          >
            Methodology
          </Link>
        </p>
      </section>

      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Next:{" "}
          <Link
            href="/guides/how-to-compare-ai-operators"
            className="text-gold underline underline-offset-2"
          >
            How to Compare AI Operators →
          </Link>
        </p>
      </section>
    </div>
  );
}
