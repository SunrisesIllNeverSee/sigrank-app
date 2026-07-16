import "server-only";

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

import type { SnapshotPayloadV1 } from "@/lib/payload/schema";
import { snapshotHash, verifySignature } from "@/lib/ingest/signature";

export type GateDecision = "accept" | "flag" | "reject";
export type VerificationTier = "verified" | "flagged" | "unverified";

/** 'reject' fails the submission; 'flag' accepts-but-downgrades; 'info' is non-deciding. */
export interface GateReason {
  code: string;
  gate: string;
  severity: "reject" | "flag" | "info";
  detail: string;
}

export interface GateResult {
  decision: GateDecision;
  tier: VerificationTier;
  reasons: GateReason[];
  signals: Record<string, number>;
}

/** All external state the chain needs — injected so the gates stay pure + testable. */
export interface GateContext {
  /** base64 ed25519 signature from the X-Agent-Signature header. */
  signatureB64?: string | null;
  /** Enrolled device public key ("ed25519:<base64>"), or null until enrollment ships. */
  lookupDeviceKey?: (deviceId: string) => string | null;
  /** Dedup: has this exact snapshot_hash already been accepted? */
  isDuplicateHash?: (snapshotHash: string) => boolean;
  /** Replay: has this (device, window) already been submitted? */
  isReplay?: (
    deviceId: string,
    windowType: string,
    windowStart: string,
  ) => boolean;
  /** Throttle: device submission count within the throttle window (default 0 = no store). */
  recentSubmissionCount?: (deviceId: string) => number;
  /** Proprietary verification battery (Benford / cadence / contamination) — server-only plug-in. */
  battery?: (p: SnapshotPayloadV1) => {
    tier?: VerificationTier;
    flags?: GateReason[];
    signals?: Record<string, number>;
  };
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
  // ── Tightened range-plausibility bounds (deviewreview3) ────────────────────
  // The original bounds (100:1 reuse, 50/min cadence) were loose enough to
  // drive Υ arbitrarily high while staying under them. Real data: reuse ~20-25:1,
  // cacheWrite ~2-11:1, input share >0.3% of total. These tightened bounds
  // catch a tuned fabricator who sets input=1 to inflate Υ = cr·o/i².
  /** Max cache_read/cache_creation ratio (real max ~30:1 for Claude power users; was 100:1). */
  MAX_CACHE_REUSE_RATIO: 35,
  /** Codex-specific max cache_read/cache_creation ratio (Codex caches more aggressively; ~70:1 observed). */
  MAX_CACHE_REUSE_RATIO_CODEX: 80,
  /** Min cache_creation/output ratio (real min ~1.5:1; fabricators set cc<<o). */
  MIN_CACHE_WRITE_RATIO: 0.5,
  /** Min input share of total tokens (real min ~0.03% for power users; fabricators set input→0). */
  MIN_INPUT_SHARE_FRAC: 0.0003,
  /** Max cadence turns/active_minutes (real: 0.5-10/min; was 50). */
  MAX_CADENCE_PER_MIN: 15,
} as const;

const reject = (gate: string, code: string, detail: string): GateReason => ({
  gate,
  code,
  severity: "reject",
  detail,
});
const flag = (gate: string, code: string, detail: string): GateReason => ({
  gate,
  code,
  severity: "flag",
  detail,
});
const info = (gate: string, code: string, detail: string): GateReason => ({
  gate,
  code,
  severity: "info",
  detail,
});

