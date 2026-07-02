/**
 * components/marketing/ThreeDegreesChart.tsx — "The Three Degrees of Leverage"
 * (owner content, Devins_Plans/three_degree_comparison.md, 2026-06-22).
 *
 * A map of how far work travels: AA 7:2:1 modeled baseline → the wild field median
 * → a clean compounding operator. Shared component, two variants:
 *   - 'embed'  (landing): footnote/source markers ABOVE the chart + a link to the
 *     full description in the wiki. Compact.
 *   - 'full'   (wiki): the whole file — the comparison table, the 10xDEV log read,
 *     the full Sources & provenance, metric definitions, and footnotes.
 *
 * Content is reproduced near-verbatim from the source markdown. Token counts only —
 * never prompt content. Pure presentational server component.
 */

import React from 'react'
import Link from 'next/link'
import { getTopOperatorColumn, type GoldColumn } from '@/lib/marketing/top-operator-column'

type Variant = 'full' | 'embed'

/** The headline comparison table — the three degrees across seven metrics.
 * Owner-facing column headers (owner 2026-06-22). The provenance footnotes below the
 * table keep the precise, truthful framing (modeled baseline / power-user median / clean
 * observer-stripped seed) — these headers are the plain-language read.
 * `tone`: 'white' = Average + Power user columns, 'gold' = the Top Evals column. */
const COLS: { label: string; tone: 'white' | 'gold' }[] = [
  { label: 'Average Users*', tone: 'white' },
  { label: 'Power users†', tone: 'white' },
  { label: 'Top Evals to date‡', tone: 'gold' },
]
// Gold column = the top REAL operator currently leading the live board, on the ALL-TIME
// window (lib/marketing/top-operator-column.ts). It auto-pulls the canonical board
// compute at render, so the chart tracks "whoever leads" + can never disagree with the
// board. `gold` is null when there's no qualifying real operator yet → these FALLBACK
// literals (the last known real read, MO§ES™ all-time 2026-06-27) are used instead.
const GOLD_FALLBACK: GoldColumn = {
  yield_: '488.65',
  snr: '0.58',
  velocity: '1.36',
  leverage: '360.2×',
  dev10x: '2.56',
  efficiency: '93.17',
  opRatio: '360 : 1 : 1.36',
  devLinear: '360×',
}

function buildRows(gold: GoldColumn): { metric: string; vals: [string, string, string]; winner: 2 }[] {
  return [
    { metric: 'Υ Yield', vals: ['1.57', '1.51', gold.yield_], winner: 2 },
    { metric: 'SNR', vals: ['0.33', '0.07', gold.snr], winner: 2 },
    { metric: 'Velocity (O/I)', vals: ['0.50', '0.08', gold.velocity], winner: 2 },
    { metric: 'Leverage (CR/I)', vals: ['3.2×', '22.3×', gold.leverage], winner: 2 },
    { metric: '10xDEV (log₁₀)', vals: ['0.50', '1.35', gold.dev10x], winner: 2 },
    { metric: 'Efficiency (vs AA 4.0)', vals: ['1.00', '5.61', gold.efficiency], winner: 2 },
    { metric: 'Operating Ratio (C:I:O)', vals: ['3.5 : 1 : 0.50', '22 : 1 : 0.08', gold.opRatio], winner: 2 },
  ]
}

/** 10xDEV log-anchor read — exponent, not multiplier. */
function buildDevRows(gold: GoldColumn): { degree: string; dev: string; linear: string }[] {
  return [
    { degree: 'Average users (AA 7:2:1)*', dev: '0.50', linear: '3.2×' },
    { degree: 'Power-user median', dev: '1.35', linear: '22.4×' },
    { degree: 'Top operator to date', dev: gold.dev10x, linear: gold.devLinear },
  ]
}

