import 'server-only'

/**
 * lib/ingest/gates.ts — SERVER-ONLY ingest integrity gate chain (anti-gaming).
 *
 * Every submission to POST /api/v1/snapshots runs through this chain BEFORE it can
 * be scored or persisted. It returns accept / flag / reject + a verification tier.
 * This is the load-bearing "un-gameable board" layer the moat actually rests on:
 * you cannot just POST inflated numbers and land on the board.
 *
 * Gates (ordered):
 *   1. plausibility   — physical/cross-field consistency (fabricated totals, etc.). LIVE.
 *   2. dedup/replay   — reject duplicate snapshot hashes + (device,window) replays.  Store-injected.
 *   3. throttle/sybil — per-device submission rate cap.                              Store-injected.
 *   4. verification   — snapshot-hash integrity + ed25519 signature → tier.          LIVE (signature
 *                       degrades to `unverified` until out-of-band device enrollment ships, per
 *                       SECURE_INGEST.md — it never rejects for "not enrolled", only for a BAD sig).
 *   5. battery        — Benford / cadence / observer-contamination. Proprietary, SERVER-INJECTED
 *                       via ctx.battery (the moat stays off the open agent + public repo).
 *
 * Pure + deterministic (no wall-clock, no RNG): all external state (seen hashes,
 * rates, enrolled keys, the battery) arrives through GateContext, so the chain is
 * unit-testable and the proprietary battery is a server-only plug-in, not shipped code.
 */

import type { SnapshotPayloadV1 } from '@/lib/payload/schema'
import { snapshotHash, verifySignature } from '@/lib/ingest/signature'

export type GateDecision = 'accept' | 'flag' | 'reject'
export type VerificationTier = 'verified' | 'flagged' | 'unverified'

/** 'reject' fails the submission; 'flag' accepts-but-downgrades; 'info' is non-deciding. */
export interface GateReason {
  code: string
  gate: string
  severity: 'reject' | 'flag' | 'info'
  detail: string
}

export interface GateResult {
  decision: GateDecision
  tier: VerificationTier
  reasons: GateReason[]
  signals: Record<string, number>
}

/** All external state the chain needs — injected so the gates stay pure + testable. */
export interface GateContext {
  /** base64 ed25519 signature from the X-Agent-Signature header. */
  signatureB64?: string | null
  /** Enrolled device public key ("ed25519:<base64>"), or null until enrollment ships. */
  lookupDeviceKey?: (deviceId: string) => string | null
  /** Dedup: has this exact snapshot_hash already been accepted? */
  isDuplicateHash?: (snapshotHash: string) => boolean
  /** Replay: has this (device, window) already been submitted? */
  isReplay?: (deviceId: string, windowType: string, windowStart: string) => boolean
  /** Throttle: device submission count within the throttle window (default 0 = no store). */
  recentSubmissionCount?: (deviceId: string) => number
  /** Proprietary verification battery (Benford / cadence / contamination) — server-only plug-in. */
  battery?: (p: SnapshotPayloadV1) => {
    tier?: VerificationTier
    flags?: GateReason[]
    signals?: Record<string, number>
  }
}

/**
 * Tunable gate limits. These are integrity guards (NOT the proprietary RS.xx scoring
 * weights) so they can live in open code — but they are candidates to move to the
 * server-only ruleset if you want the exact cutoffs hidden from gaming probes.
 */
export const GATE_LIMITS = {
  /** Allowed |Σ4-pillars − tokens_total| as a fraction of tokens_total (rounding slack). */
  TOTALS_TOLERANCE_FRAC: 0.005,
  /** Output tokens per active minute above which throughput is physically implausible. */
  MAX_OUTPUT_TOKENS_PER_MIN: 20_000,
  /** Max submissions per device within the throttle window before rate-limiting. */
  MAX_SUBMISSIONS_PER_WINDOW: 24,
} as const

const reject = (gate: string, code: string, detail: string): GateReason => ({ gate, code, severity: 'reject', detail })
const flag = (gate: string, code: string, detail: string): GateReason => ({ gate, code, severity: 'flag', detail })
const info = (gate: string, code: string, detail: string): GateReason => ({ gate, code, severity: 'info', detail })

