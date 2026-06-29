/**
 * lib/data/types.ts — canonical data-layer types, extracted from mock.ts.
 *
 * These interfaces are the contract between the DB read path (queries.ts,
 * mappers.ts), the fallback path (fallback.ts → mock.ts), and the feature
 * builders (to-entry.ts, CoreMetricsGrid.tsx, index.ts re-export facade).
 *
 * They lived in mock.ts historically (the mock module was the first thing
 * built, so its types became the canonical source by accident). Extracted
 * here 2026-06-26 so the type contract is neutral + independent of the
 * mock DATA (which is fallback-only). mock.ts now imports FROM here.
 */

import type { SignalClass } from '@/components/sigrank/types'
import type { Operator, ScoredSnapshot } from '@/lib/scoring/types'

/** A leaderboard row: identity + scored snapshot + ranking metadata. */
export interface LeaderboardRow {
  operator: Operator
  snapshot: ScoredSnapshot
  global_rank: number
  /** Percentile [0,100], higher = better. */
  percentile: number
  /** Raw telemetry, present for the real operator and useful for mock detail. */
  telemetry: TelemetryRaw
  /** True when the operator exists but has no cascade data yet (no verified
   *  submission) — the profile renders an identity-only pending state, not 404. */
  pending?: boolean
  // ── 730 window layer (optional; mirrors metric_snapshots). These let the mock
  //    path filter by window identically to the live path (lib/data/windows.ts).
  //    Live rows populate them from the DB; mock rows set them below. ──
  /** DB window_type enum: '7d' | '30d' | '90d' | 'all_time'. */
  window_type?: string | null
  /** Per-submission AI platform (FIX H): claude/codex/multi/… Distinguishes the
   *  same operator's per-platform rows on the "off" board. Live rows read it from
   *  metric_snapshots.platform; mock rows fall back to the operator's primary_domain. */
  platform?: string | null
  /** Snapshot DATE ('YYYY-MM-DD') — recency reference for the window buffer. */
  snapshot_date?: string | null
}

/** Raw token telemetry (CANON §I / §VII). */
export interface TelemetryRaw {
  fresh_input: number
  output: number
  cache_read: number
  cache_create: number
  sessions: number
  turns: number
}

/** A single point in an operator's score history. */
export interface HistoryPoint {
  /** ISO date (deterministic literal — not derived from a clock). */
  date: string
  signa_rate: number
  global_rank: number
  class_tier: SignalClass
}

/** Aggregate homepage stat block. */
export interface HomepageStats {
  total_operators: number
  total_snapshots: number
  total_tokens_scored: number
  transmitter_count: number
  top_operator_codename: string
  top_signa_rate: number
  /** Operators active in the last hour (by operators.last_seen). */
  active_last_hour: number
  /** Total head-to-head comparisons run (site_counters.comparisons_ran). */
  comparisons_ran: number
  /** Whether these numbers are placeholders (mock fallback). */
  isPlaceholder: boolean
}

/** A Hall of Signal record. */
export interface HallRecord {
  /** Reward canonical id, e.g. "RW.28". */
  reward_id: string
  title: string
  operator_codename: string
  value: string
  date: string
  isPlaceholder: boolean
}

/** Per-class population row for the class distribution board. */
export interface ClassDistributionRow {
  class_tier: SignalClass
  class_id: string
  count: number
}

/** One hour of the operators-online daily curve (BlitzStars "Hourly"). */
export interface HourlyPoint {
  /** Hour label, "00".."23". */
  label: string
  online: number
}

/** One day of the weekly online band — daily max and average (BlitzStars "Weekly"). */
export interface WeeklyPoint {
  label: string
  max: number
  avg: number
}

/**
 * Live operators online for one country (BlitzStars "Players Online - Live").
 * Country-level, not continent — operators self-identify by country.
 */
export interface CountryCount {
  country: string
  online: number
}
