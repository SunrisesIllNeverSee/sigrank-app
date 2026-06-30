/**
 * app/wiki/methodology-refinement/page.tsx — "How We Got Here: Refining the Index".
 *
 * DRAFT for owner review (lives in RNS Devins_Plans/wiki/ until approved, then ships to
 * sigrank-app at app/wiki/methodology-refinement/page.tsx). Server component, matches the
 * existing /wiki/<slug> TopicPage pattern.
 *
 * GROUNDED in the repo's own analysis (rewritten 2026-06-30 after the first draft invented a
 * triumphant framing the repo contradicts):
 *   - YIELD_ANALYSIS.md: trust the ordinal RANK; the honest magnitude is reader-matched 6.3×
 *     and 10xDEV (1.76 vs 1.50), NOT the I²-divergent raw 18,437. Lead with what survives.
 *   - SEED_CANDIDATES.md: the static seeds are the owner's own pulls split WITH-mem vs CLEAN —
 *     "let the board show the inflation gap publicly — honesty as a feature."
 *   - TOKEN_PILLAR_ROOT_NUMBERS.md: the tokscale read is a documented PARTIAL (852 opus-4-8
 *     msgs vs 18K in JSONL) — the dual reading brackets the operator between min/max input.
 *   - three_degree_comparison.md: 10xDEV is anti-inflation (telescoping identity locks the
 *     exponent to earned leverage).
 *
 * The four removed entries (TheSignalVault/ccusage anchor, the two static seeds, the tokscale
 * reader) are ALL the owner (MO§ES) under seed-era identities + readers. The LIVE claimed
 * operator @SunrisesIllNeverSee stays on the board. This page is the calibration record.
 *
 * Moat: cascade SHAPE (Υ = cache_read × output ÷ input²) + real OUTPUTS only. RS.xx weighting
 * stays server-side.
 */

import type { Metadata } from 'next'
import { TopicPage } from '@/components/wiki/TopicPage'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, definedTerm } from '@/lib/jsonld'

export const metadata: Metadata = {
  title: 'How We Got Here — Refining the Index',
  description:
    'The calibration entries behind the SigRank Index: one operator (MO§ES) measured by two readers, and the same workload run with and without memory. How bracketing those extremes refined the methodology — and why the honest lead is the rank, not the raw multiplier.',
}

interface CalRow {
  glyph: string
  name: string
  reading: string
  yield_: string
  tenx: string
  comp: string
  note: string
}

