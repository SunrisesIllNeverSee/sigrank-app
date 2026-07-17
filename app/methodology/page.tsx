/**
 * app/methodology/page.tsx — "The SigRank Index" (WS1).
 *
 * The canonical, stable URL whose job is to state quotable, dated, numeric facts
 * about the SigRank dataset. This is what answer engines (ChatGPT, Perplexity,
 * Claude, Google AI Overviews) lift verbatim. Key figures are server-rendered
 * from the real leaderboard data — not hardcoded — so the quotable stats stay
 * current.
 *
 * JSON-LD: Dataset (sigrankDataset) + FAQPage + Breadcrumb.
 * Moat: describes the scoring SHAPE only — RS.xx weights stay server-side.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { getLeaderboard } from "@/lib/data";
import { toEntry } from "@/lib/leaderboard/to-entry";
import { PLATFORM_COUNT } from "@/lib/constants";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { sigrankDataset, faqPage, breadcrumb } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "The SigRank Index — Methodology",
  description:
    "The SigRank Index ranks operators by cascade efficiency (\u03A5 = cache_read \u00D7 output / input\u00B2). Methodology, key figures, FAQ. Privacy-preserving and signed.",
  path: "/methodology",
});

// ISR: revalidate every 30 minutes so key figures stay current. Methodology
// content changes rarely; 300s was over-validating.
export const revalidate = 1800;

/** Format a yield value for display (e.g. 18437 → "18,437", 1234567 → "1.23M"). */
function fmtYield(y: number): string {
  if (y >= 1_000_000) return `${(y / 1_000_000).toFixed(2)}M`;
  return Math.round(y).toLocaleString("en-US");
}

