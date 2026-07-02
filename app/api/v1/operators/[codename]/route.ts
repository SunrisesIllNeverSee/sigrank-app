/**
 * GET /api/v1/operators/{codename} — full operator profile (api_spec.md §operators).
 *
 * Reads through the @/lib/data facade so it 200s on seed data with Supabase
 * unset, and 404s only when the codename is genuinely unknown. drift_ratio
 * (E.02) is forced null on the free tier — it is a precision-tier metric and is
 * never computed inline for free operators. The operator's `claimed` flag is
 * included per the group brief.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getOperator } from '@/lib/data'
import { rateLimit, rateLimitedResponse } from '@/lib/api/gate'

const GENERATED_AT = '2026-05-19T00:00:00Z'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ codename: string }> },
) {
  // CORPUS gate: best-effort per-IP rate limit blocks per-operator sweep scraping
  // (defense-in-depth). Single-operator reads have no list limit, so only the
  // rate limit applies here.
  const rl = rateLimit(req)
  if (!rl.ok) return rateLimitedResponse(rl.retryAfter)

  const { codename } = await params
  const row = await getOperator(codename)

  if (!row) {
    return NextResponse.json(
      { status: 'not_found', detail: `No operator with codename "${codename}".` },
      { status: 404 },
    )
  }

  const { operator, snapshot } = row
  const c = snapshot.cascade

  // Drift Ratio (E.02) is precision-tier only: null unless the operator is on a
  // Pro/precision tier AND the audit has already computed a value.
  const isPrecision =
    operator.current_supporter_tier === 'pro' ||
    operator.current_supporter_tier === 'circle_sponsor'
  const driftRatio = isPrecision ? snapshot.drift_ratio : null

  const body = {
    operator_id: operator.operator_id,
    codename: operator.codename,
    display_name: operator.display_name,
    claimed: operator.claimed,
    class_tier: snapshot.class_tier, // UPPERCASE canonical SignalClass
    platform: operator.primary_domain,
    supporter_tier: operator.current_supporter_tier,
    verification_status: operator.verification_status,
    account_age_days: operator.account_age_days,
    total_messages: operator.total_messages_lifetime,
    current_rank: {
      global: row.global_rank,
      percentile: row.percentile,
    },
    current_metrics: {
      signa_rate: snapshot.signa_rate,
      yield_: c && !c.nonCompounding ? c.yield_ : null,
      leverage: c && !c.nonCompounding ? c.leverage : null,
      velocity: c ? c.velocity : null,
      snr: c ? c.snr : snapshot.compression_ratio,
      dev10x: c && !c.nonCompounding ? c.dev10x : null,
      compression_ratio: snapshot.compression_ratio,
      session_depth: snapshot.session_depth,
      prompt_complexity: snapshot.prompt_complexity.value,
      prompt_complexity_confidence: snapshot.prompt_complexity.confidence,
      cross_thread: snapshot.cross_thread,
      token_throughput: snapshot.token_throughput,
      signal_force: snapshot.signal_force,
      drift_ratio: driftRatio,
      sdot_score: snapshot.sdot_score,
      sdrm_score: snapshot.sdrm_score,
    },
    movement_24h: snapshot.movement_24h,
    movement_7d: snapshot.movement_7d,
    last_seen: GENERATED_AT,
    ruleset_version: snapshot.ruleset_version,
    is_placeholder: operator.isPlaceholder ?? false,
    // Raw token pillars (the cascade fuel) so API consumers can verify the score.
    ...(c ? {
      input_tokens: row.telemetry.fresh_input,
      output_tokens: row.telemetry.output,
      cache_creation_tokens: row.telemetry.cache_create,
      cache_read_tokens: row.telemetry.cache_read,
      total_tokens: row.telemetry.fresh_input + row.telemetry.output + row.telemetry.cache_create + row.telemetry.cache_read,
      scale_v: c.scaleV,
      efficiency: c.efficiency,
      cost_per_million: c.costPerMillion,
      op_ratio: c.opRatio,
      cascade_str: c.cascadeStr,
      non_compounding: c.nonCompounding,
    } : {}),
  }

  return NextResponse.json(body, {
    headers: { 'Cache-Control': 'public, max-age=120, s-maxage=120, stale-while-revalidate=600' },
  })
}
