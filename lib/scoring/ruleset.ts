import "server-only";

/**
 * lib/scoring/ruleset.ts — SERVER-ONLY proprietary scoring parameters (RS.xx).
 *
 * The `'server-only'` import above hard-fails the build if any client component
 * tries to import this module. These weights/curves are the proprietary core of
 * the scoring engine and MUST NOT be shipped to the browser or rendered into
 * markup. Only lib/scoring/engine.ts (also server-side) reads them.
 *
 * Every constant below is a PROVISIONAL value from Ruleset v1.0 (CANON §VIII).
 * Each carries an OPERATOR_OVERRIDE_REQUIRED marker — these are the placeholder
 * values the operator replaces with the real Railway scoring-worker config.
 */

/**
 * RS.01 — SIGNA RATE composite weights.
 * Order: M.01 compression / M.04 session-depth / M.02 prompt-complexity /
 * M.03 cross-thread / M.05 token-throughput.
 *
 * tt (M.05 token-throughput) is a WORD-ERA metric → MUTED to 0 (2026-06-26): it is not
 * a valid token-cascade signal (it was being fed the raw total, distorting the score).
 * §IGNA is under recalibration — the recal finalizes the remaining weights (they are
 * intentionally NOT rebalanced to 1.0 here; the recal owns the final normalization).
 * Until then signa = comp+sd+pc+ct only (tt contributes nothing). See WEBSITE_FIXES /
 * the §IGNA recalibration note.
 */
// OPERATOR_OVERRIDE_REQUIRED RS.01
export const RS01_SIGNA_WEIGHTS = {
  comp: 0.3,
  sd: 0.2,
  pc: 0.2,
  ct: 0.15,
  tt: 0, // MUTED — word-era M.05, removed from the live composite pending §IGNA recal
} as const;

/**
 * RS.02 — Session-depth bucketization curve.
 * Each tuple is [rawThreshold, score]; the first tuple whose threshold the raw
 * depth meets (>=) wins. Below the smallest threshold the fallback score is 25.
 */
// OPERATOR_OVERRIDE_REQUIRED RS.02
export const RS02_DEPTH_BUCKETS: ReadonlyArray<readonly [number, number]> = [
  [30, 100],
  [25, 92],
  [20, 84],
  [15, 72],
  [10, 58],
  [5, 42],
];
/** Fallback score when raw session depth is below the smallest bucket. */
// OPERATOR_OVERRIDE_REQUIRED RS.02
export const RS02_DEPTH_FALLBACK = 25;

/**
 * RS.04 — Prompt-complexity sub-score weights (CANON M.02 / RS.04).
 * Used by sig_army / precision tier when decomposing PC. Sum = 1.0.
 */
// OPERATOR_OVERRIDE_REQUIRED RS.04
export const RS04_PC_WEIGHTS = {
  instruction_layers: 0.25,
  recursion: 0.2,
  entities: 0.2,
  constraints: 0.15,
  symbolic: 0.1,
  response_shaping: 0.1,
} as const;

/**
 * RS.05 — Class threshold exact breakpoints (the numerical realization of the
 * public qualitative cuts K.01–K.09). Each entry is the floor pair the class
 * requires; `signaMin` is null when a class has no SIGNA gate.
 *
 * NOTE: the LOCKED assignment FUNCTION FORM lives in engine.ts (assignClass) —
 * descending cuts, NOT an overlapping range table. This table only documents the
 * exact breakpoints; do not re-derive class assignment from it as a range scan.
 */
// OPERATOR_OVERRIDE_REQUIRED RS.05
export const RS05_CLASS_THRESHOLDS: ReadonlyArray<{
  class: string;
  compMin: number;
  signaMin: number | null;
}> = [
  { class: "TRANSMITTER", compMin: 0.85, signaMin: 85 },
  { class: "ARCH+", compMin: 0.75, signaMin: 75 },
  { class: "ARCH", compMin: 0.65, signaMin: 65 },
  { class: "POWER", compMin: 0.5, signaMin: 50 },
  { class: "BASE", compMin: 0.4, signaMin: null },
  { class: "SEEKER", compMin: 0.3, signaMin: null },
  { class: "REFINER", compMin: 0.2, signaMin: null },
  { class: "BEARER", compMin: 0.15, signaMin: null },
  { class: "IGNITER", compMin: 0, signaMin: null },
];

/**
 * RS.06 — Anti-gaming penalty rules. Enabled 2026-07-02 with a gentle penalty curve
 * (10% Υ reduction per battery flag, max 40%). The ingest gate chain flags suspicious
 * submissions; RS.06 applies the score-level penalty on top of the gate-level flag.
 * This is the second line of defense: even if a fabricator passes the plausibility
 * gate, the battery flags trigger a Υ penalty that drops them down the board.
 */
// OPERATOR_OVERRIDE_REQUIRED RS.06
export const RS06_ANTI_GAMING = {
  enabled: true,
  /** Υ penalty per battery flag (gentle: 10% per flag). */
  penaltyPerFlag: 0.1,
  /** Maximum total penalty (caps at 40% even with many flags). */
  maxPenalty: 0.4,
} as const;

/**
 * applyRS06Penalty — reduce a yield based on the number of battery flags fired.
 * Returns the original yield if RS.06 is disabled or no flags fired.
 */
export function applyRS06Penalty(yield_: number, batteryFlags: number): number {
  if (!RS06_ANTI_GAMING.enabled || batteryFlags <= 0) return yield_;
  const penalty = Math.min(
    batteryFlags * RS06_ANTI_GAMING.penaltyPerFlag,
    RS06_ANTI_GAMING.maxPenalty,
  );
  return yield_ * (1 - penalty);
}

/**
 * RS.07 — Class promotion stickiness: consecutive scoring cycles a higher class
 * must be held before promotion takes effect. Demotions are immediate.
 */
// OPERATOR_OVERRIDE_REQUIRED RS.07
export const RS07_PROMOTION_CYCLES = 3;

/** Active ruleset version stamped onto every scored snapshot. */
export const RULESET_VERSION = "1.0";
