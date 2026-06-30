/**
 * app/wiki/methodology-refinement/page.tsx — "How We Got Here: Refining the Index".
 *
 * DRAFT for owner review (lives in RNS Devins_Plans/wiki/ until approved, then ships to
 * sigrank-app at app/wiki/methodology-refinement/page.tsx). Server component, matches the
 * existing /wiki/<slug> TopicPage pattern.
 *
 * Purpose (owner 2026-06-30, prelaunch #1): recreate the early anchor + static-seed +
 * tokscale-reader board entries as a TERMINAL-styled table, then explain them as part of
 * the methodology-refinement story — how these experiments calibrated the Index and why
 * they now live in the record (the wiki) instead of the live ranking.
 *
 * Moat: shows the cascade SHAPE (Υ = cache_read × output / input²) and these real OUTPUTS
 * only. The RS.xx weighting that maps pillars → Υ stays server-side. No weights here.
 */

import type { Metadata } from 'next'
import { TopicPage } from '@/components/wiki/TopicPage'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, definedTerm } from '@/lib/jsonld'

export const metadata: Metadata = {
  title: 'How We Got Here — Refining the Index',
  description:
    'The early calibration entries behind the SigRank Index: the anchor operator, the two static seeds, and the dual-reader experiment. How these real measurements refined the methodology — and why they live in the record, not the live board.',
}

/** A calibration row — the real early-entry stats, recreated as a teaching table. */
interface CalRow {
  glyph: string
  name: string
  yield_: string
  comp: string
  cplx: string
  xthr: string
  sdep: string
  signa: string
  tier: string
  note: string
}

// Real values pulled from the live board 2026-06-30 (30d · claude). These are the
// entries being moved off the live ranking into this record. Outputs only — no weights.
const ROWS: CalRow[] = [
  { glyph: '◈', name: 'TheSignalVault', yield_: '18,436.98', comp: '0.969', cplx: '92.0', xthr: '37', sdep: '26.1', signa: '538.41', tier: 'TRANSMITTER', note: 'the anchor' },
  { glyph: '◈', name: 'static seed · ✱mem', yield_: '2,308.80', comp: '0.768', cplx: '70.0', xthr: '26', sdep: '18.0', signa: '184.45', tier: 'TRANSMITTER', note: 'calibration seed (memory-on)' },
  { glyph: '◈', name: 'static seed · clean', yield_: '1,695.42', comp: '0.723', cplx: '66.0', xthr: '24', sdep: '16.5', signa: '170.30', tier: 'TRANSMITTER', note: 'calibration seed (clean)' },
  { glyph: '◈', name: 'MO§ES (tokscale reader)', yield_: '16.24', comp: '0.218', cplx: '92.0', xthr: '37', sdep: '26.1', signa: '15.28', tier: 'TRANSMITTER', note: 'same operator — different reader' },
]

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-2 py-1 text-left font-normal text-text-muted">{children}</th>
}
function Td({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <td className={`px-2 py-1 tabular-nums ${accent ? 'text-text-accent' : 'text-text-primary'}`}>
      {children}
    </td>
  )
}

