'use client'

/**
 * components/sandbox/CascadeGenome.tsx — the Cascade Genome visualization.
 *
 * A radar chart with benchmark overlays (your scores vs class average vs top
 * 1%) plus a strengths/opportunities panel that identifies which dimensions
 * are above/below the benchmarks.
 *
 * 2D Recharts implementation — the 3D three.js version (Grok artifact 056)
 * was skipped: 600KB+ bundle weight for a flow diagram is not justified when
 * the 2D radar communicates the same information clearly.
 */

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
} from 'recharts'

export interface GenomeScores {
  comp: number
  sd: number
  pc: number
  ct: number
  tt: number
}

interface CascadeGenomeProps {
  /** The operator's current Core 5 scores. */
  scores: GenomeScores
  /** Optional: class-average benchmark for each dimension. */
  classAverage?: Partial<GenomeScores>
  /** Optional: top-1% benchmark for each dimension. */
  top1Percent?: Partial<GenomeScores>
  /** Optional: label for the operator series (default: "You"). */
  operatorLabel?: string
  /** Optional: compact mode (smaller chart, no panel). */
  compact?: boolean
}

const DIMENSIONS: Array<{ key: keyof GenomeScores; label: string; full: string }> = [
  { key: 'comp', label: 'Comp', full: 'Compression' },
  { key: 'sd', label: 'Depth', full: 'Session Depth' },
  { key: 'pc', label: 'PC', full: 'Prompt Complexity' },
  { key: 'ct', label: 'Cross-T', full: 'Cross-Thread' },
  { key: 'tt', label: 'Throughput', full: 'Token Throughput' },
]

export function CascadeGenome({
  scores, classAverage, top1Percent, operatorLabel = 'You', compact = false,
}: CascadeGenomeProps) {
  const data = DIMENSIONS.map((dim) => ({
    dimension: dim.label,
    [operatorLabel]: scores[dim.key] ?? 0,
    'Class Avg': classAverage?.[dim.key] ?? 50,
    'Top 1%': top1Percent?.[dim.key] ?? 85,
  }))

  // Strengths: dimensions where the operator beats class average
  // Opportunities: dimensions where the operator is below class average
  const strengths: Array<{ dim: string; value: number; delta: number }> = []
  const opportunities: Array<{ dim: string; value: number; delta: number }> = []

  for (const dim of DIMENSIONS) {
    const val = scores[dim.key] ?? 0
    const avg = classAverage?.[dim.key] ?? 50
    const delta = Number((val - avg).toFixed(1))
    if (delta >= 5) {
      strengths.push({ dim: dim.full, value: val, delta })
    } else if (delta <= -5) {
      opportunities.push({ dim: dim.full, value: val, delta })
    }
  }

  strengths.sort((a, b) => b.delta - a.delta)
  opportunities.sort((a, b) => a.delta - b.delta)

  const tooltipStyle = {
    background: 'rgb(var(--bg-elevated))',
    border: '1px solid rgb(var(--bg-border))',
    borderRadius: '6px',
    fontSize: '12px',
  }

  return (
    <div className="flex flex-col gap-4">
      <div style={{ height: compact ? 220 : 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="rgb(var(--bg-border))" />
            <PolarAngleAxis dataKey="dimension" tick={{ fill: 'rgb(var(--text-muted))', fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'rgb(var(--text-dim))', fontSize: 8 }} />
            <Tooltip contentStyle={tooltipStyle} />
            {!compact && <Legend wrapperStyle={{ fontSize: '11px' }} />}
            <Radar
              name={operatorLabel}
              dataKey={operatorLabel}
              stroke="rgb(var(--accent))"
              fill="rgb(var(--accent))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            {classAverage && (
              <Radar
                name="Class Avg"
                dataKey="Class Avg"
                stroke="rgb(var(--text-muted))"
                fill="rgb(var(--text-muted))"
                fillOpacity={0.05}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            )}
            {top1Percent && (
              <Radar
                name="Top 1%"
                dataKey="Top 1%"
                stroke="rgb(var(--gold))"
                fill="rgb(var(--gold))"
                fillOpacity={0.05}
                strokeWidth={1}
                strokeDasharray="2 2"
              />
            )}
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {!compact && (strengths.length > 0 || opportunities.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {strengths.length > 0 && (
            <div className="p-3 rounded-md border border-[rgb(var(--bg-border))] bg-[rgb(var(--bg-surface))]">
              <h4 className="text-xs uppercase tracking-wider text-[rgb(var(--text-muted))] mb-2">
                Strengths
              </h4>
              <div className="flex flex-col gap-1">
                {strengths.map((s) => (
                  <div key={s.dim} className="flex justify-between text-xs">
                    <span className="text-[rgb(var(--text-secondary))]">{s.dim}</span>
                    <span className="font-mono text-[rgb(var(--accent))]">+{s.delta}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {opportunities.length > 0 && (
            <div className="p-3 rounded-md border border-[rgb(var(--bg-border))] bg-[rgb(var(--bg-surface))]">
              <h4 className="text-xs uppercase tracking-wider text-[rgb(var(--text-muted))] mb-2">
                Opportunities
              </h4>
              <div className="flex flex-col gap-1">
                {opportunities.map((o) => (
                  <div key={o.dim} className="flex justify-between text-xs">
                    <span className="text-[rgb(var(--text-secondary))]">{o.dim}</span>
                    <span className="font-mono text-[rgb(var(--text-dim))]">{o.delta}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
