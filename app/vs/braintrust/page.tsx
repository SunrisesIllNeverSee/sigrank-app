/**
 * app/vs/braintrust/page.tsx — "SigRank vs Braintrust" SEO comparison page.
 *
 * Angle: Braintrust is a decentralized AI marketplace/freelance platform that
 * connects you with AI talent. SigRank scores the operator's token efficiency —
 * Braintrust finds AI workers; SigRank measures how well they use AI.
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
  title: "SigRank vs Braintrust \u2014 Marketplace vs Measurement",
  description:
    "Braintrust connects you with AI talent. SigRank measures how efficiently that talent drives AI. Braintrust finds AI workers; SigRank scores how well they use AI.",
  path: "/vs/braintrust",
});

const COMPARE_ROWS: { feature: string; braintrust: string; sigrank: string }[] = [
  {
    feature: "What it is",
    braintrust: "Decentralized AI talent marketplace",
    sigrank: "Platform-neutral operator scoring layer",
  },
  {
    feature: "Connects you with AI talent",
    braintrust: "Yes (freelance marketplace)",
    sigrank: "No (self-scoring)",
  },
  {
    feature: "Measures operator token efficiency",
    braintrust: "No",
    sigrank: "Yes (cascade-derived)",
  },
  {
    feature: "Cascade efficiency score (Υ = cache_read × output / input²)",
    braintrust: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    braintrust: "No",
    sigrank: "Yes",
  },
  {
    feature: "Class tier (IGNITER → TRANSMITTER)",
    braintrust: "No",
    sigrank: "Yes",
  },
  { feature: "Global operator leaderboard", braintrust: "No", sigrank: "Yes" },
  {
    feature: "Operator profiles + head-to-head compare",
    braintrust: "Profiles (marketplace)",
    sigrank: "Profiles (scored)",
  },
  {
    feature: "ed25519-signed snapshot submission",
    braintrust: "No",
    sigrank: "Yes",
  },
  { feature: "MCP server for agent integration", braintrust: "No", sigrank: "Yes" },
  {
    feature: "Works across Cursor + Claude Code + Copilot + 15+",
    braintrust: "N/A (talent sourcing)",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    braintrust: "N/A",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Does SigRank replace Braintrust?",
    answer:
      "No — the two solve different problems. Braintrust is a decentralized marketplace that connects you with AI talent: freelancers, prompt engineers, AI-native operators you can hire. SigRank is a scoring layer that measures how efficiently any operator drives AI tools. Braintrust finds you AI workers; SigRank tells you how well they (or you) actually use AI. They are complementary — you could hire talent on Braintrust and then score their token efficiency on SigRank.",
  },
  {
    question: "Does Braintrust measure AI operator skill?",
    answer:
      "Braintrust surfaces talent through marketplace profiles, ratings, and project history — the same signals a freelance platform uses for any skill. It does not measure how efficiently an operator drives AI tools. It cannot tell you whether a candidate compounds cached context into output or burns fresh input every turn. SigRank measures exactly that: the Υ Yield (cache_read × output / input²), compression ratio, SNR, Leverage, and Velocity that define token-cascade efficiency. Braintrust tells you who claims to be good with AI; SigRank measures whether they are.",
  },
  {
    question: "Why does measuring AI skill matter for hiring?",
    answer:
      "Because &quot;uses AI&quot; is not a skill — &quot;uses AI efficiently&quot; is. Two operators can both list &quot;AI-native&quot; on a marketplace and have ten-fold different cascade efficiency. One reuses context, writes tight prompts, and compounds signal; the other re-pastes stale context and burns tokens. SigRank&apos;s leaderboard makes that difference visible and comparable. If you hire AI talent through Braintrust, asking for a SigRank score turns a self-reported skill claim into a measured, signed, verifiable number.",
  },
  {
    question: "Can I use SigRank alongside Braintrust?",
    answer:
      "Yes. They operate at different layers. Braintrust is where you find and hire AI talent; SigRank is where that talent (or you) scores their AI driving. An operator enrolled in SigRank can share their leaderboard rank, class tier, and Υ trajectory as a verifiable credential — no different than a portfolio, except it is a signed snapshot of measured efficiency rather than a self-reported claim. Run the SigRank CLI alongside whatever AI tools you drive, submit a signed snapshot, and your score is public on the leaderboard.",
  },
  {
    question: "What is the difference between an AI talent marketplace and an operator leaderboard?",
    answer:
      "A marketplace (Braintrust) is a sourcing surface — it connects buyers with sellers of AI labor. A leaderboard (SigRank) is a measurement surface — it ranks operators on a canonical efficiency metric. The first answers &quot;where do I find AI workers?&quot; The second answers &quot;how good are they at driving AI?&quot; Marketplaces rely on self-reported profiles and ratings; leaderboards rely on measured, signed telemetry. They are not competitors — they are different layers of the AI talent stack.",
  },
];

export default function VsBraintrustPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs Braintrust", path: "/vs/braintrust" },
          ]),
          faqPage(FAQS),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs Braintrust"
        title="Marketplace vs Measurement"
        subtitle={
          <>
            Braintrust connects you with AI talent. SigRank{" "}
            <span className="text-gold">measures how well</span> that talent
            drives AI. Braintrust finds AI workers; SigRank scores how well they
            use AI.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: Braintrust
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Braintrust is a decentralized AI marketplace — a freelance platform
          that connects enterprises with AI talent: prompt engineers, AI-native
          developers, model specialists. It does what a talent marketplace does:
          it <em>sources people</em>. Profiles, ratings, project history, and
          bid-based matching get you a candidate. What it does not do is measure
          how efficiently that candidate actually drives AI tools.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the{" "}
          <strong className="text-text-primary">measurement layer</strong> that
          fills that gap. It reads token telemetry from any AI tool an operator
          drives — Claude Code, Cursor, Copilot, Gemini, 15+ others — computes
          the cascade efficiency (Υ Yield), and ranks them on a global
          leaderboard. Braintrust tells you <em>who claims to be good with AI</em>;
          SigRank tells you <em>whether they are</em>.
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
                  Braintrust
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
                  <td className="px-4 py-2.5 text-text-secondary">
                    {r.braintrust}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-gold">
                    {r.sigrank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sourcing vs measurement */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Sourcing talent vs measuring skill
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Braintrust&apos;s value is discovery: it surfaces AI talent through a
          decentralized marketplace where talent sets their own rates and
          enterprises post projects. That is a sourcing problem, and Braintrust
          solves it well. But &quot;uses AI&quot; is not a skill —{" "}
          <em>&quot;uses AI efficiently&quot;</em> is. Two operators can both
          list &quot;AI-native&quot; on their Braintrust profile and have
          ten-fold different cascade efficiency. One reuses cached context and
          compounds signal; the other re-pastes stale context every turn and
          burns tokens. The marketplace cannot see that difference.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>{" "}
          measures it directly. It rewards the operator who compounds cached
          context into output and penalizes the one who burns input without
          leverage. Braintrust tells you who is available; SigRank tells you
          whether they are good at the part that matters.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            Two layers, not competitors
          </p>
          <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
            Braintrust is a <strong className="text-text-primary">sourcing
            surface</strong> — where do I find AI talent? SigRank is a{" "}
            <strong className="text-text-primary">measurement surface</strong> —
            how good is that talent at driving AI? The first relies on
            self-reported profiles and ratings; the second relies on measured,
            signed telemetry. They are complementary layers of the AI talent
            stack, not alternatives.
          </p>
        </div>
      </section>

      {/* Verifiable credential */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          From self-reported claim to signed score
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Marketplace profiles are self-reported: an operator writes
          &quot;AI-native&quot; and lists projects. SigRank replaces that claim
          with a <em>verifiable credential</em>. The CLI reads token telemetry
          locally, computes the cascade metrics, signs a snapshot with ed25519,
          and publishes it to the leaderboard. The score is server-verified,
          tamper-evident, and public. An operator hired through Braintrust can
          share their SigRank rank as proof of efficiency — not a claim, a
          measurement.
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
          Find talent on Braintrust. Measure them on SigRank.
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Braintrust connects you with AI workers. SigRank tells you how
          efficiently they drive AI. Install the CLI, submit a signed snapshot,
          and turn a self-reported skill claim into a measured, verifiable rank.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/score"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            Calculate your Υ Yield
          </a>
          <Link
            href="/hall"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            See the Hall of Signal
          </Link>
        </div>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/methodology"
            className="text-gold underline underline-offset-2"
          >
            Methodology
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
            href="/guides/how-to-measure-ai-coding-efficiency"
            className="text-gold underline underline-offset-2"
          >
            Measure AI Coding Efficiency
          </Link>
        </p>
      </section>
    </div>
  );
}
