import React from 'react'
import { colors, fonts, radius, shadow } from './tokens'
import type { K2ClassEntry, RegionalCount, SignalClass } from './types'

interface Props {
  rank?: number
  score?: number
  timestamp?: string
  classes?: K2ClassEntry[]
  regions?: RegionalCount[]
}

const SAMPLE_CLASSES: K2ClassEntry[] = [
  { signalClass: 'TRANSMITTER', trait: 'Enhancing Signal', liveCount: 3, maxCount: 1645 },
  { signalClass: 'ARCH+', trait: 'Precision Creators', liveCount: 5, maxCount: 1645 },
  { signalClass: 'ARCH', trait: 'System Builders', liveCount: 3, maxCount: 1645 },
  { signalClass: 'POWER', trait: 'Forming Forge', liveCount: 106, maxCount: 1645 },
  { signalClass: 'BASE', trait: 'Signal Breaking Thru', liveCount: 178, maxCount: 1645 },
  { signalClass: 'SEEKER', trait: 'Active Explorers', liveCount: 489, maxCount: 1645 },
  { signalClass: 'REFINER', trait: 'Practicing with Purpose', liveCount: 470, maxCount: 1645 },
  { signalClass: 'BEARER', trait: 'Quiet Insight Holders', liveCount: 643, maxCount: 1645 },
  { signalClass: 'IGNITER', trait: 'Dormant Potential', liveCount: 1645, maxCount: 1645 },
]

const SAMPLE_REGIONS: RegionalCount[] = [
  { region: 'North America', count: 2816 },
  { region: 'Europe', count: 1045 },
  { region: 'Asia', count: 1215 },
  { region: 'South America', count: 724 },
  { region: 'Africa', count: 203 },
  { region: 'Oceania', count: 200 },
  { region: 'Other/Unknown', count: 97 },
]

const CLASS_ICONS: Partial<Record<SignalClass, string>> = {
  TRANSMITTER: '◈',
  'ARCH+': '▲',
  ARCH: '▽',
  POWER: '⬡',
  BASE: '↓',
  SEEKER: '◎',
  REFINER: '⟳',
  BEARER: '◇',
  IGNITER: '·',
}

const CLASS_DEFS: Partial<Record<SignalClass, string>> = {
  TRANSMITTER: 'You don\'t just use the system. You are the system. — Composite Score > 0.85',
  'ARCH+': 'Precision creators. Structure from signal. — Score 0.75–0.84',
  ARCH: 'System builders. Coherent operators. — Score 0.65–0.74',
  POWER: 'You generate. Refine. High activity, low compression — Score 0.60–74',
  BASE: 'You\'re right there. Clarity is breaking. → Rising across multiple signals',
  SEEKER: 'Curiosity is courage. Keep Asking. Clustering — High prompts, low S/N refinement.',
  REFINER: 'Practicing with purpose. Every prompt shaping precision — Consistent mid tier',
  BEARER: 'You\'ve carried signal long enough. Speak again — the legends — Deep threads',
  IGNITER: 'The still soul. Waiting. One purpose will light the next profile.',
}

function LiveCountBar({ count, max }: { count: number; max: number }) {
  const pct = Math.min(100, (count / max) * 100)
  const color = colors.class[
    count > 500 ? 'IGNITER' :
    count > 200 ? 'BEARER' :
    count > 50 ? 'SEEKER' :
    'TRANSMITTER'
  ] ?? colors.text.accent

  return (
    <div style={barStyles.wrapper}>
      <div style={{ ...barStyles.fill, width: `${pct}%`, background: color }} />
      <span style={barStyles.label}>{count.toLocaleString()}</span>
    </div>
  )
}

const barStyles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    height: '18px',
    background: colors.bg.elevated,
    borderRadius: radius.xs,
    overflow: 'hidden',
    minWidth: '120px',
    display: 'flex',
    alignItems: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: radius.xs,
    opacity: 0.35,
  },
  label: {
    position: 'relative',
    fontFamily: fonts.mono,
    fontSize: '11px',
    fontWeight: 600,
    color: colors.text.primary,
    paddingLeft: '6px',
    zIndex: 1,
  },
}

