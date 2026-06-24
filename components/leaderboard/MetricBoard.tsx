/**
 * components/leaderboard/MetricBoard.tsx
 *
 * Shared per-metric leaderboard board used by every /metrics/<slug> sub-page.
 * This is a SERVER component: it awaits getMetricLeaders(metricKey, { window })
 * and renders a ranked table for the single metric identified by `metricKey`.
 *
 * Rules honored:
 *  - Anonymous-by-default: UNCLAIMED operators show codename only; CLAIMED show
 *    display_name + a "✓ Claimed" pill (<ClaimedBadge/>). Never invent PII.
 *  - class_tier rendered UPPERCASE in display (per group brief).
 *  - Placeholder rows get the gold-star <Placeholder/> marker; real rows get a
 *    <CanonId/> superscript tracing back to the metric's canonical id.
 *  - M.02 Prompt Complexity carries a low-confidence flag: a leading '~' and a
 *    'low' tag when the value is a free-tier estimate.
 *
 * No 'use client' here — the page that renders this stays an RSC. The single
 * filter on a metric sub-board is the window, supplied by the page via props.
 */

import { getMetricLeaders, type LeaderboardRow } from '@/lib/data'
import { WINDOW_API_MAP, type WindowUI } from '@/lib/constants'
import { CanonId } from '@/components/ui/CanonId'
import { Placeholder } from '@/components/ui/Placeholder'
import { SignalClassBadge } from '@/components/sigrank'
import { ClaimedBadge } from '@/components/claim/ClaimedBadge'
import { MetricBars } from '@/components/charts/MetricBars'

interface Props {
  /** Display title for the board, e.g. "Compression Ratio". */
  title: string
  /** metric_snapshots sort column / board key (e.g. 'compression_ratio'). */
  metricKey: string
  /** Canonical id this metric traces back to (e.g. 'M.01'). */
  canonId: string
  /** Short ticker, e.g. "COMP". */
  ticker: string
  /** UI window label (resolved by the page from searchParams). */
  window: WindowUI
  /** Column header label for the metric value. */
  valueLabel: string
  /**
   * When true (M.02 Prompt Complexity), values are free-tier estimates: render a
   * leading '~' and a 'low' confidence tag.
   */
  lowConfidence?: boolean
  /** Max rows to show. */
  limit?: number
}

/** Pull the displayed metric value for a row given the metric key. */
function metricValue(row: LeaderboardRow, key: string): number {
  const s = row.snapshot
  switch (key) {
    case 'compression_ratio':
      return s.compression_ratio
    case 'prompt_complexity':
      return s.prompt_complexity.value
    case 'cross_thread':
      return s.cross_thread
    case 'session_depth':
      return s.session_depth
    case 'token_throughput':
      return s.token_throughput
    case 'message_volume':
      // No dedicated mock column — token_throughput stands in for ordering,
      // consistent with the data facade's sortValue() proxy.
      return s.token_throughput
    case 'signal_force':
      return s.signal_force
    case 'signa_rate':
    default:
      return s.signa_rate
  }
}

/** Format the metric value: compression is a [0,1] ratio; the rest are counts/scores. */
function formatValue(key: string, value: number): string {
  if (key === 'compression_ratio') return value.toFixed(4)
  if (key === 'session_depth') return value.toFixed(1)
  if (Number.isInteger(value)) return value.toLocaleString()
  return value.toFixed(1)
}

export async function MetricBoard({
  title,
  metricKey,
  canonId,
  ticker,
  window,
  valueLabel,
  lowConfidence = false,
  limit = 25,
}: Props) {
  const apiWindow = WINDOW_API_MAP[window]
  const rows = await getMetricLeaders(metricKey, { window: apiWindow, limit })

  // Top-10 ranked bars (the leaderboard "shape") above the full table.
  const barItems = rows.slice(0, 10).map((row) => {
    const v = metricValue(row, metricKey)
    const f = formatValue(metricKey, v)
    return {
      label:
        row.operator.claimed && row.operator.display_name
          ? row.operator.display_name
          : row.operator.codename,
      value: v,
      formatted: lowConfidence ? `~${f}` : f,
      isPlaceholder: row.operator.isPlaceholder === true,
    }
  })

  return (
    <div className="overflow-hidden rounded-lg border border-bg-border bg-bg-surface">
      <div className="flex items-baseline justify-between border-b border-bg-border px-4 py-3">
        <h2 className="font-mono text-sm font-bold text-text-primary">
          {title}
          <CanonId id={canonId} real title={`${ticker} · canonical ${canonId}`} />
        </h2>
        <span className="font-mono text-[11px] text-text-muted">
          {ticker} · {window} window
        </span>
      </div>
      <MetricBars items={barItems} />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-b border-bg-border bg-bg-elevated px-3 py-2 text-left font-sans text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                #
              </th>
              <th className="border-b border-bg-border bg-bg-elevated px-3 py-2 text-left font-sans text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Class
              </th>
              <th className="border-b border-bg-border bg-bg-elevated px-3 py-2 text-left font-sans text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Operator
              </th>
              <th className="border-b border-bg-border bg-bg-elevated px-3 py-2 text-right font-sans text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                {valueLabel}
                {lowConfidence ? ' (~ est.)' : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const value = metricValue(row, metricKey)
              const formatted = formatValue(metricKey, value)
              const display = lowConfidence ? `~${formatted}` : formatted
              const isPh = row.operator.isPlaceholder === true
              const name = row.operator.claimed && row.operator.display_name
                ? row.operator.display_name
                : row.operator.codename
              return (
                <tr key={row.operator.operator_id} className="border-b border-bg-border-subtle">
                  <td className="px-3 py-2 font-mono text-xs text-text-secondary">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2">
                    <SignalClassBadge
                      signalClass={row.snapshot.class_tier}
                      size="sm"
                      showFull
                    />
                    <span className="ml-1 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                      {row.snapshot.class_tier.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-mono text-xs text-text-primary">{name}</span>
                    <ClaimedBadge claimed={row.operator.claimed} />
                    {!row.operator.claimed && (
                      <span className="ml-1 font-sans text-[10px] text-text-muted">
                        (anon)
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs font-semibold text-text-primary">
                    {isPh ? (
                      <Placeholder
                        value={display}
                        title={`Placeholder ${ticker} value — sample data`}
                      />
                    ) : (
                      <span>
                        {display}
                        <CanonId id={canonId} real title={`Verified ${ticker} (${canonId})`} />
                      </span>
                    )}
                    {lowConfidence && (
                      <span className="ml-1 font-sans text-[9px] uppercase text-text-muted">
                        low
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
