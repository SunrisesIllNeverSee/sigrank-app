/**
 * lib/api/leaderboard.ts — shared serialization for leaderboard-style API
 * responses.
 *
 * Lives outside `app/` on purpose: Next.js route files (`route.ts`) may ONLY
 * export HTTP handlers + route-segment config, so shared helpers like the
 * entry serializer and the D19 cache header must live in a normal module that
 * both `/leaderboard` and `/metrics/leaders` import.
 */

import type { LeaderboardRow } from "@/lib/board";
import type { LeaderboardRowWithPlatforms } from "@/lib/board/queries";

/** D19: leaderboard responses carry Cache-Control for CDN caching.
 * TTL increased from 300s to 1800s — on-demand revalidation via
 * revalidateTouchedWindows() busts caches on submission, so the TTL
 * is only a fallback for idle periods. */
export const LEADERBOARD_CACHE_CONTROL =
  "public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600";

/**
 * Serialize one row to the api_spec.md leaderboard entry shape.
 * class_tier is emitted UPPERCASE (it is already the canonical SignalClass).
 * Includes the operator's `claimed` flag per the group brief.
 */
export function serializeLeaderboardEntry(row: LeaderboardRow) {
  const { operator, snapshot } = row;
  const c = snapshot.cascade;
  const t = row.telemetry;
  // operatorTotal rows carry the distinct submitted-platform SET (attached in
  // queries.ts); other collapse modes leave it undefined → omitted.
  const platforms = (row as LeaderboardRowWithPlatforms).platforms;
  // Migration 0021 privacy contract: 'private' operators expose codename +
  // computed metrics only — identity fields (display_name, handle, location)
  // are owner-only. The same redaction applies in to-entry.ts so SSR rows
  // and API-fetched rows stay identical.
  const isPrivate = operator.profile_visibility === "private";
  return {
    rank: row.global_rank,
    operator_id: operator.operator_id,
    codename: operator.codename,
    display_name: isPrivate ? null : (operator.display_name ?? null),
    claimed: operator.claimed,
    // Identity/status fields the board needs to preserve across client fetches
    // (2026-09-26 live-scope fix — previously dropped by the API mapper, so
    // fetched rows lost handle sub-labels, retirement state, and the platform
    // set badge that SSR rows carried).
    status: operator.status ?? "active",
    handle: isPrivate ? null : (operator.handle ?? null),
    primary_domain: operator.primary_domain ?? null,
    account_age_days: operator.account_age_days ?? null,
    // Operator-supplied public location (already public via operators_public);
    // without it every client-fetched row lost the ◍ location SSR renders.
    location: isPrivate ? null : (operator.location ?? null),
    ...(platforms && platforms.length > 0 ? { platforms } : {}),
    class_tier: snapshot.class_tier, // UPPERCASE canonical SignalClass
    platform: (row.platform ?? operator.primary_domain ?? "other").toLowerCase(),
    // The window bucket this row's snapshot belongs to ('7d'/'30d'/'90d'/'all_time').
    window: row.window_type ?? null,
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
    last_seen: snapshot.snapshot_date ?? null,
    // Operator-lifetime message count — kept in the API contract so
    // client-fetched rows carry the same Message Volume the SSR rows render.
    message_volume: operator.total_messages_lifetime ?? null,
    movement_24h: snapshot.movement_24h,
    movement_7d: snapshot.movement_7d,
    is_placeholder: operator.isPlaceholder ?? false,
  };
}
