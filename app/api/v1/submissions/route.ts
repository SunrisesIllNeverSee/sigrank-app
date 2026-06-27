/**
 * GET /api/v1/submissions — the raw submission corpus, ranked by yield.
 *
 * DISTINCT FROM /api/v1/leaderboard: the leaderboard returns ONE aggregate row
 * per operator (the latest snapshot per operator collapses together). This
 * endpoint returns EVERY raw snapshot row — each (operator, platform, window)
 * point as its own entry — ranked together by Υ yield. It is the "show me all
 * submissions" view, not the per-operator board.
 *
 * Implementation reuses the @/lib/data facade with `allSnapshots: true` (the
 * Everything-board mode that keeps every window/platform point rather than
 * collapsing to one row per operator). That means:
 *   - SAME server Supabase client + ruleset the leaderboard route uses (the
 *     facade reads through getSupabaseServer()).
 *   - SAME trust filter: metric_snapshots only ever holds verified+materialized
 *     snapshots (the snapshots ingest route writes a row there ONLY for an
 *     enrolled TRUSTED device with a valid signature; flagged/unverified rows
 *     stay in snapshot_submissions and are never ranked). So reading
 *     metric_snapshots inherits the trusted/verified/non-flagged filter exactly
 *     as the leaderboard does — no extra predicate needed.
 *   - SAME graceful degradation: no creds / DB error → deterministic fallback.
 *
 * Mirrors the leaderboard route's CORPUS gate (per-IP rate limit + list-size
 * clamp), error handling, and D19 Cache-Control header.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getLeaderboard, type LeaderboardRow } from '@/lib/data'
import { SORT_DEFAULT } from '@/lib/constants'
import { LEADERBOARD_CACHE_CONTROL } from '@/lib/api/leaderboard'
import { enforceListGate, rateLimit, rateLimitedResponse } from '@/lib/api/gate'

/** Note surfaced when an unauthenticated caller is clamped to the public top-N. */
const GATED_NOTE = 'top N public; full corpus requires an API key'

/** Deterministic generated_at — no wall-clock read (mock parity, build-safe). */
const GENERATED_AT = '2026-05-19T00:00:00Z'

const MAX_LIMIT = 1000
const DEFAULT_LIMIT = 200

/** Map the metric query alias (api_spec.md) to a metric_snapshots sort column. */
const METRIC_PARAM_TO_SORT: Record<string, string> = {
  yield: 'yield_',
  yield_: 'yield_',
  signa_rate: 'signa_rate',
  compression: 'compression_ratio',
  depth: 'session_depth',
  volume: 'message_volume',
  complexity: 'prompt_complexity',
  cross_thread: 'cross_thread',
  signal_force: 'signal_force',
}

/**
 * Serialize one raw snapshot row to the submissions entry shape. Distinct from
 * serializeLeaderboardEntry: a submission is a single snapshot point keyed by
 * (codename, platform, window), so it surfaces snapshot-level identity
 * (snapshot_id, window, submitted_at) rather than operator-aggregate fields.
 */
function serializeSubmissionEntry(row: LeaderboardRow, rank: number) {
  const { operator, snapshot } = row
  const c = snapshot.cascade
  const t = row.telemetry
  // Deterministic per-snapshot handle: a snapshot is uniquely keyed by
  // (operator, platform, window, date). No DB key is exposed, so derive a stable
  // id from those parts (identical points reproduce identical ids).
  const platform = row.platform ?? operator.primary_domain
  const window = row.window_type ?? null
  const snapshotId = deterministicId(
    'snap',
    operator.operator_id,
    platform ?? 'other',
    window ?? 'all_time',
    row.snapshot_date ?? '',
  )
  return {
    rank,
    snapshot_id: snapshotId,
    codename: operator.codename,
    claimed: operator.claimed,
    platform,
    window,
    // Primary rank metric: Υ yield from the token cascade (null when non-compounding).
    yield_: c && !c.nonCompounding ? c.yield_ : null,
    leverage: c && !c.nonCompounding ? c.leverage : null,
    snr: c ? c.snr : snapshot.compression_ratio,
    op_ratio: c ? c.opRatio : null,
    // Raw pillars so consumers can verify the cascade.
    input_tokens: t ? t.fresh_input : null,
    output_tokens: t ? t.output : null,
    cache_creation_tokens: t ? t.cache_create : null,
    cache_read_tokens: t ? t.cache_read : null,
    total_tokens: c ? t.fresh_input + t.output + t.cache_create + t.cache_read : null,
    class_tier: snapshot.class_tier, // UPPERCASE canonical SignalClass
    submitted_at: row.snapshot_date ?? null,
  }
}

/**
 * Derive a deterministic id from parts (no RNG), mirroring the snapshots ingest
 * route's handle scheme. API-response handles only — never a DB key.
 */
function deterministicId(prefix: string, ...parts: string[]): string {
  let h = 0
  const s = parts.join('|')
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return `${prefix}_${(h >>> 0).toString(16).padStart(8, '0')}`
}

export async function GET(req: NextRequest) {
  // CORPUS gate: best-effort per-IP rate limit (defense-in-depth) before any read.
  const rl = rateLimit(req)
  if (!rl.ok) return rateLimitedResponse(rl.retryAfter)

  const sp = req.nextUrl.searchParams

  const metricParam = sp.get('metric') ?? 'yield_'
  const sort = METRIC_PARAM_TO_SORT[metricParam] ?? SORT_DEFAULT

  // window: passed through as the API enum directly (api_spec.md uses API enums).
  const windowParam = sp.get('window') ?? '30d'

  const limitRaw = Number.parseInt(sp.get('limit') ?? '', 10)
  const requestedLimit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
    : DEFAULT_LIMIT

  // CORPUS gate: unauthenticated callers are clamped to the public top-N; a valid
  // x-api-key lifts the cap for bulk/full corpus reads.
  const { limit, gated } = enforceListGate(req, requestedLimit)

  // allSnapshots: keep EVERY raw snapshot row (no collapse to one per operator),
  // ranked together by the requested metric — this is the submissions corpus, not
  // the per-operator aggregate leaderboard. Same Supabase client + ruleset + trust
  // filter (metric_snapshots holds only verified rows) the leaderboard route uses.
  const rows = await getLeaderboard({
    window: windowParam,
    allSnapshots: true,
    sort,
    limit,
  })

  const entries = rows.map((row, i) => serializeSubmissionEntry(row, i + 1))

  const body = {
    window: windowParam,
    metric: metricParam,
    generated_at: GENERATED_AT,
    total: entries.length,
    entries,
    ...(gated ? { gated: true, note: GATED_NOTE } : {}),
  }

  return NextResponse.json(body, {
    headers: { 'Cache-Control': LEADERBOARD_CACHE_CONTROL },
  })
}
