import React from 'react'
import { CanonId } from '@/components/ui/CanonId'

interface Tile {
  ticker: string
  name: string
  /** Canonical metric id (M.xx / C.xx / E.xx). */
  canonId: string
  body: string
  formula: string
  featured?: boolean
}

/**
 * MetricTiles — the operator performance stack from intro.html: the Core 5,
 * two composites (SIGNA RATE, SDOT, SDRM), plus Signal Force. Per the group
 * brief, Signal Force is canonical id E.01 (the mockup's SF→C.02 was an error;
 * decision D17). Eight tiles, each with a public-shape formula + canon-id
 * superscript. Server component, static copy.
 */
const TILES: Tile[] = [
  {
    ticker: 'COMP',
    name: 'Compression Ratio',
    canonId: 'M.01',
    body: 'The signal-purity score. A bounded [0,1] measure of how much of your output is structured, coherent signal vs. noise and redundancy.',
    formula: 'signal / (signal + noise)',
  },
  {
    ticker: 'SD',
    name: 'Session Depth',
    canonId: 'M.04',
    body: 'Average reply-chain length per session. Sustained reasoning beats shallow chatter. The continuity metric.',
    formula: 'avg(max_chain_length / session)',
  },
  {
    ticker: 'PC',
    name: 'Prompt Complexity',
    canonId: 'M.02',
    body: 'Structural sophistication of your prompts. Multi-layer instructions, recursive logic, symbolic precision, constraint density.',
    formula: 'weighted(layers, recursion, entities)',
  },
  {
    ticker: 'CT',
    name: 'Cross-Thread Referencing',
    canonId: 'M.03',
    body: 'Long-range continuity. References to prior threads, callbacks to system memory, knowledge weaving across sessions.',
    formula: 'min(100, 8·refs + 4·callbacks)',
  },
  {
    ticker: 'TT',
    name: 'Token Throughput',
    canonId: 'M.05',
    body: 'Sustained transmission rate per active minute. Log-scaled so volume alone does not dominate. Bandwidth, not just chatter.',
    formula: 'min(100, 20·log₁₀(tokens + 1))',
  },
  {
    ticker: 'SR',
    name: 'SIGNA RATE',
    canonId: 'C.01',
    body: 'The flagship. The composite. The number that owns your profile and drives your rank. Computed from the Core 5 with locked weights.',
    formula: 'w₁·Comp + w₂·SD + w₃·PC + w₄·CT + w₅·TT · weights = RS.01',
    featured: true,
  },
  {
    ticker: 'SDRM',
    name: 'Signal Density Resonance',
    canonId: 'C.03',
    body: 'The coherence detector. Whether your Core 5 metrics are mutually reinforcing (real signal) or one is propping up the others (gameable).',
    formula: '(Comp · (SD + PC)) · Thread_Rate',
  },
  {
    ticker: 'SF',
    name: 'Signal Force',
    canonId: 'E.01',
    body: 'Lifetime intensity. How much sustained signal an operator pushes per day of account age — depth and volume against time.',
    formula: 'log₁₀((total_messages · session_depth) / account_age_days)',
  },
]

export function MetricTiles() {
  return (
    <section className="my-16">
      <div className="font-mono text-xs uppercase tracking-widest text-gold">
        ⊙ The metrics
      </div>
      <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
        Five signals. Three composites. Nine classes.
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
        Inputs are simple. The math is locked. The interpretation runs deep.
        Below is the operator performance stack.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => (
          <div
            key={t.canonId}
            className={
              'rounded-xl border p-7 ' +
              (t.featured
                ? 'border-gold/25 bg-gradient-to-b from-gold/5 to-bg-surface'
                : 'border-bg-border-subtle bg-bg-surface')
            }
          >
            <div className="mb-3 flex items-center gap-3">
              <span
                className={
                  'rounded font-mono text-xs font-semibold ' +
                  (t.featured
                    ? 'bg-gold px-2 py-0.5 text-bg-base'
                    : 'border border-gold/25 bg-gold/10 px-2 py-0.5 text-gold')
                }
              >
                {t.ticker}
              </span>
              <h3 className="text-lg font-semibold tracking-tight text-text-primary">
                {t.name}
                <CanonId id={t.canonId} real title={`${t.canonId} — ${t.name}`} />
              </h3>
            </div>
            <p className="mb-4 text-sm leading-relaxed text-text-secondary">{t.body}</p>
            <div className="rounded-lg border border-bg-border-subtle bg-bg-elevated p-3.5 font-mono text-[13px] leading-relaxed text-text-primary">
              {t.formula}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
