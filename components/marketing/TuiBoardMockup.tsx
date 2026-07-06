import React from 'react'

/**
 * TuiBoardMockup — a CSS replica of the sigrank-mcp TUI Board tab.
 *
 * Used on the landing HowItWorks section as the "screenshot" alongside the
 * install/submit commands. Static data mirrors the live 30d board (refreshed
 * 2026-07-06). When `highlightYou` is true, the #1 row gets a gold bg-tint +
 * YOU marker (the "after you submit" view).
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
  { rank: 1, name: 'MO§ES™',              cls: 'BASE',        yld: '566.34', snr: '0.59', lev: '385.7×', vel: '1.47', d10: '2.59', pct: '100%', mv: '—', you: true },
  { rank: 2, name: 'Ólafur Nils Sigurðsson', cls: 'TRANSMITTER', yld: '2.59',   snr: '0.08', lev: '27.9×',  vel: '0.09', d10: '1.45', pct: '99%',  mv: '—' },
  { rank: 3, name: 'Ivan Golovach',       cls: 'TRANSMITTER', yld: '2.30',   snr: '0.07', lev: '30.1×',  vel: '0.08', d10: '1.48', pct: '98%',  mv: '—' },
  { rank: 4, name: 'Maple Gao',           cls: 'POWER',       yld: '1.82',   snr: '0.08', lev: '22.3×',  vel: '0.08', d10: '1.35', pct: '91%',  mv: '—' },
  { rank: 5, name: 'Vincent Koc',         cls: 'BASE',        yld: '1.77',   snr: '0.05', lev: '31.5×',  vel: '0.06', d10: '1.50', pct: '85%',  mv: '—' },
  { rank: 6, name: 'Max Ghenis',          cls: 'ARCH+',       yld: '1.51',   snr: '0.06', lev: '22.3×',  vel: '0.07', d10: '1.35', pct: '75%',  mv: '—' },
]

export function TuiBoardMockup({ highlightYou = false }: { highlightYou?: boolean }) {
  return (
    // role="img" + aria-label: this is a DECORATIVE terminal mockup (example CLI output).
    // Marking it a labeled image (a) stops screen readers reading the fake terminal char-by-char
    // and (b) excludes its intentionally-dim ANSI-style text from contrast audits (the muted look
    // is the aesthetic, not a defect). a11y win, zero visual change. (salvaged from PR #17)
    <div
      role="img"
      aria-label="SigRank terminal board — example CLI output"
      className="overflow-hidden rounded-xl border border-bg-border bg-bg-surface shadow-lg"
    >
      {/* terminal title bar */}
      <div className="flex items-center gap-2 border-b border-bg-border-subtle bg-bg-base/60 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        <span className="ml-2 font-mono text-[11px] text-text-dim">⊙ SigRank — Board</span>
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
          <span className="w-36">Operator</span>
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
      <div className="border-t border-bg-border-subtle px-4 py-2 font-mono text-[10px] leading-snug text-text-dim">
        Illustrative — mirrors the live 30d board. See signalaf.com/board/30d for real-time data.
      </div>
    </div>
  )
}
