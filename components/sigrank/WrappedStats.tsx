import React from 'react'
import { colors, fonts, radius, shadow } from './tokens'
import type { Badge } from './types'

interface Props {
  stats?: {
    sessions: number
    messagesSent: number
    totalTokens: number
    timeWithDroid: string
    longestSession: string
    daysSinceJoining: number
    longestStreak: number
    tokenBreakdown?: {
      input: number
      output: number
      thinking: number
      cache: number
    }
    dateRange?: string
  }
  activityByMonth?: { label: string; sessions: number }[]
  topModel?: string
  totalTokensDisplay?: string
  badges?: Badge[]
  tagline?: string
}

const SAMPLE_STATS = {
  sessions: 1602,
  messagesSent: 53960,
  totalTokens: 3028615336,
  timeWithDroid: '10d 4h',
  longestSession: '14.6 hours',
  daysSinceJoining: 119,
  longestStreak: 38,
  tokenBreakdown: {
    input: 91254810,
    output: 18977616,
    thinking: 6325085,
    cache: 2912057825,
  },
  dateRange: 'Sep 3, 2025 to Dec 30, 2025',
}

const SAMPLE_MONTHS = [
  { label: 'Sep', sessions: 263 },
  { label: 'Oct', sessions: 336 },
  { label: 'Nov', sessions: 528 },
  { label: 'Dec', sessions: 475 },
]

const SAMPLE_BADGES: Badge[] = [
  { name: 'Super User', description: '1000+ sessions' },
  { name: 'Streak Legend', description: '30+ day streak' },
  { name: 'Billion Token Club', description: '1B+ tokens' },
  { name: 'Centurion', description: '100+ hours total' },
  { name: 'Ultra Marathon', description: '8+ hour session' },
  { name: 'The DJ', description: 'Sounds enabled' },
]

function formatTokens(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toString()
}

function ActivityMonthRow({ label, sessions, max }: { label: string; sessions: number; max: number }) {
  const blocks = 20
  const filled = Math.round((sessions / max) * blocks)

  return (
    <div style={monthStyles.row}>
      <span style={monthStyles.label}>{label}</span>
      <span style={monthStyles.dots}>
        {Array.from({ length: blocks }, (_, i) => (
          <span key={i} style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '1px',
            marginRight: '1px',
            background: i < filled ? colors.class.REFINER : colors.bg.elevated,
            opacity: i < filled ? (0.4 + (i / blocks) * 0.6) : 1,
          }} />
        ))}
      </span>
      <span style={monthStyles.count}>{sessions} sessions</span>
    </div>
  )
}

const monthStyles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: '12px',
    color: colors.text.muted,
    width: '28px',
  },
  dots: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  },
  count: {
    fontFamily: fonts.mono,
    fontSize: '11px',
    color: colors.text.secondary,
    whiteSpace: 'nowrap',
  },
}

