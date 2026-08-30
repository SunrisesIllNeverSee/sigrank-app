/**
 * app/ai-evaluation-news/page.tsx — "AI Evaluation News and Trends — 2026"
 *
 * Covers the shift from model benchmarks to operator evaluation: trends,
 * milestones, what to watch. Links into /blog, /ai-evaluation,
 * /ai-benchmarking, /science.
 *
 * JSON-LD: breadcrumb() + definedTerm() + faqPage().
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "AI Evaluation News and Trends — 2026",
  description:
    "The shift from model benchmarks to operator evaluation. AI evaluation trends, milestones, and what to watch in 2026 — content-free telemetry, the Yield metric, and the operator layer. SigRank news and analysis.",
  path: "/ai-evaluation-news",
});

const RELATED = [
  {
    href: "/blog",
    title: "The SigRank Blog",
    desc: "Analysis and commentary on AI evaluation, operator benchmarking, and the token cascade. The latest thinking on the operator layer.",
  },
  {
    href: "/ai-evaluation",
    title: "AI Evaluation — Measuring the Operator, Not Just the Model",
    desc: "The four-layer model of AI evaluation: model, output, safety, operator. The framework behind the shift from model-only to operator evaluation.",
  },
  {
    href: "/ai-benchmarking",
    title: "AI Benchmarking — Beyond Model Leaderboards",
    desc: "Model benchmarks are saturating. Operator benchmarks are emerging. The trend from model-only to operator benchmarking.",
  },
  {
    href: "/science",
    title: "The Conservation Law of Commitment",
    desc: "The academic foundation: a published conservation law for language under compression, with Zenodo DOIs and an empirical record. The science behind the operator layer.",
  },
];

export default function AIEvaluationNewsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "AI Evaluation News", path: "/ai-evaluation-news" },
          ]),
          definedTerm(
            "AI Evaluation News",
            "AI evaluation news in 2026 is dominated by the shift from model benchmarks to operator evaluation. Model benchmarks (MMLU, LMSYS Arena) are saturating as models approach ceiling performance. The emerging trend is content-free telemetry — measuring operators via token counts (input, output, cache-read, cache-write) without reading prompt content. SigRank leads this shift with the Yield metric (Υ = cache_read × output / input²) and ed25519-signed snapshots. Key milestones: the publication of the Conservation Law of Commitment (DOI: 10.5281/zenodo.20029607) and the launch of the SigRank operator leaderboard.",
            "/ai-evaluation-news",
          ),
          faqPage([
            {
              question: "What is the latest trend in AI evaluation?",
              answer:
                "The shift from model benchmarks to operator evaluation. For years, AI evaluation meant model evaluation — MMLU, LMSYS Arena, HumanEval. In 2026, the conversation is expanding to include the operator layer: measuring the humans driving the AI, not just the AI itself. SigRank leads this shift with content-free token telemetry and the Yield metric. The trend reflects a growing recognition that the model is a constant in production and the operator is the variable that determines real-world performance.",
            },
            {
              question: "Why are model benchmarks saturating?",
              answer:
                "Model benchmarks saturate because models improve faster than benchmarks can differentiate them. MMLU scores are clustering near the ceiling for frontier models. LMSYS Arena preference votes are increasingly noisy as models converge in quality. When every frontier model scores 90%+ on a benchmark, the benchmark stops being informative. This is not a failure of the benchmarks — it is a sign of progress. But it means the frontier of AI evaluation is moving from \"which model is best?\" to \"who uses the model best?\" — and that is the operator layer.",
            },
            {
              question: "What is content-free telemetry?",
              answer:
                "Content-free telemetry is the practice of measuring AI usage via token counts only — input, output, cache-read, cache-write — without reading or storing prompt content. It is the privacy-preserving foundation of operator evaluation. SigRank uses content-free telemetry to compute the Yield metric (Υ = cache_read × output / input²) and rank operators. Snapshots are ed25519-signed and verified server-side, so the data is trustworthy without being readable. Content-free telemetry is the trend that makes operator evaluation possible without compromising privacy.",
            },
            {
              question: "What should I watch in AI evaluation in 2026?",
              answer:
                "Three things. First, the continued saturation of model benchmarks and the corresponding rise of operator evaluation. Second, the adoption of content-free telemetry as a privacy standard — token counts, not prompt content, as the basis for AI usage measurement. Third, the integration of operator evaluation into governance frameworks like NIST AI RMF, where the \"Measure\" function requires auditable, provenance-backed evaluation. SigRank is positioned at the intersection of all three trends.",
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ News & Trends"
        terminalText="NEWS"
        title="AI Evaluation News and Trends — 2026"
        subtitle={
          <>
            The shift from model benchmarks to operator evaluation. Model
            benchmarks are saturating; the{" "}
            <span className="text-gold">operator layer</span> is emerging as
            the frontier of AI evaluation. Trends, milestones, and what to
            watch.
          </>
        }
      />

      {/* ── The shift ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The shift from models to operators
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          For years, AI evaluation meant model evaluation. MMLU, LMSYS
          Chatbot Arena, HumanEval, SWE-bench — the conversation was about
          which model scores highest. In 2026, that conversation is expanding.
          The frontier of AI evaluation is moving from &ldquo;which model is
          best?&rdquo; to &ldquo;who uses the model best?&rdquo; — and that is
          the operator layer. The shift reflects a growing recognition that in
          production the model is a constant and the operator is the variable.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank leads this shift. Four token pillars — input, output,
          cache-read, cache-write — captured on-device from real sessions. The
          yield metric{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            Υ = cache_read × output / input²
          </code>{" "}
          measures cascade architecture. Snapshots are ed25519-signed and
          verified server-side. No prompt content is ever read. It is operator
          evaluation built on content-free telemetry — the trend that defines
          the next phase of AI evaluation.
        </p>
      </section>

      {/* ── Why benchmarks are saturating ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why model benchmarks are saturating
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Model benchmarks saturate because models improve faster than
          benchmarks can differentiate them. MMLU scores are clustering near
          the ceiling for frontier models. LMSYS Arena preference votes are
          increasingly noisy as models converge in quality. When every
          frontier model scores 90%+ on a benchmark, the benchmark stops being
          informative. This is not a failure — it is a sign of progress. But
          it means the informative question is no longer &ldquo;which model is
          best?&rdquo; but &ldquo;who is best at using the model?&rdquo;
        </p>
      </section>

      {/* ── Milestones ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Key milestones
        </h2>
        <ul className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">
              The Conservation Law of Commitment.
            </strong>{" "}
            A published conservation law for language under compression
            (DOI: 10.5281/zenodo.20029607), with an empirical record and a
            public transformation harness. The theoretical foundation for
            operator evaluation.
          </li>
          <li>
            <strong className="text-text-primary">
              The SigRank operator leaderboard.
            </strong>{" "}
            A public, continuously-updated ranking of AI operators by Yield,
            built from ed25519-signed token telemetry across 15+ platforms.
            The first operator leaderboard.
          </li>
          <li>
            <strong className="text-text-primary">
              Content-free telemetry as a standard.
            </strong>{" "}
            The practice of measuring AI usage via token counts only — never
            prompt content — is emerging as the privacy standard for operator
            evaluation. ed25519-signed snapshots provide provenance without
            readability.
          </li>
        </ul>
      </section>

      {/* ── What to watch ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What to watch in 2026
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Three trends to track. First, the continued saturation of model
          benchmarks and the rise of operator evaluation as the new frontier.
          Second, the adoption of content-free telemetry as a privacy standard
          — token counts, not prompt content, as the basis for AI usage
          measurement. Third, the integration of operator evaluation into
          governance frameworks like NIST AI RMF, where the
          &ldquo;Measure&rdquo; function requires auditable,
          provenance-backed evaluation. SigRank sits at the intersection of
          all three.
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
              What is the latest trend in AI evaluation?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The shift from model benchmarks to operator evaluation. Model
              benchmarks saturate as models converge. The frontier is moving
              to &ldquo;who uses the model best?&rdquo; — the operator layer.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Why are benchmarks saturating?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Models improve faster than benchmarks differentiate them. MMLU
              scores cluster near the ceiling; Arena votes get noisy. When
              every model scores 90%+, the benchmark stops being informative.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is content-free telemetry?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Measuring AI usage via token counts only — input, output,
              cache-read, cache-write — without reading prompt content. The
              privacy-preserving foundation of operator evaluation. ed25519
              signatures provide provenance without readability.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What should I watch in 2026?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Three trends: model benchmark saturation and the rise of
              operator evaluation, content-free telemetry as a privacy
              standard, and operator evaluation entering governance frameworks
              like NIST AI RMF.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