/** Gate 1 — physical + cross-field plausibility. Rejects fabricated/impossible telemetry. */
export function plausibilityGate(p: SnapshotPayloadV1): GateReason[] {
  const rt = p.raw_telemetry;
  const out: GateReason[] = [];
  const pillars =
    rt.tokens_input_fresh +
    rt.tokens_output +
    rt.tokens_cache_read +
    rt.tokens_cache_creation;

  if (rt.tokens_total > 0) {
    const tol = Math.max(
      1,
      rt.tokens_total * GATE_LIMITS.TOTALS_TOLERANCE_FRAC,
    );
    if (Math.abs(pillars - rt.tokens_total) > tol) {
      out.push(
        reject(
          "plausibility",
          "totals_inconsistent",
          `Σ4 pillars (${pillars}) ≠ tokens_total (${rt.tokens_total})`,
        ),
      );
    }
    if (rt.sessions_count === 0) {
      out.push(
        reject(
          "plausibility",
          "tokens_without_sessions",
          `tokens_total ${rt.tokens_total} with sessions_count 0`,
        ),
      );
    }
  }
  if (rt.turns_total < rt.sessions_count) {
    out.push(
      reject(
        "plausibility",
        "turns_lt_sessions",
        `turns_total ${rt.turns_total} < sessions_count ${rt.sessions_count}`,
      ),
    );
  }
  if (rt.tokens_output > 0 && rt.turns_total === 0) {
    out.push(
      reject(
        "plausibility",
        "output_without_turns",
        `tokens_output ${rt.tokens_output} with turns_total 0`,
      ),
    );
  }

  const spanMin =
    (Date.parse(p.window.end) - Date.parse(p.window.start)) / 60_000;
  if (Number.isFinite(spanMin) && rt.active_minutes_est > spanMin + 1) {
    out.push(
      flag(
        "plausibility",
        "active_exceeds_window",
        `active_minutes_est ${rt.active_minutes_est} > window span ${Math.round(spanMin)}m`,
      ),
    );
  }
  const outPerMin = rt.tokens_output / Math.max(rt.active_minutes_est, 1);
  if (outPerMin > GATE_LIMITS.MAX_OUTPUT_TOKENS_PER_MIN) {
    out.push(
      flag(
        "plausibility",
        "implausible_output_rate",
        `${Math.round(outPerMin)} output tok/min > ${GATE_LIMITS.MAX_OUTPUT_TOKENS_PER_MIN}`,
      ),
    );
  }

  // Cross-field ratio checks (S1.2) — flag, not reject (avoids false positives on power users).
  // These are defense-in-depth: the battery (Gate 5) checks the same patterns, but having them
  // in the plausibility gate means they fire even if the battery is ever unwired.
  // Bounds tightened (deviewreview3): the original 100:1 reuse + 50/min cadence were
  // loose enough to drive Υ arbitrarily high while staying under them.

  // Impossible cascade: cache_read > 0 with cache_creation = 0 (must write cache before reading).
  if (rt.tokens_cache_read > 1_000 && rt.tokens_cache_creation === 0) {
    out.push(
      flag(
        "plausibility",
        "cache_without_creation",
        `${rt.tokens_cache_read} cache_read with 0 cache_creation (impossible cascade)`,
      ),
    );
  }
  // Extreme cache reuse: cache_read/cache_creation ratio too high.
  // Claude real max ~30:1; Codex caches more aggressively (~70:1 observed).
  // A fabricator who sets cc low and cr high inflates Υ = cr·o/i².
  const isCodex = p.platform.primary === "codex";
  const maxReuse = isCodex
    ? GATE_LIMITS.MAX_CACHE_REUSE_RATIO_CODEX
    : GATE_LIMITS.MAX_CACHE_REUSE_RATIO;
  if (
    rt.tokens_cache_creation > 0 &&
    rt.tokens_cache_read / rt.tokens_cache_creation > maxReuse
  ) {
    out.push(
      flag(
        "plausibility",
        "extreme_cache_ratio",
        `cache_read/cache_creation = ${(rt.tokens_cache_read / rt.tokens_cache_creation).toFixed(1)}:1 (real max ~${maxReuse - 5}:1${isCodex ? " for Codex" : ""})`,
      ),
    );
  }
  // Low cache-write ratio: cache_creation/output < 0.5 (real min ~1.5:1).
  // A fabricator who sets cc<<o gets high Υ without the cache-write cost.
  if (
    rt.tokens_output > 1_000 &&
    rt.tokens_cache_creation / rt.tokens_output <
      GATE_LIMITS.MIN_CACHE_WRITE_RATIO
  ) {
    out.push(
      flag(
        "plausibility",
        "low_cache_write_ratio",
        `cache_creation/output = ${(rt.tokens_cache_creation / rt.tokens_output).toFixed(2)}:1 (real min ~1.5:1)`,
      ),
    );
  }
  // Input share too low: input < 0.1% of total (real min ~0.3%).
  // A fabricator who sets input→0 inflates Υ = cr·o/i² quadratically.
  if (
    pillars > 10_000 &&
    rt.tokens_input_fresh / pillars < GATE_LIMITS.MIN_INPUT_SHARE_FRAC
  ) {
    out.push(
      flag(
        "plausibility",
        "implausible_input_share",
        `input is ${((rt.tokens_input_fresh / pillars) * 100).toFixed(3)}% of total (real min ~0.3%)`,
      ),
    );
  }
  // Implausible cadence: turns/active_minutes > 15 (real sessions: 0.5-10/min; was 50).
  if (
    rt.active_minutes_est > 0 &&
    rt.turns_total / rt.active_minutes_est > GATE_LIMITS.MAX_CADENCE_PER_MIN
  ) {
    out.push(
      flag(
        "plausibility",
        "implausible_cadence",
        `${(rt.turns_total / rt.active_minutes_est).toFixed(1)} turns/min (real: 0.5-10)`,
      ),
    );
  }

  return out;
}

