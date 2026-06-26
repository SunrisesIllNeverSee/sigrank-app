/**
 * lib/data/queries.ts — the async DB read facade.
 *
 * Every page / route that needs operator data calls these functions (via the
 * `@/lib/data` barrel); none import Supabase directly. Each follows the same
 * contract:
 *
 *     const sb = getSupabaseServer()
 *     if (!sb) return <fallback>          // no creds → deterministic fallback
 *     try { ...query...; return mapped }  // live data
 *     catch { return <fallback> }         // query error → graceful fallback
 *
 * So the app always builds and renders with no creds present, and degrades
 * gracefully on any Supabase failure. Raw rows are shaped by lib/data/mappers;
 * the no-DB/error path is lib/data/fallback. All functions are async.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseServer } from '@/lib/supabase/server'
import { SORT_DEFAULT } from '@/lib/constants'
import { filterToWindow } from '@/lib/data/windows'
import { CLASS_NAME_TO_ID, REWARDS } from '@/lib/canon/ids'
import type { SignalClass } from '@/components/sigrank/types'
import {
  MOCK_CLASS_DISTRIBUTION,
  MOCK_COUNTRIES,
  MOCK_HALL,
  MOCK_HISTORY,
  MOCK_HOMEPAGE_STATS,
  MOCK_HOURLY,
  MOCK_WEEKLY,
} from '@/lib/data/mock'
import type {
  ClassDistributionRow,
  CountryCount,
  HallRecord,
  HistoryPoint,
  HomepageStats,
  HourlyPoint,
  LeaderboardRow,
  WeeklyPoint,
} from '@/lib/data/types'
import {
  type BoardParams,
  type DbMetricSnapshot,
  type DbOperator,
  type HistoryParams,
  asDb,
  latestPerOperator,
  latestPerOperatorPlatform,
  mapOperator,
  mapSnapshot,
  num,
  pendingSnapshot,
  telemetryFromSnapshot,
  toSignalClass,
  ZERO_TELEMETRY,
} from '@/lib/data/mappers'
import { fallbackRows, filterMockBoard, sortValue } from '@/lib/data/fallback'

/** Minimal shape of a `rank_history` row we read. */
interface DbRankHistory {
  operator_id: string
  snapshot_date: string
  global_rank: number | null
  percentile: number | null
}


/** All columns of metric_snapshots the mapper reads (single source for selects). */
export const SNAPSHOT_COLUMNS =
  'operator_id, snapshot_date, window_type, platform, compression_ratio, prompt_complexity, cross_thread, ' +
  'session_depth, token_throughput, signa_rate, sdot_score, sdrm_score, signal_force, ' +
  'drift_ratio, class_tier, movement_24h, movement_7d, ' +
  'ruleset_version, ' +
  'input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens'

/**
 * All operators columns the mapper reads — these are exactly the columns the
 * `operators_public` view exposes (P5 fix, 0008). claim_contact / claim_payment_id
 * are deliberately ABSENT (the view withholds them); selecting them off the view
 * would error, and the public path must never read the PII email.
 */
export const OPERATOR_COLUMNS =
  'operator_id, codename, display_name, claimed, claimed_at, ' +
  'current_supporter_tier, verification_status, primary_domain, ' +
  'account_age_days, total_messages_lifetime, ' +
  // Phase-0 identity fields (migration 0007, apply post-move — null-safe on old rows)
  'handle, avatar_url, bio, links, location'

// (Circles feature dropped 2026-06-25 — fresh-slate rebuild later. The circles /
// circle_members / circle_metric_snapshots tables were removed from the DB; the
// query code is gone with them. See ICEBOX.md / AFTER_LAUNCH.md.)

// ───────────────────────────────────────────────────────────────────────────
// Facade functions.
// ───────────────────────────────────────────────────────────────────────────

