'use client'

/**
 * components/profile/HealthScore.tsx — the cascade health score display.
 *
 * A single number 0-100 that combines consistency, momentum, and quality.
 * Like a credit score for token efficiency.
 *
 * "Yield 18,436 with health 94 = consistent operator.
 *  Yield 18,436 with health 40 = one lucky session."
 */

export function HealthScore({ score, yield_ }: { score: number; yield_: number }) {
  const color =
    score >= 80 ? 'text-green-400'
    : score >= 60 ? 'text-gold'
    : score >= 40 ? 'text-orange-400'
    : 'text-red-400'

  const context =
    score >= 80 && yield_ > 1000
      ? 'Consistent operator — the cascade is compounding reliably.'
    : score >= 80
      ? 'Consistent operator — steady across sessions.'
    : score >= 40 && yield_ > 1000
      ? 'One lucky session — yield is high but consistency is low.'
    : 'Building consistency — keep submitting to grow your health score.'

  return (
    <div className="rounded-lg border border-bg-border p-4">
      <h3 className="mb-2 font-mono text-xs uppercase tracking-[0.06em] text-text-muted">
        Health Score
      </h3>
      <div className="flex items-baseline gap-2">
        <span className={`font-mono text-4xl font-bold ${color}`}>{score}</span>
        <span className="font-mono text-lg text-text-muted">/100</span>
      </div>
      <p className="mt-2 font-mono text-xs text-text-muted">{context}</p>
    </div>
  )
}