function ComparisonTable({ rows }: { rows: ReturnType<typeof buildRows> }) {
  const ROWS = rows
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
                  'px-4 py-4 text-right text-sm font-bold sm:text-base ' +
                  (c.tone === 'gold' ? 'text-gold' : 'text-white')
                }
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.metric} className="border-b border-bg-border-subtle last:border-b-0">
              <td className="px-4 py-3 text-left font-bold text-text-primary">{r.metric}</td>
              {r.vals.map((v, i) => (
                <td
                  key={i}
                  className={
                    'px-4 py-3 text-right font-bold tabular-nums ' +
                    (i === r.winner
                      ? 'text-xl text-gold sm:text-2xl'
                      : 'text-lg text-white/85 sm:text-xl')
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
  )
}

function DevTable({ rows }: { rows: ReturnType<typeof buildDevRows> }) {
  const DEV_ROWS = rows
  return (
    <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b border-bg-border">
            <th className="px-3 py-2.5 text-left font-bold text-text-muted">Degree</th>
            <th className="px-3 py-2.5 text-right font-bold text-text-secondary">10xDEV</th>
            <th className="px-3 py-2.5 text-right font-bold text-text-secondary">
              Linear amplification (10^x)
            </th>
          </tr>
        </thead>
        <tbody>
          {DEV_ROWS.map((r) => (
            <tr key={r.degree} className="border-b border-bg-border-subtle last:border-b-0">
              <td className="px-3 py-2 text-left text-text-primary">{r.degree}</td>
              <td className="px-3 py-2 text-right tabular-nums text-text-secondary">{r.dev}</td>
              <td className="px-3 py-2 text-right tabular-nums text-text-secondary">{r.linear}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Compact source markers shown ABOVE the chart on the landing (owner: "footnotes
 * to mark sources before the chart"). */
function SourceMarkers() {
  return (
    <p className="font-sans text-[11px] leading-relaxed text-text-muted">
      <span className="text-text-secondary">Sources:</span> the top operator is{' '}
      <em>measured live</em> from the{' '}
      <Link href="/board/all" className="text-text-accent underline-offset-2 hover:underline">
        all-time board
      </Link>{' '}
      (auto-pulled, refreshed daily); the power-user median is a measured survey (n=10). Both derived
      from canonical four-pillar token telemetry. Token counts only.{' '}
      <span className="text-text-secondary">AA 7:2:1</span> is a{' '}
      <em>modeled</em> baseline from{' '}
      <a
        href="https://artificialanalysis.ai/methodology"
        target="_blank"
        rel="noopener noreferrer"
        className="text-text-accent underline-offset-2 hover:underline"
      >
        Artificial Analysis methodology
      </a>{' '}
      (not measured; a reference floor).
    </p>
  )
}

/** Full Sources & provenance block (wiki variant). */
function Provenance() {
  return (
    <div className="flex flex-col gap-4 font-sans text-xs leading-relaxed text-text-muted">
      <h3 className="font-mono text-sm font-bold text-text-primary">Sources &amp; provenance</h3>

      <div>
        <p className="font-mono text-[11px] font-bold text-text-secondary">
          Top operator to date · <span className="text-gold">measured</span>
        </p>
        <p>
          The top real operator on the live SigRank board so far (MO§ES™ — the owner&apos;s own
          observer-stripped run). Source:{' '}
          <a
            href="https://signalaf.com/compare?a=signal-92b4f9f485&b=the-field"
            className="text-text-accent underline-offset-2 hover:underline"
          >
            signalaf.com/compare
          </a>{' '}
          (retrieved 2026-06-27, canonical board compute). Derived from canonical four-pillar token
          telemetry (input / output / cache_create / cache_read). Token counts only, no prompt content.
        </p>
      </div>

      <div>
        <p className="font-mono text-[11px] font-bold text-text-secondary">
          Power-user median (n=10) · <span className="text-gold">measured</span>
        </p>
        <p>
          Operators #5–14 of the live board (public tokscale.ai footprints surfaced on SigRank).
          Median, not mean: n=10 is small and right-skewed (one operator = 64% of the field&apos;s
          total tokens), so the median is the honest &ldquo;typical operator.&rdquo; Source:{' '}
          <a
            href="https://signalaf.com/board/30d"
            className="text-text-accent underline-offset-2 hover:underline"
          >
            signalaf.com/board/30d
          </a>{' '}
          (retrieved 2026-06-21).
        </p>
      </div>

      <div>
        <p className="font-mono text-[11px] font-bold text-text-secondary">
          Average users (AA 7:2:1) · <span className="text-text-dim uppercase">modeled, not measured</span>
        </p>
        <p>
          A synthetic reference operator built from the Artificial Analysis blended-price ratio:{' '}
          <em>
            &ldquo;we calculate a blended price assuming a 7:2:1 ratio of cache hit, input, and output
            tokens&rdquo;
          </em>{' '}
          (
          <a
            href="https://artificialanalysis.ai/methodology"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-accent underline-offset-2 hover:underline"
          >
            Artificial Analysis methodology
          </a>
          ){' '}
          (retrieved 2026-06-21). Ratio cache:input:output = 7:2:1 → input-normalized 3.5:1:0.50. The
          cache term was split create/read (cw=0.7, cr=6.3) to give the reference a defined cascade
          (a modeling choice). This row is a constructed reference, not telemetry from a real operator.
          Do not cite as measured.
        </p>
      </div>

      <div>
        <p className="font-mono text-[11px] font-bold text-text-secondary">Metric definitions</p>
        <p className="font-mono text-[11px]">
          SNR = O/(I+O) · Velocity = O/I · Leverage = cache_read/I · 10xDEV = log₁₀(transmission ×
          commitment × reuse) · Efficiency = (cache+O)/I ÷ 4.0 (AA baseline 4.0 = (7+1)/2) · Υ =
          (cache_read × O) / I² · Operating Ratio = cache : input=1 : output. Telescoping identity:
          (O/I)(C_create/O)(C_read/C_create) = cache_read/input, so 10^10xDEV = Leverage.
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-bg-border-subtle pt-3 text-[11px] text-text-dim">
        <p>
          <span className="text-text-muted">*</span> <strong>Modeled baseline</strong>: synthesized
          from the AA 7:2:1 ratio, not measured. The cache create/read split is a modeling assumption.
          Treat as a reference floor, not a real operator&apos;s telemetry.
        </p>
        <p>
          <span className="text-text-muted">‡</span> <strong>Top operator to date</strong>: the
          gold column is the highest real operator measured on the live board so far (MO§ES™, the
          owner). The claude-mem memory observer (an MCP that auto-prompts memory, low-input/high-output)
          inflated the raw owner row by ~25% of output; the figure shown here is the observer-stripped
          read. The inflated vs clean pair is shown openly on the live board, the instrument measuring
          its own contamination and removing it.
        </p>
      </div>
    </div>
  )
}

export async function ThreeDegreesChart({ variant = 'full' }: { variant?: Variant }) {
  // Auto-pull the current top real operator (all-time) for the gold column; fall back to
  // the last-known real read when the board has no qualifying real operator yet.
  const gold = (await getTopOperatorColumn()) ?? GOLD_FALLBACK
  const rows = buildRows(gold)
  const devRows = buildDevRows(gold)

  // 10xDEV deltas vs the two reference degrees (AA 0.50 / power-user 1.35), computed from
  // the live gold dev10x so the wiki bullets never drift. Linear = 10^delta.
  const goldDev = Number(gold.dev10x) || 0
  const devVsAA = goldDev - 0.5
  const devVsPower = goldDev - 1.35
  const fmtDelta = (d: number) => `+${d.toFixed(2)} decades = ~${Math.round(10 ** d)}×`

  if (variant === 'embed') {
    return (
      <div className="flex flex-col gap-3">
        {/* eyebrow OUTSIDE the box (owner 2026-06-22) */}
        <div className="font-mono text-sm uppercase tracking-[0.2em] text-gold sm:text-base">
          ⊙ The three degrees of leverage
        </div>

        <section className="box-glow flex flex-col gap-5 rounded-2xl border border-gold/25 bg-gradient-to-b from-gold/5 to-bg-surface p-6 sm:p-8">
          {/* Comparison table LEADS (owner 2026-07-02: table-first, explanation below).
              The 1/3 + 2/3 headline/walkthrough split that used to sit above the table
              now lives below it as a full-width explanation block. */}
          <ComparisonTable rows={rows} />

          {/* under-chart footnote (owner 2026-06-22) */}
          <p className="font-mono text-[11px] text-text-muted">
            † Power users: median ~500 billion total tokens (n=10).
          </p>

          {/* footnotes/sources (owner: kept with the table) */}
          <SourceMarkers />

          {/* Explanation — headline + the C:I:O cascade walkthrough, full width
              (owner 2026-07-02: was a 1/3 + 2/3 split above the table; now below it,
              full-width, since the table is the lead). */}
          <div className="mt-2 flex flex-col gap-4 border-t border-bg-border-subtle pt-6">
            <h2 className="text-3xl font-bold leading-[1.05] tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
              The baseline builds. The field caches.{' '}
              <span className="text-gold">A few compound.</span>
            </h2>
            <div className="flex flex-col gap-3 text-base font-medium leading-relaxed text-text-secondary sm:text-lg">
              <p>
                Read it as a token cascade: <strong className="text-text-primary">Cache : Input : Output</strong>.
                Research pegs the average user near <strong className="text-text-primary">7 : 2 : 1</strong>, so
                it takes about 2 input tokens to produce 1 output, riding a cache of roughly 7.
                Input-normalized, that&apos;s <strong className="text-text-primary">3.5 : 1 : 0.5</strong> (the
                leftmost column).
              </p>
              <p>
                We surveyed 10 <strong className="text-text-primary">power users</strong> with a median around
                500B total tokens, and they land near{' '}
                <strong className="text-text-primary">22 : 1 : 0.08</strong>. What they give up in output they
                bank in cache.
              </p>
              <p>
                The top operator on the live board sits at{' '}
                <strong className="text-gold">{gold.opRatio}</strong>: every input token returns multiple
                outputs while carrying a deep cache. That&apos;s the eval to beat.
              </p>
            </div>
          </div>

          <Link
            href="/wiki/three-degrees"
            className="w-fit font-mono text-sm font-semibold text-text-accent underline-offset-2 hover:underline"
          >
            Full description, the 10xDEV log read &amp; full provenance →
          </Link>
        </section>
      </div>
    )
  }

  // 'full' — the whole file, for the wiki.
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-text-primary">
          The Three Degrees of Leverage
        </h1>
        <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
          Read it as a token cascade: <strong className="text-text-primary">Cache : Input : Output</strong>.
          Research pegs the average user near <strong className="text-text-primary">7 : 2 : 1</strong> (~2
          input tokens per output, on a ~7 cache); input-normalized that&apos;s{' '}
          <strong className="text-text-primary">3.5 : 1 : 0.5</strong>. We surveyed 10 power users (median
          ~500B total tokens) at about <strong className="text-text-primary">22 : 1 : 0.08</strong>, output
          traded for cache. The top operator on the live board is{' '}
          <strong className="text-gold">{gold.opRatio}</strong>: every input returns multiple outputs on a deep
          cache. Three degrees of leverage, each a real skill, and the distance between them learnable.
        </p>
      </div>

      <SourceMarkers />
      <ComparisonTable rows={rows} />

      <div className="flex flex-col gap-3">
        <h2 className="font-mono text-lg font-bold text-text-primary">10xDEV read on the log anchor</h2>
        <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
          10xDEV is an exponent, not a multiplier: each whole point is a 10× jump in real cascade
          amplification (linear = 10^10xDEV).
        </p>
        <DevTable rows={devRows} />
        <ul className="flex flex-col gap-1 font-sans text-sm text-text-muted">
          <li>
            Top operator vs AA baseline:{' '}
            <strong className="text-text-secondary">{fmtDelta(devVsAA)} more amplification</strong>
          </li>
          <li>
            Top operator vs power-user median:{' '}
            <strong className="text-text-secondary">{fmtDelta(devVsPower)} more</strong>
          </li>
        </ul>
        <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-muted">
          10xDEV is an anchor: the telescoping identity (10^10xDEV = cache_read/input) locks the
          exponent to leverage, so it can&apos;t be inflated independently; it has to be earned
          through the full cascade. Gaining two full points is ~2 orders of magnitude of real
          amplification, which is why it moves slowly and means a lot.
        </p>
      </div>

      <Provenance />

      <p className="font-sans text-[11px] italic text-text-dim">
        All signal is monitored. All drift is noted. · SigRank · MO§ES™ · Ello Cello LLC · Token counts
        only, never prompt content.
      </p>
    </div>
  )
}
