/**
 * GET /api/v1/leaderboard — the main leaderboard (api_spec.md §leaderboard).
 *
 * Reads through the @/lib/data facade, so it 200s with deterministic seed data
 * when Supabase is unset. Class tier filters come in lowercase (`class` param)
 * and go out UPPERCASE in each entry (class_tier). Window labels map through
 * WINDOW_API_MAP. D19: leaderboard responses carry Cache-Control max-age=300.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getLeaderboard } from '@/lib/data'
import { SORT_DEFAULT } from '@/lib/constants'
import {
  LEADERBOARD_CACHE_CONTROL,
  serializeLeaderboardEntry,
} from '@/lib/api/leaderboard'
import { enforceListGate, rateLimit, rateLimitedResponse } from '@/lib/api/gate'

/** Note surfaced when an unauthenticated caller is clamped to the public top-N. */
const GATED_NOTE = 'top N public; full corpus requires an API key'

/** Deterministic generated_at — no wall-clock read (mock parity, build-safe). */
const GENERATED_AT = '2026-05-19T00:00:00Z'

const MAX_LIMIT = 100
const DEFAULT_LIMIT = 25

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

export async function GET(req: NextRequest) {
  // CORPUS gate: best-effort per-IP rate limit (defense-in-depth) before any read.
  const rl = rateLimit(req)
  if (!rl.ok) return rateLimitedResponse(rl.retryAfter)

  const sp = req.nextUrl.searchParams

  const metricParam = sp.get('metric') ?? 'yield'
  const sort = METRIC_PARAM_TO_SORT[metricParam] ?? SORT_DEFAULT

  // window: passed through as the API enum directly (api_spec.md uses API enums).
  const windowParam = sp.get('window') ?? '30d'

  // platform / class filters arrive lowercase; null clears the filter.
  const platformParam = sp.get('platform')
  const classParam = sp.get('class')

  const limitRaw = Number.parseInt(sp.get('limit') ?? '', 10)
  const requestedLimit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
    : DEFAULT_LIMIT

  // CORPUS gate: unauthenticated callers are clamped to the public top-N; a valid
  // x-api-key lifts the cap for bulk/full corpus reads.
  const { limit, gated } = enforceListGate(req, requestedLimit)

  const rows = await getLeaderboard({
    window: windowParam,
    platform: platformParam && platformParam !== 'all' ? platformParam : null,
    classScope: classParam ?? undefined,
    sort,
    limit,
  })

  const body = {
    metric: metricParam,
    window: windowParam,
    generated_at: GENERATED_AT,
    ruleset_version: '1.0',
    total_operators: rows.length,
    entries: rows.map(serializeLeaderboardEntry),
    ...(gated ? { gated: true, note: GATED_NOTE } : {}),
  }

  return NextResponse.json(body, {
    headers: { 'Cache-Control': LEADERBOARD_CACHE_CONTROL },
  })
}