/** Gate 2 — dedup + replay (store-injected; no-op without a store). */
export function dedupGate(
  p: SnapshotPayloadV1,
  ctx: GateContext,
): GateReason[] {
  const out: GateReason[] = [];
  if (ctx.isDuplicateHash?.(p.agent.snapshot_hash)) {
    out.push(
      reject(
        "dedup",
        "duplicate_snapshot",
        `snapshot_hash already accepted: ${p.agent.snapshot_hash}`,
      ),
    );
  }
  if (ctx.isReplay?.(p.device_id, p.window.type, p.window.start)) {
    out.push(
      reject(
        "dedup",
        "replay",
        `(device, ${p.window.type} @ ${p.window.start}) already submitted`,
      ),
    );
  }
  return out;
}

/** Gate 3 — per-device throttle / sybil rate cap (store-injected; 0 without a store).
 *
 * TOCTOU note: this gate reads a pre-fetched count, so N concurrent requests
 * sharing one snapshotted count all pass (effective cap = count + inflight).
 * The authoritative throttle check is INSIDE the materialize_verified_snapshot
 * RPC (migration 0025_atomic_throttle.sql), which counts + enforces atomically
 * in the same transaction as the insert. This gate stays as a fast-path
 * pre-check for the no-store/test path and to give early feedback. */
export function throttleGate(
  p: SnapshotPayloadV1,
  ctx: GateContext,
): GateReason[] {
  const n = ctx.recentSubmissionCount?.(p.device_id) ?? 0;
  return n >= GATE_LIMITS.MAX_SUBMISSIONS_PER_WINDOW
    ? [
        reject(
          "throttle",
          "rate_limited",
          `device submitted ${n} times this window (cap ${GATE_LIMITS.MAX_SUBMISSIONS_PER_WINDOW})`,
        ),
      ]
    : [];
}

/** Gate 4 — hash integrity + ed25519 signature → verification tier. */
export function verificationGate(
  p: SnapshotPayloadV1,
  ctx: GateContext,
): { tier: VerificationTier; reasons: GateReason[] } {
  const reasons: GateReason[] = [];
  let tier: VerificationTier = "unverified";

  // Hash integrity. Mismatch is a FLAG (cross-language canonicalization caveat — see signature.ts),
  // not a hard reject; a MATCH is a positive integrity signal.
  if (p.agent.snapshot_hash) {
    const expected = snapshotHash(p);
    if (expected !== p.agent.snapshot_hash) {
      reasons.push(
        flag(
          "verification",
          "hash_unverified",
          "recomputed snapshot_hash ≠ claimed (tampering or canon drift)",
        ),
      );
    }
  }

  const key = ctx.lookupDeviceKey?.(p.device_id) ?? null;
  if (key && ctx.signatureB64) {
    if (verifySignature(p, ctx.signatureB64, key)) {
      tier = "verified";
    } else {
      reasons.push(
        reject(
          "verification",
          "signature_invalid",
          "ed25519 verification failed against enrolled device key",
        ),
      );
    }
  } else {
    // Out-of-band device enrollment not available yet (SECURE_INGEST.md): we cannot
    // verify, so the submission is `unverified` — accepted but un-trusted, never rejected
    // for lack of enrollment. Board weight/inclusion can gate on tier downstream.
    reasons.push(
      info(
        "verification",
        "device_unenrolled",
        "no enrolled key for device → tier=unverified",
      ),
    );
  }
  return { tier, reasons };
}

/**
 * runIngestGates — run the full chain. First reject wins (decision='reject');
 * any flag → 'flag' (and a 'verified' tier downgrades to 'flagged'); else 'accept'.
 */
export function runIngestGates(
  p: SnapshotPayloadV1,
  ctx: GateContext = {},
): GateResult {
  const reasons: GateReason[] = [];
  const signals: Record<string, number> = {};

  reasons.push(...plausibilityGate(p));
  reasons.push(...dedupGate(p, ctx));
  reasons.push(...throttleGate(p, ctx));

  const v = verificationGate(p, ctx);
  reasons.push(...v.reasons);
  let tier = v.tier;

  if (ctx.battery) {
    const b = ctx.battery(p);
    if (b.flags) reasons.push(...b.flags);
    if (b.tier) tier = b.tier;
    if (b.signals) Object.assign(signals, b.signals);
  }

  const hasReject = reasons.some((r) => r.severity === "reject");
  const hasFlag = reasons.some((r) => r.severity === "flag");
  const decision: GateDecision = hasReject
    ? "reject"
    : hasFlag
      ? "flag"
      : "accept";
  if (hasFlag && tier === "verified") tier = "flagged";

  return { decision, tier, reasons, signals };
}