/** Global / filtered leaderboard. */
export async function getLeaderboard(params: BoardParams = {}): Promise<LeaderboardRow[]> {
  const sb = getSupabaseServer()
  if (!sb) return filterMockBoard(params)
  try {
    // Live path: read latest metric_snapshots, join operators + rank_history.
    // We sort/filter/re-rank in JS so the live board is shape- and order-
    // identical to filterMockBoard (the schema-parity contract).
    const { data: snapData, error: snapError } = await sb
      .from('metric_snapshots')
      .select(SNAPSHOT_COLUMNS)
      .order('snapshot_date', { ascending: false })
    if (snapError) throw snapError
    const allSnaps = asDb<DbMetricSnapshot[] | null>(snapData) ?? []
    // DB empty/unreachable → mock fallback (graceful-degradation contract).
    if (allSnaps.length === 0) return filterMockBoard(params)
    // 730: narrow to the window (exact window_type + buffer) BEFORE dedupe so each
    // operator's latest snapshot WITHIN the window wins — but ONLY when the caller
    // opts in (the /board route). Legacy callers (metric pages, /api/v1/leaderboard,
    // home/transmitters/hall) keep their pre-730 full-field behaviour.
    const windowed =
      params.windowFilter && params.window ? filterToWindow(allSnaps, params.window) : allSnaps
    // "off" board: keep EVERY (operator, platform, window) point — no collapse.
    // perPlatform (windowed boards, FIX H): one row per (operator, platform).
    // Otherwise collapse to the latest snapshot per operator (legacy behaviour).
    const snapRows: DbMetricSnapshot[] = params.allSnapshots
      ? windowed
      : params.perPlatform
        ? [...latestPerOperatorPlatform(windowed).values()]
        : [...latestPerOperator(windowed).values()]
    // Honest empty: a connected DB whose requested window has zero rows returns an
    // empty board (NOT fabricated mock seeds). Mock is only for an empty/broken DB.
    if (snapRows.length === 0) return params.windowFilter ? [] : filterMockBoard(params)

    const opIds = [...new Set(snapRows.map((s) => s.operator_id))]
    const { data: opData, error: opError } = await sb
      .from('operators_public')
      .select(OPERATOR_COLUMNS)
      .in('operator_id', opIds)
    if (opError) throw opError
    const opById = new Map<string, DbOperator>(
      (asDb<DbOperator[] | null>(opData) ?? []).map((o) => [o.operator_id, o]),
    )

    // Latest rank_history per operator for percentile (global_rank is recomputed
    // from the filtered view below, mirroring the mock re-ranking).
    const { data: rankData } = await sb
      .from('rank_history')
      .select('operator_id, snapshot_date, global_rank, percentile')
      .order('snapshot_date', { ascending: false })
    const pctById = new Map<string, number>()
    for (const r of (asDb<DbRankHistory[] | null>(rankData) ?? [])) {
      if (!pctById.has(r.operator_id)) pctById.set(r.operator_id, num(r.percentile))
    }

    let rows: LeaderboardRow[] = []
    for (const snap of snapRows) {
      const op = opById.get(snap.operator_id)
      if (!op) continue
      rows.push({
        operator: mapOperator(op),
        snapshot: mapSnapshot(snap),
        global_rank: 0, // recomputed after sort
        percentile: pctById.get(snap.operator_id) ?? 0,
        telemetry: telemetryFromSnapshot(snap),
        window_type: snap.window_type ?? null,
        platform: snap.platform ?? op.primary_domain ?? null,
        snapshot_date: snap.snapshot_date ?? null,
      })
    }
    // Honest empty (mirrors the latest.size===0 guard above): if operators didn't
    // resolve for the windowed snapshots (e.g. RLS divergence on an anon-key deploy),
    // a windowFilter board returns [] rather than fabricated mock seeds.
    if (rows.length === 0) return params.windowFilter ? [] : filterMockBoard(params)

    // Apply the same filter → sort → re-rank → limit pipeline as the mock path.
    if (params.platform && params.platform !== 'all') {
      rows = rows.filter(
        (r) => r.operator.primary_domain.toLowerCase() === params.platform!.toLowerCase(),
      )
    }
    if (params.classScope && params.classScope !== 'all') {
      rows = rows.filter(
        (r) => r.snapshot.class_tier.toLowerCase() === params.classScope!.toLowerCase(),
      )
    }
    const sort = params.sort ?? SORT_DEFAULT
    rows.sort((a, b) => sortValue(b, sort) - sortValue(a, sort))
    rows = rows.map((r, i) => ({ ...r, global_rank: i + 1 }))
    if (params.limit && params.limit > 0) rows = rows.slice(0, params.limit)
    return rows
  } catch {
    return filterMockBoard(params)
  }
}

