/**
 * components/marketing/FourDegreesChart.tsx — "The Four Degrees of Leverage"
 * (owner content, Devins_Plans/three_degree_comparison.md, 2026-06-22).
 *
 * A map of how far work travels: AA 7:2:1 modeled baseline → the wild field median
 * → a clean compounding operator → the top eval. Shared component, two variants:
 *   - 'embed'  (landing): footnote/source markers ABOVE the chart + a link to the
 *     full description in the wiki. Compact.
 *   - 'full'   (wiki): the whole file — the comparison table, the 10xDEV log read,
 *     the full Sources & provenance, metric definitions, and footnotes.
 *
 * Content is reproduced near-verbatim from the source markdown. Token counts only —
 * never prompt content. Pure presentational server component.
 */

import React from "react";
import Link from "next/link";
import {
  getTopOperatorColumn,
  getAverageUsersColumn,
  getPowerUsersColumn,
  GOLD_FALLBACK,
  AVG_FALLBACK,
  POWER_FALLBACK,
  AA_BASELINE,
  type GoldColumn,
} from "@/lib/marketing/top-operator-column";

type Variant = "full" | "embed";

/** The headline comparison table — the four degrees across seven metrics.
 * Owner-facing column headers (owner 2026-06-22, updated 2026-07-14, expanded to 4
 * degrees 2026-07-17). The first column is a static modeled baseline; the rest are
 * LIVE from the all-time board, filtered to the Human Center of Mass
 * (bots/outliers with input/total < 0.1% or > 80% are categorized separately):
 *   - "AA baseline"   = the Artificial Analysis 7:2:1 modeled reference (static)
 *   - "Human Center of Mass" = median of all real human operators (the typical operator)
 *   - "Power users"   = median of the top 100 real human operators (the typical elite)
 *   - "Top Evals"     = the single top real human operator (gold column)
 * `tone`: 'muted' = AA baseline, 'white' = HCM + Power user columns, 'gold' = Top Evals. */
const COLS: { label: string; tone: "muted" | "white" | "gold" }[] = [
  { label: "AA baseline§", tone: "muted" },
  { label: "Human Center of Mass*", tone: "white" },
  { label: "Power users†", tone: "white" },
  { label: "Top Evals to date‡", tone: "gold" },
];

function buildRows(
  aa: GoldColumn,
  avg: GoldColumn,
  power: GoldColumn,
  gold: GoldColumn,
): { metric: string; vals: [string, string, string, string]; winner: 3 }[] {
  return [
    { metric: "Υ Yield", vals: [aa.yield_, avg.yield_, power.yield_, gold.yield_], winner: 3 },
    { metric: "SNR", vals: [aa.snr, avg.snr, power.snr, gold.snr], winner: 3 },
    {
      metric: "Velocity (O/I)",
      vals: [aa.velocity, avg.velocity, power.velocity, gold.velocity],
      winner: 3,
    },
    {
      metric: "Leverage (CR/I)",
      vals: [aa.leverage, avg.leverage, power.leverage, gold.leverage],
      winner: 3,
    },
    {
      metric: "10xDEV (log₁₀)",
      vals: [aa.dev10x, avg.dev10x, power.dev10x, gold.dev10x],
      winner: 3,
    },
    {
      metric: "Efficiency (vs AA 4.0)",
      vals: [aa.efficiency, avg.efficiency, power.efficiency, gold.efficiency],
      winner: 3,
    },
    {
      metric: "Operating Ratio (C:I:O)",
      vals: [aa.opRatio, avg.opRatio, power.opRatio, gold.opRatio],
      winner: 3,
    },
  ];
}

/** 10xDEV log-anchor read — exponent, not multiplier. */
function buildDevRows(
  aa: GoldColumn,
  avg: GoldColumn,
  power: GoldColumn,
  gold: GoldColumn,
): { degree: string; dev: string; linear: string }[] {
  return [
    { degree: "AA baseline (7:2:1 modeled reference)", dev: aa.dev10x, linear: aa.devLinear },
    { degree: "Human Center of Mass (median, all human operators)*", dev: avg.dev10x, linear: avg.devLinear },
    { degree: "Power-user median (top 100)", dev: power.dev10x, linear: power.devLinear },
    {
      degree: "Top operator to date",
      dev: gold.dev10x,
      linear: gold.devLinear,
    },
  ];
}

