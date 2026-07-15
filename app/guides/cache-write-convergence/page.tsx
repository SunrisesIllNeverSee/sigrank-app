/**
 * app/guides/cache-write-convergence/page.tsx
 *
 * Troubleshooting guide: cache_write convergence, operating ratio stress test,
 * the cache_write red herring. Why HCM breaks on ChatGPT operators while
 * AA avg and Codex PU hold.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Cache Write Convergence — Troubleshooting ChatGPT Token Telemetry",
  description:
    "ChatGPT and Codex bundle cache_write into input and report cache_write as zero. This guide explains the discrepancy, how operating ratios split the signal, and why cache_write convergence validates ratio selection.",
  path: "/guides/cache-write-convergence",
});

const howTo = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Validate operating ratio selection using cache_write convergence",
  description:
    "When ChatGPT/Codex reports cache_write as zero, use reference operating ratios to split the combined input. Validate ratio selection by checking the derived cache_write against real operator data.",
  totalTime: "PT15M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Identify the ChatGPT cache_write gap",
      text: "ChatGPT and Codex bundle cache_write into the input field and report cache_creation_input_tokens as zero. If an operator has cache_write = 0 but significant cache_read, they are affected by this gap.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Gather the three real numbers",
      text: "Extract the operator's real output, cache_read, and combined input. These three pillars are reported correctly by ChatGPT. cache_write is the hidden fourth pillar.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Apply each reference operating ratio",
      text: "Run the AA avg (3.5:1:0.5), HCM (20:1:0.1), and Codex PU (243:1:1.03) ratios. Each ratio's velocity term splits combined input into true fresh input and cache_write.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Check cache_write convergence",
      text: "Compare the derived cache_write against real operator data. Real operators produce 270-313M cache_write regardless of leverage level. If a ratio produces cache_write far outside this range, it does not fit.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Select the validated ratio",
      text: "The ratio that produces cache_write within the real range is the correct one. For most ChatGPT operators, AA avg and Codex PU pass. HCM fails on operators with small combined input relative to output.",
    },
  ],
};

export default function CacheWriteConvergencePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Guides", path: "/guides" },
            {
              name: "Cache Write Convergence",
              path: "/guides/cache-write-convergence",
            },
          ]),
          faqPage([
            {
              question:
                "Why does ChatGPT report cache_write as zero?",
              answer:
                "ChatGPT and Codex bundle cache_creation_input_tokens into the input field. The API returns the combined total as input_tokens and reports cache_creation_input_tokens as zero. The cache write happened, it is just not separated out in the summary.",
            },
            {
              question:
                "What is the cache_write red herring?",
              answer:
                "Cache_write is the derived number when re-parsing ChatGPT operators. It is what we solve for using operating ratios. When the derived cache_write matches what real operators produce (270-313M), the ratio fits. When it does not, the ratio is broken. HCM produces 44M cache_write for kr-yeon, 6x below the real range, proving it does not fit.",
            },
            {
              question:
                "Which operating ratio should I use for ChatGPT operators?",
              answer:
                "For most ChatGPT operators, AA avg (3.5:1:0.5) and Codex PU (243:1:1.03) both produce cache_write in the real range. HCM (20:1:0.1) fails on operators with small combined input relative to output because its low velocity forces input to consume most of the combined input, starving cache_write.",
            },
            {
              question:
                "What is the operating ratio?",
              answer:
                "The operating ratio is cache_read : input : output (with input normalized to 1). It is NOT cache_write. cache_write is the derived number we solve for. cache_read is the real number that validates the solution.",
            },
          ]),
          howTo,
        ]}
      />

      <WaveHero
        eyebrow="◈ Troubleshooting Guide"
        title="Cache Write Convergence"
        subtitle={
          <>
            ChatGPT and Codex report{" "}
            <span className="text-gold">cache_write as zero</span>. Here is
            why, how to split the signal, and how to validate which operating
            ratio fits.
          </>
        }
      />

      {/* ── The Problem ─────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          The problem
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          ChatGPT and Codex bundle cache_write into input and report
          cache_write as near-zero. When SigRank seeds a ChatGPT operator,
          their cache_write shows as 0, which flags them as non-compounding,
          nulls their yield, and sorts them to the bottom of the board.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          To fix this, we use reference operating ratios to split the combined
          input into true fresh input and cache_write. Three ratios are used:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="font-mono text-sm text-text-secondary overflow-x-auto">
{`  AA avg:      3.5 : 1 : 0.5    (cache_read : input : output)
  HCM:        20   : 1 : 0.1
  Codex PU:  243   : 1 : 1.03`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The question: which ratio is correct for a given operator? And can we
          use the operator&rsquo;s real cache_read to validate the choice?
        </p>
      </section>

      {/* ── The Method ──────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          The method
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          For a ChatGPT operator, we know three real numbers:
        </p>
        <ul className="flex flex-col gap-2">
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Output</strong> (real,
            reported correctly)
          </li>
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Cache read</strong> (real,
            reported correctly)
          </li>
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">Combined input</strong>{" "}
            (real, but includes hidden cache_write)
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          We use the velocity term (output/input) from each reference ratio to
          solve for input:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="font-mono text-sm text-text-secondary overflow-x-auto">
{`  input = output / velocity
  cache_write = combined_input - input`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Then we compute the operator&rsquo;s actual leverage and yield:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="font-mono text-sm text-text-secondary overflow-x-auto">
{`  leverage = cache_read / input
  velocity = output / input
  yield = leverage x velocity`}
          </pre>
        </div>
      </section>

      {/* ── Case Study: kr-yeon ─────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Case study: kr-yeon
        </h2>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="font-mono text-sm text-text-secondary overflow-x-auto">
{`  Output:           23,655,246    (23.7M)
  Cache read:    5,845,750,656    (5.85B)
  Combined input:   280,931,419   (280.9M)`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Results across three ratios:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5 overflow-x-auto">
          <pre className="font-mono text-xs text-text-secondary">
{`                      ChatGPT       AA avg         HCM       Codex PU
                     (broken)    3.5:1:0.5     20:1:0.1   243:1:1.03
  ─────────────────  ────────────  ────────────  ────────────  ────────────
  Input                280,931,419    47,310,492  236,552,460    22,966,258
  Output                23,655,246    23,655,246   23,655,246    23,655,246
  Cache write                   0   233,620,927   44,378,959   257,965,161
  Cache read          5,845,750,656 5,845,750,656 5,845,750,656 5,845,750,656
  ─────────────────  ────────────  ────────────  ────────────  ────────────
  Velocity                   0.08          0.50         0.10         1.03
  Leverage                 20.8:1       123.6:1       24.7:1      254.5:1
  Yield                     NULL        61.78         2.47       262.17
  Class                    ARCH       SEEKER      IGNITER        POWER
  Rank                    #1514        #242         #706         #137`}
          </pre>
        </div>
      </section>

      {/* ── The Red Herring ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          The red herring: cache write
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Real operator data (1,495 operators with all 4 real pillars) shows
          that cache_write is roughly constant across profiles:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5 overflow-x-auto">
          <pre className="font-mono text-xs text-text-secondary">
{`  HCM operators (leverage 15-25x, n=276):
    avg cache_write:  313.4M
    avg input:      1,501.5M

  PU operators (leverage 200-300x, n=50):
    avg cache_write:  269.3M
    avg input:         37.2M

  Difference in cache_write:  1.2x
  Difference in input:       40.4x`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Now look at what each ratio produces for kr-yeon:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="font-mono text-sm text-text-secondary overflow-x-auto">
{`  AA avg:    233.6M cache_write    (within real range)
  HCM:        44.4M cache_write    (6x below real range)
  Codex PU:  258.0M cache_write    (within real range)`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-gold">
            HCM produces a cache_write number that does not exist in real data.
          </strong>{" "}
          No cohort of operators at any leverage level produces 44M cache_write.
          The HCM ratio is broken for this operator.
        </p>
      </section>

      {/* ── Why HCM Breaks ──────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Why HCM breaks
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          HCM&rsquo;s velocity is 0.1, meaning input = output / 0.1 = 236.6M.
          That consumes 84% of the combined input (280.9M), leaving only 44.4M
          for cache_write.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Real HCM operators have 1,501.5M input. Their combined input is large
          enough that even at 0.1 velocity, there&rsquo;s room for 313M of
          cache_write. kr-yeon&rsquo;s combined input is only 280.9M.
          HCM&rsquo;s velocity assumption eats it alive.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The HCM ratio works on real HCM operators because they have massive
          input. It fails on ChatGPT operators whose combined input is small
          relative to their output, because the low velocity forces input to
          consume nearly all the combined input, starving cache_write.
        </p>
      </section>

      {/* ── Why AA and PU Hold ──────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Why AA avg and Codex PU hold
        </h2>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="font-mono text-sm text-text-secondary overflow-x-auto">
{`  AA avg (velocity 0.5):
    input = 23.7M / 0.5 = 47.3M    (17% of combined)
    cache_write = 233.6M           (matches real data)

  Codex PU (velocity 1.03):
    input = 23.7M / 1.03 = 23.0M   (8% of combined)
    cache_write = 258.0M           (matches real data)`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Both produce cache_write in the 233-258M range, which is consistent
          with what real operators at those leverage levels actually create.
        </p>
      </section>

      {/* ── The Broader Pattern ─────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          The broader pattern
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Cache write is roughly constant across operator profiles (270-313M
          regardless of leverage level). This suggests cache_write is a function
          of total context built, not of input volume or output volume. You
          build a context library, and that library has a size.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Input is the variable that separates profiles. HCM operators use
          1,501.5M input. PU operators use 37.2M input. The difference is 40x.
          PU operators achieve the same or better results with 40x less input
          because they compound more efficiently.
        </p>
      </section>

      {/* ── Implications ────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Implications
        </h2>
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              1. Cache write is the validation signal
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              When re-parsing a ChatGPT operator, check the cache_write produced
              by each ratio against real operator data. If it&rsquo;s far
              outside the 270-313M range, the ratio does not fit.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              2. HCM breaks on low-combined-input operators
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              HCM&rsquo;s velocity of 0.1 forces input to consume most of the
              combined input, producing an impossibly low cache_write. This
              ratio should not be used for ChatGPT operators with small combined
              input relative to output.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              3. AA avg and Codex PU are both viable
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              They produce similar cache_write numbers. The choice between them
              is a velocity question, not a cache question.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              4. The operating ratio is cache_read : input : output
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Not cache_write. cache_write is the derived number we solve for.
              cache_read is the real number that validates the solution.
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          FAQ
        </h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Why does ChatGPT report cache_write as zero?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              ChatGPT and Codex bundle cache_creation_input_tokens into the
              input field. The API returns the combined total as input_tokens
              and reports cache_creation_input_tokens as zero. The cache write
              happened, it is just not separated out in the summary.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is the cache_write red herring?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Cache_write is the derived number when re-parsing ChatGPT
              operators. It is what we solve for using operating ratios. When
              the derived cache_write matches what real operators produce
              (270-313M), the ratio fits. When it does not, the ratio is broken.
              HCM produces 44M cache_write for kr-yeon, 6x below the real range,
              proving it does not fit.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Which operating ratio should I use for ChatGPT operators?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              For most ChatGPT operators, AA avg (3.5:1:0.5) and Codex PU
              (243:1:1.03) both produce cache_write in the real range. HCM
              (20:1:0.1) fails on operators with small combined input relative
              to output because its low velocity forces input to consume most of
              the combined input, starving cache_write.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is the operating ratio?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The operating ratio is cache_read : input : output (with input
              normalized to 1). It is NOT cache_write. cache_write is the derived
              number we solve for. cache_read is the real number that validates
              the solution.
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Methodology Notes ───────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Methodology notes
        </h2>
        <ul className="flex flex-col gap-2">
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            Real operator data: 1,495 operators with all 4 pillars (input,
            output, cache_write, cache_read) reported. These are primarily
            Claude/Anthropic users whose telemetry reports cache_write
            correctly.
          </li>
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            HCM-like: cache_read/input between 15 and 25 (n=276)
          </li>
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            PU-like: cache_read/input between 200 and 300 (n=50)
          </li>
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            AA-like: cache_read/input between 2 and 5 (n=110)
          </li>
          <li className="font-sans text-sm leading-relaxed text-text-secondary">
            kr-yeon: ChatGPT user, cache_write reported as 0, combined input =
            280.9M
          </li>
        </ul>
      </section>

      {/* ── Back link ───────────────────────────────────────────────── */}
      <section className="flex flex-col gap-2">
        <Link
          href="/guides"
          className="font-mono text-sm text-gold underline underline-offset-2"
        >
          ← All guides
        </Link>
        <Link
          href="/blog/volume-isnt-yield"
          className="font-mono text-sm text-gold underline underline-offset-2"
        >
          ← Volume Isn&rsquo;t Yield: The Shape of AI Operators
        </Link>
      </section>
    </div>
  );
}
