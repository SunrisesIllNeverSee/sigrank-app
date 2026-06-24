/**
 * components/profile/TelemetryStrip.tsx — raw telemetry receipts (profile.html port).
 *
 * Server component. Six columns of REAL token telemetry (CANON §I / §VII): the
 * raw inputs the scoring engine consumed. These are verified MO§ES values, so
 * each carries a real canonical-id superscript (T.xx) rather than a placeholder
 * star. "Active Minutes" is an estimate, so it keeps its ~ prefix + placeholder.
 */

import { CanonId } from '@/components/ui/CanonId'
import { Placeholder } from '@/components/ui/Placeholder'
import type { TelemetryRaw } from '@/lib/data'

interface Props {
  telemetry: TelemetryRaw
}

/** Compact human formatting: 1.08B / 34.8M / 123,246. */
function fmt(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  return n.toLocaleString('en-US')
}

interface Cell {
  key: string
  value: React.ReactNode
}

export function TelemetryStrip({ telemetry }: Props) {
  const cells: Cell[] = [
    {
      key: 'Fresh Input',
      value: (
        <>
          {fmt(telemetry.fresh_input)}
          <CanonId id="T.02" real title="Fresh input tokens (CANON T.02)" />
        </>
      ),
    },
    {
      key: 'Output',
      value: (
        <>
          {fmt(telemetry.output)}
          <CanonId id="T.01" real title="Output tokens (CANON T.01)" />
        </>
      ),
    },
    {
      key: 'Cache Read',
      value: (
        <>
          {fmt(telemetry.cache_read)}
          <CanonId id="T.03" real title="Cache read tokens (CANON T.03)" />
        </>
      ),
    },
    {
      key: 'Cache Create',
      value: (
        <>
          {fmt(telemetry.cache_create)}
          <CanonId id="T.04" real title="Cache creation tokens (CANON T.04)" />
        </>
      ),
    },
    {
      key: 'Sessions / Turns',
      value: (
        <>
          {telemetry.sessions.toLocaleString('en-US')} /{' '}
          {telemetry.turns.toLocaleString('en-US')}
          <CanonId id="T.06" real title="Sessions / turns (CANON T.06)" />
        </>
      ),
    },
    {
      key: 'Active Minutes',
      value: (
        <Placeholder value="~2,700" title="Placeholder · active-minute estimate, not yet finalized" />
      ),
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-6 border-b border-bg-border-subtle bg-bg-base p-5 sm:grid-cols-3 lg:grid-cols-6">
      {cells.map((c) => (
        <div key={c.key} className="flex flex-col gap-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.05em] text-text-dim">
            {c.key}
          </div>
          <div className="font-mono text-base font-semibold tracking-[-0.01em] text-text-primary">
            {c.value}
          </div>
        </div>
      ))}
    </div>
  )
}
