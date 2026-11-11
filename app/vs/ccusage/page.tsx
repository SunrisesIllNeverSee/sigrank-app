/**
 * app/vs/ccusage/page.tsx - "SigRank vs ccusage" comparison page.
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
  title: "SigRank vs ccusage — Spend Ledger vs Efficiency Ranking",
  description:
    "ccusage reports what your coding agents cost from local logs. SigRank ranks how efficiently you drive them. When to use each, and how to run both.",
  path: "/vs/ccusage",
});

const COMPARE_ROWS: { feature: string; other: string; sigrank: string }[] = [
  {
    "feature": "Main question answered",
    "other": "What did I spend, and on what?",
    "sigrank": "How does my reuse pattern compare with other operators?"
  },
  {
    "feature": "Data read",
    "other": "Local usage data from 19 listed agent CLIs",
    "sigrank": "Local usage via the SigRank CLI; four token pillars"
  },
  {
    "feature": "Cost in dollars",
    "other": "Yes, per model (pricing data; --offline uses a cache)",
    "sigrank": "Cost per 1M tokens appears on the board; not a billing ledger"
  },
  {
    "feature": "Time views",
    "other": "daily, weekly, monthly, session, 5-hour blocks",
    "sigrank": "7d / 30d / 90d / all-time board windows"
  },
  {
    "feature": "Efficiency metrics",
    "other": "Raw counts and cost",
    "sigrank": "Υ Yield, SNR, Leverage, Velocity, 10xDEV, Scale V"
  },
  {
    "feature": "Public ranking and profiles",
    "other": "No",
    "sigrank": "Yes, after enroll and submit"
  },
  {
    "feature": "Account required",
    "other": "No",
    "sigrank": "Only to enroll and submit; the calculator needs none"
  },
  {
    "feature": "Licence",
    "other": "MIT",
    "sigrank": "See the repository LICENSE"
  }
];

const FAQS: { question: string; answer: string }[] = [
  {
    "question": "Does SigRank replace ccusage?",
    "answer": "No. They answer different questions. ccusage is a cost and token ledger across many agent CLIs; SigRank compares reuse-to-fresh-input patterns across operators. Keep ccusage for spend."
  },
  {
    "question": "Which ccusage numbers can I use in SigRank?",
    "answer": "The four token pillars: input, output, cache creation and cache read. Run ccusage with --json, copy those counts into the score calculator at /score, and you get a Yield preview without an account."
  },
  {
    "question": "Is a high Yield the same as a low ccusage bill?",
    "answer": "No. Yield is high when cached context is reused heavily relative to fresh input. That often, but not always, lines up with lower cost; ccusage is the tool to check the actual bill."
  },
  {
    "question": "Why is the field only 7 operators?",
    "answer": "The public 30-day board is young and small: 7 operators when this page was written on 2026-11-11. The all-time window holds 1,626, but those are not all recent. Treat ranks as early signals."
  },
  {
    "question": "Does ccusage read agents SigRank does not?",
    "answer": "ccusage lists 19 sources in its README. SigRank ingests token telemetry through its own CLI; check the CLI repository for the platforms it currently reads before assuming coverage parity."
  }
];

const SOURCES: { label: string; href: string }[] = [
  {
    "label": "ccusage README (github.com/ryoppippi/ccusage)",
    "href": "https://github.com/ryoppippi/ccusage"
  },
  {
    "label": "ccusage on npm",
    "href": "https://www.npmjs.com/package/ccusage"
  },
  {
    "label": "SigRank CLI and MCP (sigrank-mcp)",
    "href": "https://github.com/SunrisesIllNeverSee/sigrank-mcp"
  }
];

export default function VsccusagePage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs ccusage", path: "/vs/ccusage" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs ccusage — Spend Ledger vs Efficiency Ranking",
            description: "ccusage reports what your coding agents cost from local logs. SigRank ranks how efficiently you drive them. When to use each, and how to run both.",
            path: "/vs/ccusage",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs ccusage"
        title="ccusage Reports Spend. SigRank Ranks Efficiency."
        subtitle={
          <>
            ccusage reads local agent logs and tells you what you spent. SigRank takes the same four token counts and asks how you compare with other operators. Different questions; here is when each is the right tool.
          </>
        }
      />

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What ccusage is, as of 2026-11-11
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          ccusage is an MIT-licensed command-line tool that reads the usage data coding-agent CLIs leave on your machine and turns it into cost and token reports. Its README lists 19 supported sources, including Claude Code, Codex, OpenCode, Amp, Cline, GitHub Copilot CLI, Gemini CLI and Goose. Reports are <span className="font-mono text-text-primary">daily</span>, <span className="font-mono text-text-primary">weekly</span>, <span className="font-mono text-text-primary">monthly</span> and <span className="font-mono text-text-primary">session</span>, plus <span className="font-mono text-text-primary">blocks</span> (Claude Code 5-hour billing windows) and a beta <span className="font-mono text-text-primary">statusline</span> hook for Claude Code. You run it with <span className="font-mono text-text-primary">npx ccusage@latest</span> (or bunx / pnpm dlx), add <span className="font-mono text-text-primary">--json</span> for machine-readable output, and it reports cache-creation and cache-read tokens separately. The npm package ccusage was at version 20.0.49, published 2026-11-10.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Where ccusage is the better choice: it is free, needs no account, covers far more agent CLIs than most trackers, gives per-model dollar costs, and its blocks and statusline views help you watch a live 5-hour window. If your question is “what did I spend, on which model, on which day?”, ccusage answers it directly and SigRank does not try to.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Two different questions
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          ccusage is a ledger: how many tokens went in and out, and what that cost. SigRank asks a different question about the same four counts: relative to other operators, how much output and reuse did you get per unit of fresh input? It turns the counts into canon metrics and publishes them on a public board so you can see where you sit.
        </p>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 font-sans text-sm leading-relaxed text-text-secondary">
          <li><strong className="text-text-primary">Υ Yield</strong> is the headline: (cache_read × output) / input². It is large when cached context is reused heavily and output is high relative to fresh input.</li>
          <li><strong className="text-text-primary">Leverage</strong> is cache reuse per fresh input; <strong className="text-text-primary">Velocity</strong> is output per fresh input (a ratio, not a time rate); <strong className="text-text-primary">SNR</strong> is the output share of fresh traffic.</li>
          <li><strong className="text-text-primary">10xDEV</strong> and <strong className="text-text-primary">Scale V</strong> (log10 of total tokens) round out the token-era board.</li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          None of these says whether the work was good. They describe token-processing patterns, nothing more.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Use ccusage when, use SigRank when
        </h2>
        <ul className="flex list-disc flex-col gap-1.5 pl-5 font-sans text-sm leading-relaxed text-text-secondary">
          <li>Use <strong className="text-text-primary">ccusage</strong> when you need dollars, a per-day or per-session breakdown, a 5-hour block view, or coverage of an agent CLI SigRank does not read.</li>
          <li>Use <strong className="text-text-primary">SigRank</strong> when you want to know whether your reuse-to-fresh-input pattern is high or low compared with other operators, track it over 7d / 30d / 90d windows, or publish a signed snapshot others can look at.</li>
          <li>Use <strong className="text-text-primary">both</strong> when you are tuning a workflow. A concrete loop: run <span className="font-mono text-text-primary">npx ccusage@latest daily</span> for the spend, then <span className="font-mono text-text-primary">npx sigrank submit --dry-run</span> to see the Yield, Leverage and Velocity of the same usage before you change prompts or caching habits, and again after. ccusage tells you what the change cost; SigRank tells you whether the pattern behind it moved.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Adding SigRank if you already run ccusage
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          You do not need to change how you use ccusage. The SigRank CLI is a separate package:
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
          Prefer not to install anything? The <a href="/score" className="text-gold underline underline-offset-2">score calculator</a> takes four token counts (input, output, cache creation, cache read), which you can copy from <span className="font-mono text-text-primary">ccusage --json</span> output, and returns a preview without an account. Ranked submissions do not need prompt text, responses or source code.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What the live board looks like
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Fetched from the public SigRank analyst MCP on 2026-11-11. The field is small. For the 30-day window the public board holds <strong className="text-text-primary">7 operators</strong> (6 of them claimed). Their Υ Yield runs from 36.7 to 141,155 with a median of 3,037; median Leverage is 808.6, median Velocity 3.76 and median SNR 0.79. The all-time window holds 1,626 public operators, with a median Yield of 1.95. With a 30-day field this size a rank means little yet; the distribution is more useful than the position, and the numbers will move as people enroll.
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
                  ccusage
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
          Sources and as-of date
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Competitor facts were read from the sources below on 2026-11-11 (UTC); check them for anything newer. Field numbers come from the public SigRank analyst MCP on the same date.
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
          <Link href="/alternatives/ccusage-alternatives" className="text-gold underline underline-offset-2">ccusage Alternatives</Link>
          {" · "}
          <Link href="/tools/yield-calculator" className="text-gold underline underline-offset-2">Yield Calculator</Link>
          {" · "}
          <Link href="/wiki/local-agent" className="text-gold underline underline-offset-2">The Local Agent (MCP)</Link>
        </p>
      </section>
    </div>
  );
}