/** Gate 1 — physical + cross-field plausibility. Rejects fabricated/impossible telemetry. */
export function plausibilityGate(p: SnapshotPayloadV1): GateReason[] {
  const rt = p.raw_telemetry
  const out: GateReason[] = []
  const pillars =
    rt.tokens_input_fresh + rt.tokens_output + rt.tokens_cache_read + rt.tokens_cache_creation

  if (rt.tokens_total > 0) {
    const tol = Math.max(1, rt.tokens_total * GATE_LIMITS.TOTALS_TOLERANCE_FRAC)
    if (Math.abs(pillars - rt.tokens_total) > tol) {
      out.push(reject('plausibility', 'totals_inconsistent', `Σ4 pillars (${pillars}) ≠ tokens_total (${rt.tokens_total})`))
    }
    if (rt.sessions_count === 0) {
      out.push(reject('plausibility', 'tokens_without_sessions', `tokens_total ${rt.tokens_total} with sessions_count 0`))
    }
  }
  if (rt.turns_total < rt.sessions_count) {
    out.push(reject('plausibility', 'turns_lt_sessions', `turns_total ${rt.turns_total} < sessions_count ${rt.sessions_count}`))
  }
  if (rt.tokens_output > 0 && rt.turns_total === 0) {
    out.push(reject('plausibility', 'output_without_turns', `tokens_output ${rt.tokens_output} with turns_total 0`))
  }

  const spanMin = (Date.parse(p.window.end) - Date.parse(p.window.start)) / 60_000
  if (Number.isFinite(spanMin) && rt.active_minutes_est > spanMin + 1) {
    out.push(flag('plausibility', 'active_exceeds_window', `active_minutes_est ${rt.active_minutes_est} > window span ${Math.round(spanMin)}m`))
  }
  const outPerMin = rt.tokens_output / Math.max(rt.active_minutes_est, 1)
  if (outPerMin > GATE_LIMITS.MAX_OUTPUT_TOKENS_PER_MIN) {
    out.push(flag('plausibility', 'implausible_output_rate', `${Math.round(outPerMin)} output tok/min > ${GATE_LIMITS.MAX_OUTPUT_TOKENS_PER_MIN}`))
  }
  return out
}

/** Gate 2 — dedup + replay (store-injected; no-op without a store). */
export function dedupGate(p: SnapshotPayloadV1, ctx: GateContext): GateReason[] {
  const out: GateReason[] = []
  if (ctx.isDuplicateHash?.(p.agent.snapshot_hash)) {
    out.push(reject('dedup', 'duplicate_snapshot', `snapshot_hash already accepted: ${p.agent.snapshot_hash}`))
  }
  if (ctx.isReplay?.(p.device_id, p.window.type, p.window.start)) {
    out.push(reject('dedup', 'replay', `(device, ${p.window.type} @ ${p.window.start}) already submitted`))
  }
  return out
}

/** Gate 3 — per-device throttle / sybil rate cap (store-injected; 0 without a store). */
export function throttleGate(p: SnapshotPayloadV1, ctx: GateContext): GateReason[] {
  const n = ctx.recentSubmissionCount?.(p.device_id) ?? 0
  return n >= GATE_LIMITS.MAX_SUBMISSIONS_PER_WINDOW
    ? [reject('throttle', 'rate_limited', `device submitted ${n} times this window (cap ${GATE_LIMITS.MAX_SUBMISSIONS_PER_WINDOW})`)]
    : []
}

/** Gate 4 — hash integrity + ed25519 signature → verification tier. */
export function verificationGate(p: SnapshotPayloadV1, ctx: GateContext): { tier: VerificationTier; reasons: GateReason[] } {
  const reasons: GateReason[] = []
  let tier: VerificationTier = 'unverified'

  // Hash integrity. Mismatch is a FLAG (cross-language canonicalization caveat — see signature.ts),
  // not a hard reject; a MATCH is a positive integrity signal.
  if (p.agent.snapshot_hash) {
    const expected = snapshotHash(p)
    if (expected !== p.agent.snapshot_hash) {
      reasons.push(flag('verification', 'hash_unverified', 'recomputed snapshot_hash ≠ claimed (tampering or canon drift)'))
    }
  }

  const key = ctx.lookupDeviceKey?.(p.device_id) ?? null
  if (key && ctx.signatureB64) {
    if (verifySignature(p, ctx.signatureB64, key)) {
      tier = 'verified'
    } else {
      reasons.push(reject('verification', 'signature_invalid', 'ed25519 verification failed against enrolled device key'))
    }
  } else {
    // Out-of-band device enrollment not available yet (SECURE_INGEST.md): we cannot
    // verify, so the submission is `unverified` — accepted but un-trusted, never rejected
    // for lack of enrollment. Board weight/inclusion can gate on tier downstream.
    reasons.push(info('verification', 'device_unenrolled', 'no enrolled key for device → tier=unverified'))
  }
  return { tier, reasons }
}

/**
 * runIngestGates — run the full chain. First reject wins (decision='reject');
 * any flag → 'flag' (and a 'verified' tier downgrades to 'flagged'); else 'accept'.
 */
export function runIngestGates(p: SnapshotPayloadV1, ctx: GateContext = {}): GateResult {
  const reasons: GateReason[] = []
  const signals: Record<string, number> = {}

  reasons.push(...plausibilityGate(p))
  reasons.push(...dedupGate(p, ctx))
  reasons.push(...throttleGate(p, ctx))

  const v = verificationGate(p, ctx)
  reasons.push(...v.reasons)
  let tier = v.tier

  if (ctx.battery) {
    const b = ctx.battery(p)
    if (b.flags) reasons.push(...b.flags)
    if (b.tier) tier = b.tier
    if (b.signals) Object.assign(signals, b.signals)
  }

  const hasReject = reasons.some((r) => r.severity === 'reject')
  const hasFlag = reasons.some((r) => r.severity === 'flag')
  const decision: GateDecision = hasReject ? 'reject' : hasFlag ? 'flag' : 'accept'
  if (hasFlag && tier === 'verified') tier = 'flagged'

  return { decision, tier, reasons, signals }
}
