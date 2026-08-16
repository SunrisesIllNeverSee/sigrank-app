/**
 * app/token-cascade/page.tsx — "Token Cascade — The Flow of Tokens Through AI
 * Coding Sessions"
 *
 * Definitional page targeting the exact search term "token cascade". Explains
 * what a token cascade is, the four pillars, how it differs from raw token
 * consumption, and why cascade architecture (not volume) determines AI coding
 * efficiency. Links into /token-telemetry, /cascade-analysis, /metrics/yield-cascade,
 * and the comparison pages for token-tracking tools.
 *
 * JSON-LD: breadcrumb() + faqPage() + definedTerm().
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Token Cascade — The Flow of Tokens Through AI Coding Sessions",
  description:
    "A token cascade is the flow of tokens through an AI coding session: input, output, cache-read, cache-write. Cascade architecture — not raw volume — determines AI coding efficiency.",
  path: "/token-cascade",
});

const PILLARS = [
  {
    name: "Input",
    glyph: "→",
    role: "Spend",
    desc: "Fresh tokens you send to the model. Every input token is a cost — the raw spend side of the cascade.",
  },
  {
    name: "Output",
    glyph: "←",
    role: "Return",
    desc: "Tokens the model generates back. The return side — what you actually keep from the exchange.",
  },
  {
    name: "Cache-read",
    glyph: "↻",
    role: "Compounding",
    desc: "Cached tokens reused from prior context via prompt caching. Signal you already paid for, served again for free. The compounding layer of the cascade.",
  },
  {
    name: "Cache-write",
    glyph: "✎",
    role: "Investment",
    desc: "New tokens written to cache for future reuse. An investment in the next turn — you pay now to compound later.",
  },
];

const RELATED = [
  {
    href: "/token-telemetry",
    title: "Token Telemetry",
    desc: "How the four token pillars are captured on-device from real coding sessions — the privacy-preserving data layer that makes the cascade visible.",
  },
  {
    href: "/cascade-analysis",
    title: "Cascade Analysis",
    desc: "The diagnostic patterns: how to read your cascade, spot compounding vs burning, and turn the four pillars into action.",
  },
  {
    href: "/metrics/yield-cascade",
    title: "Yield (Υ) Cascade",
    desc: "The headline metric that summarizes cascade architecture in one number: cache_read × output / input².",
  },
  {
    href: "/metrics/cache-hit-rate",
    title: "Cache Hit Rate",
    desc: "How well you reuse cached context — the difference between a compounding cascade and a hoarding one.",
  },
  {
    href: "/metrics/leverage",
    title: "Leverage",
    desc: "How much cached context amplifies your fresh input — the compounding multiplier of the cascade.",
  },
  {
    href: "/metrics/compression-ratio",
    title: "Compression Ratio",
    desc: "Output over input — whether the model is doing more with your tokens than echoing them back.",
  },
  {
    href: "/guides/how-to-read-your-cascade",
    title: "How to Read Your Cascade",
    desc: "A step-by-step guide to interpreting your four token pillars and spotting diagnostic patterns.",
  },
  {
    href: "/guides/how-to-track-token-cascade",
    title: "How to Track Your Token Cascade",
    desc: "A step-by-step guide to capturing the four pillars from your AI coding sessions.",
  },
  {
    href: "/tools/cascade-comparator",
    title: "Cascade Comparator",
    desc: "Compare two operators' token cascades side by side — see where the yield gap comes from.",
  },
  {
    href: "/blog/token-cascade-vs-raw-token-consumption",
    title: "Token Yield vs Token Count",
    desc: "Why cascade architecture — not raw token volume — measures AI operator skill.",
  },
];

export default function TokenCascadePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([{ name: "Token Cascade", path: "/token-cascade" }]),
          faqPage([
            {
              question: "What is a token cascade?",
              answer:
                "A token cascade is the flow of tokens through an AI coding session. Every turn moves tokens through four stages: fresh input you send to the model, output the model generates back, cache-read tokens reused from prior context via prompt caching, and cache-write tokens written to cache for future reuse. The cascade is the full picture of how tokens enter, circulate, and leave a session.",
            },
            {
              question: "What are the four pillars of a token cascade?",
              answer:
                "The four pillars are input (fresh tokens sent to the model), output (tokens the model generates back), cache-read (cached tokens reused from prior context), and cache-write (new tokens written to cache for future reuse). Together they describe the full flow of tokens through an AI coding session.",
            },
            {
              question: "Why is token cascade architecture more important than raw token volume?",
              answer:
                "Raw token volume tells you how much you spent. Cascade architecture tells you whether that spend compounded or burned. Two operators can consume the same number of tokens and get wildly different results: one reuses cached context efficiently (high cache-read, low input, high output) while the other sends fresh prompts without reusing context (high input, low cache-read, low output). The yield metric Υ = cache_read × output / input² captures this in one number — and it rewards the compounding cascade, not the burning one.",
            },
            {
              question: "How is a token cascade different from token consumption?",
              answer:
                "Token consumption is a single number — total tokens used. A token cascade is the architecture: how those tokens flowed through the four pillars. Consumption says you spent 500K tokens. Cascade analysis says whether those tokens compounded (high cache reuse, high output per input) or burned (low cache, low output, high fresh input). Yield, not volume, is the measure of AI coding efficiency.",
            },
            {
              question: "How do I measure my token cascade?",
              answer:
                "Install the SigRank CLI (npm install -g sigrank) and run sigrank enroll. The on-device scanner reads token counts from your AI coding logs locally — it bundles ccusage for Claude Code logs — computes the cascade metrics (Yield, Leverage, SNR, Velocity, Cache Hit Rate), and publishes an ed25519-signed snapshot to the leaderboard. No message content leaves your machine.",
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Definition"
        terminalText="CASCADE"
        title="Token Cascade — The Flow of Tokens Through AI Coding Sessions"
        subtitle={
          <>
            Every AI coding session moves tokens through a{" "}
            <span className="text-gold">cascade</span>. Architecture — not
            volume — determines whether tokens compound or burn.
          </>
        }
      />

      {/* ── Definition ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What a token cascade is
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          A <strong className="text-text-primary">token cascade</strong> is the
          flow of tokens through an AI coding session. Every turn moves tokens
          through four stages: you send fresh{" "}
          <strong className="text-text-primary">input</strong> to the model, the
          model generates <strong className="text-text-primary">output</strong>{" "}
          back, <strong className="text-text-primary">cache-read</strong> tokens
          are reused from prior context via prompt caching, and{" "}
          <strong className="text-text-primary">cache-write</strong> tokens are
          written to cache for future reuse. The cascade is the full picture of
          how tokens enter, circulate, and leave the session.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The metaphor is deliberate: tokens cascade like water through a series
          of pools. Some pools compound — cached context flows back into the
          next turn, amplifying a small fresh input into large output. Other
          pools drain — fresh input pours in, nothing is reused, and thin output
          trickles out. The cascade is the architecture that determines which
          one you have.
        </p>
      </section>

      {/* ── The four pillars ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The four pillars of the cascade
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Every token in an AI coding session falls into exactly one of four
          buckets. Together they describe the full flow of the cascade.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <div
              key={p.name}
              className="rounded-lg border border-bg-border bg-bg-surface p-5"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg text-gold">{p.glyph}</span>
                <h3 className="font-mono text-sm font-bold text-text-primary">
                  {p.name}
                </h3>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-wide text-text-muted">
                  {p.role}
                </span>
              </div>
              <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cascade vs consumption ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Token cascade vs raw token consumption
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Token consumption is a single number: total tokens used. It tells you
          how much you spent. Token cascade is the architecture: how those
          tokens flowed through the four pillars. It tells you whether the spend
          compounded or burned.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Two operators can consume the same 500K tokens and get wildly
          different results. One reuses cached context efficiently — high
          cache-read, low input, high output — and her yield is high. The other
          sends fresh prompts without reusing context — high input, low
          cache-read, low output — and his yield is low. Same volume, different
          cascade, different skill. The yield metric{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>{" "}
          captures this in one number.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          This is why cascade architecture — not raw volume — is the measure of
          AI coding efficiency. Counting tokens tells you what you spent.
          Reading the cascade tells you how efficiently you spent it.
        </p>
      </section>

      {/* ── Why the cascade matters ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why the cascade matters
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The cascade matters because it is the unit of skill in AI coding. Your
          token cascade is your skill signature — the architecture of how you
          drive your AI tools. A compounding cascade (high cache reuse, high
          output per input) is the signature of an operator who structures turns
          to recall cached context and sends minimal fresh input. A burning
          cascade (high input, low cache, low output) is the signature of an
          operator who pays full price every turn.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The cascade is also privacy-preserving by construction. Four integers
          — input, output, cache_read, cache_write — fully describe the
          architecture without revealing a single word of what you typed or what
          the model returned. This is what makes a global, continuous operator
          ranking possible without reading anyone&apos;s prompts.
        </p>
      </section>

      {/* ── Related pages ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Explore the cascade
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
              What is a token cascade?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The flow of tokens through an AI coding session across four
              stages: input, output, cache-read, and cache-write. The cascade is
              the full picture of how tokens enter, circulate, and leave a
              session.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What are the four pillars?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Input (fresh tokens sent), output (tokens generated back),
              cache-read (cached tokens reused), and cache-write (new tokens
              written to cache for future reuse).
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Cascade vs consumption?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Consumption is a single number — total tokens used. Cascade is the
              architecture — how those tokens flowed. Two operators with the
              same consumption can have very different cascades and very
              different yield.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I measure my cascade?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Install the SigRank CLI (
              <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-xs text-gold">
                npm install -g sigrank
              </code>
              ), run{" "}
              <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-xs text-gold">
                sigrank enroll
              </code>
              , and submit a snapshot. The on-device scanner reads token counts
              locally and publishes a signed snapshot. No message content leaves
              your machine.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
