/**
 * app/ai-benchmarking/page.tsx — "AI Benchmarking — Beyond Model Leaderboards"
 *
 * Topic hub for the AI-benchmarking category. Explains the problem with
 * model-only benchmarking, operator benchmarking vs. model benchmarking,
 * SigRank's approach, and links to the LMSYS comparison, the benchmarking-
 * tools alternatives page, and the science page.
 *
 * JSON-LD: breadcrumb() + faqPage().
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "AI Benchmarking — Beyond Model Leaderboards",
  description:
    "Model-only AI benchmarking ranks the model, not the operator. SigRank benchmarks the human driving the AI \u2014 cascade efficiency, not preference votes.",
  path: "/ai-benchmarking",
});

const RELATED = [
  {
    href: "/vs/lmsys-arena",
    title: "SigRank vs. LMSYS Chatbot Arena",
    desc: "LMSYS Arena ranks AI models by human preference. SigRank ranks operators by token-cascade efficiency. Different questions, different answers — and why both matter.",
  },
  {
    href: "/alternatives/ai-benchmarking-tools",
    title: "AI Benchmarking Tools — Alternatives",
    desc: "The landscape of AI benchmarking and measurement tools: LMSYS Arena, WakaTime, Cursor metrics, Copilot, ccusage — and where SigRank fits.",
  },
  {
    href: "/science",
    title: "The Conservation Law of Commitment",
    desc: "The academic foundation: a published conservation law for language under compression, with Zenodo DOIs and an empirical record. The theory SigRank is built on.",
  },
  {
    href: "/methodology",
    title: "The SigRank Index — Methodology",
    desc: "How operator scores are computed, verified, and ranked. The canonical methodology page for the SigRank Index dataset.",
  },
];

export default function AIBenchmarkingPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([{ name: "AI Benchmarking", path: "/ai-benchmarking" }]),
          faqPage([
            {
              question: "What is AI benchmarking?",
              answer:
                "AI benchmarking is the systematic measurement and comparison of AI system performance. Traditional AI benchmarking ranks models — which LLM scores highest on a test suite or wins the most preference votes. SigRank introduces a new category: operator benchmarking, which ranks the humans driving the AI by token-cascade efficiency rather than ranking the models themselves.",
            },
            {
              question: "What is wrong with model-only benchmarking?",
              answer:
                "Model-only benchmarking tells you which model is best in the abstract, but not who uses it best. It holds the model as the variable and the operator as a constant — the inverse of reality. Two operators on the same model produce wildly different results. Model leaderboards cannot see that difference because they average it away. They also rely on synthetic test suites or preference votes, not real coding telemetry.",
            },
            {
              question:
                "What is the difference between operator benchmarking and model benchmarking?",
              answer:
                'Model benchmarking asks "which AI is best?" and ranks models. Operator benchmarking asks "who is best at using the AI?" and ranks humans. Model benchmarking uses test suites or preference votes. Operator benchmarking uses real token telemetry from actual coding sessions. LMSYS Arena is a model benchmark. SigRank is an operator benchmark. They answer different questions.',
            },
            {
              question: "How does SigRank benchmark AI operators?",
              answer:
                "SigRank captures four token pillars (input, output, cache-read, cache-write) on-device from real AI coding sessions, computes the yield metric Υ = cache_read × output / input², and ranks operators by the architecture of their token cascade. Snapshots are ed25519-signed and verified server-side. No prompt content is ever read — only token counts.",
            },
            {
              question: "Is SigRank a replacement for model leaderboards?",
              answer:
                'No — it is a complement. Model leaderboards (LMSYS Arena, MMLU, HumanEval) answer "which model should I choose?" SigRank answers "am I using the model I chose well?" Both questions matter. SigRank fills the gap that model-only benchmarking leaves: the operator layer.',
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Topic Hub"
        terminalText="BENCHMARK"
        title="AI Benchmarking — Beyond Model Leaderboards"
        subtitle={
          <>
            Model leaderboards rank the AI.{" "}
            <span className="text-gold">Operator benchmarking</span> ranks the
            human. A new category — built on real telemetry, not preference
            votes.
          </>
        }
      />

      {/* ── The problem with model-only benchmarking ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The problem with model-only benchmarking
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Model leaderboards — LMSYS Chatbot Arena, MMLU, HumanEval, SWE-bench —
          answer one question: <em>which model is best?</em> It is a good
          question and the leaderboards answer it well. But it is only half the
          picture. The other half —{" "}
          <em>who is best at using the model they have?</em> — has no
          leaderboard. Model benchmarking holds the model as the variable and
          the operator as a constant. In practice the opposite is true: the
          model is a constant (you pick one and drive it), and the operator is
          the variable (two people on the same model produce wildly different
          results).
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          There is a second problem. Model benchmarks rely on synthetic test
          suites or human preference votes — not on real coding telemetry. A
          test suite tells you the model can solve a curated problem in a
          controlled harness. A preference vote tells you a human liked one
          response better than another. Neither tells you anything about how
          efficiently a real developer drives the model through a real coding
          session over a real week. That gap is where operator time, money, and
          signal are actually won or lost.
        </p>
      </section>

      {/* ── Operator benchmarking vs. model benchmarking ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Operator benchmarking vs. model benchmarking
        </h2>
        <div className="overflow-hidden rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full text-left font-sans text-sm">
            <thead className="border-b border-bg-border bg-bg-elevated">
              <tr>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-text-muted">
                  Dimension
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-text-muted">
                  Model benchmark
                </th>
                <th className="px-4 py-3 font-mono text-xs uppercase tracking-wider text-text-muted">
                  Operator benchmark
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border-subtle">
              <tr>
                <td className="px-4 py-3 font-semibold text-text-primary">
                  Question
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  Which AI is best?
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  Who uses the AI best?
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-text-primary">
                  Ranks
                </td>
                <td className="px-4 py-3 text-text-secondary">Models</td>
                <td className="px-4 py-3 text-text-secondary">
                  Humans (operators)
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-text-primary">
                  Data
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  Test suites / preference votes
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  Real token telemetry
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-text-primary">
                  Setting
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  Controlled harness
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  Live coding sessions
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-text-primary">
                  Example
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  LMSYS Chatbot Arena
                </td>
                <td className="px-4 py-3 text-text-secondary">SigRank Index</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The two categories are complements, not competitors. A model benchmark
          helps you choose a model. An operator benchmark helps you measure
          whether you are driving the model you chose well. Most developers have
          never had the second one. That is the gap SigRank fills.
        </p>
      </section>

      {/* ── SigRank's approach ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          SigRank&apos;s approach
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank benchmarks operators by the architecture of their token
          cascade. Four pillars — input, output, cache-read, cache-write — are
          captured on-device from real coding sessions across 15+ platforms. The
          yield metric{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            Υ = cache_read × output / input²
          </code>{" "}
          measures whether signal is compounding or tokens are burning.
          Operators are ranked by yield, classified into tiers (IGNITER to
          TRANSMITTER), and scored over 7-day, 30-day, 90-day, and all-time
          windows.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The foundation is a published conservation law for language under
          compression (DOI: 10.5281/zenodo.20029607), with an empirical record
          and a public transformation harness. The data is privacy-preserving —
          token counts only, never prompt content — and cryptographically
          signed. It is benchmarking built on real telemetry, real science, and
          real privacy, not on preference votes or synthetic tests.
        </p>
      </section>

      {/* ── Related ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Explore the category
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {RELATED.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="group rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-bg-border-subtle hover:bg-bg-elevated"
            >
              <h3 className="font-mono text-sm font-bold text-text-primary group-hover:text-gold">
                {r.title}
              </h3>
              <p className="mt-1.5 font-sans text-sm leading-relaxed text-text-secondary">
                {r.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">FAQ</h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is AI benchmarking?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The systematic measurement and comparison of AI system
              performance. Traditional benchmarking ranks models. SigRank
              introduces operator benchmarking — ranking the humans driving the
              AI by token-cascade efficiency.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is wrong with model-only benchmarking?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              It holds the model as the variable and the operator as a constant
              — the inverse of reality. It also relies on synthetic tests or
              preference votes, not real coding telemetry. It cannot see the
              operator-level difference that determines real-world efficiency.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Operator benchmarking vs. model benchmarking?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Model benchmarking asks &ldquo;which AI is best?&rdquo; and ranks
              models using test suites or votes. Operator benchmarking asks
              &ldquo;who is best at using the AI?&rdquo; and ranks humans using
              real token telemetry. They are complements, not competitors.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How does SigRank benchmark operators?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Four token pillars captured on-device from real sessions. Yield (Υ
              = cache_read × output / input²) measures cascade architecture.
              Operators are ranked by yield, tiered, and scored over multiple
              time windows. Snapshots are ed25519-signed. No prompt content is
              ever read.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Is SigRank a replacement for model leaderboards?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              No — it is a complement. Model leaderboards help you choose a
              model. SigRank helps you measure whether you are using the model
              you chose well. Both questions matter; SigRank fills the
              operator-layer gap.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