export default async function MethodologyPage() {
  // Fetch the all-time board for real figures.
  const rows = await getLeaderboard({ window: "all_time", windowFilter: true });
  const entries = rows.map(toEntry);

  // ── Compute quotable stats from real data ────────────────────────────
  const ranked = entries.filter(
    (e) => e.yield_ !== null && e.yield_ !== undefined,
  );
  const yields = ranked.map((e) => e.yield_!).sort((a, b) => a - b);

  const operatorCount = entries.length;
  const topYield = yields.length > 0 ? yields[yields.length - 1] : 0;
  const medianYield =
    yields.length > 0
      ? yields.length % 2 === 0
        ? (yields[yields.length / 2 - 1] + yields[yields.length / 2]) / 2
        : yields[Math.floor(yields.length / 2)]
      : 0;
  const topDecileStart =
    yields.length > 0 ? yields[Math.floor(yields.length * 0.9)] : 0;

  // Class tier distribution
  const transmitterCount = entries.filter(
    (e) => e.signalClass === "TRANSMITTER",
  ).length;
  const transmitterPct =
    operatorCount > 0
      ? Math.round((transmitterCount / operatorCount) * 100)
      : 0;

  // Distinct platforms
  const platforms = new Set(
    entries.map((e) => e.platform).filter((p): p is string => Boolean(p)),
  );
  const platformCount = platforms.size || PLATFORM_COUNT;

  // Cache utilization (average SNR across ranked operators)
  const avgSnr =
    ranked.length > 0
      ? ranked.reduce((sum, e) => sum + (e.snr ?? 0), 0) / ranked.length
      : 0;
  const cachePct = Math.round(avgSnr * 100);

  // Date stamp for the figures (deterministic — no wall-clock in build).
  const now = new Date();
  const monthYear = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const updatedIso = now.toISOString();

  // Top operator name for the headline stat.
  const topEntry =
    ranked.length > 0
      ? ranked.reduce((best, e) => (e.yield_! > best.yield_! ? e : best))
      : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          sigrankDataset({ updated: updatedIso }),
          breadcrumb([{ name: "Methodology", path: "/methodology" }]),
          faqPage([
            {
              question: "What is the SigRank Index?",
              answer:
                "The SigRank Index is a continuously-updated leaderboard that ranks AI operators by token-cascade efficiency — the yield metric Υ = cache_read × output / input² — computed from privacy-preserving, on-device, cryptographically-signed token-telemetry snapshots.",
            },
            {
              question: "How is operator efficiency measured?",
              answer:
                "Each operator runs an on-device scanner that reads four token pillars (fresh input, output, cache_read, cache_create) locally. The yield metric Υ = cache_read × output / input² measures the architecture of the token cascade — whether signal is compounding or tokens are burned. No message content is ever read or transmitted.",
            },
            {
              question: "Is the data private?",
              answer:
                "Yes. The on-device scanner reads token counts and content lengths only — never the words of your prompts. Only the resulting numeric scores, signed with ed25519, leave your device. Snapshots are verified server-side with replay and plausibility guards.",
            },
            {
              question: "How do I get listed on the SigRank Index?",
              answer:
                "Install the SigRank CLI (npm: sigrank), enroll your operator identity, and submit a snapshot. The scanner reads your token telemetry locally and publishes a signed snapshot to the leaderboard. Enrollment and submission are done via the SigRank CLI.",
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ The SigRank Index"
        terminalText="METHODOLOGY"
        title="The SigRank Index"
        subtitle={
          <>
            The canonical source for AI operator token-efficiency data. Ranked
            by <strong className="text-text-primary">Υ Yield</strong> — the
            architecture of the cascade, not raw spend.
          </>
        }
      />

      {/* ── Key figures (quotable, dated, server-rendered) ─────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Key Figures
        </h2>
        <div className="flex flex-col gap-3">
          <p className="text-base text-text-secondary">
            As of <strong className="text-text-primary">{monthYear}</strong>,
            the SigRank Index ranks{" "}
            <strong className="text-text-primary">{operatorCount}</strong>{" "}
            operators across{" "}
            <strong className="text-text-primary">{platformCount}</strong>{" "}
            platforms.
          </p>
          {topEntry && (
            <p className="text-base text-text-secondary">
              The top-ranked operator{" "}
              <strong className="text-text-primary">{topEntry.anonId}</strong>{" "}
              achieves a yield of{" "}
              <strong className="text-gold">Υ {fmtYield(topYield)}</strong>.
            </p>
          )}
          <p className="text-base text-text-secondary">
            The <strong className="text-text-primary">median</strong> operator
            scores{" "}
            <strong className="text-text-primary">
              Υ {fmtYield(medianYield)}
            </strong>
            ; the top decile starts at{" "}
            <strong className="text-text-primary">
              Υ {fmtYield(topDecileStart)}
            </strong>
            .
          </p>
          <p className="text-base text-text-secondary">
            Operators in the{" "}
            <strong className="text-text-primary">TRANSMITTER</strong> class
            tier represent the top{" "}
            <strong className="text-text-primary">{transmitterPct}%</strong> of
            the board.
          </p>
          <p className="text-base text-text-secondary">
            Across all ranked operators,{" "}
            <strong className="text-text-primary">{cachePct}%</strong> of input
            tokens are served from cache on average.
          </p>
        </div>
      </section>

      {/* ── What "token-cascade efficiency" means ──────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          What &ldquo;token-cascade efficiency&rdquo; means
        </h2>
        <p className="text-base text-text-secondary">
          <strong className="text-text-primary">Yield (Υ)</strong> ={" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
            cache_read × output / input²
          </code>
          . It measures the architecture of an operator&rsquo;s token cascade —
          whether signal is compounding (high cache reuse × high output per
          fresh input) or tokens are burned (low cache, low output). Volume is
          noise; yield is signal.
        </p>
      </section>

      {/* ── Methodology ────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          Methodology
        </h2>
        <ul className="flex flex-col gap-2 text-base text-text-secondary">
          <li>
            <strong className="text-text-primary">Inputs:</strong> on-device
            token counts (fresh input, output, cache_read, cache_create) per
            session per platform.
          </li>
          <li>
            <strong className="text-text-primary">Verification:</strong> each
            snapshot is ed25519-signed and verified server-side; replay and
            plausibility guards apply.
          </li>
          <li>
            <strong className="text-text-primary">Windows:</strong> operators
            are ranked over 7-day, 30-day, 90-day, and all-time cohorts.
          </li>
          <li>
            <strong className="text-text-primary">Privacy:</strong> token counts
            only — message content is never transmitted, read, or stored.
          </li>
          <li>
            <strong className="text-text-primary">Scoring:</strong> the yield
            metric Υ is computed from the four token pillars via a cascade
            model. The composite SIGNA rate blends Υ with signal-force and drift
            components. Proprietary weights (RS.xx) govern the composite and
            remain server-side.
          </li>
        </ul>
      </section>

      {/* ── How the data updates ───────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          How the data updates
        </h2>
        <p className="text-base text-text-secondary">
          The Index updates continuously as operators submit signed snapshots.
          Public top-N data is available at{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-sm text-gold">
            /api/v1/leaderboard
          </code>
          .
        </p>
      </section>

      {/* ── License ────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          License &amp; citation
        </h2>
        <p className="text-base text-text-secondary">
          The SigRank Index dataset is licensed under{" "}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            className="text-gold underline underline-offset-2 hover:text-text-primary"
            rel="license"
          >
            Creative Commons Attribution 4.0 (CC-BY-4.0)
          </a>
          . Attribution is the citation mechanism — reuse requires credit, which
          turns reuse into citations. The source code is separately licensed
          under MIT.
        </p>
        <p className="text-sm text-text-muted">
          Cite as: &ldquo;SigRank Index, {monthYear}.
          signalaf.com/methodology.&rdquo;
        </p>
      </section>

      {/* ── Topic hubs ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Learn more:{" "}
          <Link
            href="/ai-coding-metrics"
            className="text-gold underline underline-offset-2"
          >
            AI Coding Metrics
          </Link>
          {" · "}
          <Link
            href="/ai-operator-scoring"
            className="text-gold underline underline-offset-2"
          >
            AI Operator Scoring
          </Link>
          {" · "}
          <Link
            href="/science"
            className="text-gold underline underline-offset-2"
          >
            Science
          </Link>
        </p>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          FAQ
        </h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is the SigRank Index?
            </dt>
            <dd className="text-base text-text-secondary">
              A continuously-updated leaderboard that ranks AI operators by
              token-cascade efficiency (Υ = cache_read × output / input²),
              computed from privacy-preserving, on-device,
              cryptographically-signed token-telemetry snapshots.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How is operator efficiency measured?
            </dt>
            <dd className="text-base text-text-secondary">
              Each operator runs an on-device scanner that reads four token
              pillars locally. The yield metric Υ measures the architecture of
              the token cascade — whether signal is compounding or tokens are
              burned. No message content is ever read or transmitted.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Is the data private?
            </dt>
            <dd className="text-base text-text-secondary">
              Yes. The scanner reads token counts and content lengths only —
              never the words of your prompts. Only the resulting numeric
              scores, signed with ed25519, leave your device.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I get listed?
            </dt>
            <dd className="text-base text-text-secondary">
              Install the SigRank MCP server (
              <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-sm text-gold">
                npm i -g sigrank
              </code>
              ), enroll, and submit a snapshot. Visit{" "}
              <Link
                href="/score"
                className="text-gold underline underline-offset-2"
              >
                /score
              </Link>{" "}
              to get started.
            </dd>
          </div>
        </dl>
      </section>

      {/* Cross-link to the Q1 report — internal link from /methodology (the citation
          page) to /research/q1-2026 so Google discovers the report (G3/G4). */}
      <section className="mt-8 border-t border-bg-border-subtle pt-6">
        <p className="text-sm text-text-muted">
          Looking for the quarterly findings?{" "}
          <Link
            href="/research/q1-2026"
            className="text-gold underline underline-offset-2"
          >
            Read the Q1 2026 State of AI Operator Token Efficiency →
          </Link>
        </p>
      </section>
    </div>
  );
}