/** Single operator by codename (identity + latest snapshot + rank). */
export async function getOperator(codename: string): Promise<LeaderboardRow | null> {
  const sb = getSupabaseServer()
  const fromMock = () =>
    fallbackRows().find(
      (r) => r.operator.codename.toLowerCase() === codename.toLowerCase(),
    ) ?? null
  if (!sb) return fromMock()
  try {
    // Identity by codename (case-insensitive), then latest snapshot + rank.
    const { data: opData, error: opError } = await sb
      .from('operators_public')
      .select(OPERATOR_COLUMNS)
      .ilike('codename', codename)
      .limit(1)
      .maybeSingle()
    if (opError) throw opError
    const op = asDb<DbOperator | null>(opData)
    if (!op) return fromMock()

    const { data: snapData, error: snapError } = await sb
      .from('metric_snapshots')
      .select(SNAPSHOT_COLUMNS)
      .eq('operator_id', op.operator_id)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (snapError) throw snapError
    const snap = asDb<DbMetricSnapshot | null>(snapData)
    if (!snap) {
      // Operator EXISTS but has no cascade data yet (freshly-claimed account, no
      // verified submission). Render an identity-only PENDING profile — never a 404.
      return {
        operator: mapOperator(op),
        snapshot: pendingSnapshot(),
        global_rank: 0,
        percentile: 0,
        telemetry: ZERO_TELEMETRY,
        pending: true,
      }
    }

    const { data: rankData } = await sb
      .from('rank_history')
      .select('operator_id, snapshot_date, global_rank, percentile')
      .eq('operator_id', op.operator_id)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .maybeSingle()
    const rank = asDb<DbRankHistory | null>(rankData)

    return {
      operator: mapOperator(op),
      snapshot: mapSnapshot(snap),
      global_rank: num(rank?.global_rank),
      percentile: num(rank?.percentile),
      telemetry: telemetryFromSnapshot(snap),
    }
  } catch {
    return fromMock()
  }
}

/** One operator submission cell: a (platform, window) point with its score. */
export interface OperatorSubmission {
  /** Lowercase platform ('claude'/'codex'/'multi'/…). */
  platform: string
  /** Window bucket ('7d'/'30d'/'90d'/'all_time'/'today'). */
  window: string
  /** Snapshot date 'YYYY-MM-DD' (most recent for this platform×window). */
  snapshotDate: string | null
  classTier: SignalClass
  /** Υ Yield (null when non-compounding — no cache pillar). */
  yield_: number | null
  signaRate: number | null
  totalTokens: number | null
}

/** Map one DB snapshot → a submission cell. */
function toSubmission(snap: DbMetricSnapshot, primaryDomain: string | null): OperatorSubmission {
  const s = mapSnapshot(snap)
  const t = telemetryFromSnapshot(snap)
  const c = s.cascade
  return {
    platform: (snap.platform ?? primaryDomain ?? 'other').toLowerCase(),
    window: snap.window_type ?? 'all_time',
    snapshotDate: snap.snapshot_date ?? null,
    classTier: s.class_tier,
    yield_: c && !c.nonCompounding ? c.yield_ : null,
    signaRate: snap.signa_rate ?? null,
    totalTokens: t ? t.fresh_input + t.output + t.cache_create + t.cache_read : null,
  }
}

/**
 * All of an operator's submissions, one per (platform, window) — the data behind the
 * profile Submissions grid (FIX I3 / owner 2026-06-26: "show all their submissions —
 * claude/codex/multi × 7/30/90/all"). Latest snapshot per (platform, window) wins
 * (rows arrive date-desc → first seen). Empty when the operator has no verified
 * submission yet. Per-platform cells populate as FIX H multi-platform submissions land.
 */
export async function getOperatorSubmissions(codename: string): Promise<OperatorSubmission[]> {
  const sb = getSupabaseServer()
  const dedupe = (rows: OperatorSubmission[]): OperatorSubmission[] => {
    const seen = new Map<string, OperatorSubmission>()
    for (const r of rows) {
      const k = `${r.platform}|${r.window}`
      if (!seen.has(k)) seen.set(k, r)
    }
    return [...seen.values()]
  }
  // Degraded/mock path: the single fallback row → one submission cell.
  if (!sb) {
    const r = fallbackRows().find(
      (x) => x.operator.codename.toLowerCase() === codename.toLowerCase(),
    )
    if (!r || r.pending) return []
    const t = r.telemetry
    const c = r.snapshot.cascade
    return [
      {
        platform: (r.platform ?? r.operator.primary_domain ?? 'other').toLowerCase(),
        window: r.window_type ?? 'all_time',
        snapshotDate: r.snapshot_date ?? null,
        classTier: r.snapshot.class_tier,
        yield_: c && !c.nonCompounding ? c.yield_ : null,
        signaRate: r.snapshot.signa_rate ?? null,
        totalTokens: t ? t.fresh_input + t.output + t.cache_create + t.cache_read : null,
      },
    ]
  }
  try {
    const { data: opData, error: opError } = await sb
      .from('operators_public')
      .select('operator_id, primary_domain')
      .ilike('codename', codename)
      .limit(1)
      .maybeSingle()
    if (opError) throw opError
    const op = asDb<{ operator_id: string; primary_domain: string | null } | null>(opData)
    if (!op) return []
    const { data: snapData, error: snapError } = await sb
      .from('metric_snapshots')
      .select(SNAPSHOT_COLUMNS)
      .eq('operator_id', op.operator_id)
      .order('snapshot_date', { ascending: false })
    if (snapError) throw snapError
    const snaps = asDb<DbMetricSnapshot[] | null>(snapData) ?? []
    return dedupe(snaps.map((s) => toSubmission(s, op.primary_domain)))
  } catch {
    return []
  }
}

