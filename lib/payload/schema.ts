/**
 * lib/payload/schema.ts — zod Snapshot Payload v1.0 (CANON §I, snapshot_payload.md).
 *
 * The canonical signed JSON a local agent submits to POST /api/v1/snapshots.
 * Dependency-free (zod only) and safe to import from the route handler. The web
 * app never PRODUCES these — the agent does — but the submit endpoint validates
 * against this schema so producer and consumer agree on shape.
 *
 * Mirrors the field table in snapshot_payload.md exactly: window.type enum,
 * platform.primary enum, core_metrics ranges (compression_ratio [0,1],
 * prompt_complexity [0,100]), optional composites (drift_ratio precision-only),
 * tier enum 'free' | 'precision', and the agent signing block.
 */

import { z } from 'zod'

/** window.type — the scoring window enum (snapshot_payload.md §window). */
export const windowTypeEnum = z.enum(['today', '7d', '30d', '90d', 'all_time'])

/** platform.primary — the AI platform enum (snapshot_payload.md §platform). */
export const platformPrimaryEnum = z.enum([
  'claude',
  'chatgpt',
  'gemini',
  'pi',
  'multi',
  'other',
])

/** tier — submission tier (snapshot_payload.md §tier). */
export const payloadTierEnum = z.enum(['free', 'precision'])

/** ISO-8601 datetime string. */
const isoDateTime = z.string().datetime({ offset: true })

/**
 * snapshotPayloadSchema — Schema v1.0 (snapshot_payload.md).
 * FAIL-CLOSED: every object is `.strict()`, so an unexpected/extra field is REJECTED
 * (status:'rejected', reason:'schema_invalid') — never silently stripped. This is the
 * P1-2 ingest gate: an allowlist enforced at the boundary, not a denylist. Bump
 * schema_version to evolve the shape; do not relax strictness for forward-compat.
 */
export const snapshotPayloadSchema = z.object({
  schema_version: z.literal('1.0'),
  codename: z.string().min(1),
  device_id: z.string().uuid(),
  submitted_at: isoDateTime,

  window: z.object({
    type: windowTypeEnum,
    start: isoDateTime,
    end: isoDateTime,
  }).strict(),

  platform: z.object({
    primary: platformPrimaryEnum,
    models: z.array(z.string()).optional().default([]),
  }).strict(),

  core_metrics: z.object({
    compression_ratio: z.number().min(0).max(1),
    prompt_complexity: z.number().min(0).max(100),
    cross_thread_score: z.number().int(),
    session_depth_avg: z.number().min(0),
    token_throughput: z.number().min(0),
  }).strict(),

  background_metrics: z.object({
    message_volume: z.number().int().min(0),
    account_age_days: z.number().int().min(0),
    total_messages_lifetime: z.number().int().min(0),
  }).strict(),

  // composites — optional; agent may pre-compute or leave to the server.
  // drift_ratio is precision-tier only (null/absent on free tier).
  composites: z
    .object({
      signa_rate: z.number().optional(),
      signal_force: z.number().optional(),
      drift_ratio: z.number().nullable().optional(),
    })
    .strict()
    .partial()
    .optional(),

  raw_telemetry: z.object({
    sessions_count: z.number().int().min(0),
    turns_total: z.number().int().min(0),
    tokens_total: z.number().int().min(0),
    tokens_input_fresh: z.number().int().min(0),
    tokens_output: z.number().int().min(0),
    tokens_cache_read: z.number().int().min(0),
    tokens_cache_creation: z.number().int().min(0),
    active_minutes_est: z.number().int().min(0),
  }).strict(),

  tier: payloadTierEnum,

  agent: z.object({
    version: z.string().min(1),
    ruleset_version: z.string().min(1),
    snapshot_hash: z.string().min(1),
    public_key: z.string().min(1),
  }).strict(),
}).strict()

/** The validated Snapshot Payload type, inferred from the schema. */
export type SnapshotPayloadV1 = z.infer<typeof snapshotPayloadSchema>

/** Result of validateSnapshot: a discriminated success / failure union. */
export type ValidateSnapshotResult =
  | { ok: true; data: SnapshotPayloadV1 }
  | { ok: false; reason: string; detail: string }

/**
 * validateSnapshot — parse + cross-field validate an incoming payload.
 *
 * Returns a discriminated result so the route can map failures directly to the
 * { status:'rejected', reason, detail } response. Cross-field rules from
 * snapshot_payload.md §Validation rules (window.end > window.start) are enforced
 * here; the wall-clock rule (window.end <= now) is intentionally NOT enforced at
 * module scope — the route supplies any clock-dependent checks.
 */
export function validateSnapshot(input: unknown): ValidateSnapshotResult {
  const parsed = snapshotPayloadSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    const path = first?.path.join('.') || '(root)'
    // schema_version literal mismatch → schema_outdated reason per api_spec.md.
    const reason =
      first && first.path[0] === 'schema_version' ? 'schema_outdated' : 'schema_invalid'
    return {
      ok: false,
      reason,
      detail: `${path}: ${first?.message ?? 'invalid payload'}`,
    }
  }

  const data = parsed.data
  // window.end must be strictly after window.start (snapshot_payload.md).
  if (Date.parse(data.window.end) <= Date.parse(data.window.start)) {
    return {
      ok: false,
      reason: 'schema_invalid',
      detail: 'window.end must be after window.start',
    }
  }

  return { ok: true, data }
}
