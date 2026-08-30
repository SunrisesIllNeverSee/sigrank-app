/**
 * app/vs/vibe-island/page.tsx — "SigRank vs vibe-island" SEO comparison page.
 *
 * Angle: vibe-island is a vibe coding community. SigRank is an operator ranking
 * system. Vibing ≠ operating.
 *
 * RSC only — no client JS. Uses withOG(), JsonLd (breadcrumb + faqPage),
 * WaveHero, and a styled comparison table matching the repo's table conventions.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, comparisonArticle } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

export const metadata: Metadata = withOG({
  title: "SigRank vs vibe-island",
  description:
    "vibe-island is a vibe coding community. SigRank is an operator ranking system. Vibing is not operating. Community is not competition.",
  path: "/vs/vibe-island",
});

// Comparison rows — feature-by-feature, vibe-island vs SigRank.
const COMPARE_ROWS: { feature: string; vibeisland: string; sigrank: string }[] = [
  {
    feature: "What it is",
    vibeisland: "Vibe coding community platform",
    sigrank: "Operator scoring and ranking system",
  },
  {
    feature: "What it provides",
    vibeisland: "Community for vibe coders to connect",
    sigrank: "Cascade efficiency scores + global leaderboard",
  },
  {
    feature: "Cascade efficiency score (Υ Yield)",
    vibeisland: "No",
    sigrank: "Yes",
  },
  {
    feature: "Compression ratio + SNR + Leverage + Velocity",
    vibeisland: "No",
    sigrank: "Yes (derived metrics)",
  },
  {
    feature: "Class tier (IGNITER to ARCH+)",
    vibeisland: "No",
    sigrank: "Yes",
  },
  {
    feature: "Global operator leaderboard",
    vibeisland: "No (community, not ranked)",
    sigrank: "Yes (Yield-ranked)",
  },
  {
    feature: "Operator profiles + head-to-head compare",
    vibeisland: "No",
    sigrank: "Yes",
  },
  {
    feature: "MCP server for AI-agent integration",
    vibeisland: "No",
    sigrank: "Yes",
  },
  {
    feature: "ed25519-signed snapshot submission",
    vibeisland: "No",
    sigrank: "Yes",
  },
  {
    feature: "Platform-neutral (Claude Code, Cursor, Copilot, Gemini, 15+)",
    vibeisland: "Community-focused, tool-agnostic",
    sigrank: "Yes",
  },
  {
    feature: "Bundled tools (tokscale, token-dashboard)",
    vibeisland: "No",
    sigrank: "Yes",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    vibeisland: "N/A (community platform)",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is SigRank a vibe-island alternative?",
    answer:
      "They serve different purposes. vibe-island is a vibe coding community — a place for vibe coders to connect, share, and hang out. SigRank is an operator ranking system — it scores how efficiently you drive AI and ranks you globally. vibe-island is a community; SigRank is a competition. Vibing is not operating. You can use both — vibe-island for the community, SigRank for the score and the leaderboard.",
  },
  {
    question: "Why is vibing not the same as operating?",
    answer:
      "Vibing is about the experience — the flow, the community, the culture of coding with AI. Operating is about the efficiency — how well you compound cached context into output, how high your yield is, where you rank. Two vibe coders can have the same vibe and wildly different efficiency. One reuses cached context efficiently and produces 30K output tokens; the other re-sends the same context every turn and produces 3K. Same vibe, ten-fold difference in signal. Community is not competition.",
  },
  {
    question: "What does vibe-island not measure that SigRank does?",
    answer:
      "vibe-island is a community platform — it does not measure operator efficiency at all. SigRank derives the cascade architecture from the operator's token telemetry: Υ Yield (is signal compounding or burning?), compression ratio (output per input), SNR (signal density), Leverage (how much cached context amplifies your input), and Velocity (tokens per unit time). vibe-island gives you a community; SigRank gives you a score and a rank.",
  },
  {
    question: "Can I use both vibe-island and SigRank?",
    answer:
      "Yes, and they complement each other. vibe-island gives you the vibe coding community — a place to connect with other vibe coders. SigRank gives you the efficiency layer — a score, a class tier, and a global leaderboard rank. Run `sigrank submit` to publish your cascade score to the SigRank leaderboard, and keep your vibe-island profile for the community. The two are complementary, not mutually exclusive.",
  },
  {
    question: "Does vibe-island have a leaderboard?",
    answer:
      "No. vibe-island is a community platform, not a ranking system. It connects vibe coders but does not score or rank them by efficiency. SigRank is a public leaderboard: it ranks operators globally by cascade yield, with signed snapshots and verified identities. vibe-island is for community; SigRank is for competition. The first is a hangout; the second is a leaderboard.",
  },
];

export default function VsVibeIslandPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs vibe-island", path: "/vs/vibe-island" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs vibe-island \u2014 Vibe Community vs Operator Ranking",
            description: "vibe-island is a vibe coding community. SigRank is an operator ranking system. Vibing is not operating. Community is not competition.",
            path: "/vs/vibe-island",
          }),
        ]}
      />

      <WaveHero
        eyebrow="\u25C8 SigRank vs vibe-island"
        title="Vibing Is Not Operating"
        subtitle={
          <>
            vibe-island is a vibe coding community. SigRank is an{" "}
            <span className="text-gold">operator ranking system</span>.
            Community is not competition. A hangout is not a leaderboard.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: vibe-island
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          vibe-island is a vibe coding community platform — a place for vibe
          coders to connect, share, and hang out. It is built around the vibe
          coding culture: the flow, the community, the experience of coding
          with AI. It does the community layer well: you find other vibe
          coders, you share your work, you vibe together. But{" "}
          <em>vibing is not operating</em>. A community does not measure skill,
          assign a score, or rank anyone.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is a different thing entirely: an{" "}
          <strong className="text-text-primary">operator ranking system</strong>.
          It reads token telemetry from any AI tool an operator drives, computes
          the cascade efficiency (Υ Yield), and ranks them globally. vibe-island
          is the community; SigRank is the competition. Both matter. Only one
          tells you who is winning.
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
                  vibe-island
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
                    {r.vibeisland}
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

      {/* Why vibing isn't operating */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why vibing isn&apos;t operating
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          vibe-island answers <em>&quot;where do I find other vibe
          coders?&quot;</em> That is a community question, not an efficiency
          question. Two vibe coders can have the same vibe and wildly different
          efficiency. One reuses cached context efficiently and produces 30K
          output tokens; the other re-sends the same context every turn and
          produces 3K. Same vibe, ten-fold difference in signal. vibe-island
          sees the same community member either way.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s headline metric,{" "}
          <span className="font-mono text-gold">
            Υ = cache_read × output / input²
          </span>
          , measures exactly that gap. It rewards the operator who compounds
          cached context into output and penalizes the one who burns fresh input
          without leverage. vibe-island gives you the community; SigRank tells
          you whether the operator behind it is{" "}
          <em>compounding or burning</em>.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">
            The four token pillars (SigRank reads these)
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 font-sans text-sm text-text-secondary">
            <li>
              <strong className="text-text-primary">Input</strong>: tokens you
              send to the model
            </li>
            <li>
              <strong className="text-text-primary">Output</strong>: tokens the
              model generates back
            </li>
            <li>
              <strong className="text-text-primary">Cache-read</strong>: cached
              tokens reused from prior context
            </li>
            <li>
              <strong className="text-text-primary">Cache-write</strong>: new
              tokens written to cache for future reuse
            </li>
          </ul>
        </div>
      </section>

      {/* The upgrade path */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          From community to competition
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you are part of the vibe-island community, you have the vibe.
          SigRank adds the scoring layer that communities never had:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
            {`npm install -g sigrank
sigrank enroll      # create your operator identity
sigrank submit      # reads logs, scores, signs, publishes`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Prefer to inspect before you submit? Run{" "}
          <span className="font-mono text-text-primary">
            sigrank me --dry-run
          </span>{" "}
          to see your scored payload locally, or paste your token counts into
          the{" "}
          <Link href="/score" className="text-gold underline underline-offset-2">
            /score calculator
          </Link>{" "}
          to compute your Υ Yield, class tier, and compression ratio instantly,
          no account, no submission, just the numbers.
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
          Ready to see your yield?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep your vibe-island profile for the community. Add the scoring, the
          leaderboard, and the operator profile that turns your vibe into a
          rank. Install SigRank and submit your first signed snapshot in under
          a minute.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/score"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            Calculate your Υ Yield
          </Link>
          <Link
            href="/board/all"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            See the leaderboard
          </Link>
        </div>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/alternatives/ccusage-alternatives"
            className="text-gold underline underline-offset-2"
          >
            ccusage Alternatives
          </Link>
          {" \u00B7 "}
          <Link
            href="/tools/yield-calculator"
            className="text-gold underline underline-offset-2"
          >
            Yield Calculator
          </Link>
          {" \u00B7 "}
          <Link
            href="/wiki/local-agent"
            className="text-gold underline underline-offset-2"
          >
            The Local Agent (MCP)
          </Link>
        </p>
      </section>
    </div>
  );
}
