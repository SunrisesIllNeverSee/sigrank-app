/**
 * app/metrics/signal-to-noise-ratio/page.tsx — "Signal-to-Noise Ratio (SNR)"
 *
 * Defines SNR: output / (input + output) — the share of fresh conversational
 * traffic represented by model output. A bounded (0-1) view of Velocity.
 * Connects to the Conservation Law of Commitment.
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
    "SNR = output / (input + output) — the share of fresh conversational traffic represented by model output. A bounded view of Velocity. Learn what signal vs noise means and its link to the Conservation Law.",
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
            "SNR = output / (input + output). The share of fresh conversational traffic represented by model output. A bounded (0-1) view of Velocity: S = V/(1+V). High SNR means most of your fresh traffic is output; low SNR means most is input. SNR measures the compression/transmission structure, not the semantic quality of the output.",
            "/metrics/signal-to-noise-ratio",
          ),
          faqPage([
            {
              question: "What is signal-to-noise ratio in AI coding?",
              answer:
                "SNR = output / (input + output). It measures the share of fresh conversational traffic represented by model output. High SNR means most of your fresh traffic is output; low SNR means most is input. It is a bounded (0-1) view of Velocity: S = V/(1+V). SNR measures the compression/transmission structure, not the semantic quality of the output.",
            },
            {
              question: "What counts as signal vs noise in AI coding?",
              answer:
                "In SigRank, signal is model output and noise is fresh input. Output is the work the model generates for you; input is the fresh context you provide. SNR measures what fraction of the fresh traffic (input + output) is actually output. It does not independently judge the semantic quality of that output — a brilliant response and a mediocre one both count as signal. The distinction is about transmission structure, not content quality.",
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
            The share of fresh conversational traffic that is{" "}
            <span className="text-gold">output</span> versus input. A bounded
            view of Velocity.
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
            SNR = output / (input + output)
          </p>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Where <strong className="text-text-primary">output</strong> is tokens
          the model generates and{" "}
          <strong className="text-text-primary">input</strong> is fresh context
          you provide. The ratio ranges from 0 to 1. An SNR of 0.8 means 80% of
          your fresh conversational traffic is model output; an SNR of 0.2 means
          80% is fresh input.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SNR is a bounded transformation of Velocity (V = output / input). The
          relationship is exact:{" "}
          <strong className="text-text-primary">S = V / (1 + V)</strong>. This
          places the unbounded velocity ratio onto a 0-1 scale, making it easier
          to compare, threshold, and visualize. SNR does not independently judge
          the semantic quality of the output — it measures transmission
          structure, not content quality.
        </p>
      </section>

      {/* ── Signal vs noise ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What signal vs noise means in AI coding
        </h2>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-gold">
            Signal (output)
          </p>
          <ul className="mt-2 flex flex-col gap-1.5 font-sans text-sm leading-relaxed text-text-secondary">
            <li>
              <strong className="text-text-primary">output</strong> — tokens the
              model generates in response to your input. This is the productive
              work: code, explanations, analysis, refactors. Output is what you
              want from the interaction.
            </li>
          </ul>
        </div>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">
            Noise (input)
          </p>
          <ul className="mt-2 flex flex-col gap-1.5 font-sans text-sm leading-relaxed text-text-secondary">
            <li>
              <strong className="text-text-primary">fresh input</strong> —
              tokens you send to the model: prompts, instructions, pasted code,
              context. Input is necessary but not the goal. High input relative
              to output means you&rsquo;re spending more than you&rsquo;re
              getting.
            </li>
          </ul>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The distinction is not about content quality — it&rsquo;s about
          transmission structure. A brilliant prompt and a redundant one both
          count as input. A correct response and an incorrect one both count as
          output. SNR measures what fraction of the fresh traffic is output, not
          whether that output is good. Quality is a separate question that
          requires external evaluation.
        </p>
      </section>

      {/* ── Why high SNR matters ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why high SNR matters
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          High SNR means most of your fresh conversational traffic is output.
          You send relatively little input and get relatively much output back.
          This is the signature of an operator who writes efficient prompts —
          concise instructions that produce substantial responses.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Low SNR means most of your fresh traffic is input. You&rsquo;re
          sending large prompts, pasting extensive context, or re-explaining
          things — and getting relatively little output back. The model
          processes your input, gives a short response, and you need to send
          more input to continue.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SNR is also a cost indicator. Output tokens are typically more
          expensive than input tokens, but high SNR means you&rsquo;re getting
          more value per token of input you provide. Low SNR means
          you&rsquo;re paying for input that doesn&rsquo;t produce proportional
          output.
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
              SNR = output / (input + output). It measures the share of fresh
              conversational traffic represented by model output. High SNR
              means most of your fresh traffic is output; low SNR means most is
              input. It is a bounded view of Velocity: S = V/(1+V).
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What counts as signal vs noise in AI coding?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Signal is model output; noise is fresh input. SNR measures what
              fraction of the fresh traffic (input + output) is output. It does
              not independently judge the semantic quality of the output — a
              brilliant response and a mediocre one both count as signal. The
              distinction is about transmission structure, not content quality.
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
