import React from 'react'

/**
 * TuiBoardMockup — a CSS replica of the sigrank-mcp TUI Board tab.
 *
 * Used on the landing HowItWorks section as the "screenshot" alongside the
 * install/submit commands. Static data (realistic — mirrors the live 30d
 * board). When `highlightYou` is true, the #1 row gets a gold bg-tint + YOU
 * marker (the "after you submit" view).
 *
 * The #1 Υ (18,436.98) is the CANONICAL ANCHOR — the owner's verified ccusage
 * ceiling (the most-favorable raw read). It is intentionally NOT the live
 * board's observer-stripped top (~552.53, shown in the Three Degrees gold
 * column): the mock illustrates the TUI at the canonical anchor, the chart
 * tracks the live observer-stripped field. The caption below the rows makes
 * that distinction visible so a visitor doesn't read the two surfaces as a 33×
 * discrepancy (review 2026-07-02).
 */

interface Row {
  rank: number
  name: string
  cls: string
  yld: string
  snr: string
  lev: string
  vel: string
  d10: string
  pct: string
  mv: string
  you?: boolean
}

const ROWS: Row[] = [
  { rank: 1, name: 'TransVaultOrigin', cls: 'TRANSMITTER', yld: '18,436.98', snr: '90.2', lev: '4.27×', vel: '1.63', d10: '0.63', pct: '100%', mv: '▲', you: true },
  { rank: 2, name: 'OrcaVanguard',     cls: 'TRANSMITTER', yld: '12,104.41', snr: '84.1', lev: '3.82×', vel: '1.41', d10: '0.58', pct: '99%',  mv: '▲' },
  { rank: 3, name: 'IronLattice',      cls: 'ARCHITECT',   yld:  '8,902.17', snr: '78.5', lev: '3.10×', vel: '1.29', d10: '0.49', pct: '98%',  mv: '—' },
  { rank: 4, name: 'MeridianScribe',   cls: 'ARCHITECT',   yld:  '6,418.80', snr: '71.3', lev: '2.64×', vel: '1.12', d10: '0.42', pct: '95%',  mv: '▼' },
  { rank: 5, name: 'VectorHerald',     cls: 'POWER',       yld:  '4,771.02', snr: '65.8', lev: '2.21×', vel: '0.98', d10: '0.34', pct: '91%',  mv: '▲' },
  { rank: 6, name: 'DriftPilgrim',     cls: 'POWER',       yld:  '3,209.44', snr: '58.2', lev: '1.87×', vel: '0.84', d10: '0.27', pct: '85%',  mv: '—' },
]

export function TuiBoardMockup({ highlightYou = false }: { highlightYou?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-bg-border bg-bg-surface shadow-lg">
      {/* terminal title bar */}
      <div className="flex items-center gap-2 border-b border-bg-border-subtle bg-bg-base/60 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        <span className="ml-2 font-mono text-[11px] text-text-dim">sigrank-mcp — Board</span>
      </div>
      {/* tab bar */}
      <div className="flex gap-4 overflow-x-auto border-b border-bg-border-subtle px-4 py-2 font-mono text-[11px] whitespace-nowrap">
        <span className="text-text-dim">1 Dashboard</span>
        <span className="text-text-dim">2 Trends</span>
        <span className="text-text-dim">3 Compare</span>
        <span className="border-b-2 border-gold pb-1 text-gold">4 Board</span>
        <span className="text-text-dim">5 Watch</span>
        <span className="text-text-dim">6 Connect</span>
      </div>
      {/* board content */}
      <div className="overflow-x-auto px-4 py-3">
        <div className="font-mono text-[11px] text-text-dim whitespace-nowrap">
          Leaderboard&nbsp;&nbsp;window: 30d&nbsp;&nbsp;·&nbsp;&nbsp;sorted by Υ Yield
        </div>
        {/* column headers */}
        <div className="mt-3 flex gap-2 border-b border-bg-border-subtle pb-2 font-mono text-[10px] uppercase tracking-wide text-text-muted whitespace-nowrap">
          <span className="w-8 text-right">#</span>
          <span className="w-36">Codename</span>
          <span className="w-24">Class</span>
          <span className="w-24 text-right">Υ Yield</span>
          <span className="w-14 text-right">SNR</span>
          <span className="w-14 text-right">Lev</span>
          <span className="w-12 text-right">Vel</span>
          <span className="w-12 text-right">10x</span>
          <span className="w-12 text-right">Pct</span>
          <span className="w-10 text-right">7d↕</span>
        </div>
        {/* rows */}
        {ROWS.map((r) => {
          const showYou = highlightYou && r.you
          return (
            <div
              key={r.rank}
              className={`flex gap-2 py-1.5 font-mono text-[11px] whitespace-nowrap ${
                showYou ? 'rounded bg-gold/10' : ''
              }`}
            >
              <span className={`w-8 text-right ${r.rank <= 3 ? 'font-bold text-gold' : 'text-text-muted'}`}>
                #{r.rank}
              </span>
              <span className={`w-36 truncate ${showYou ? 'font-bold text-gold' : 'text-text-primary'}`}>
                {r.name}{showYou && <span className="ml-1 text-gold/70">YOU</span>}
              </span>
              <span className="w-24 text-text-secondary">{r.cls}</span>
              <span className="w-24 text-right font-semibold text-text-primary">{r.yld}</span>
              <span className="w-14 text-right text-text-secondary">{r.snr}</span>
              <span className="w-14 text-right text-text-secondary">{r.lev}</span>
              <span className="w-12 text-right text-text-secondary">{r.vel}</span>
              <span className="w-12 text-right text-text-secondary">{r.d10}</span>
              <span className="w-12 text-right text-text-muted">{r.pct}</span>
              <span className={`w-10 text-right ${r.mv === '▲' ? 'text-green-400' : r.mv === '▼' ? 'text-red-400' : 'text-text-dim'}`}>
                {r.mv}
              </span>
            </div>
          )
        })}
      </div>
      {/* Reconciling caption (review 2026-07-02): the mock renders the canonical
          anchor read (the verified ccusage ceiling), NOT the observer-stripped
          live board shown in the Three Degrees gold column — so the two surfaces
          don't read as a 33× discrepancy. */}
      <div className="border-t border-bg-border-subtle px-4 py-2 font-mono text-[10px] leading-snug text-text-dim">
        Illustrative — canonical anchor read (ccusage ceiling). Live board shows
        observer-stripped yields.
      </div>
    </div>
  )
}
