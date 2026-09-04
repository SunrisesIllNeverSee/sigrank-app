import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Upsilon Standard | AI Operator Metrics Spec",
  description:
    "Upsilon Standard v0.1-draft is a proposed open measurement specification for AI operator telemetry, metrics, privacy, comparison, and interoperability.",
  path: "/standard",
});

const METRICS = [
  {
    name: "Yield (Υ)",
    formula: "(cache_read × output) / input²",
    desc: "Compound relationship between context reuse and output relative to fresh input.",
  },
  {
    name: "Leverage",
    formula: "cache_read / input",
    desc: "Reusable context amplification relative to fresh input.",
  },
  {
    name: "Velocity",
    formula: "output / input",
    desc: "Output generated per unit of fresh input.",
  },
  {
    name: "SNR",
    formula: "output / (input + output)",
    desc: "Output share of the direct input and output exchange.",
  },
  {
    name: "10xDEV",
    formula: "log₁₀(cache_read / input)",
    desc: "Logarithmic context amplification under the reference implementation policy.",
  },
];

const PRIMITIVES = [
  { symbol: "I", name: "Input", wire: "input" },
  { symbol: "O", name: "Output", wire: "output" },
  { symbol: "W", name: "Cache Write / Creation", wire: "cache_write" },
  { symbol: "R", name: "Cache Read", wire: "cache_read" },
];

