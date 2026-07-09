import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { ScorePasteCard } from "@/components/score/ScorePasteCard";

/**
 * app/score/paste/page.tsx — the backup paste calculator.
 *
 * The agent path is the primary flow (see /score). This page exists for when
 * you can't install the agent or just want a quick preview. No account, no
 * save — just the numbers.
 */

export const metadata: Metadata = withOG({
  title: "Paste — quick cascade preview",
  description:
    "Paste four token counts for an instant cascade preview. No account, no save. The agent path is the primary flow.",
  path: "/score/paste",
});

export default function ScorePastePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      {/* Hero */}
      <div className="flex flex-col gap-3 text-center">
        <span className="font-mono text-xs uppercase tracking-widest text-gold">
          ◈ Quick preview
        </span>
        <h1 className="font-mono text-2xl font-bold leading-tight text-text-primary sm:text-3xl">
          Paste four token counts
        </h1>
        <p className="mx-auto max-w-xl font-sans text-sm leading-relaxed text-text-secondary">
          Instant cascade preview — Υ Yield, class tier, and full metrics. No
          account, no save, just the numbers. This is the backup path; the agent
          reads your logs automatically.
        </p>
      </div>

      {/* Paste card */}
      <div className="mt-8">
        <ScorePasteCard />
      </div>

      {/* ── How it works ── */}
      <section className="mt-8 flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How the paste path works
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The paste flow is the backup path: you manually enter the four token
          counts (input, output, cache_read, cache_write) from any AI
          platform&apos;s usage dashboard, and the calculator instantly computes
          your Υ Yield, class tier, and full cascade metrics. No account, no
          save — just the numbers.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The agent flow is the primary path: install the SigRank CLI, and the
          on-device scanner reads your token pillars automatically from your
          local logs — no paste needed. The agent also publishes signed
          snapshots to the leaderboard so your scores are verifiable. Use paste
          for a quick preview; use the agent for ongoing tracking.
        </p>
      </section>

      {/* Back to the agent path */}
      <div className="mt-10 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The agent path is better — it reads your local logs, no paste needed.{" "}
          <Link
            href="/score"
            className="text-text-accent underline-offset-2 hover:underline"
          >
            ← Back to the agent path
          </Link>
        </p>
      </div>
    </main>
  );
}
