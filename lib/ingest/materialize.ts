import 'server-only'

/**
 * lib/ingest/materialize.ts — verified submission → metric_snapshots → board (D7 §6).
 *
 * Called inline by app/api/v1/snapshots/route.ts AFTER the gate chain decides. Two
 * persist paths, both via the service-role-ONLY client (loud-fail on a blank key):
 *
 *   materializeVerifiedSnapshot()  verified+accept → ONE transaction (the
 *                                  materialize_verified_snapshot RPC, 0013):
 *                                  append-only snapshot_submissions INSERT +
 *                                  metric_snapshots live-upload UPSERT. Then the
 *                                  route revalidates the touched board slug(s).
 *   insertSubmissionOnly()         accepted-but-unverified / flagged → audit row
 *                                  only (status 'validated'); NOT ranked, NOT
 *                                  materialized.
 *
 * SECURITY CORE (§5.4): operator_id is ALWAYS taken from the enrolled device row,
 * NEVER from the payload codename. The caller resolves the device by payload.device_id
 * and passes it here; an UNENROLLED device (no row) must never reach these functions —
 * the route persists nothing for it (no operator to bind, preserving today's safe
 * behavior for unauthenticated payloads).
 *
 * The board ranks by Υ recomputed ON READ from the 4 raw pillar columns, so this
 * module recomputes signa_rate / class_tier / signal_force from the un-fakeable
 * pillars and IGNORES the agent's self-reported composites (the un-gameable layer).
 */

import { revalidatePath } from 'next/cache'
import { getSupabaseService } from '@/lib/supabase/server'
import { pillarsToCore5 } from '@/lib/ingest/bridge'
import { scoreSnapshot } from '@/lib/scoring/engine'
import { boardWindowByEnum } from '@/lib/data/windows'
import type { SnapshotPayloadV1 } from '@/lib/payload/schema'
import type { GateResult } from '@/lib/ingest/gates'

/** The enrolled-device facts the persist path needs (resolved FROM the device, §5.4). */
export interface ResolvedDevice {
  device_id: string
  operator_id: string
}

/** Persist outcome the route maps to an HTTP status. */
export type MaterializeResult =
  | { ok: true; metricSnapshotId: string | null }
  | { ok: false; reason: 'persistence_unavailable' | 'duplicate_snapshot' | 'persist_failed'; detail: string }

/** Background-metric clamp bounds (§6.1): a fabricated lifetime/age can't inflate signal_force. */
const MAX_ACCOUNT_AGE_DAYS = 3650 // 10y
const MAX_TOTAL_MESSAGES = 5_000_000

/** Round to a column scale so a value can never numeric_value_out_of_range → abort the tx (review P3). */
const round = (n: number, dp: number): number => {
  const f = 10 ** dp
  return Math.round(n * f) / f
}
const clampMax = (n: number, max: number): number => Math.max(-max, Math.min(max, n))

/** The server-recomputed, column-scale-safe values for one snapshot. Pure + DB-free (testable). */
export interface RecomputedSnapshot {
  pillars: { input: number; output: number; cacheCreate: number; cacheRead: number }
  signaRate: number
  classTier: string
  compressionRatio: number
  promptComplexity: number
  crossThread: number
  sessionDepth: number
  tokenThroughput: number
  signalForce: number
  messageVolume: number
  accountAgeDays: number
  totalMessages: number
}

/**
 * recomputeFromPillars — the un-fakeable recompute (§6.1). Pure: takes the validated
 * payload, derives the board number from the 4 raw pillars + clamped background metrics.
 * Exported so materialize.test.mjs can assert the cascade anchor without a DB.
 */
