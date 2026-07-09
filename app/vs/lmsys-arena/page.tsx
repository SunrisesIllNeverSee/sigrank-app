/**
 * app/vs/lmsys-arena/page.tsx — "SigRank vs LMSYS Chatbot Arena" SEO page.
 *
 * Angle: LMSYS ranks AI MODELS by human preference votes. SigRank ranks
 * OPERATORS by token cascade efficiency. Models don't drive — operators do.
 * The leaderboard should rank the driver, not the car.
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
  title: "SigRank vs LMSYS Arena \u2014 Rank Driver, Not Car",
  description:
    "LMSYS ranks AI models by preference votes. SigRank ranks operators by cascade efficiency. Models don\u2019t drive \u2014 operators do. Rank the driver, not the car.",
  path: "/vs/lmsys-arena",
});

const COMPARE_ROWS: { feature: string; lmsys: string; sigrank: string }[] = [
  {
    feature: "What gets ranked",
    lmsys: "AI models (GPT, Claude, Gemini…)",
    sigrank: "AI operators (the humans driving)",
  },
  {
    feature: "Ranking signal",
    lmsys: "Human preference votes (Elo)",
    sigrank: "Token cascade efficiency (Υ Yield)",
  },
  {
    feature: "Measurement method",
    lmsys: "Blind pairwise voting",
    sigrank: "On-device token telemetry (ed25519-signed)",
  },
  {
    feature: "Scores the model or the operator",
    lmsys: "The model",
    sigrank: "The operator",
  },
  {
    feature: "Objective vs subjective",
    lmsys: "Subjective (human taste)",
    sigrank: "Objective (token counts, no content read)",
  },
  {
    feature: "Privacy-preserving (no prompt content)",
    lmsys: "N/A (votes on outputs)",
    sigrank: "Yes (token counts only)",
  },
  {
    feature: "Reproducible from your own logs",
    lmsys: "No (centralized vote corpus)",
    sigrank: "Yes (on-device scanner)",
  },
  {
    feature: "Class tier (IGNITER → TRANSMITTER)",
    lmsys: "No",
    sigrank: "Yes",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    lmsys: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform-neutral (15+ AI tools)",
    lmsys: "Models only",
    sigrank: "Yes",
  },
  {
    feature: "Published science (Conservation Law, DOI)",
    lmsys: "Elo methodology papers",
    sigrank: "Yes (DOI: 10.5281/zenodo.20029607)",
  },
  { feature: "MCP server for agent integration", lmsys: "No", sigrank: "Yes" },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "What is the difference between LMSYS Chatbot Arena and SigRank?",
    answer:
      "LMSYS Chatbot Arena ranks AI MODELS — GPT-4, Claude, Gemini — by collecting blind pairwise human preference votes and computing an Elo score. SigRank ranks OPERATORS — the humans driving the AI — by measuring token cascade efficiency (Υ = cache_read × output / input²) from on-device, signed telemetry. LMSYS answers &quot;which model is best?&quot;; SigRank answers &quot;which operator drives best?&quot; Models don't drive — operators do. The leaderboard should rank the driver, not the car.",
  },
  {
    question: "Is SigRank an LMSYS alternative?",
    answer:
      "They are complementary, not replacements. LMSYS is the gold standard for model ranking — it tells you which AI to use. SigRank is the standard for operator ranking — it tells you how well you used it. You pick the model with LMSYS; you measure your skill with SigRank. If you want an AI benchmarking leaderboard that ranks the human side of the human-AI loop, SigRank is the one that does that.",
  },
  {
    question: "Why rank operators instead of models?",
    answer:
      "Because the model is a constant across operators, but the outcome is not. Give ten operators the same Claude model and the same task and you get ten different token cascades — different input sizes, different cache reuse, different output. The model didn't change; the driving did. LMSYS controls for the operator to isolate the model. SigRank controls for the model to isolate the operator. Both are valid; only SigRank answers &quot;how well did I drive?&quot;",
  },
  {
    question: "How is SigRank objective while LMSYS is subjective?",
    answer:
      "LMSYS uses human preference votes — which response &quot;feels better.&quot; That is a subjective, taste-based signal, vulnerable to length bias and style preference. SigRank reads four token integers (input, output, cache-read, cache-write) from your local logs and computes Υ Yield = cache_read × output / input². No human judges, no prompt content read, no opinion — just the arithmetic of the cascade. The score is reproducible from your own logs; anyone can verify it.",
  },
  {
    question: "Does SigRank ignore model quality?",
    answer:
      "No — it normalizes across it. SigRank is platform-neutral, so operators on different models are comparable on the cascade axis. A strong operator on a weaker model can still achieve high Leverage and cache reuse; a weak operator on the best model can still burn input tokens. The cascade measures driving skill, which is partly independent of engine power. LMSYS tells you the engine's ceiling; SigRank tells you how close you got to it.",
  },
];

export default function VsLmsysArenaPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs LMSYS Chatbot Arena", path: "/vs/lmsys-arena" },
          ]),
          faqPage(FAQS),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs LMSYS Arena"
        title="Rank the Driver, Not the Car"
        subtitle={
          <>
            LMSYS ranks <span className="text-gold">models</span> by human
            preference. SigRank ranks{" "}
            <span className="text-gold">operators</span> by token cascade
            efficiency. Models don&apos;t drive — operators do.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: LMSYS Arena
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          LMSYS Chatbot Arena is the gold standard for one question:{" "}
          <em>which AI model is best?</em> It collects blind pairwise votes,
          computes Elo, and ranks GPT-4, Claude, Gemini, and the rest. That is a
          model-ranking problem, and LMSYS solves it well.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank solves a different problem:{" "}
          <strong className="text-text-primary">
            which operator drives best?
          </strong>{" "}
          Give ten operators the same model and the same task and you get ten
          different token cascades. The model didn&apos;t change — the driving
          did. LMSYS ranks the car; SigRank ranks the driver. The leaderboard
          that was missing was the one that scores the human in the human-AI
          loop.
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
                  LMSYS Arena
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
                  <td className="px-4 py-2.5 text-text-secondary">{r.lmsys}</td>
                  <td className="px-4 py-2.5 font-medium text-gold">
                    {r.sigrank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Driver vs car */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The driver, not the car
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          A leaderboard that ranks models tells you the ceiling — the best
          engine you can put in the car. It tells you nothing about who is
          extracting the most from the engine they have. That is the gap SigRank
          fills. The cascade metric{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>{" "}
          is model-agnostic: it measures how well the operator reused context,
          compressed input, and converted tokens into output — regardless of
          which model produced them.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            Same model, different drivers
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            Ten operators, all on Claude. Same task. Ten different Υ scores —
            because one reused cached context (high cache_read, low input), one
            re-sent everything every turn (low cache_read, high input), and one
            wrote tight prompts (high output, low input). LMSYS would rank the
            model identically for all ten. SigRank ranks the operators
            differently — because the driving was different.
          </p>
        </div>
      </section>

      {/* Objective vs subjective */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Objective cascade vs subjective votes
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          LMSYS&apos;s Elo is built from human preference votes — which response
          &quot;feels better.&quot; That is a subjective signal, and it is the
          right signal for model ranking (you want models humans like). But it
          carries known biases: longer responses win, confident tone wins, style
          wins. SigRank&apos;s Υ is built from four token integers read
          on-device — no judges, no content read, no opinion. The score is the
          arithmetic of the cascade, reproducible from your own logs. Anyone can
          verify it; no one can vote it up.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s scoring is grounded in published science — the
          Conservation Law of Commitment (DOI:{" "}
          <a
            href="https://doi.org/10.5281/zenodo.20029607"
            className="text-gold underline underline-offset-2"
          >
            10.5281/zenodo.20029607
          </a>
          ) — with a governance framework (MO§ES™, patent pending) enforcing
          submission integrity.
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
          You picked the model. Now measure the driving.
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          LMSYS told you which AI to use. SigRank tells you how well you used
          it. Install the CLI, submit a signed snapshot, and see where you rank
          among operators — not models.
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
            See the operator leaderboard
          </Link>
        </div>
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
            href="/alternatives/ai-benchmarking-tools"
            className="text-gold underline underline-offset-2"
          >
            AI Benchmarking Tools
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
    </div>
  );
}