export default function MethodologyRefinementPage() {
  return (
    <TopicPage>
      <JsonLd
        data={[
          breadcrumb([
            { name: 'Wiki', path: '/wiki' },
            { name: 'How We Got Here', path: '/wiki/methodology-refinement' },
          ]),
          definedTerm(
            'Index Calibration',
            'The early anchor and seed entries used to calibrate the SigRank Index scoring scale before live operators populated the board.',
            '/wiki/methodology-refinement',
          ),
        ]}
      />

      <header className="flex flex-col gap-2">
        <h1 className="font-mono text-lg text-text-primary">How We Got Here — Refining the Index</h1>
        <p className="text-sm leading-relaxed text-text-secondary">
          Before real operators populated the board, the SigRank Index had to be{' '}
          <em>calibrated</em>: we needed entries whose token cascades we understood completely, so
          we could see what the scale did at its extremes. These are those entries — recreated here
          as the record of how the methodology was tuned. They are no longer on the live ranking;
          this page is where they belong.
        </p>
      </header>

      {/* Terminal-styled calibration table — mirrors the live board's mono/glyph aesthetic. */}
      <section className="flex flex-col gap-2">
        <div className="font-mono text-[11px] uppercase tracking-wide text-text-muted">
          Calibration entries · 30d · claude · 2026-05→06
        </div>
        <div className="overflow-x-auto rounded border border-bg-border-subtle bg-bg-surface">
          <table className="w-full border-collapse font-mono text-xs">
            <thead className="border-b border-bg-border-subtle">
              <tr>
                <Th>OPERATOR</Th>
                <Th>Υ YIELD</Th>
                <Th>◌ COMP</Th>
                <Th>⚙ CPLX</Th>
                <Th>⇄ XTHR</Th>
                <Th>▼ DEPTH</Th>
                <Th>§IGNA</Th>
                <Th>TIER</Th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.name} className="border-b border-bg-border-subtle/40 last:border-0">
                  <Td>
                    <span className="text-text-muted">{r.glyph}</span> {r.name}
                  </Td>
                  <Td accent>{r.yield_}</Td>
                  <Td>{r.comp}</Td>
                  <Td>{r.cplx}</Td>
                  <Td>{r.xthr}</Td>
                  <Td>{r.sdep}</Td>
                  <Td>{r.signa}</Td>
                  <Td>{r.tier}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="font-mono text-[10px] text-text-muted">
          Υ = cache_read × output ÷ input². Pillars shown are real measured outputs; the weighting
          that maps them to Υ is part of the ruleset and stays server-side.
        </p>
      </section>

      {/* The story — three lessons, each tied to a row. */}
      <section className="flex flex-col gap-4 text-sm leading-relaxed text-text-secondary">
        <div>
          <h2 className="mb-1 font-mono text-sm text-text-primary">1. The anchor — why the scale is exponential</h2>
          <p>
            <span className="font-mono text-text-accent">◈ TheSignalVault</span> scores Υ 18,437 — orders of
            magnitude above everything else. That is not a bug; it is the point. The cascade
            (cache_read × output ÷ input²) rewards an operator who does enormous downstream work off
            a small, dense prompt. A near-perfect compression ratio (0.969) on deep, cross-threaded
            sessions produces a yield that <em>should</em> dwarf a casual run. The anchor proved the
            scale separates a true signal-amplifier from the field — and showed us the board needs a
            visual scale (not a linear bar) so one extreme entry doesn&apos;t flatten everyone below
            it. That is a presentation lesson the anchor taught, and the reason it now lives here
            rather than skewing the live ladder.
          </p>
        </div>
        <div>
          <h2 className="mb-1 font-mono text-sm text-text-primary">2. The two static seeds — memory is signal</h2>
          <p>
            <span className="font-mono text-text-accent">◈ static seed · ✱mem</span> (Υ 2,309) and{' '}
            <span className="font-mono text-text-accent">◈ static seed · clean</span> (Υ 1,695) are the
            same workload measured with and without memory/context reuse. The memory-on run scores
            ~36% higher. We built these deliberately to confirm the Index <em>credits</em> the thing
            that actually makes an operator efficient: reusing prior context (cache_read) instead of
            re-paying for it every turn. Two controlled seeds, one variable — that is how we verified
            the cascade measures what we claim it measures.
          </p>
        </div>
        <div>
          <h2 className="mb-1 font-mono text-sm text-text-primary">3. The dual-reader test — the score is reader-sensitive</h2>
          <p>
            The most important calibration entry is the pair:{' '}
            <span className="font-mono text-text-accent">◈ TheSignalVault</span> (Υ 18,437, comp 0.969)
            and <span className="font-mono text-text-accent">◈ MO§ES (tokscale reader)</span> (Υ 16,
            comp 0.218) — the <em>same operator</em>, the same underlying activity, read by two
            different token-accounting tools. A &gt;1,000× gap in yield from nothing but the reader.
            This is why SigRank standardized on a single canonical reader: the cascade is only
            comparable across operators if everyone is measured the same way. The dual-reader test is
            the experiment that forced that decision — and it is the clearest single illustration of
            what the Index is sensitive to.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-2 border-t border-bg-border-subtle pt-4 text-sm leading-relaxed text-text-secondary">
        <h2 className="font-mono text-sm text-text-primary">Why they&apos;re here, not on the board</h2>
        <p>
          The live board ranks real operators. These four entries did their job — they calibrated the
          scale, verified the cascade credits context reuse, and forced the single-reader standard.
          Leaving them on the live ladder would misrepresent the field (an internal anchor at the top
          of a public ranking is not a real competitor). So they retire into the record. The
          methodology they shaped is the one now scoring everyone else.
        </p>
      </section>
    </TopicPage>
  )
}