export function WrappedStats({
  stats = SAMPLE_STATS,
  activityByMonth = SAMPLE_MONTHS,
  topModel = 'Claude Opus 4.5',
  totalTokensDisplay = '3028.6M',
  badges = SAMPLE_BADGES,
  tagline = "1B+ tokens? Could have written Chromium twice. Does the world need another AI browser?",
}: Props) {
  const maxSessions = Math.max(...activityByMonth.map(m => m.sessions))

  const mainStats = [
    { label: 'Sessions', value: stats.sessions.toLocaleString() },
    { label: 'Messages Sent', value: stats.messagesSent.toLocaleString() },
    { label: 'Total Tokens', value: formatTokens(stats.totalTokens) },
    { label: 'Time with Droid', value: stats.timeWithDroid },
    { label: 'Longest Session', value: stats.longestSession },
    { label: 'Days Since Joining', value: `${stats.daysSinceJoining} days` },
    { label: 'Longest Streak', value: `${stats.longestStreak} days` },
  ]

  return (
    <div style={styles.wrapper}>
      {/* The Numbers section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>★ THE NUMBERS</div>
        <div style={styles.divider} />

        <div style={styles.statsGrid}>
          {mainStats.map((s) => (
            <div key={s.label} style={styles.statRow}>
              <span style={styles.statLabel}>{s.label}</span>
              <span style={styles.statValue}>{s.value}</span>
            </div>
          ))}
        </div>

        {stats.tokenBreakdown && (
          <div style={styles.tokenBreakdown}>
            Token breakdown:{' '}
            <span style={styles.tokenPart}>{formatTokens(stats.tokenBreakdown.input)} input</span>
            {' | '}
            <span style={styles.tokenPart}>{formatTokens(stats.tokenBreakdown.output)} output</span>
            {' | '}
            <span style={styles.tokenPart}>{formatTokens(stats.tokenBreakdown.thinking)} thinking</span>
            {' | '}
            <span style={styles.tokenPart}>{formatTokens(stats.tokenBreakdown.cache)} cache</span>
          </div>
        )}

        {stats.dateRange && (
          <div style={styles.dateRange}>Data from {stats.dateRange}</div>
        )}
      </div>

      {/* Wrapped section */}
      <div style={styles.section}>
        <div style={styles.wrappedTitle}>FACTORY WRAPPED 2025</div>
        <div style={styles.divider} />

        <div style={styles.statsBubbleRow}>
          {[
            { val: '1.6K', sub: 'SESSIONS' },
            { val: '10d 4h', sub: 'TIME' },
            { val: '38d', sub: 'STREAK' },
            { val: '15h', sub: 'LONGEST' },
            { val: '119d', sub: 'MEMBER' },
          ].map((b) => (
            <div key={b.sub} style={styles.bubble}>
              <span style={styles.bubbleVal}>{b.val}</span>
              <span style={styles.bubbleSub}>{b.sub}</span>
            </div>
          ))}
        </div>

        <div style={styles.monthActivity}>
          {activityByMonth.map((m) => (
            <ActivityMonthRow key={m.label} label={m.label} sessions={m.sessions} max={maxSessions} />
          ))}
        </div>

        <div style={styles.modelRow}>
          <span style={styles.modelLabel}>Top Model:</span>
          <span style={styles.modelValue}>{topModel}</span>
        </div>
        <div style={styles.modelRow}>
          <span style={styles.modelLabel}>Tokens:</span>
          <span style={styles.modelValue}>{totalTokensDisplay}</span>
        </div>
      </div>

      {/* Badges */}
      <div style={styles.section}>
        <div style={styles.badgesHeader}>BADGES</div>
        <div style={styles.badgesList}>
          {badges.map((b) => (
            <div key={b.name} style={styles.badgeRow}>
              <span style={styles.badgeStar}>★</span>
              <span style={styles.badgeName}>{b.name}</span>
              <span style={styles.badgeDesc}>- {b.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tagline */}
      {tagline && (
        <div style={styles.tagline}>{tagline}</div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    background: colors.bg.surface,
    border: `1px solid ${colors.bg.border}`,
    borderRadius: radius.lg,
    boxShadow: shadow.card,
    fontFamily: fonts.mono,
    color: colors.text.primary,
    maxWidth: '560px',
    overflow: 'hidden',
  },
  section: {
    padding: '16px 20px',
    borderBottom: `1px solid ${colors.bg.border}`,
  },
  sectionHeader: {
    fontSize: '13px',
    fontWeight: 700,
    color: colors.text.gold,
    letterSpacing: '0.06em',
    marginBottom: '8px',
  },
  divider: {
    height: '1px',
    background: colors.bg.border,
    marginBottom: '12px',
  },
  statsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  statRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  statLabel: {
    fontSize: '12px',
    color: colors.text.secondary,
    minWidth: '160px',
  },
  statValue: {
    fontSize: '12px',
    color: colors.text.primary,
    fontWeight: 600,
  },
  tokenBreakdown: {
    fontSize: '11px',
    color: colors.text.muted,
    marginTop: '10px',
    lineHeight: 1.6,
    wordBreak: 'break-word',
  },
  tokenPart: {
    color: colors.text.secondary,
  },
  dateRange: {
    fontSize: '10px',
    color: colors.text.dim,
    marginTop: '8px',
  },
  wrappedTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: colors.text.gold,
    letterSpacing: '0.1em',
    textAlign: 'center',
    marginBottom: '8px',
  },
  statsBubbleRow: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'space-between',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  bubble: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  bubbleVal: {
    fontSize: '16px',
    fontWeight: 700,
    color: colors.text.primary,
  },
  bubbleSub: {
    fontSize: '9px',
    color: colors.text.muted,
    letterSpacing: '0.06em',
  },
  monthActivity: {
    marginBottom: '12px',
  },
  modelRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'baseline',
    marginTop: '4px',
  },
  modelLabel: {
    fontSize: '11px',
    color: colors.text.muted,
  },
  modelValue: {
    fontSize: '12px',
    fontWeight: 700,
    color: colors.text.primary,
  },
  badgesHeader: {
    fontSize: '12px',
    fontWeight: 700,
    color: colors.text.gold,
    letterSpacing: '0.06em',
    marginBottom: '8px',
  },
  badgesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
  },
  badgeStar: {
    color: colors.text.gold,
    fontSize: '11px',
  },
  badgeName: {
    fontSize: '12px',
    fontWeight: 600,
    color: colors.text.primary,
  },
  badgeDesc: {
    fontSize: '11px',
    color: colors.text.muted,
  },
  tagline: {
    padding: '12px 20px',
    fontSize: '11px',
    color: colors.text.dim,
    lineHeight: 1.6,
    fontStyle: 'italic',
  },
}
