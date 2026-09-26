/**
 * app/vs/ccclub/page.tsx — "SigRank vs ccclub" SEO comparison page.
 *
 * Angle: ccclub is the private-league model — invite-code groups of friends
 * comparing Claude Code/Codex usage. It answers "how do I stack up against
 * my friends?" SigRank answers "how do I stack up against the field?" —
 * global, signed, yield-ranked.
 *
 * RSC only — no client JS. Uses withOG(), JsonLd (breadcrumb + faqPage +
 * comparisonArticle), WaveHero, and a styled comparison table.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, comparisonArticle } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

export const metadata: Metadata = withOG({
  title: "SigRank vs ccclub — Private Leagues vs the Global Field",
  description:
    "ccclub is a leaderboard among friends — invite-code groups comparing Claude Code, Codex, OpenCode, Amp, and pi-agent usage. SigRank is the global evaluation — signed, yield-ranked operator scores across 15+ platforms.",
  path: "/vs/ccclub",
});

const COMPARE_ROWS: { feature: string; ccclub: string; sigrank: string }[] = [
  {
    feature: "What it measures",
    ccclub: "Cost, tokens, turns, active status, agent mix",
    sigrank: "Cascade yield (Υ) + Leverage, SNR, Velocity",
  },
  {
    feature: "Who you are ranked against",
    ccclub: "Your private group (invite-code friends)",
    sigrank: "The global field — every signed operator",
  },
  {
    feature: "Group model",
    ccclub: "Invite-code leagues, no account needed",
    sigrank: "Public leaderboard + class tiers",
  },
  {
    feature: "Efficiency score (Υ Yield)",
    ccclub: "No",
    sigrank: "Yes",
  },
  {
    feature: "Archetypes + class tiers",
    ccclub: "No",
    sigrank: "Yes",
  },
  {
    feature: "Signed, verifiable submissions",
    ccclub: "Server-side sync",
    sigrank: "ed25519-signed snapshots",
  },
  {
    feature: "MCP server for AI-agent integration",
    ccclub: "No",
    sigrank: "Yes",
  },
  {
    feature: "Tool coverage",
    ccclub: "Claude Code, Codex, OpenCode, Amp, pi-agent",
    sigrank: "15+ platforms",
  },
  {
    feature: "Privacy-preserving (token counts only)",
    ccclub: "Yes — 30-min aggregate summaries, auditable via ccclub show-data",
    sigrank: "Yes",
  },
];

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Is ccclub a SigRank alternative?",
    answer:
      "It solves a different problem. ccclub is the social model: create a group, share an invite code, and compare token usage, cost, and activity with your friends across Claude Code, Codex, OpenCode, Amp, and pi-agent. The private-league design is a real strength — comparing against people you know is motivating in a way a global board is not. SigRank is the global evaluation: signed snapshots, Υ Yield efficiency scoring, class tiers, and a public field. ccclub answers 'how do I compare to my crew?'; SigRank answers 'how do I compare to everyone?'",
  },
  {
    question: "What does ccclub do that SigRank does not?",
    answer:
      "Private leagues. ccclub's invite-code group model means you can run a board for just your team, your friends, or your community — with per-member agent mix and active status. It is the right tool for a closed comparison. SigRank is deliberately public and global: the point of an operator evaluation is that it means the same thing regardless of who is in the room. A private board calibrates against your friends; the global board calibrates against the field.",
  },
  {
    question: "Can I use ccclub and SigRank together?",
    answer:
      "Yes. Run ccclub for the friend-group board — the daily 'who is active and what are they driving' view is its own kind of fun. Then submit a signed SigRank snapshot to see how the group members actually rank on efficiency against the global field. The private league for the group chat; the global score for the record.",
  },
  {
    question: "Which tells me if I am actually efficient?",
    answer:
      "SigRank. ccclub tracks totals — cost, tokens, turns — which tell you how much everyone used, not how well. Υ Yield (cache_read × output / input²) measures whether the tokens compounded into output or burned as repeated input. In a small group the most active member usually tops the totals; on the efficiency board, the most skilled one does.",
  },
];

export default function VsCcclubPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Comparisons", path: "/vs" },
            { name: "SigRank vs ccclub", path: "/vs/ccclub" },
          ]),
          faqPage(FAQS),
          comparisonArticle({
            title: "SigRank vs ccclub — Private Leagues vs the Global Field",
            description:
              "ccclub is a leaderboard among friends — invite-code groups comparing agent usage. SigRank is the global evaluation — signed, yield-ranked operator scores.",
            path: "/vs/ccclub",
          }),
        ]}
      />

      <WaveHero
        eyebrow="◈ SigRank vs ccclub"
        title="Your Crew vs the Field"
        subtitle={
          <>
            ccclub answers &quot;how do I stack up against my friends?&quot;
            SigRank answers{" "}
            <span className="text-gold">
              &quot;how do I stack up against everyone?&quot;
            </span>{" "}
            Different questions — both worth asking.
          </>
        }
      />

      {/* TL;DR */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version: ccclub
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <a
            href="https://ccclub.dev"
            target="_blank"
            rel="noopener"
            className="text-gold underline underline-offset-2"
          >
            ccclub
          </a>{" "}
          is the private-league take on token tracking: run{" "}
          <span className="font-mono text-text-primary">npx ccclub init</span>,
          share an invite code, and your group gets a live board of cost,
          tokens, turns, active status, and agent mix across Claude Code,
          Codex, OpenCode, Amp, and pi-agent. No accounts needed, 30-minute
          aggregate sync, and{" "}
          <span className="font-mono text-text-primary">ccclub show-data</span>{" "}
          lets members audit exactly what leaves their machine. The social
          model done right — comparing against your crew is a different
          motivation than a global board, and ccclub builds for it.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the complement at the other end of the social graph:
          instead of a private group, every signed operator is ranked on the
          same global field by{" "}
          <strong className="text-text-primary">
            Υ = cache_read × output / input²
          </strong>
          . Your ccclub board tells you who in the group burned the most this
          week; SigRank tells you who in the field is actually efficient.
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
                  ccclub
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
                  <td className="px-4 py-2.5 text-text-secondary">{r.ccclub}</td>
                  <td className="px-4 py-2.5 font-medium text-gold">
                    {r.sigrank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* The distinction */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          A league calibrates locally; a field calibrates globally
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Private boards are honest about their frame — your group&apos;s
          numbers against each other. The limits show up at the edges: the
          biggest burner in a five-person group might be mid-table globally,
          and nobody in the group can tell because the league only sees itself.
          Totals-based ranking deepens that: the member who runs the most
          sessions always wins the cost column, whatever their efficiency.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s global board fixes the frame: every entry is a signed
          snapshot scored on the same Υ formula, ranked against the whole field
          across 7d/30d/90d/all-time windows, with class tiers to keep scale
          honest. It is not a replacement for the group leaderboard — it is
          the thing the group leaderboard can compare itself to.
        </p>
      </section>

      {/* Upgrade path */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Bring the group&apos;s scores to the field
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Each member of a ccclub league can publish a signed SigRank score
          from the same local telemetry:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
            {`npm install -g sigrank
sigrank enroll      # create your operator identity
sigrank submit      # reads logs, scores, signs, publishes`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Or paste token counts into the{" "}
          <Link href="/score" className="text-gold underline underline-offset-2">
            /score calculator
          </Link>{" "}
          to see Υ Yield and class tier instantly.
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
          See where the crew stands globally
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Keep the private league for the group chat. Publish signed scores to
          see how everyone ranks on the field.
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
            href="/vs/ccwarriors"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs ccwarriors
          </Link>
          {" · "}
          <Link
            href="/vs/ccrank"
            className="text-gold underline underline-offset-2"
          >
            SigRank vs ccrank
          </Link>
          {" · "}
          <Link
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            The Yield Metric
          </Link>
        </p>
      </section>
    </div>
  );
}
