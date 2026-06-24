/**
 * GET /api/v1/metrics/leaders — top performers per metric (api_spec.md
 * §metrics/leaders, the "metric pages").
 *
 * `metric` is REQUIRED. Reads through the @/lib/data facade so it 200s on seed
 * data with Supabase unset. Returns the leaderboard payload sorted by the
 * requested metric. D19 cache window applies (this is a board read).
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getMetricLeaders } from '@/lib/data'
import {
  LEADERBOARD_CACHE_CONTROL,
  serializeLeaderboardEntry,
} from '@/lib/api/leaderboard'
import { enforceListGate, rateLimit, rateLimitedResponse } from '@/lib/api/gate'

/** Note surfaced when an unauthenticated caller is clamped to the public top-N. */
const GATED_NOTE = 'top N public; full corpus requires an API key'

const GENERATED_AT = '2026-05-19T00:00:00Z'
const MAX_LIMIT = 100
const DEFAULT_LIMIT = 25

/** Map the metric query alias (api_spec.md) to a metric_snapshots sort column. */
const METRIC_PARAM_TO_SORT: Record<string, string> = {
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

  const metricParam = sp.get('metric')
  if (!metricParam) {
    return NextResponse.json(
      { status: 'rejected', reason: 'metric_required', detail: 'The `metric` query parameter is required.' },
      { status: 400 },
    )
  }
  const sort = METRIC_PARAM_TO_SORT[metricParam]
  if (!sort) {
    return NextResponse.json(
      {
        status: 'rejected',
        reason: 'metric_invalid',
        detail: `Unknown metric "${metricParam}". Allowed: ${Object.keys(METRIC_PARAM_TO_SORT).join(', ')}.`,
      },
      { status: 400 },
    )
  }

  const windowParam = sp.get('window') ?? '30d'
  const platformParam = sp.get('platform')
  const classParam = sp.get('class')
  const limitRaw = Number.parseInt(sp.get('limit') ?? '', 10)
  const requestedLimit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
    : DEFAULT_LIMIT

  // CORPUS gate: unauthenticated callers are clamped to the public top-N; a valid
  // x-api-key lifts the cap for bulk/full corpus reads.
  const { limit, gated } = enforceListGate(req, requestedLimit)

  const rows = await getMetricLeaders(sort, {
    window: windowParam,
    platform: platformParam && platformParam !== 'all' ? platformParam : null,
    classScope: classParam ?? undefined,
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