function ComparisonTable({ rows }: { rows: ReturnType<typeof buildRows> }) {
  const ROWS = rows;
  return (
    <div className="overflow-x-auto rounded-xl border border-gold/30 bg-bg-surface">
      <table className="w-full border-collapse font-mono text-lg sm:text-xl">
        <thead>
          <tr className="border-b border-bg-border">
            <th className="px-4 py-4 text-left text-sm font-bold uppercase tracking-wide text-text-primary sm:text-base">
              Metric
            </th>
            {COLS.map((c) => (
              <th
                key={c.label}
                className={
                  "px-4 py-4 text-right text-sm font-bold sm:text-base " +
                  (c.tone === "gold" ? "text-gold" : c.tone === "muted" ? "text-text-muted" : "text-white")
                }
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr
              key={r.metric}
              className="border-b border-bg-border-subtle last:border-b-0"
            >
              <td className="px-4 py-3 text-left font-bold text-text-primary">
                {r.metric}
              </td>
              {r.vals.map((v, i) => (
                <td
                  key={i}
                  className={
                    "px-4 py-3 text-right font-bold tabular-nums " +
                    (i === r.winner
                      ? "text-xl text-gold sm:text-2xl"
                      : i === 0
                        ? "text-lg text-text-muted sm:text-xl"
                        : "text-lg text-white/85 sm:text-xl")
                  }
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DevTable({ rows }: { rows: ReturnType<typeof buildDevRows> }) {
  const DEV_ROWS = rows;
  return (
    <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b border-bg-border">
            <th className="px-3 py-2.5 text-left font-bold text-text-muted">
              Degree
            </th>
            <th className="px-3 py-2.5 text-right font-bold text-text-secondary">
              10xDEV
            </th>
            <th className="px-3 py-2.5 text-right font-bold text-text-secondary">
              Linear amplification (10^x)
            </th>
          </tr>
        </thead>
        <tbody>
          {DEV_ROWS.map((r) => (
            <tr
              key={r.degree}
              className="border-b border-bg-border-subtle last:border-b-0"
            >
              <td className="px-3 py-2 text-left text-text-primary">
                {r.degree}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-text-secondary">
                {r.dev}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-text-secondary">
                {r.linear}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Compact source markers shown ABOVE the chart on the landing (owner: "footnotes
 * to mark sources before the chart"). */
function SourceMarkers() {
  return (
    <p className="font-sans text-[11px] leading-relaxed text-text-muted">
      <span className="text-text-secondary">Sources:</span> the AA baseline is a
      static modeled reference (7:2:1 cache-read : cache-write : input ratio from{" "}
      <a
        href="https://artificialanalysis.ai"
        className="text-text-accent underline-offset-2 hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        Artificial Analysis
      </a>{" "}
      pricing data). The other three columns are{" "}
      <em>measured live</em> from the{" "}
      <Link
        href="/board/all"
        className="text-text-accent underline-offset-2 hover:underline"
      >
        all-time board
      </Link>{" "}
      (auto-pulled at render). Human Center of Mass = median of all real operators;
      Power users = median of the top 100 by yield; Top Evals = the single leading
      operator. All derived from canonical four-pillar token telemetry. Token counts
      only.
    </p>
  );
}

/** Full Sources & provenance block (wiki variant). */
function Provenance() {
  return (
    <div className="flex flex-col gap-4 font-sans text-xs leading-relaxed text-text-muted">
      <h3 className="font-mono text-sm font-bold text-text-primary">
        Sources &amp; provenance
      </h3>

      <div>
        <p className="font-mono text-[11px] font-bold text-text-secondary">
          AA baseline (7:2:1 modeled reference) · <span className="text-text-muted">static</span>
        </p>
        <p>
          The Artificial Analysis pricing baseline sets a 7:2:1 ratio for
          cache-read : cache-write : fresh input. This is a modeled reference
          point, not live data — it represents the &ldquo;average AI user&rdquo;
          operating ratio of 3.5:1:0.5 (cache-read : input : output). Efficiency
          is 1.00 by definition: all other operators are measured against this.
          Source:{" "}
          <a
            href="https://artificialanalysis.ai"
            className="text-text-accent underline-offset-2 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Artificial Analysis
          </a>{" "}
          pricing data.
        </p>
      </div>

      <div>
        <p className="font-mono text-[11px] font-bold text-text-secondary">
          Top operator to date · <span className="text-gold">measured live</span>
        </p>
        <p>
          The top real operator on the live SigRank all-time board (auto-pulled
          at render via the same operatorTotal path the board uses). Derived from
          canonical four-pillar token telemetry (input / output / cache_create /
          cache_read). Token counts only, no prompt content. Source:{" "}
          <Link
            href="/board/all"
            className="text-text-accent underline-offset-2 hover:underline"
          >
            signalaf.com/board/all
          </Link>
          .
        </p>
      </div>

      <div>
        <p className="font-mono text-[11px] font-bold text-text-secondary">
          Power users (top 100 median) · <span className="text-gold">measured live</span>
        </p>
        <p>
          The median of the top 100 real operators on the all-time board, ranked
          by Υ Yield. Median, not mean: the top 100 is right-skewed (the top 5
          have yields 10-100× higher than the rest), so the median is the honest
          &ldquo;typical elite performer&rdquo; — the operator ranked ~50th out
          of the top 100. Source:{" "}
          <Link
            href="/board/all"
            className="text-text-accent underline-offset-2 hover:underline"
          >
            signalaf.com/board/all
          </Link>
          .
        </p>
      </div>

      <div>
        <p className="font-mono text-[11px] font-bold text-text-secondary">
          Average users (all operators median) · <span className="text-gold">measured live</span>
        </p>
        <p>
          The median of ALL real operators on the all-time board. Median, not
          mean: the board is heavily right-skewed (a single IGNITER-class
          operator with 9 quadrillion input tokens pulls the mean yield to 427
          vs the median of 2.5 — a 170× spread). The median is the exact 50th
          percentile, immune to any outlier no matter how extreme. The trimmed
          mean (drop 5% each end) still lands at 17.6 vs 2.5 — still pulled by
          the upper-middle. Median is the cleanest cut. Source:{" "}
          <Link
            href="/board/all"
            className="text-text-accent underline-offset-2 hover:underline"
          >
            signalaf.com/board/all
          </Link>
          .
        </p>
      </div>

      <div>
        <p className="font-mono text-[11px] font-bold text-text-secondary">
          Why median, not mean
        </p>
        <p>
          Token-cascade metrics are not normally distributed. They follow a
          power law: a few operators compound signal at extreme rates while the
          long tail burns tokens. The mean is dragged toward the extremes; the
          median sits at the honest middle. For the &ldquo;typical
          operator&rdquo; column, the median answers &ldquo;what does the
          operator at the 50th percentile look like?&rdquo; — which is the
          question the chart asks. A mean would answer &ldquo;what would you get
          if you pooled everyone&apos;s tokens and divided evenly?&rdquo; — which
          is a different question, and not a useful one when the distribution is
          this skewed.
        </p>
      </div>

      <div>
        <p className="font-mono text-[11px] font-bold text-text-secondary">
          Metric definitions
        </p>
        <p className="font-mono text-[11px]">
          SNR = O/(I+O) · Velocity = O/I · Leverage = cache_read/I · 10xDEV =
          log₁₀(transmission × commitment × reuse) · Efficiency = (cache+O)/I ÷
          4.0 (AA baseline 4.0 = (7+1)/2) · Υ = (cache_read × O) / I² ·
          Operating Ratio = cache : input=1 : output. Telescoping identity:
          (O/I)(C_create/O)(C_read/C_create) = cache_read/input, so 10^10xDEV =
          Leverage.
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-bg-border-subtle pt-3 text-[11px] text-text-dim">
        <p>
          <span className="text-text-muted">§</span>{" "}
          <strong>AA baseline</strong>: the Artificial Analysis 7:2:1 modeled
          reference (3.5:1:0.5 operating ratio). Static — not live data.
          Efficiency = 1.00 by definition.
        </p>
        <p>
          <span className="text-text-muted">*</span>{" "}
          <strong>Human Center of Mass</strong>: median of all real operators on
          the all-time board, computed live at render. Excludes staged seeds, The
          Field, and retired/anonymized rows.
        </p>
        <p>
          <span className="text-text-muted">†</span>{" "}
          <strong>Power users</strong>: median of the top 100 real operators by
          Υ Yield on the all-time board, computed live at render.
        </p>
        <p>
          <span className="text-text-muted">‡</span>{" "}
          <strong>Top Evals to date</strong>: the single top real operator on
          the all-time board, computed live at render.
        </p>
      </div>
    </div>
  );
}

export async function FourDegreesChart({
  variant = "full",
}: {
  variant?: Variant;
}) {
  // Four columns:
  //   aa    = AA 7:2:1 modeled baseline (static, not live)
  //   avg   = median of ALL real operators (the typical operator)
  //   power = median of the top 100 real operators (the typical elite)
  //   gold  = the single top real operator
  // The live columns fall back to frozen reference values when the board has no
  // qualifying data.
  const [avgCol, powerCol, goldCol] = await Promise.all([
    getAverageUsersColumn(),
    getPowerUsersColumn(),
    getTopOperatorColumn(),
  ]);
  const aa = AA_BASELINE;
  const avg = avgCol ?? AVG_FALLBACK;
  const power = powerCol ?? POWER_FALLBACK;
  const gold = goldCol ?? GOLD_FALLBACK;
  const rows = buildRows(aa, avg, power, gold);
  const devRows = buildDevRows(aa, avg, power, gold);

  // 10xDEV deltas vs the reference degrees, computed from the live values so the
  // wiki bullets never drift. Linear = 10^delta.
  const goldDev = Number(gold.dev10x) || 0;
  const aaDev = Number(aa.dev10x) || 0;
  const avgDev = Number(avg.dev10x) || 0;
  const powerDev = Number(power.dev10x) || 0;
  const devVsAA = goldDev - aaDev;
  const devVsAvg = goldDev - avgDev;
  const devVsPower = goldDev - powerDev;
  const fmtDelta = (d: number) =>
    `+${d.toFixed(2)} decades = ~${Math.round(10 ** d)}×`;

  if (variant === "embed") {
    return (
      <div className="flex flex-col gap-3">
        {/* eyebrow OUTSIDE the box (owner 2026-06-22) */}
        <div className="font-mono text-sm uppercase tracking-[0.2em] text-gold sm:text-base">
          ⊙ The four degrees of leverage
        </div>

        <section className="box-glow flex flex-col gap-5 rounded-2xl border border-gold/25 bg-gradient-to-b from-gold/5 to-bg-surface p-6 sm:p-8">
          {/* Comparison table LEADS (owner 2026-07-02: table-first, explanation below).
              The 1/3 + 2/3 headline/walkthrough split that used to sit above the table
              now lives below it as a full-width explanation block. */}
          <ComparisonTable rows={rows} />

          {/* under-chart footnote (owner 2026-06-22) */}
          <p className="font-mono text-[11px] text-text-muted">
            † Power users: median of the top 100 real operators by Υ Yield.
          </p>

          {/* footnotes/sources (owner: kept with the table) */}
          <SourceMarkers />

          {/* Explanation — headline + the C:I:O cascade walkthrough, full width
              (owner 2026-07-02: was a 1/3 + 2/3 split above the table; now below it,
              full-width, since the table is the lead). */}
          <div className="mt-2 flex flex-col gap-4 border-t border-bg-border-subtle pt-6">
            <h2 className="text-3xl font-bold leading-[1.05] tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
              The baseline builds. The field caches.{" "}
              <span className="text-gold">A few compound.</span>
            </h2>
            <div className="flex flex-col gap-3 text-base font-medium leading-relaxed text-text-secondary sm:text-lg">
              <p>
                Read it as a token cascade:{" "}
                <strong className="text-text-primary">
                  Cache : Input : Output
                </strong>
                . The AA baseline at{" "}
                <strong className="text-text-muted">{aa.opRatio}</strong> is the
                modeled reference — the average AI user. The median operator on
                the board sits at{" "}
                <strong className="text-text-primary">{avg.opRatio}</strong>{" "}
                (the second column) — the typical operator, the 50th percentile
                of everyone measured.
              </p>
              <p>
                The median of the{" "}
                <strong className="text-text-primary">top 100</strong> operators
                lands at{" "}
                <strong className="text-text-primary">{power.opRatio}</strong>.
                What they give up in output they bank in cache — the typical
                elite performer.
              </p>
              <p>
                The top operator on the live board sits at{" "}
                <strong className="text-gold">{gold.opRatio}</strong>: every
                input token returns multiple outputs while carrying a deep
                cache. That&apos;s the eval to beat.
              </p>
            </div>
          </div>

          <Link
            href="/wiki/four-degrees"
            className="w-fit font-mono text-sm font-semibold text-text-accent underline-offset-2 hover:underline"
          >
            Full description, the 10xDEV log read &amp; full provenance →
          </Link>
        </section>
      </div>
    );
  }

  // 'full' — the whole file, for the wiki.
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-text-primary">
          The Four Degrees of Leverage
        </h1>
        <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
          Read it as a token cascade:{" "}
          <strong className="text-text-primary">Cache : Input : Output</strong>.
          The AA baseline sits at{" "}
          <strong className="text-text-muted">{aa.opRatio}</strong> — the modeled
          average AI user. The median operator on the all-time board sits at{" "}
          <strong className="text-text-primary">{avg.opRatio}</strong> — the
          typical operator, the 50th percentile of everyone measured. The median
          of the top 100 lands at{" "}
          <strong className="text-text-primary">{power.opRatio}</strong>, output
          traded for cache. The top operator on the live board is{" "}
          <strong className="text-gold">{gold.opRatio}</strong>: every input
          returns multiple outputs on a deep cache. Four degrees of leverage,
          each a real skill, and the distance between them learnable. The last
          three columns are measured live from the{" "}
          <Link
            href="/board/all"
            className="text-text-accent underline-offset-2 hover:underline"
          >
            all-time board
          </Link>
          .
        </p>
      </div>

      <SourceMarkers />
      <ComparisonTable rows={rows} />

      <div className="flex flex-col gap-3">
        <h2 className="font-mono text-lg font-bold text-text-primary">
          10xDEV read on the log anchor
        </h2>
        <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
          10xDEV is an exponent, not a multiplier: each whole point is a 10×
          jump in real cascade amplification (linear = 10^10xDEV).
        </p>
        <DevTable rows={devRows} />
        <ul className="flex flex-col gap-1 font-sans text-sm text-text-muted">
          <li>
            Top operator vs AA baseline:{" "}
            <strong className="text-text-secondary">
              {fmtDelta(devVsAA)} more amplification
            </strong>
          </li>
          <li>
            Top operator vs median operator:{" "}
            <strong className="text-text-secondary">
              {fmtDelta(devVsAvg)} more
            </strong>
          </li>
          <li>
            Top operator vs top-100 median:{" "}
            <strong className="text-text-secondary">
              {fmtDelta(devVsPower)} more
            </strong>
          </li>
        </ul>
        <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-muted">
          10xDEV is an anchor: the telescoping identity (10^10xDEV =
          cache_read/input) locks the exponent to leverage, so it can&apos;t be
          inflated independently; it has to be earned through the full cascade.
          Gaining two full points is ~2 orders of magnitude of real
          amplification, which is why it moves slowly and means a lot.
        </p>
      </div>

      <Provenance />

      <p className="font-sans text-[11px] italic text-text-dim">
        All signal is monitored. All drift is noted. · SigRank · MO§ES™ · Ello
        Cello LLC · Token counts only, never prompt content.
      </p>
    </div>
  );
}