/** Score history for one operator. */
export async function getOperatorHistory(
  codename: string,
  params: HistoryParams = {},
): Promise<HistoryPoint[]> {
  const sb = getSupabaseServer()
  const fromMock = () => {
    const points = MOCK_HISTORY[codename] ?? []
    return params.limit && params.limit > 0 ? points.slice(-params.limit) : points
  }
  if (!sb) return fromMock()
  try {
    // Resolve the operator id from the codename first.
    const { data: opData, error: opError } = await sb
      .from('operators_public')
      .select('operator_id')
      .ilike('codename', codename)
      .limit(1)
      .maybeSingle()
    if (opError) throw opError
    const op = asDb<{ operator_id: string } | null>(opData)
    if (!op) return fromMock()

    // Per-snapshot scores (signa / class), oldest → newest.
    const { data: snapData, error: snapError } = await sb
      .from('metric_snapshots')
      .select('snapshot_date, signa_rate, class_tier')
      .eq('operator_id', op.operator_id)
      .order('snapshot_date', { ascending: true })
    if (snapError) throw snapError
    const snaps =
      asDb<Array<{
        snapshot_date: string
        signa_rate: number | null
        class_tier: string | null
      }> | null>(snapData) ?? []
    if (snaps.length === 0) return fromMock()

    // Per-date global_rank from rank_history (keyed by date).
    const { data: rankData } = await sb
      .from('rank_history')
      .select('snapshot_date, global_rank')
      .eq('operator_id', op.operator_id)
    const rankByDate = new Map<string, number>()
    for (const r of ((rankData as Array<{ snapshot_date: string; global_rank: number | null }>) ?? [])) {
      rankByDate.set(r.snapshot_date, num(r.global_rank))
    }

    const points: HistoryPoint[] = snaps.map((s) => ({
      date: s.snapshot_date,
      signa_rate: num(s.signa_rate),
      global_rank: rankByDate.get(s.snapshot_date) ?? 0,
      class_tier: toSignalClass(s.class_tier),
    }))
    return params.limit && params.limit > 0 ? points.slice(-params.limit) : points
  } catch {
    return fromMock()
  }
}

/** Per-metric leaderboard (sorted by a single metric column). */
export async function getMetricLeaders(
  metric: string,
  params: BoardParams = {},
): Promise<LeaderboardRow[]> {
  return getLeaderboard({ ...params, sort: metric })
}

/** Hall of Signal records. */
export async function getHallOfSignal(params: BoardParams = {}): Promise<HallRecord[]> {
  const sb = getSupabaseServer()
  if (!sb) return MOCK_HALL
  try {
    void params
    // Hall records derive from badge awards. We embed the badge catalog (for the
    // record title) and the operator (for the codename), newest awards first.
    const { data, error } = await sb
      .from('operator_badges')
      .select(
        'awarded_at, source_note, ' +
          'badges:badge_id ( badge_name ), ' +
          'operators:operator_id ( codename )',
      )
      .order('awarded_at', { ascending: false })
    if (error) throw error

    type HallJoin = {
      awarded_at: string | null
      source_note: string | null
      badges: { badge_name: string | null } | null
      operators: { codename: string | null } | null
    }
    const rows = (data as unknown as HallJoin[] | null) ?? []
    if (rows.length === 0) return MOCK_HALL

    const records: HallRecord[] = rows.map((r) => {
      // source_note may carry an explicit RW.xx reward id; otherwise fall back to
      // the Hall-of-Signal reserved reward (RW.15 / BG.16) from the canon catalog.
      const note = r.source_note ?? ''
      const rwMatch = note.match(/RW\.\d+/)
      const rewardId = rwMatch && REWARDS[rwMatch[0]] ? rwMatch[0] : 'RW.15'
      return {
        reward_id: rewardId,
        title: r.badges?.badge_name ?? REWARDS[rewardId]?.reward ?? 'Hall of Signal',
        operator_codename: r.operators?.codename ?? 'unknown',
        value: note || (r.badges?.badge_name ?? ''),
        date: (r.awarded_at ?? '').slice(0, 10),
        isPlaceholder: false,
      }
    })
    return records
  } catch {
    return MOCK_HALL
  }
}

