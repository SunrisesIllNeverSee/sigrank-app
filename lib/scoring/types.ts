/**
 * lib/scoring/types.ts — Core scoring + operator data shapes.
 *
 * Dependency-free type contracts shared by the scoring engine, the data facade,
 * and every feature builder. No runtime values live here. The proprietary
 * RS.xx weights are intentionally NOT referenced from this file.
 */

import type { SignalClass } from '@/components/sigrank/types'
import type { CascadeMetrics } from '@/lib/ingest/bridge'

export type { CascadeMetrics }

/** Supporter (product) tier — distinct from class tier (K.xx). */
export type SupporterTier = 'free' | 'patron' | 'pro' | 'circle_sponsor'

/** Verification status mirrors `operators.verification_status`. */
export type VerificationStatus = 'unverified' | 'verified' | 'audited'

/**
 * Core5Raw — the raw (pre-normalization) Core 5 inputs computed from telemetry.
 * Compression is already a [0,1] ratio; the rest are raw counts / ratios.
 */
export interface Core5Raw {
  /** M.01 compression ratio, [0,1]. */
  compression_ratio: number
  /** M.02 prompt complexity raw (free-tier estimate or precision value), [0,100]. */
  prompt_complexity: number
  /** M.03 cross-thread referencing, already [0,100]. */
  cross_thread: number
  /** M.04 session depth raw (avg reply-chain length / turns-per-session). */
  session_depth: number
  /** M.05 token throughput — total tokens (T.05) for log normalization. */
  token_throughput: number
}

/**
 * Core5Scores — the Core 5 normalized to [0,100] scores (CANON §VI step 6).
 */
export interface Core5Scores {
  /** M.01 score = compression × 100. */
  comp: number
  /** M.04 score via RS.02 bucketization. */
  sd: number
  /** M.02 score (PC composite, already [0,100]). */
  pc: number
  /** M.03 score (cross-thread, already [0,100]). */
  ct: number
  /** M.05 score via log normalization. */
  tt: number
}

/**
 * ScoredSnapshot — the board-grade scored metrics for one operator/window.
 * This is what the leaderboard, profile, and metric pages read.
 */
export interface ScoredSnapshot {
  /** C.01 SIGNA RATE composite, [0,100]. */
  signa_rate: number
  /** K.xx class assignment. */
  class_tier: SignalClass
  /** M.01 compression ratio, [0,1]. */
  compression_ratio: number
  /**
   * M.02 prompt complexity. `confidence` is 'exact' for precision-tier
   * (sig_army) values and 'low' for the free-tier estimate.
   */
  prompt_complexity: { value: number; confidence: 'exact' | 'low' }
  /** M.03 cross-thread referencing score, [0,100]. */
  cross_thread: number
  /** M.04 session depth raw. */
  session_depth: number
  /** M.05 token throughput raw (total tokens). */
  token_throughput: number
  /** E.01 signal force score, [0,100]. */
  signal_force: number
  /** E.02 drift ratio — null until a Pro audit computes it. */
  drift_ratio: number | null
  /** C.02 SDOT — null until multi-window history exists. */
  sdot_score: number | null
  /** C.03 SDRM — null until the engine computes it. */
  sdrm_score: number | null
  /** Rank movement over the last 24h (positive = climbed). */
  movement_24h: number
  /** Rank movement over the last 7d (positive = climbed). */
  movement_7d: number
  /** Ruleset version that produced this snapshot. */
  ruleset_version: string
  /**
   * Snapshot date ('YYYY-MM-DD') — the recency of this scored window. Surfaced as the
   * board's LAST column (2026-06-28). Optional/null on rows without a date (the engine
   * doesn't always stamp it; queries.ts + mock both populate it where available).
   */
  snapshot_date?: string | null
  /**
   * Cascade diagnostics (Υ-layer) — null when telemetry lacks cache tokens
   * (non-Claude platforms or Codex alpha path). Always present for Claude operators.
   */
  cascade: CascadeMetrics | null
}

/**
 * SnapshotPayload — Schema v1.0 of the canonical payload the local agent
 * submits (CANON §I, snapshot_payload.md). The web app does not produce these
 * (the agent does), but the types are shared so the submit endpoint and any
 * preview UI agree on the shape.
 */
export interface SnapshotPayload {
  schema_version: '1.0'
  /** Telemetry block (CANON T.01–T.16). */
  telemetry: {
    output_tokens: number
    fresh_input_tokens: number
    cache_read: number
    cache_creation: number
    total_tokens: number
    sessions_count: number
    turns_total: number
    active_minutes_est: number
    message_volume: number
    account_age_days: number
    total_messages_lifetime: number
    window_type: string
    window_start: string
    window_end: string
    platform: {
      primary: string
      models: string[]
    }
  }
  /** Agent / signing block (CANON T.17–T.20). */
  agent: {
    public_key: string
    signature: string
    ruleset_version: string
    snapshot_hash: string
  }
}

/**
 * Operator — identity record (mirrors `operators` plus claim + supporter fields).
 * `isPlaceholder` flags mock / not-yet-real rows so the UI can render the gold
 * star + tooltip per the placeholder protocol.
 */
export interface Operator {
  operator_id: string
  codename: string
  display_name: string | null
  /** Whether this operator profile has been claimed by a paying owner. */
  claimed: boolean
  claimed_at: string | null
  /** Stripe payment id for the one-time claim purchase, if any. */
  claim_payment_id: string | null
  /** Contact captured at claim time, if any. */
  claim_contact: string | null
  /** Current resolved supporter (product) tier. */
  current_supporter_tier: SupporterTier
  verification_status: VerificationStatus
  /** Which AI platform (claude / chatgpt / gemini / pi / multi). */
  primary_domain: string
  account_age_days: number
  total_messages_lifetime: number
  /** True for mock / not-real rows — render with placeholder styling. */
  isPlaceholder?: boolean
  // ── Phase-0 identity fields (migration 0007, apply post-move) ──────────────
  /** Optional vanity handle (unique, opt-in — codename stays the anonymous primary id). */
  handle?: string | null
  /** Public avatar URL (Supabase Storage, Phase 3 upload; display-only pre-move). */
  avatar_url?: string | null
  /** Short public bio. */
  bio?: string | null
  /** Profile links — fixed slots: github, site, x. */
  links?: { github?: string; site?: string; x?: string } | null
  /** Public location string (city/country, operator-supplied). */
  location?: string | null
}