export function recomputeFromPillars(payload: SnapshotPayloadV1): RecomputedSnapshot {
  const rt = payload.raw_telemetry
  const pillars = {
    input: rt.tokens_input_fresh,
    output: rt.tokens_output,
    cacheCreate: rt.tokens_cache_creation,
    cacheRead: rt.tokens_cache_read,
  }
  const bridge = pillarsToCore5({
    pillars,
    sessionsCount: rt.sessions_count,
    turnsTotal: rt.turns_total,
  })

  const accountAgeDays = Math.max(1, Math.min(payload.background_metrics.account_age_days, MAX_ACCOUNT_AGE_DAYS))
  const totalMessages = Math.max(0, Math.min(payload.background_metrics.total_messages_lifetime, MAX_TOTAL_MESSAGES))
  const messageVolume = Math.max(0, Math.min(payload.background_metrics.message_volume, MAX_TOTAL_MESSAGES))

  const scored = scoreSnapshot({
    raw: bridge.core5,
    pcConfidence: bridge.pcConfidence,
    totalMessagesLifetime: totalMessages,
    accountAgeDays,
  })

  return {
    pillars,
    // column scales (schema.sql): signa_rate/prompt_complexity NUMERIC(5,2),
    // compression_ratio NUMERIC(5,4), session_depth NUMERIC(6,2), signal_force NUMERIC(10,2).
    signaRate: round(clampMax(scored.signa_rate, 999.99), 2),
    classTier: scored.class_tier,
    compressionRatio: round(clampMax(bridge.core5.compression_ratio, 9.9999), 4),
    promptComplexity: round(clampMax(bridge.core5.prompt_complexity, 999.99), 2),
    crossThread: Math.round(bridge.core5.cross_thread),
    sessionDepth: round(clampMax(bridge.core5.session_depth, 9999.99), 2),
    tokenThroughput: Math.round(bridge.tokensTotal),
    signalForce: round(clampMax(scored.signal_force, 99_999_999.99), 2),
    messageVolume,
    accountAgeDays,
    totalMessages,
  }
}

/** window.end (ISO, any offset) → UTC 'YYYY-MM-DD' for snapshot_date (§6.2). */
function snapshotDateUTC(windowEnd: string): string {
  return new Date(windowEnd).toISOString().slice(0, 10)
}

/**
 * materializeVerifiedSnapshot — the verified+accept path. ONE transaction via the
 * 0013 RPC: append-only submission INSERT + metric_snapshots live-upload UPSERT.
 *
 * DEFENSIVE RE-ASSERT (§6.2 P2): refuse to materialize anything that is not
 * verified+accept, so a future refactor can never leak a flagged/unverified row
 * onto the board (the board ranks everything it finds in metric_snapshots).
 */