export function K2IndexSnapshot({
  rank = 17,
  score = 4.6,
  timestamp = '2025-07-27 08:22 UTC',
  classes = SAMPLE_CLASSES,
  regions = SAMPLE_REGIONS,
}: Props) {
  return (
    <div style={styles.wrapper}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.brandRow}>
          <span style={styles.brand}>◈ SIGRANK</span>
          <span style={styles.rankChip}>★ Rank #{rank} • {score}</span>
        </div>
        <div style={styles.titleBlock}>
          <div style={styles.titleMain}>SigRank: K2 SIGNAL INDEX</div>
          <div style={styles.titleSub}>SNAPSHOT — LIVE REPORT</div>
        </div>
      </div>

      {/* Class table */}
      <div style={styles.tableWrapper}>
        <div style={styles.brandBar}>
          <span style={styles.brandBarLabel}>◈ SIGRANK</span>
          <span style={styles.brandBarRank}>★ Rank #{rank} • {score}</span>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}></th>
              <th style={styles.th}>CLASS</th>
              <th style={styles.th}>S/N TRAIT</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>LIVE_COUNT</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((entry) => {
              const color = colors.class[entry.signalClass] ?? colors.text.muted
              return (
                <tr key={entry.signalClass} style={styles.row}>
                  <td style={styles.td}>
                    <span style={{ color, fontSize: '14px' }}>
                      {CLASS_ICONS[entry.signalClass] ?? '·'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      fontFamily: fonts.mono,
                      fontSize: '12px',
                      fontWeight: 600,
                      color,
                    }}>
                      {entry.signalClass}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      fontFamily: fonts.sans,
                      fontSize: '11px',
                      color: colors.text.secondary,
                    }}>
                      {entry.trait}
                    </span>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    <LiveCountBar count={entry.liveCount} max={entry.maxCount ?? 2000} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Regional distribution */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>▸ REGIONAL USER DISTRIBUTION</div>
        <div style={styles.regionGrid}>
          {regions.map((r) => (
            <div key={r.region} style={styles.regionRow}>
              <span style={styles.regionLabel}>{r.region}</span>
              <span style={styles.regionCount}>{r.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Class definitions */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>▸ CLASS DEFINITIONS + SIGNAL METRIC CRITERIA</div>
        <div style={styles.defsGrid}>
          {classes.map((entry) => {
            const def = CLASS_DEFS[entry.signalClass]
            if (!def) return null
            const color = colors.class[entry.signalClass] ?? colors.text.muted
            return (
              <div key={entry.signalClass} style={styles.defRow}>
                <span style={{ ...styles.defClass, color }}>{entry.signalClass}</span>
                <span style={styles.defText}>{def}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <span style={styles.footerText}>Generated by TheSignalVault | SigRank | Timestamp: {timestamp}</span>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: colors.bg.base,
    border: `1px solid ${colors.bg.border}`,
    borderRadius: radius.lg,
    boxShadow: shadow.card,
    fontFamily: fonts.sans,
    overflow: 'hidden',
    maxWidth: '560px',
  },
  header: {
    background: `linear-gradient(180deg, ${colors.bg.elevated} 0%, ${colors.bg.surface} 100%)`,
    borderBottom: `1px solid ${colors.bg.border}`,
    padding: '16px 20px 12px',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  brand: {
    fontFamily: fonts.mono,
    fontSize: '13px',
    fontWeight: 700,
    color: colors.text.accent,
    letterSpacing: '0.08em',
  },
  rankChip: {
    fontFamily: fonts.mono,
    fontSize: '11px',
    color: colors.text.gold,
    background: `${colors.text.gold}15`,
    border: `1px solid ${colors.text.gold}30`,
    borderRadius: radius.sm,
    padding: '2px 8px',
  },
  titleBlock: {
    textAlign: 'center',
    padding: '4px 0',
  },
  titleMain: {
    fontFamily: fonts.mono,
    fontSize: '15px',
    fontWeight: 700,
    color: colors.text.primary,
    letterSpacing: '0.06em',
  },
  titleSub: {
    fontFamily: fonts.mono,
    fontSize: '11px',
    color: colors.text.muted,
    letterSpacing: '0.1em',
    marginTop: '2px',
  },
  tableWrapper: {
    borderBottom: `1px solid ${colors.bg.border}`,
  },
  brandBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px 4px',
    background: colors.bg.surface,
  },
  brandBarLabel: {
    fontFamily: fonts.mono,
    fontSize: '12px',
    color: colors.text.accent,
  },
  brandBarRank: {
    fontFamily: fonts.mono,
    fontSize: '11px',
    color: colors.text.gold,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    fontFamily: fonts.mono,
    fontSize: '10px',
    fontWeight: 700,
    color: colors.text.muted,
    textAlign: 'left',
    padding: '6px 12px',
    background: colors.bg.elevated,
    borderBottom: `1px solid ${colors.bg.border}`,
    letterSpacing: '0.06em',
  },
  row: {
    borderBottom: `1px solid ${colors.bg.borderSubtle}`,
  },
  td: {
    padding: '8px 12px',
    verticalAlign: 'middle',
  },
  section: {
    padding: '12px 16px',
    borderBottom: `1px solid ${colors.bg.border}`,
  },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: '10px',
    fontWeight: 700,
    color: colors.text.muted,
    letterSpacing: '0.06em',
    marginBottom: '8px',
  },
  regionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px 24px',
  },
  regionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regionLabel: {
    fontFamily: fonts.sans,
    fontSize: '11px',
    color: colors.text.secondary,
  },
  regionCount: {
    fontFamily: fonts.mono,
    fontSize: '11px',
    color: colors.text.primary,
    fontWeight: 600,
  },
  defsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  defRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'flex-start',
  },
  defClass: {
    fontFamily: fonts.mono,
    fontSize: '10px',
    fontWeight: 700,
    minWidth: '80px',
    letterSpacing: '0.04em',
    flexShrink: 0,
    paddingTop: '1px',
  },
  defText: {
    fontFamily: fonts.sans,
    fontSize: '10px',
    color: colors.text.muted,
    lineHeight: 1.5,
  },
  footer: {
    padding: '8px 16px',
    background: colors.bg.surface,
    textAlign: 'center',
  },
  footerText: {
    fontFamily: fonts.mono,
    fontSize: '10px',
    color: colors.text.dim,
  },
}