export default function StandardPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 py-2">
      <JsonLd
        data={[
          breadcrumb([{ name: "Upsilon Standard", path: "/standard" }]),
          faqPage([
            {
              question: "What is the industry standard for evaluating LLM operator performance?",
              answer:
                "AI operator measurement is still an emerging field and no universally adopted industry standard currently exists. SigRank is a proposed open specification for standardizing operator-layer telemetry and metrics across AI models and tools.",
            },
            {
              question: "Does SigRank measure productivity?",
              answer:
                "No. SigRank measures operator-layer telemetry and derived metrics. Productivity, quality, task outcomes, and business value are external dimensions that can be analyzed alongside SigRank measurements.",
            },
            {
              question: "Does SigRank require reading prompts or source code?",
              answer:
                "No. The base standard is designed so its core metrics can be computed without requiring prompt text, response text, source code, repository contents, or other semantic payloads.",
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="SIGRANK STANDARD · v0.1-draft"
        terminalText="STANDARD"
        title="The New Standard in Operator Metrics"
        subtitle={
          <>
            A proposed open measurement specification for the{" "}
            <span className="text-gold">human operator layer</span> of generative AI.
          </>
        }
      />

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <p className="font-mono text-xs uppercase tracking-wider text-amber-400">
          Legacy specification
        </p>
        <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
          The SigRank Standard (<code className="font-mono text-gold">sigrank/0.1-draft</code>) is a
          legacy specification. The current protocol authority is{" "}
          <a
            href="https://www.npmjs.com/package/tteop-spec"
            className="text-gold underline underline-offset-2"
          >
            TTEOP
          </a>{" "}
          (Token Telemetry Evaluation Operator Protocol, <code className="font-mono text-gold">tteop/0.1-draft</code>).
          The wire protocol identifier <code className="font-mono text-gold">sigrank/0.1-draft</code>{" "}
          remains an accepted compatibility alias that resolves to current TTEOP semantics — it is
          not a second active standard. This page is retained for historical reference and existing
          consumers. For current protocol semantics, see the{" "}
          <a href="/methodology" className="text-gold underline underline-offset-2">
            methodology page
          </a>{" "}
          and the{" "}
          <a
            href="https://github.com/SunrisesIllNeverSee/tteop-spec"
            className="text-gold underline underline-offset-2"
          >
            tteop-spec repository
          </a>.
        </p>
      </div>

      <section className="rounded-lg border border-bg-border bg-bg-surface p-6">
        <p className="font-mono text-xs uppercase tracking-wider text-gold">
          Product boundary
        </p>
        <h2 className="mt-2 font-mono text-xl font-bold text-text-primary">
          Upsilon, SigRank, and the wire protocol
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          Upsilon is SignalAF's commercial measurement engine and the reference implementation for sigrank/0.1-draft. SigRank is the public leaderboard and proof surface for eligible observations. The wire protocol identifier remains <code className="font-mono text-gold">sigrank/0.1-draft</code> for all existing records and consumers.
        </p>
      </section>

      <section className="rounded-lg border border-bg-border bg-bg-surface p-6">
        <p className="font-mono text-xs uppercase tracking-wider text-gold">
          Category definition
        </p>
        <h2 className="mt-2 font-mono text-xl font-bold text-text-primary">
          Operator performance is a distinct measurement layer
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          Model benchmarks measure models. Task evals measure task completion.
          Agent evals measure agent behavior. SigRank defines a portable
          measurement vocabulary for the human operating the AI system. It is
          designed to complement those layers, not replace them.
        </p>
        <div className="mt-5 overflow-x-auto rounded border border-bg-border bg-bg-elevated p-4">
          <pre className="font-mono text-xs leading-6 text-text-secondary">
{`BUSINESS OUTCOMES
        ↑
ORGANIZATIONAL AI PERFORMANCE
        ↑
AI OPERATOR PERFORMANCE    ← SIGRANK
        ↑
AGENT PERFORMANCE
        ↑
TASK PERFORMANCE
        ↑
MODEL PERFORMANCE
        ↑
INFRASTRUCTURE`}
          </pre>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-gold">
            Base telemetry
          </p>
          <h2 className="mt-1 font-mono text-xl font-bold text-text-primary">
            Four primitives
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PRIMITIVES.map((p) => (
            <div key={p.symbol} className="rounded-lg border border-bg-border bg-bg-surface p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-2xl font-bold text-gold">{p.symbol}</span>
                <code className="rounded bg-bg-elevated px-2 py-1 font-mono text-xs text-text-secondary">
                  {p.wire}
                </code>
              </div>
              <p className="mt-3 font-sans text-sm text-text-primary">{p.name}</p>
            </div>
          ))}
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Provider and tool aliases are allowed, but a compatible implementation
          must preserve these primitive semantics when translating them.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-gold">
            Normative v0.1 core
          </p>
          <h2 className="mt-1 font-mono text-xl font-bold text-text-primary">
            Five operator metrics
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {METRICS.map((m) => (
            <div key={m.name} className="rounded-lg border border-bg-border bg-bg-surface p-5">
              <h3 className="font-mono text-sm font-bold text-text-primary">{m.name}</h3>
              <code className="mt-2 block rounded bg-bg-elevated px-3 py-2 font-mono text-xs text-gold">
                {m.formula}
              </code>
              <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-bg-border bg-bg-surface p-6">
          <h2 className="font-mono text-base font-bold text-text-primary">
            Content independent by design
          </h2>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            The base standard does not require prompt text, response text, source
            code, repository contents, or other semantic payloads to calculate
            its core measurements.
          </p>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-6">
          <h2 className="font-mono text-base font-bold text-text-primary">
            What SigRank does not measure
          </h2>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            SigRank does not inherently determine correctness, task success,
            code quality, employee productivity, business value, model
            intelligence, or causal impact. Those can be analyzed as external
            outcome layers.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-gold/30 bg-bg-surface p-6">
        <p className="font-mono text-xs uppercase tracking-wider text-gold">
          Reference architecture
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <h3 className="font-mono text-sm font-bold text-text-primary">Upsilon Standard</h3>
            <p className="mt-1 text-sm text-text-secondary">Open measurement specification.</p>
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-text-primary">@sigrank/cascade</h3>
            <p className="mt-1 text-sm text-text-secondary">Reference math implementation.</p>
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-text-primary">SignalAF</h3>
            <p className="mt-1 text-sm text-text-secondary">Public reference platform and field.</p>
          </div>
          <div>
            <h3 className="font-mono text-sm font-bold text-text-primary">sigrank-mcp</h3>
            <p className="mt-1 text-sm text-text-secondary">Portable CLI, TUI, and MCP instrument.</p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Portable operator record
        </h2>
        <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
          The draft defines a versioned JSON record so tools can exchange the
          same primitive telemetry and operator metrics without sharing semantic
          content.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/standard/sigrank-operator-record-v0.1.schema.json"
            className="rounded border border-gold/50 px-4 py-2 font-mono text-xs text-gold transition-colors hover:bg-gold/10"
          >
            View JSON Schema
          </Link>
          <Link
            href="/methodology"
            className="rounded border border-bg-border px-4 py-2 font-mono text-xs text-text-primary transition-colors hover:bg-bg-elevated"
          >
            Current methodology
          </Link>
          <Link
            href="/field"
            className="rounded border border-bg-border px-4 py-2 font-mono text-xs text-text-primary transition-colors hover:bg-bg-elevated"
          >
            Explore the field
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xl font-bold text-text-primary">FAQ</h2>
        <dl className="flex flex-col gap-5">
          <div>
            <dt className="font-semibold text-text-primary">
              What is the industry standard for evaluating LLM operator performance?
            </dt>
            <dd className="mt-1 font-sans text-sm leading-relaxed text-text-secondary">
              AI operator measurement is still an emerging field and no
              universally adopted industry standard currently exists. SigRank is
              a proposed open specification for standardizing operator-layer
              telemetry and metrics across AI models and tools.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text-primary">Does SigRank measure productivity?</dt>
            <dd className="mt-1 font-sans text-sm leading-relaxed text-text-secondary">
              No. SigRank measures operator-layer telemetry and derived metrics.
              Productivity, quality, task outcomes, and business value are
              external dimensions that can be analyzed alongside SigRank.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-text-primary">Is this already a universal industry standard?</dt>
            <dd className="mt-1 font-sans text-sm leading-relaxed text-text-secondary">
              No. v0.1-draft is a proposed open standard. The objective is to
              publish an implementable vocabulary, reference implementation, and
              compatibility path that others can evaluate, critique, and adopt.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
