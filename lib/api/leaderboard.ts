/**
 * lib/api/leaderboard.ts — shared serialization for leaderboard-style API
 * responses.
 *
 * Lives outside `app/` on purpose: Next.js route files (`route.ts`) may ONLY
 * export HTTP handlers + route-segment config, so shared helpers like the
 * entry serializer and the D19 cache header must live in a normal module that
 * both `/leaderboard` and `/metrics/leaders` import.
 */

import type { LeaderboardRow } from "@/lib/data";

/** D19: leaderboard responses carry Cache-Control max-age=300 + s-maxage for CDN. */
export const LEADERBOARD_CACHE_CONTROL =
  "public, max-age=300, s-maxage=300, stale-while-revalidate=600";

/** Deterministic generated_at — no wall-clock read (mock parity, build-safe). */
const GENERATED_AT = "2026-05-19T00:00:00Z";

/**
 * Serialize one row to the api_spec.md leaderboard entry shape.
 * class_tier is emitted UPPERCASE (it is already the canonical SignalClass).
 * Includes the operator's `claimed` flag per the group brief.
 */
export function serializeLeaderboardEntry(row: LeaderboardRow) {
  const { operator, snapshot } = row;
  const c = snapshot.cascade;
  const t = row.telemetry;
  return {
    rank: row.global_rank,
    operator_id: operator.operator_id,
    codename: operator.codename,
    display_name: operator.display_name ?? null,
    claimed: operator.claimed,
    class_tier: snapshot.class_tier, // UPPERCASE canonical SignalClass
    platform: operator.primary_domain,
    // Primary rank metric: Υ yield from the token cascade.
    yield_: c && !c.nonCompounding ? c.yield_ : null,
    leverage: c && !c.nonCompounding ? c.leverage : null,
    velocity: c ? c.velocity : null,
    snr: c ? c.snr : snapshot.compression_ratio,
    dev10x: c && !c.nonCompounding ? c.dev10x : null,
    signa_rate: snapshot.signa_rate,
    compression_ratio: snapshot.compression_ratio,
    session_depth: snapshot.session_depth,
    token_throughput: snapshot.token_throughput,
    prompt_complexity: snapshot.prompt_complexity.value,
    cross_thread: snapshot.cross_thread,
    signal_force: snapshot.signal_force,
    // Raw pillars so API consumers can verify the cascade.
    input_tokens: t ? t.fresh_input : null,
    output_tokens: t ? t.output : null,
    cache_creation_tokens: t ? t.cache_create : null,
    cache_read_tokens: t ? t.cache_read : null,
    total_tokens: c
      ? t.fresh_input + t.output + t.cache_create + t.cache_read
      : null,
    scale_v: c ? c.scaleV : null,
    efficiency: c ? c.efficiency : null,
    cost_per_million: c ? c.costPerMillion : null,
    op_ratio: c ? c.opRatio : null,
    cascade_str: c ? c.cascadeStr : null,
    non_compounding: c ? c.nonCompounding : null,
    percentile: row.percentile,
    last_seen: GENERATED_AT,
    movement_24h: snapshot.movement_24h,
    movement_7d: snapshot.movement_7d,
    is_placeholder: operator.isPlaceholder ?? false,
  };
}
