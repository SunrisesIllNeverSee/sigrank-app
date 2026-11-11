/**
 * app/vs/langfuse/page.tsx - "SigRank vs Langfuse" comparison page.
 *
 * Rebuilt 2026-11-11 as a standalone page, not template text: competitor facts
 * come from its primary sources (cited on the page with an as-of date); field
 * facts come from the public SigRank analyst MCP, fetched the same day.
 * Metric names follow lib/identity/canon-ids.ts (token-era board).
 *
 * RSC only, no client JS.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, comparisonArticle } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

export const metadata: Metadata = withOG({
  title: "SigRank vs Langfuse — App Tracing vs Operator Ranking",
  description:
    "Langfuse traces and evaluates LLM applications. SigRank ranks how operators use tokens. What each answers, when to use which, and how they sit side by side.",
  path: "/vs/langfuse",
});

const COMPARE_ROWS: { feature: string; other: string; sigrank: string }[] = [
  {
    feature: "Main question answered",
    other: "What did my LLM app do, and was it good?",
    sigrank:
      "How efficiently does an operator use tokens compared with others?",
  },
  {
    feature: "Unit of measurement",
    other: "Trace, span, generation, session",
    sigrank: "Operator over a 7d / 30d / 90d / all-time window",
  },
  {
    feature: "How data arrives",
    other: "SDK, OpenTelemetry or gateway in your app",
    sigrank: "CLI reading local usage; four token counts",
  },
  {
    feature: "Reads prompt and response content",
    other: "Yes (that is how traces work)",
    sigrank: "No; ranked telemetry needs no prompt text",
  },
  {
    feature: "Evaluation and prompt management",
    other: "Yes: scores, datasets, prompt versions",
    sigrank: "No",
  },
  {
    feature: "Cost and latency dashboards",
    other: "Yes, for your app",
    sigrank: "Cost per 1M tokens on the board; no latency",
  },
  {
    feature: "Public ranking",
    other: "No",
    sigrank: "Yes, after enroll and submit",
  },
  {
    feature: "Open source and self-hosting",
    other: "MIT outside ee/; self-host or cloud",
    sigrank: "See the repository LICENSE",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Can SigRank replace Langfuse?",
    answer:
      "No. SigRank does not trace calls, store prompts, run evaluations or manage prompt versions. If you ship an LLM application you need an observability tool; SigRank is a separate measurement of how operators use tokens.",
  },
  {
    question: "Does SigRank read my Langfuse traces?",
    answer:
      "No. SigRank reads local token usage through its own CLI and submits signed summaries of four token counts. It does not connect to Langfuse.",
  },
  {
    question: "Does Langfuse measure Yield, Leverage or Velocity?",
    answer:
      "Not as named metrics in its documentation. Langfuse reports cost, latency, quality scores and usage for your app. SigRank's Υ Yield, SNR, Leverage and Velocity are defined from an operator's four token pillars.",
  },
  {
    question: "Which should a small team start with?",
    answer:
      "If you are shipping an LLM product, start with Langfuse: you need traces before anything else. Add SigRank if you also want to compare how your people use coding agents.",
  },
  {
    question: "Is the SigRank field large enough to trust ranks?",
    answer:
      "Treat ranks as early signals. The public board is small and changes as people enroll, so read the spread of Yield and your own trend rather than a single position.",
  },
];

const SOURCES: { label: string; href: string }[] = [
  {
    label: "Langfuse documentation (langfuse.com/docs)",
    href: "https://langfuse.com/docs",
  },
  {
    label: "Langfuse pricing",
    href: "https://langfuse.com/pricing",
  },
  {
    label: "Langfuse repository and LICENSE",
    href: "https://github.com/langfuse/langfuse",
  },
  {
    label: "langfuse on PyPI",
    href: "https://pypi.org/project/langfuse/",
  },
  {
    label: "SigRank CLI and MCP (sigrank-mcp)",
    href: "https://github.com/SunrisesIllNeverSee/sigrank-mcp",
  },
];

export default function VsLangfusePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs Langfuse", path: "/vs/langfuse" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs Langfuse — App Tracing vs Operator Ranking",
            description:
              "Langfuse traces and evaluates LLM applications. SigRank ranks how operators use tokens. What each answers, when to use which, and how they sit side by side.",
            path: "/vs/langfuse",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs Langfuse"
        title="Langfuse Traces Your App. SigRank Ranks the Operator."
        subtitle={
          <>
            Langfuse records what your LLM application did so you can debug and
            evaluate it. SigRank looks only at four token counts and ranks the
            operator. Different layer, different reader; here is how to choose.
          </>
        }
      />

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What Langfuse is, as of 2026-11-11
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Langfuse describes itself as an open-source AI engineering platform
          for teams building LLM and agent applications. Its documentation lists
          tracing (LLM and non-LLM calls, sessions, per-user tracking, agent
          graph and timeline views, alerts); prompt management with versions,
          labels and a playground; evaluation (LLM-as-a-judge, code evaluators,
          user feedback, annotation queues, custom scores); datasets and
          experiments; a metrics dashboard for quality, cost and latency; and an
          AI gateway. It has Python and JavaScript SDKs, OpenTelemetry-based
          tracing, and 100+ integrations such as the OpenAI SDK, LangChain and
          LlamaIndex.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Licensing and pricing: the repository is MIT-licensed outside its ee/
          directories, which carry a separate licence. You can self-host or use
          Langfuse Cloud, which has a free Hobby tier and paid tiers listed on
          its pricing page. The Python package langfuse was at 5.2.0 on PyPI,
          released 2026-11-05.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Different layer, different reader
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Langfuse instruments an application. You add its SDK or an
          OpenTelemetry exporter to code you ship, and it records every call so
          you can debug a bad answer, compare prompt versions or score outputs.
          The reader is the team that owns the app; the unit is a trace.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank measures an operator. It looks only at the four token counts a
          person or agent produced (input, output, cache write, cache read),
          computes Υ Yield, SNR, Leverage, Velocity, 10xDEV and Scale V, and
          places them on a public board. The unit is the operator over a time
          window, and nothing in it looks at content, prompts or correctness. If
          you are asking “why did this chain answer wrongly?”, SigRank cannot
          help; Langfuse can.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Use Langfuse when, use SigRank when
        </h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            Use <strong className="text-text-primary">Langfuse</strong> when you
            are building an LLM product and need traces, prompt versions,
            evaluation scores, datasets, or cost and latency dashboards for that
            product.
          </li>
          <li>
            Use <strong className="text-text-primary">SigRank</strong> when your
            question is about how an individual or team drives coding agents:
            how much cached context you reuse, how much output you get per fresh
            input, and how that compares with other operators.
          </li>
          <li>
            Use <strong className="text-text-primary">both</strong> if your team
            ships an LLM app with Langfuse tracing and also uses coding agents
            to build it. Langfuse watches the app in production; SigRank watches
            the coding sessions that produced it. They do not read the same
            data.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Adding SigRank next to a Langfuse setup
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          There is nothing to wire into your app or your Langfuse project.
          SigRank reads local usage from your coding tools, so it sits beside
          your tracing rather than inside it:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
            {`npx sigrank                  # inspect local usage in the terminal
npx sigrank enroll           # bind this device with a connect code from Settings
npx sigrank submit --dry-run # inspect the payload; nothing is sent
npx sigrank submit           # publish a signed snapshot`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank does not read or upload Langfuse traces. Ranked telemetry
          needs no prompt text, responses or source code. If you only want a
          preview, the{" "}
          <a href="/score" className="text-gold underline underline-offset-2">
            score calculator
          </a>{" "}
          takes four token counts and needs no account.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What the live board looks like
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Fetched from the public SigRank analyst MCP on 2026-11-11: the 30-day
          public board had{" "}
          <strong className="text-text-primary">7 public operators</strong>, a
          small, early field. See the{" "}
          <a
            href="/board/all"
            className="text-gold underline underline-offset-2"
          >
            live board
          </a>{" "}
          for the current count and the{" "}
          <a
            href="/methodology"
            className="text-gold underline underline-offset-2"
          >
            methodology
          </a>{" "}
          page for definitions. These are operator patterns, not application
          quality; Langfuse has no equivalent number because it measures
          something else.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Side-by-side
        </h2>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-bg-border bg-bg-elevated">
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  Question
                </th>
                <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-text-muted">
                  Langfuse
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
                  <td className="px-4 py-2.5 text-text-secondary">{r.other}</td>
                  <td className="px-4 py-2.5 font-medium text-gold">
                    {r.sigrank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

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

      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Measure the operator side
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Langfuse covers your application. To see how you drive the coding
          agents that build it, paste four token counts into the calculator for
          a no-account preview, or enroll and submit a signed snapshot.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/score"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            Calculate your Υ Yield
          </a>
          <Link
            href="/board/all"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            See the leaderboard
          </Link>
          <Link
            href="/hall"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            Hall of operators
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Sources and as-of date
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Competitor facts were read from the sources below on 2026-11-11 (UTC);
          check them for anything newer. Field numbers come from the public
          SigRank analyst MCP on the same date.
        </p>
        <ul className="flex list-disc flex-col gap-1 pl-5 font-sans text-sm text-text-secondary">
          {SOURCES.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                rel="noopener noreferrer"
                className="text-gold underline underline-offset-2"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/vs/braintrust"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs Braintrust
          </Link>
          {" · "}
          <Link
            href="/vs/langchain"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs LangChain
          </Link>
          {" · "}
          <Link
            href="/methodology"
            className="text-gold underline underline-offset-2"
          >
            Methodology
          </Link>
          {" · "}
          <Link
            href="/guides/how-to-measure-ai-coding-efficiency"
            className="text-gold underline underline-offset-2"
          >
            How to measure AI coding efficiency
          </Link>
          {" · "}
          <Link
            href="/tools/yield-calculator"
            className="text-gold underline underline-offset-2"
          >
            Yield Calculator
          </Link>
        </p>
      </section>
    </div>
  );
}