// Real values from YIELD_ANALYSIS.md + SEED_CANDIDATES.md (repo-sourced, not inferred).
// Υ and 10xDEV are the two readings the methodology brackets between.
const READER_ROWS: CalRow[] = [
  { glyph: '◈', name: 'MO§ES — ccusage read', reading: 'min input (1.25M)', yield_: '18,436.98', tenx: '3.31', comp: '0.969', note: 'most-favorable reading — the ceiling' },
  { glyph: '◈', name: 'MO§ES — tokscale read', reading: 'max input (partial)', yield_: '16.24', tenx: '1.76', comp: '0.218', note: 'own worst-case reading — the floor' },
]
const SEED_ROWS: CalRow[] = [
  { glyph: '◈', name: 'static seed · ✱mem', reading: 'WITH memory', yield_: '2,308.80', tenx: '—', comp: '0.768', note: 'context reused' },
  { glyph: '◈', name: 'static seed · clean', reading: 'CLEAN (mem stripped)', yield_: '1,695.42', tenx: '—', comp: '0.723', note: 'same work, no reuse' },
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
function Table({ rows }: { rows: CalRow[] }) {
  return (
    <div className="overflow-x-auto rounded border border-bg-border-subtle bg-bg-surface">
      <table className="w-full border-collapse font-mono text-xs">
        <thead className="border-b border-bg-border-subtle">
          <tr>
            <Th>ENTRY</Th>
            <Th>READING</Th>
            <Th>Υ YIELD</Th>
            <Th>10×DEV</Th>
            <Th>◌ COMP</Th>
            <Th>NOTE</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-b border-bg-border-subtle/40 last:border-0">
              <Td>
                <span className="text-text-muted">{r.glyph}</span> {r.name}
              </Td>
              <Td>{r.reading}</Td>
              <Td accent>{r.yield_}</Td>
              <Td>{r.tenx}</Td>
              <Td>{r.comp}</Td>
              <Td>{r.note}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
            'The dual-reader and memory-pair entries used to bracket and verify the SigRank Index scoring before live operators populated the board.',
            '/wiki/methodology-refinement',
          ),
        ]}
      />

      <header className="flex flex-col gap-2">
        <h1 className="font-mono text-lg text-text-primary">How We Got Here — Refining the Index</h1>
        <p className="text-sm leading-relaxed text-text-secondary">
          Before live operators populated the board, the Index had to be{' '}
          <em>bracketed and stress-tested</em> against entries we understood completely — all of
          them our own usage (MO§ES), measured deliberately at the extremes. These are those
          entries, kept here as the record of how the methodology was tuned and where it&apos;s
          honest about its own limits. They are no longer on the live ranking; this page is where
          they belong.
        </p>
      </header>

      {/* 1. The dual-reader bracket. */}
      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-sm text-text-primary">1. One operator, two readers — the bracket</h2>
        <Table rows={READER_ROWS} />
        <p className="text-sm leading-relaxed text-text-secondary">
          Both rows are the <em>same operator&apos;s same activity</em>, counted by two different
          token tools. ccusage reads a small fresh-input footprint (Υ 18,437); tokscale reads a
          larger, partial input (Υ 16). That is a &gt;1,000× swing from the <em>reader alone</em> —
          and it is exactly why we do <strong>not</strong> lead with the raw multiplier. Υ = cache_read
          × output ÷ input², so input² in the denominator makes Υ hypersensitive to a tiny input.
          The honest figures are the ones that survive a hostile reading:
        </p>
        <ul className="ml-4 flex list-disc flex-col gap-1 text-sm leading-relaxed text-text-secondary">
          <li><strong>The rank.</strong> On every reader and every axis, the operator is #1. The ordinal does not wobble.</li>
          <li><strong>The reader-matched 6.3×.</strong> Put everyone on the <em>same</em> reader (the volume-style one) and even this operator&apos;s <em>worst</em> input reading beats the strongest high-volume operator by 6.3×. That is the courtroom number.</li>
          <li><strong>10×DEV.</strong> The log view tames the input² blow-up: 1.76 vs the field&apos;s best 1.50 — clearly ahead, on a sane scale. The telescoping identity locks the exponent to earned leverage, so it can&apos;t be inflated independently.</li>
        </ul>
        <p className="text-sm leading-relaxed text-text-secondary">
          The lesson the bracket taught: <strong>put every operator on one reader.</strong> The
          moment the field is measured the same way, the comparison stops being arguable — and the
          bracket <span className="font-mono text-text-accent">[16.24 … 18,437]</span> itself becomes
          the robustness story (&quot;best even at its own worst-case measurement&quot;).
        </p>
      </section>

      {/* 2. The memory pair. */}
      <section className="flex flex-col gap-2">
        <h2 className="font-mono text-sm text-text-primary">2. With memory vs. clean — what the Index credits</h2>
        <Table rows={SEED_ROWS} />
        <p className="text-sm leading-relaxed text-text-secondary">
          The two static seeds are the same workload run <em>with</em> memory/context reuse and{' '}
          <em>clean</em> (observer stripped). The memory-on run yields ~36% higher. We staged the
          pair on purpose: it lets the board <em>show the inflation gap publicly</em> — honesty as a
          feature — and it confirms the cascade credits the thing that actually makes an operator
          efficient: reusing prior context (cache_read) instead of re-paying for it every turn.
        </p>
      </section>

      <section className="flex flex-col gap-2 border-t border-bg-border-subtle pt-4 text-sm leading-relaxed text-text-secondary">
        <h2 className="font-mono text-sm text-text-primary">Why they&apos;re here, not on the board</h2>
        <p>
          These entries did their job — they bracketed the scale, exposed its sensitivity to the
          reader, and confirmed the cascade credits context reuse. Leaving a seed-era self-anchor at
          the top of a public ranking would misrepresent the live field, so they retire into the
          record. The live board ranks real operators; the methodology these entries refined is the
          one now scoring everyone.
        </p>
        <p className="font-mono text-[10px] text-text-muted">
          Υ = cache_read × output ÷ input². Pillars and yields shown are real measured outputs; the
          weighting that maps them to Υ is part of the ruleset and stays server-side.
        </p>
      </section>
    </TopicPage>
  )
}
