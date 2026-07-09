/**
 * app/metrics/signal-to-noise-ratio/page.tsx — "Signal-to-Noise Ratio (SNR)"
 *
 * Defines SNR: the fraction of total tokens that are signal (cached + output)
 * versus noise (fresh input that doesn't compound). Connects to the Conservation
 * Law of Commitment.
 *
 * JSON-LD: breadcrumb + definedTerm + faqPage.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Signal-to-Noise Ratio (SNR) — Signal Density",
  description:
    "Signal-to-noise ratio (SNR) measures signal density in AI coding. Learn what signal vs noise means, why SNR matters, and its link to the Conservation Law.",
  path: "/metrics/signal-to-noise-ratio",
});

export default function SignalToNoiseRatioPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Metrics", path: "/metrics" },
            {
              name: "Signal-to-Noise Ratio",
              path: "/metrics/signal-to-noise-ratio",
            },
          ]),
          definedTerm(
            "Signal-to-Noise Ratio (SNR)",
            "SNR = signal_tokens / total_tokens. The fraction of an operator's total token flow that is signal (cached context reused + output generated) versus noise (fresh input that does not compound). High SNR means most of your token budget is productive; low SNR means most of it is spent re-establishing context from scratch.",
            "/metrics/signal-to-noise-ratio",
          ),
          faqPage([
            {
              question: "What is signal-to-noise ratio in AI coding?",
              answer:
                "SNR = signal_tokens / total_tokens, where signal tokens are cached context reused (cache_read) plus output generated, and total tokens are all tokens processed. High SNR means most of your token budget is productive signal; low SNR means most of it is noise — fresh input that does not compound.",
            },
            {
              question: "What counts as signal vs noise in AI coding?",
              answer:
                "Signal tokens are cached context reused from prior turns (cache_read) and output tokens the model generates. Noise tokens are fresh input that does not compound — re-explained context, redundant instructions, pasted code already in cache. Signal accumulates; noise evaporates.",
            },
            {
              question:
                "How does SNR relate to the Conservation Law of Commitment?",
              answer:
                "The Conservation Law of Commitment states that commitment content survives transformation only with an enforcement gate. In token-cascade terms, signal (the commitment content of your context) survives across turns only when you maintain a stable, structured context — the enforcement gate is your context discipline. Without it, signal decays into noise with each transformation.",
            },
            {
              question: "How do I increase my signal-to-noise ratio?",
              answer:
                "Increase signal by maximizing cache reuse (stable context, structured prefixes) and requesting substantive output. Decrease noise by trimming fresh input, avoiding re-pasted context, and building on prior turns instead of restarting. The highest-leverage move is conversation continuity — every turn that reuses cache adds signal without adding noise.",
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Signal Density"
        terminalText="SNR"
        title="Signal-to-Noise Ratio (SNR)"
        subtitle={
          <>
            The fraction of your token flow that is{" "}
            <span className="text-gold">signal</span> versus noise. High SNR
            means your context is compounding, not evaporating.
          </>
        }
      />

      {/* ── The formula ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The SNR formula
        </h2>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-6">
          <p className="text-center font-mono text-2xl text-gold">
            SNR = signal_tokens / total_tokens
          </p>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Where <strong className="text-text-primary">signal_tokens</strong> ={" "}
          cache_read + output (tokens that compound — reused context plus
          generated output), and{" "}
          <strong className="text-text-primary">total_tokens</strong> = input +
          cache_read + cache_write + output (all tokens processed in the
          cascade). The ratio ranges from 0 to 1. An SNR of 0.8 means 80% of
          your token flow is signal; an SNR of 0.2 means 80% is noise.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The intuition is simple:{" "}
          <strong className="text-text-primary">signal accumulates</strong>{" "}
          (cached context carries forward, output builds on prior output), while{" "}
          <strong className="text-text-primary">noise evaporates</strong> (fresh
          input is processed once and, if not cached, never compounds). SNR
          measures the balance between the two.
        </p>
      </section>

      {/* ── Signal vs noise ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What signal vs noise means in AI coding
        </h2>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-gold">
            Signal tokens
          </p>
          <ul className="mt-2 flex flex-col gap-1.5 font-sans text-sm leading-relaxed text-text-secondary">
            <li>
              <strong className="text-text-primary">cache_read</strong> — cached
              context reused from prior turns. This is signal you already paid
              for, now compounding for free.
            </li>
            <li>
              <strong className="text-text-primary">output</strong> — tokens the
              model generates. Productive work that becomes the basis for future
              turns.
            </li>
          </ul>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">
            Noise tokens
          </p>
          <ul className="mt-2 flex flex-col gap-1.5 font-sans text-sm leading-relaxed text-text-secondary">
            <li>
              <strong className="text-text-primary">fresh input</strong> —
              tokens you send that don&rsquo;t get cached or don&rsquo;t build
              on prior context. Re-explained context, redundant instructions,
              pasted code that&rsquo;s already in the window.
            </li>
            <li>
              <strong className="text-text-primary">cache_write</strong> —
              tokens written to cache that are never read back. An investment
              that didn&rsquo;t pay off because the session ended or the context
              was abandoned.
            </li>
          </ul>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The distinction is not about content quality — it&rsquo;s about
          whether tokens <em>compound</em>. A brilliantly written prompt that
          gets sent once and never cached is noise. A mediocre cached prefix
          that gets reused 50 times is signal. SNR measures the architecture of
          accumulation, not the brilliance of any individual turn.
        </p>
      </section>

      {/* ── Why high SNR matters ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why high SNR matters
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          High SNR means your token budget is being spent productively. Most of
          what you process is either reused context (free signal) or generated
          output (new signal). Little is wasted on re-establishing baseline
          context. This is the signature of an operator who maintains a stable,
          structured context across turns — the cascade is a flywheel, not a
          restart loop.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Low SNR means most of your token flow is noise. You&rsquo;re spending
          the bulk of your budget on fresh input that doesn&rsquo;t compound —
          re-pasting files, re-explaining project structure, re-establishing
          conventions. Every turn starts from near-zero. The model processes
          your input, gives a response, and the context evaporates.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SNR is also a cost and latency indicator. High-SNR sessions process
          more tokens from cache (which is cheaper and faster) and fewer from
          fresh input (which is expensive and slow). Low-SNR sessions are the
          opposite — you pay full price on every turn.
        </p>
      </section>

      {/* ── How to increase signal density ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How to increase signal density
        </h2>
        <ul className="flex flex-col gap-3 font-sans text-sm leading-relaxed text-text-secondary">
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">
              1. Maintain conversation continuity.
            </strong>{" "}
            The single highest-leverage move. Every turn that reuses cached
            context adds signal without adding noise. Don&rsquo;t restart
            sessions unnecessarily — the cached prefix from turn 5 is free
            signal on turn 50.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">
              2. Use stable, structured prefixes.
            </strong>{" "}
            Put project conventions, file layout, and coding standards at the
            top of your context — in a consistent order. Stable prefixes get
            cached; chaotic, re-ordered context breaks the cache and forces
            fresh processing.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">
              3. Reference instead of re-pasting.
            </strong>{" "}
            If the model already has a file in context, reference it by name
            rather than pasting its contents again. &ldquo;Add tests to the auth
            module we discussed&rdquo; is signal; re-pasting auth.ts is noise.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">
              4. Request substantive output.
            </strong>{" "}
            More output tokens means more signal in the numerator. Ask for
            complete deliverables — functions, modules, test suites — rather
            than one-line answers. Output compounds: today&rsquo;s generated
            code becomes tomorrow&rsquo;s cached context.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">
              5. Avoid context-switching mid-session.
            </strong>{" "}
            Jumping between unrelated tasks in one session dilutes the cache.
            Each topic switch forces fresh input to establish new context. Group
            related work into focused sessions where the cache stays relevant.
          </li>
        </ul>
      </section>

      {/* ── Conservation Law connection ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Relationship to the Conservation Law of Commitment
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The Conservation Law of Commitment states that{" "}
          <strong className="text-text-primary">
            C(T(S)) &asymp; C(S) with enforcement
          </strong>{" "}
          — commitment content survives transformation only when an enforcement
          gate is present in the pipeline. Without the gate, commitment decays:{" "}
          <strong className="text-text-primary">C(T(S)) &lt; C(S)</strong>.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          In token-cascade terms, the &ldquo;commitment content&rdquo; of your
          context is the <strong className="text-text-primary">signal</strong> —
          the accumulated understanding, conventions, and code that should
          survive across turns. The &ldquo;enforcement gate&rdquo; is your{" "}
          <strong className="text-text-primary">context discipline</strong>:
          stable prefixes, conversation continuity, structured prompts. With
          discipline, signal survives transformation (each new turn) and
          compounds. Without it, signal decays into noise — you re-explain,
          re-paste, and re-establish context every turn.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          High SNR is the empirical signature of the conservation law holding:
          the enforcement gate (your context discipline) is present, and signal
          survives. Low SNR is the signature of the law failing: no gate, signal
          decays, noise dominates. The law is published under CC-BY-4.0 (
          <a
            href="https://doi.org/10.5281/zenodo.20029607"
            className="text-gold underline underline-offset-2"
            rel="external"
          >
            DOI: 10.5281/zenodo.20029607
          </a>
          ).
        </p>
      </section>

      {/* ── FAQ ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">FAQ</h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is signal-to-noise ratio in AI coding?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              SNR = signal_tokens / total_tokens, where signal is cached context
              reused plus output generated, and total is all tokens processed.
              High SNR means most of your token budget is productive signal; low
              SNR means most is noise — fresh input that does not compound.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What counts as signal vs noise in AI coding?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Signal tokens are cache_read (reused context) and output
              (generated work). Noise tokens are fresh input that doesn&rsquo;t
              compound and cache_write that&rsquo;s never read back. Signal
              accumulates; noise evaporates. The distinction is about
              compounding, not content quality.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How does SNR relate to the Conservation Law of Commitment?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The Conservation Law states commitment content survives
              transformation only with an enforcement gate. In token-cascade
              terms, signal survives across turns only when you maintain stable,
              structured context — the gate is your context discipline. Without
              it, signal decays into noise. High SNR is the empirical signature
              of the law holding.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I increase my signal-to-noise ratio?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Increase signal by maximizing cache reuse and requesting
              substantive output. Decrease noise by trimming fresh input and
              avoiding re-pasted context. The highest-leverage move is
              conversation continuity — every turn that reuses cache adds signal
              without adding noise.
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/metrics/cache-hit-rate"
            className="text-gold underline underline-offset-2"
          >
            Cache Hit Rate
          </Link>
          {" · "}
          <Link
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            Yield (Υ)
          </Link>
          {" · "}
          <Link
            href="/science"
            className="text-gold underline underline-offset-2"
          >
            Conservation Law of Commitment
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
