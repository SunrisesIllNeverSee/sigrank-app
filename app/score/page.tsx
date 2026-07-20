import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { scoreCalculator, scoreHowTo, cliTool } from "@/lib/jsonld";
import PillarFlowDiagram from "@/components/score/PillarFlowDiagram";
import WhereYouSit from "@/components/score/WhereYouSit";
import HowToGetScored from "@/components/score/HowToGetScored";
import WhyItMatters from "@/components/score/WhyItMatters";

/**
 * app/score/page.tsx — the "Measure" page.
 *
 * Conversion-first layout:
 *   1. Hero (tight)
 *   2. One diagram (the four pillars — most intuitive)
 *   3. Why it matters (volume isn't yield — real data, no moralizing)
 *   4. Two vertical glowing banners (how to get scored: paste + agent)
 *   5. "Where do you sit?" hook (archetype yield range)
 *   6. Learn link + privacy
 *
 * The deeper diagrams (cascade snowball + yield formula) live on /learn.
 */

export const metadata: Metadata = withOG({
  title: "Score your cascade",
  description:
    "Paste four token counts for an instant cascade preview, or install the agent to read your logs on-device. Find out which archetype you are.",
  path: "/score",
});

const PRIVACY_POINTS = [
  {
    t: "Zero-paste, on-device read",
    b: "tokenpull reads local session logs and counts the four token pillars across 7d / 30d / 90d / all-time — no copy-paste, nothing to assemble by hand.",
  },
  {
    t: "Token counts only",
    b: "The agent counts tokens. It never reads the content of your prompts or replies. Only the four integers leave your machine.",
  },
  {
    t: "Signed submissions",
    b: "Each snapshot is signed with an ed25519 keypair (per-device). The server verifies the signature before accepting. No spoofing, no spoofed ranks.",
  },
  {
    t: "Read-only by design",
    b: "The agent is read-only against telemetry. It emits no prompt of its own. It measures without disturbing what it measures.",
  },
];

export default function ScorePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <JsonLd data={[scoreCalculator(), scoreHowTo(), cliTool()]} />

      {/* Hero */}
      <div className="flex flex-col gap-3 text-center">
        <span className="font-mono text-xs uppercase tracking-widest text-gold">
          ◈ Score your cascade
        </span>
        <h1 className="font-mono text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
          How much signal does your token cascade actually compound?
        </h1>
        <p className="mx-auto max-w-xl font-sans text-sm leading-relaxed text-text-secondary">
          Two paths. Both get you scored. Pick the one that fits.
        </p>
      </div>

      {/* ── One diagram: the four pillars ── */}
      <div className="mt-12">
        <PillarFlowDiagram />
      </div>

      {/* ── Why it matters ── */}
      <div className="mt-16">
        <WhyItMatters />
      </div>

      {/* ── Two vertical glowing banners (how to get scored) ── */}
      <div className="mt-16">
        <HowToGetScored />
      </div>

      {/* ── "Where do you sit?" hook ── */}
      <div className="mt-12">
        <WhereYouSit />
      </div>

      {/* ── Learn more ── */}
      <div className="mt-10 border-t border-bg-border-subtle pt-6 text-center">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Want to understand the cascade model in depth?{" "}
          <Link
            href="/learn"
            className="text-text-accent underline-offset-2 hover:underline"
          >
            Learn how it works →
          </Link>
        </p>
      </div>

      {/* ── Data privacy ── */}
      <div className="mt-12 rounded-xl border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-gold">
          ⊙ Data privacy
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PRIVACY_POINTS.map((p) => (
            <div key={p.t} className="flex flex-col gap-1">
              <h3 className="font-sans text-sm font-semibold text-text-primary">
                {p.t}
              </h3>
              <p className="font-sans text-sm leading-relaxed text-text-secondary">
                {p.b}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 font-mono text-xs text-text-muted">
          Token counts only. Never your prompts.
        </p>
      </div>
    </main>
  );
}
