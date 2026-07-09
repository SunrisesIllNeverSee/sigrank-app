/**
 * lib/scoring/engine.ts — Pure scoring functions (CANON §VI pipeline).
 *
 * Imports the SERVER-ONLY ruleset, so this module is itself server-side. All
 * functions are pure: no wall-clock reads, no RNG. They take explicit inputs
 * (including any "hours since last seen") so callers control determinism.
 */

import type { SignalClass } from "@/components/sigrank/types";
import {
  RS01_SIGNA_WEIGHTS,
  RS02_DEPTH_BUCKETS,
  RS02_DEPTH_FALLBACK,
  RS05_CLASS_THRESHOLDS,
} from "@/lib/scoring/secret-config";
import type { Core5Raw, Core5Scores } from "@/lib/scoring/types";

/** Log normalization shared by TT / MV / Signal Force: min(100, 20·log10(x+1)). */
export const logNorm = (x: number): number =>
  Math.min(100, 20 * Math.log10(x + 1));

/** Clamp a value into [min, max]. */
const clamp = (x: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, x));

/**
 * normalizeCore5 — turn raw Core 5 inputs into [0,100] scores (CANON §VI.6).
 * - comp = compression × 100
 * - sd   = RS.02 bucketization of raw session depth
 * - pc   = already [0,100] (clamped)
 * - ct   = already [0,100] (clamped)
 * - tt   = log normalization of total tokens
 */
export function normalizeCore5(raw: Core5Raw): Core5Scores {
  return {
    comp: clamp(raw.compression_ratio * 100, 0, 100),
    sd: bucketizeDepth(raw.session_depth),
    pc: clamp(raw.prompt_complexity, 0, 100),
    ct: clamp(raw.cross_thread, 0, 100),
    tt: logNorm(raw.token_throughput),
  };
}

/** RS.02 session-depth bucketization. First threshold met (>=) wins. */
export function bucketizeDepth(rawDepth: number): number {
  for (const [threshold, score] of RS02_DEPTH_BUCKETS) {
    if (rawDepth >= threshold) return score;
  }
  return RS02_DEPTH_FALLBACK;
}

/**
 * computeSignaRate — RS.01-weighted Core 5 composite (CANON §VI.7).
 * = w·comp + w·sd + w·pc + w·ct + w·tt, result in [0,100].
 */
export function computeSignaRate(scores: Core5Scores): number {
  const { comp, sd, pc, ct, tt } = scores;
  const w = RS01_SIGNA_WEIGHTS;
  const signa = w.comp * comp + w.sd * sd + w.pc * pc + w.ct * ct + w.tt * tt;
  return clamp(signa, 0, 100);
}

/**
 * assignClass — LOCKED FUNCTION FORM (CANON §V, class_tiers.md).
 *
 * Descending cuts: the FIRST condition met wins. Top four classes gate on BOTH
 * compression AND SIGNA RATE (anti-gaming); lower classes gate on compression
 * only. This is intentionally NOT an overlapping range table — do not refactor
 * into a range scan, which would change tie/edge behavior.
 *
 * Breakpoints now load from RS05_CLASS_THRESHOLDS in ./secret-config (the active,
 * env-overridable ruleset; falls back to the public placeholders when no env is
 * set). The iteration is a DESCENDING FIRST-MATCH scan over that table, NOT a
 * range scan: for each threshold in order, a non-null signaMin requires BOTH
 * compression >= compMin AND signaRate >= signaMin; a null signaMin requires only
 * compression >= compMin. First match wins; fallthrough returns the last class.
 * For the placeholder thresholds this is byte-identical to the prior if-chain,
 * preserving exact >= edge semantics.
 */
export function assignClass(
  compression: number,
  signaRate: number,
): SignalClass {
  for (const t of RS05_CLASS_THRESHOLDS) {
    const met =
      t.signaMin !== null
        ? compression >= t.compMin && signaRate >= t.signaMin
        : compression >= t.compMin;
    if (met) return t.class as SignalClass;
  }
  return RS05_CLASS_THRESHOLDS[RS05_CLASS_THRESHOLDS.length - 1]
    .class as SignalClass;
}

/**
 * computeSignalForce — E.01 (CANON §IV-B).
 * raw   = (totalMessagesLifetime × sessionDepthRaw) / accountAgeDays
 * score = log normalization of raw, [0,100].
 * Guards a zero account age (returns score 0).
 */
export function computeSignalForce(
  totalMessagesLifetime: number,
  sessionDepthRaw: number,
  accountAgeDays: number,
): { raw: number; score: number } {
  if (accountAgeDays <= 0) return { raw: 0, score: 0 };
  const raw = (totalMessagesLifetime * sessionDepthRaw) / accountAgeDays;
  return { raw, score: logNorm(raw) };
}

/** Input bundle for scoreSnapshot. */
export interface ScoreSnapshotInput {
  raw: Core5Raw;
  /** PC confidence: 'exact' (precision/sig_army) or 'low' (free-tier estimate). */
  pcConfidence: "exact" | "low";
  /** Lifetime total messages (B.03) for Signal Force. */
  totalMessagesLifetime: number;
  /** Account age in days (B.02) for Signal Force. */
  accountAgeDays: number;
}

/** Output of scoreSnapshot — the engine-computed slice of a ScoredSnapshot. */
export interface ScoreSnapshotResult {
  signa_rate: number;
  class_tier: SignalClass;
  scores: Core5Scores;
  signal_force: number;
  signal_force_raw: number;
}

/**
 * scoreSnapshot — run the deterministic core of the scoring pipeline for one
 * snapshot: normalize → SIGNA RATE → class → signal force.
 * Movement deltas, SDOT/SDRM, and Drift Ratio are computed elsewhere (history /
 * AuditProvider), not here.
 */
export function scoreSnapshot(input: ScoreSnapshotInput): ScoreSnapshotResult {
  const scores = normalizeCore5(input.raw);
  const signa_rate = computeSignaRate(scores);
  const class_tier = assignClass(input.raw.compression_ratio, signa_rate);
  const sf = computeSignalForce(
    input.totalMessagesLifetime,
    input.raw.session_depth,
    input.accountAgeDays,
  );
  return {
    signa_rate,
    class_tier,
    scores,
    signal_force: sf.score,
    signal_force_raw: sf.raw,
  };
}
