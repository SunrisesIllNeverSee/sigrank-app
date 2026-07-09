/**
 * app/guides/how-to-measure-ai-coding-efficiency/page.tsx
 *
 * SEO guide targeting "how to measure ai coding efficiency" and
 * "ai coding metrics guide". Explains why time-based metrics fail for
 * AI-assisted coding, introduces the four token pillars and the Υ Yield
 * metric, and walks through a step-by-step setup with ccusage + sigrank.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "How to Measure AI Coding Efficiency",
  description:
    "A step-by-step guide to measuring AI coding efficiency with the four token pillars and \u03A5 Yield. Learn why time-based metrics fail and how to compute yield.",
  path: "/guides/how-to-measure-ai-coding-efficiency",
});

const howTo = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to measure AI coding efficiency",
  description:
    "Measure your AI coding efficiency using the four token pillars and the Υ Yield metric with ccusage and sigrank. A privacy-preserving, on-device workflow.",
  totalTime: "PT10M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Install the sigrank CLI",
      text: "Run `npm install -g sigrank` (or `npx sigrank` without installing). This bundles ccusage, tokscale, and token-dashboard for local log parsing.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Enroll your operator identity",
      text: "Run `sigrank enroll` to generate an ed25519 keypair. This signs your submissions so the leaderboard can verify they came from you.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Read your token cascade locally",
      text: "Run `sigrank me` (or `ccusage --json`) to read your local session logs and count the four token pillars: input, output, cache-read, cache-write.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Compute your Υ Yield",
      text: "Yield is computed as (cache_read × output) / input². sigrank computes this automatically. You can also paste your stats into the /score calculator for an instant read.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Submit a signed snapshot",
      text: "Run `sigrank submit` to publish your four token pillars (signed, no prompt content) to the SigRank leaderboard. The server re-scores authoritatively and assigns your class tier.",
    },
  ],
};

export default function HowToMeasureAICodingEfficiencyPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Guides", path: "/guides" },
            {
              name: "Measure AI Coding Efficiency",
              path: "/guides/how-to-measure-ai-coding-efficiency",
            },
          ]),
          faqPage([
            {
              question: "Why do time-based metrics fail for AI coding?",
              answer:
                "Time-based metrics (hours logged, commits per hour) measure the human clock, not the AI token cascade. A 10-minute session with excellent cache reuse can outproduce a 4-hour session that burns fresh input tokens. Yield (Υ) measures the architecture of the cascade — whether signal compounds or tokens are burned — independent of wall-clock time.",
            },
            {
              question: "What are the four token pillars?",
              answer:
                "The four token pillars are input (tokens you send), output (tokens the model generates), cache-read (cached tokens reused from prior context), and cache-write (new tokens written to cache for future reuse). Together they describe the full token cascade of an AI coding session.",
            },
            {
              question: "How is Υ Yield computed?",
              answer:
                "Yield (Υ) = (cache_read × output) / input². It rewards operators who reuse cached context (high cache-read) and produce high output per unit of fresh input. A high yield means signal is compounding; a low yield means tokens are being burned.",
            },
            {
              question: "Does sigrank read my prompt content?",
              answer:
                "No. The on-device scanner reads token counts only — never the words of your prompts or the content of your replies. Only the four integers (input, output, cache-read, cache-write) leave your machine, signed with ed25519.",
            },
            {
              question: "What tools do I need to measure AI coding efficiency?",
              answer:
                "Install the sigrank CLI (npm: sigrank), which bundles ccusage for local Claude Code log parsing, tokscale for token scaling, and token-dashboard for visualization. Alternatively, use `npx sigrank` without a global install, or paste your ccusage JSON into the /score calculator.",
            },
          ]),
          howTo,
        ]}
      />

      <WaveHero
        eyebrow="◈ Guide"
        title="How to Measure AI Coding Efficiency"
        subtitle={
          <>
            Time-based metrics measure the clock, not the cascade. Here&rsquo;s
            how to measure what actually matters: the{" "}
            <span className="text-gold">four token pillars</span> and your{" "}
            <span className="text-gold">Υ Yield</span>.
          </>
        }
      />

      {/* ── Why time-based metrics fail ─────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Why time-based metrics fail for AI coding
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          For decades, developer productivity was measured in time: hours
          logged, commits per hour, lines per day. Tools like WakaTime built
          entire businesses on the premise that{" "}
          <em>more time at the keyboard equals more output</em>. That model
          breaks the moment an AI agent enters the loop.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          An AI-assisted session doesn&rsquo;t follow the human clock. A
          well-structured 10-minute session with excellent prompt caching can
          produce more useful code than a 4-hour session that re-sends the same
          context from scratch every turn. The human spent less time — but the
          cascade was far more efficient. Time-based metrics reward the slow,
          verbose session and penalize the sharp, cache-rich one. They measure
          the wrong axis entirely.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The right axis is the{" "}
          <strong className="text-text-primary">token cascade</strong>: how
          input, output, cache-read, and cache-write flow through your session.
          That cascade is what SigRank measures — and it&rsquo;s what this guide
          teaches you to measure yourself.
        </p>
      </section>

      {/* ── The four token pillars ──────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          The four token pillars
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Every AI coding session — whether in Claude Code, Cursor, Copilot, or
          Gemini CLI — produces four token counts. These are the only numbers
          you need:
        </p>
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Input</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Fresh tokens you send to the model. Every new instruction, every
              re-pasted file, every prompt that isn&rsquo;t served from cache.
              High input means you&rsquo;re paying full price for context.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Output</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Tokens the model generates back. Code, explanations, diffs. This
              is your gross signal — what you actually got from the session.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Cache-read</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Cached tokens reused from prior context via prompt caching. High
              cache-read means the model already had your context loaded and
              didn&rsquo;t need to re-process it. This is the hallmark of an
              efficient operator.
            </p>
          </div>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">Cache-write</p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              New tokens written to cache for future reuse. An investment: you
              pay now so the next turn is cheaper. High cache-write with rising
              cache-read on subsequent turns is a healthy cascade.
            </p>
          </div>
        </div>
      </section>

      {/* ── How to compute Υ Yield ──────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          How to compute Υ Yield
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The headline metric is{" "}
          <strong className="text-text-primary">Yield (Υ)</strong>:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="text-center font-mono text-base text-gold">
            Υ = (cache_read × output) / input²
          </p>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Yield rewards two things at once:{" "}
          <strong className="text-text-primary">cache reuse</strong> (high
          cache-read means you&rsquo;re not re-sending context) and{" "}
          <strong className="text-text-primary">output efficiency</strong> (high
          output per fresh input means the model is productive, not churning).
          The input term is squared, so burning fresh input tanks your yield
          fast — which is exactly the behavior you want a metric to penalize.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          A yield of 5,000 is solid. 50,000 is excellent. The top operators on
          the SigRank leaderboard push well into six figures. Your class tier
          (IGNITER → SEEKER → BUILDER → TRANSMITTER) is assigned from your yield
          and the cascade shape.
        </p>
      </section>

      {/* ── Tools to use ────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Tools to use
        </h2>
        <ul className="flex flex-col gap-3">
          <li className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-text-primary">
              ccusage
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              A CLI that reads Claude Code token usage from local logs and emits
              the four pillars as JSON. SigRank bundles it — you don&rsquo;t
              need a separate install.
            </p>
          </li>
          <li className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-text-primary">
              sigrank
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              The SigRank CLI. Reads your logs on-device, computes yield + class
              tier, signs the snapshot with ed25519, and submits to the
              leaderboard. Also bundles tokscale and token-dashboard.
            </p>
          </li>
          <li className="rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-text-primary">
              /score calculator
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              A browser-based calculator at{" "}
              <Link
                href="/score"
                className="text-gold underline underline-offset-2"
              >
                /score
              </Link>
              . Paste your ccusage JSON to see yield, class tier, and
              compression ratio instantly — no install required.
            </p>
          </li>
        </ul>
      </section>

      {/* ── Step-by-step setup ──────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Step-by-step setup guide
        </h2>
        <ol className="flex flex-col gap-4">
          <li className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              Step 1 — Install sigrank
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Run{" "}
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
                npm install -g sigrank
              </code>{" "}
              for a global install, or{" "}
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
                npx sigrank
              </code>{" "}
              to run without installing. This gives you ccusage, tokscale, and
              token-dashboard in one binary.
            </p>
          </li>
          <li className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              Step 2 — Enroll your identity
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Run{" "}
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
                sigrank enroll
              </code>
              . This generates an ed25519 keypair on your device. Your private
              key never leaves your machine; your public key is what signs
              submissions server-side.
            </p>
          </li>
          <li className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              Step 3 — Read your cascade
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Run{" "}
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
                sigrank me
              </code>{" "}
              (or{" "}
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
                ccusage --json
              </code>
              ). The scanner reads your local session logs and counts the four
              pillars across 7-day, 30-day, 90-day, and all-time windows. You
              see the full cascade before anything leaves your machine.
            </p>
          </li>
          <li className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              Step 4 — Check your yield
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              sigrank computes Υ Yield automatically. If you want a quick check
              without the CLI, paste your ccusage JSON into the{" "}
              <Link
                href="/score"
                className="text-gold underline underline-offset-2"
              >
                /score
              </Link>{" "}
              calculator. You&rsquo;ll see yield, class tier, and compression
              ratio instantly.
            </p>
          </li>
          <li className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5">
            <p className="font-mono text-sm font-bold text-gold">
              Step 5 — Submit to the board
            </p>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Run{" "}
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
                sigrank submit
              </code>
              . Only the four token integers (signed) are transmitted — never
              your prompts, never your code. The server re-scores
              authoritatively and assigns your class tier. Use{" "}
              <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
                sigrank submit --dry-run
              </code>{" "}
              to inspect the payload before sending.
            </p>
          </li>
        </ol>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          FAQ
        </h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Why do time-based metrics fail for AI coding?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Time-based metrics measure the human clock, not the AI token
              cascade. A 10-minute session with excellent cache reuse can
              outproduce a 4-hour session that burns fresh input tokens. Yield
              measures the cascade architecture, independent of wall-clock time.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What are the four token pillars?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Input (tokens you send), output (tokens the model generates),
              cache-read (cached tokens reused), and cache-write (new tokens
              written to cache). They describe the full token cascade of any AI
              coding session.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How is Υ Yield computed?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Υ = (cache_read × output) / input². It rewards cache reuse and
              output efficiency while penalizing fresh-input burn. High yield
              means signal is compounding; low yield means tokens are being
              burned.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Does sigrank read my prompt content?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              No. The scanner reads token counts only — never the words of your
              prompts or replies. Only the four integers leave your machine,
              signed with ed25519.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What tools do I need?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Install the sigrank CLI (npm: sigrank), which bundles ccusage,
              tokscale, and token-dashboard. Or use `npx sigrank` without a
              global install, or paste your ccusage JSON into the /score
              calculator.
            </dd>
          </div>
        </dl>
      </section>
      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            Yield (Υ)
          </Link>
          {" · "}
          <Link
            href="/tools/yield-calculator"
            className="text-gold underline underline-offset-2"
          >
            Yield Calculator
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
            href="/guides/how-to-track-token-cascade"
            className="text-gold underline underline-offset-2"
          >
            How to Track Your Token Cascade →
          </Link>
        </p>
      </section>
    </div>
  );
}
