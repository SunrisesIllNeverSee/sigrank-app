import React from 'react'
import { CLASS_TIERS } from '@/lib/canon/ids'
import { CanonId } from '@/components/ui/CanonId'

interface LadderRow {
  /** Canonical class id (K.xx). */
  id: string
  desc: string
  /** Public compression range copy (qualitative cut; exact breaks are RS.05). */
  range: string
}

/**
 * ClassLadder — the nine-class hierarchy (K.01..K.09) from intro.html.
 *
 * Glyph / name / hex are pulled from the canonical CLASS_TIERS registry so the
 * ladder stays in lockstep with the contract; the descriptive copy + public
 * compression ranges mirror the mockup. The exact numeric breakpoints are NOT
 * shown here — they are proprietary (RS.05, server-only). Server component.
 */
const ROW_COPY: Record<string, LadderRow> = {
  'K.01': { id: 'K.01', desc: "You don't just use the system. You are the system. Sustained high-yield cascade across all dimensions.", range: 'SNR ≥ 0.85' },
  'K.02': { id: 'K.02', desc: 'Precision creators. Structure from signal. Others follow your patterns.', range: '0.75 – 0.84' },
  'K.03': { id: 'K.03', desc: 'System builders. Coherent operators with consistent output.', range: '0.65 – 0.74' },
  'K.04': { id: 'K.04', desc: 'Forming forge. High activity, signal still emerging from noise.', range: '0.50 – 0.64' },
  'K.05': { id: 'K.05', desc: 'Signal breaking through. Clarity emerging. Active development phase.', range: '0.40 – 0.49' },
  'K.06': { id: 'K.06', desc: 'Active explorers. High throughput, low reuse. Curiosity-driven.', range: '0.30 – 0.39' },
  'K.07': { id: 'K.07', desc: 'Practicing with purpose. Consistent mid-tier. Quiet build phase.', range: '0.20 – 0.29' },
  'K.08': { id: 'K.08', desc: 'Quiet insight holders. Deep threads, low activity volume.', range: '0.15 – 0.19' },
  'K.09': { id: 'K.09', desc: 'Dormant potential. The still soul. Waiting for the spark.', range: '< 0.15' },
}

export function ClassLadder() {
  const tiers = Object.values(CLASS_TIERS)

  return (
    <section className="my-16">
      <div className="font-mono text-xs uppercase tracking-widest text-gold">
        ⊙ The hierarchy
      </div>
      <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
        Nine classes. One ladder.
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
        Your class is identity. Your rank is position. Class is assigned from
        your cascade SNR and 10xDEV — whichever is more restrictive wins.
        TRANSMITTER is rare on purpose.
      </p>

      <div className="mt-10 overflow-hidden rounded-2xl border border-bg-border-subtle bg-bg-surface">
        {tiers.map((tier) => {
          const copy = ROW_COPY[tier.id]
          return (
            <div
              key={tier.id}
              className="grid grid-cols-[48px_1fr] items-center gap-4 border-b border-bg-border-subtle px-6 py-5 transition-colors last:border-b-0 hover:bg-bg-hover sm:grid-cols-[56px_180px_1fr_120px] sm:gap-6"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl font-mono text-xl font-bold"
                style={{
                  color: tier.hex,
                  background: `${tier.hex}1f`,
                  border: `1px solid ${tier.hex}4d`,
                }}
              >
                {tier.glyph}
              </div>
              <div
                className="font-mono text-sm font-semibold tracking-wide"
                style={{ color: tier.hex }}
              >
                {tier.name}
                <CanonId id={tier.id} real title={`Class tier ${tier.id}`} />
              </div>
              <div className="col-span-2 text-sm leading-relaxed text-text-secondary sm:col-span-1">
                {copy?.desc}
              </div>
              <div className="col-span-2 text-right font-mono text-sm text-text-muted sm:col-span-1">
                {copy?.range}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