export async function materializeVerifiedSnapshot(
  payload: SnapshotPayloadV1,
  signature: string,
  device: ResolvedDevice,
  gate: GateResult,
): Promise<MaterializeResult> {
  if (!(gate.tier === 'verified' && gate.decision === 'accept')) {
    throw new Error(`materializeVerifiedSnapshot called with non-verified gate (tier=${gate.tier}, decision=${gate.decision})`)
  }

  const svc = getSupabaseService()
  if (!svc) {
    return { ok: false, reason: 'persistence_unavailable', detail: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' }
  }

  const r = recomputeFromPillars(payload)

  const { data, error } = await svc.rpc('materialize_verified_snapshot', {
    p_operator_id: device.operator_id, // resolved FROM DEVICE (§5.4), never from payload
    p_device_id: device.device_id,
    p_window_type: payload.window.type,
    p_window_start: payload.window.start,
    p_window_end: payload.window.end,
    p_ruleset_version: payload.agent.ruleset_version,
    p_snapshot_hash: payload.agent.snapshot_hash,
    p_payload_json: payload,
    p_input: r.pillars.input,
    p_output: r.pillars.output,
    p_cache_creation: r.pillars.cacheCreate,
    p_cache_read: r.pillars.cacheRead,
    p_snapshot_date: snapshotDateUTC(payload.window.end),
    p_signa_rate: r.signaRate,
    p_class_tier: r.classTier,
    // FIX H (migration 0015): the per-submission platform → its own board slot.
    // The payload's platform.primary is a validated enum (lib/payload/schema.ts);
    // the RPC keys (operator, date, window, platform) so claude/codex don't collide.
    p_platform: payload.platform.primary,
    // p_submitted_at intentionally OMITTED → the RPC's COALESCE(p_submitted_at, now())
    // stamps submitted_at with the SERVER clock. The per-device throttle counts on this
    // column, so a client-supplied timestamp must never set it (review P2: a backdated
    // submitted_at would make the throttle window always read 0 → unbounded writes). The
    // client's claimed submitted_at is still preserved inside p_payload_json.
    p_schema_version: payload.schema_version,
    p_signature: signature,
    p_codename: payload.codename,
    p_tier: payload.tier,
    p_verification_tier: gate.tier,
    p_compression_ratio: r.compressionRatio,
    p_prompt_complexity: r.promptComplexity,
    p_cross_thread: r.crossThread,
    p_session_depth: r.sessionDepth,
    p_token_throughput: r.tokenThroughput,
    p_signal_force: r.signalForce,
    p_live_signa_rate: r.signaRate,
    p_message_volume: r.messageVolume,
    p_account_age_days: r.accountAgeDays,
    p_total_messages: r.totalMessages,
  })

  if (error) {
    // 23505 = unique_violation on uq_submissions_snapshot_hash → exact-hash replay (§0.4).
    if (error.code === '23505') {
      return { ok: false, reason: 'duplicate_snapshot', detail: 'snapshot_hash already accepted' }
    }
    return { ok: false, reason: 'persist_failed', detail: error.message }
  }

  return { ok: true, metricSnapshotId: (data as string | null) ?? null }
}

/**
 * insertSubmissionOnly — accepted-but-unverified / flagged path: write the
 * constraint-complete audit row (status 'validated'), do NOT materialize. The row
 * is never ranked (the board reads metric_snapshots, which this does not touch).
 */
export async function insertSubmissionOnly(
  payload: SnapshotPayloadV1,
  signature: string,
  device: ResolvedDevice,
  gate: GateResult,
): Promise<MaterializeResult> {
  const svc = getSupabaseService()
  if (!svc) {
    return { ok: false, reason: 'persistence_unavailable', detail: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' }
  }

  const r = recomputeFromPillars(payload)

  const { error } = await svc.from('snapshot_submissions').insert({
    operator_id: device.operator_id, // FROM DEVICE (§5.4)
    device_id: device.device_id,
    // submitted_at OMITTED → column DEFAULT now() (server clock). Throttle integrity:
    // never let a client timestamp set the throttle-keyed column (review P2). The client's
    // claimed submitted_at remains in payload_json.
    window_type: payload.window.type,
    window_start: payload.window.start,
    window_end: payload.window.end,
    schema_version: payload.schema_version,
    ruleset_version: payload.agent.ruleset_version,
    snapshot_hash: payload.agent.snapshot_hash,
    signature,
    payload_json: payload,
    codename: payload.codename,
    tier: payload.tier,
    verification_tier: gate.tier,
    status: 'validated',
    input_tokens: r.pillars.input,
    output_tokens: r.pillars.output,
    cache_creation_tokens: r.pillars.cacheCreate,
    cache_read_tokens: r.pillars.cacheRead,
  })

  if (error) {
    if (error.code === '23505') {
      return { ok: false, reason: 'duplicate_snapshot', detail: 'snapshot_hash already accepted' }
    }
    return { ok: false, reason: 'persist_failed', detail: error.message }
  }

  return { ok: true, metricSnapshotId: null }
}

/**
 * revalidateTouchedWindows — refresh the static board pages a new verified row
 * affects (§6.4): the specific window slug + the deduped default "/board/off"
 * (which replaced the removed "everything" firehose, PR#10). all_time → "all".
 */
export function revalidateTouchedWindows(windowType: string): void {
  const win = boardWindowByEnum(windowType)
  if (win) revalidatePath(`/board/${win.slug}`)
  revalidatePath('/board/off')
}