/** Homepage aggregate stats. */
export async function getHomepageStats(): Promise<HomepageStats> {
  const sb = getSupabaseServer()
  if (!sb) return MOCK_HOMEPAGE_STATS
  try {
    // Singleton aggregate block (system_stats.id is pinned TRUE), with the top
    // operator's codename embedded via the top_operator_id FK.
    const { data, error } = await sb
      .from('system_stats')
      .select(
        'total_operators, total_snapshots, total_tokens_scored, transmitter_count, ' +
          'top_signa_rate, operators:top_operator_id ( codename )',
      )
      .limit(1)
      .maybeSingle()
    if (error) throw error
    const s = data as
      | {
          total_operators: number | null
          total_snapshots: number | null
          total_tokens_scored: number | null
          transmitter_count: number | null
          top_signa_rate: number | null
          operators: { codename: string | null } | null
        }
      | null
    if (!s) return MOCK_HOMEPAGE_STATS

    return {
      total_operators: num(s.total_operators),
      total_snapshots: num(s.total_snapshots),
      total_tokens_scored: num(s.total_tokens_scored),
      transmitter_count: num(s.transmitter_count),
      top_operator_codename: s.operators?.codename ?? MOCK_HOMEPAGE_STATS.top_operator_codename,
      top_signa_rate: num(s.top_signa_rate),
      isPlaceholder: false,
    }
  } catch {
    return MOCK_HOMEPAGE_STATS
  }
}

/** Class distribution across the active population. */
export async function getClassDistribution(): Promise<ClassDistributionRow[]> {
  const sb = getSupabaseServer()
  if (!sb) return MOCK_CLASS_DISTRIBUTION
  try {
    // Count each operator once, by their latest snapshot's class_tier.
    const { data, error } = await sb
      .from('metric_snapshots')
      .select('operator_id, snapshot_date, class_tier')
      .order('snapshot_date', { ascending: false })
    if (error) throw error
    const rows =
      (data as Array<{ operator_id: string; snapshot_date: string; class_tier: string | null }>) ??
      []
    if (rows.length === 0) return MOCK_CLASS_DISTRIBUTION

    const seen = new Set<string>()
    const counts = new Map<SignalClass, number>()
    for (const r of rows) {
      if (seen.has(r.operator_id)) continue
      seen.add(r.operator_id)
      const cls = toSignalClass(r.class_tier)
      counts.set(cls, (counts.get(cls) ?? 0) + 1)
    }

    // Emit in the same canonical class order the mock board uses.
    const order: SignalClass[] = [
      'TRANSMITTER',
      'ARCH+',
      'ARCH',
      'POWER',
      'BASE',
      'SEEKER',
      'REFINER',
      'BEARER',
      'IGNITER',
    ]
    return order.map((cls) => ({
      class_tier: cls,
      class_id: CLASS_NAME_TO_ID[cls],
      count: counts.get(cls) ?? 0,
    }))
  } catch {
    return MOCK_CLASS_DISTRIBUTION
  }
}

// getCircles / getCircle removed 2026-06-25 (Circles feature dropped — fresh-slate
// rebuild later; the route was already archived 06-22). See ICEBOX.md.

/**
 * getOnlineHourly — 24h operators-online curve for the activity board.
 * TODO(ONLINE.LIVE): no per-hour online aggregation exists yet; returns mock.
 * (Real item — the "operators online" widgets; backlog, post-auth.)
 */
export async function getOnlineHourly(): Promise<HourlyPoint[]> {
  return MOCK_HOURLY
}

/**
 * getOnlineWeekly — 7-day online band (daily max + avg) for the activity board.
 * TODO(ONLINE.LIVE): weekly aggregation is not in the schema yet; returns mock.
 * (Real item — the "operators online" widgets; backlog, post-auth.)
 */
export async function getOnlineWeekly(): Promise<WeeklyPoint[]> {
  return MOCK_WEEKLY
}

/**
 * getOnlineByCountry — live operators online by country (BlitzStars "Live").
 * TODO(ONLINE.LIVE): country geo-aggregation is not in the schema yet; returns mock.
 * (Real item — the "operators online" widgets; backlog, post-auth.)
 */
export async function getOnlineByCountry(): Promise<CountryCount[]> {
  return MOCK_COUNTRIES
}
