import "server-only";

/**
 * lib/scoring/ruleset.ts — SERVER-ONLY proprietary scoring parameters (RS.xx).
 *
 * The `'server-only'` import above hard-fails the build if any client component
 * tries to import this module. These weights/curves are the proprietary core of
 * the scoring engine and MUST NOT be shipped to the browser or rendered into
 * markup. Only lib/scoring/engine.ts (also server-side) reads them.
 *
 * Every constant below is a calibrated value from Ruleset v1.0 (CANON §VIII).
 * The OPERATOR_OVERRIDE_REQUIRED marker indicates the operator can override
 * these at runtime via SIGRANK_RULESET env vars (see lib/analytics/secret-config.ts).
 * RS.05 thresholds are calibrated from the HCM cut (1,626 operators) using
 * target population distribution (Option C). RS.08 is the TRANSMITTER badge gate.
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
 * RS.05 — Experience ladder breakpoints (TOKEN-PURE v4). 24 stages = 8 tiers ×
 * 3 sub-stages (I/II/III). Assignment is a descending first-match scan (highest
 * stage first). TRANSMITTER is NOT on this ladder — it is a temporary peak
 * badge (RS.08) that any tier can earn during a high-frequency, high-resonance
 * window.
 *
 * Calibrated from the HCM cut (1,626 operators) using target population
 * distribution (Option C): IGNITER 10%, BEARER 12.5%, REFINER 15%, SEEKER 22.5%,
 * BASE 20%, POWER 15%, ARCH 5%, ARCH+ 0% (aspirational). Each tier split into
 * 3 equal-population sub-stages.
 */
// OPERATOR_OVERRIDE_REQUIRED RS.05
export const RS05_CLASS_THRESHOLDS: ReadonlyArray<{
  class: string;
  totalMin: number;
}> = [
  { class: "ARCH+ I", totalMin: 7068201104627 },
  { class: "ARCH+ II", totalMin: 3000000000000 },
  { class: "ARCH+ III", totalMin: 1000000000000 },
  { class: "ARCH I", totalMin: 186207267611 },
  { class: "ARCH II", totalMin: 98543134083 },
  { class: "ARCH III", totalMin: 68766193943 },
  { class: "POWER I", totalMin: 39958782379 },
  { class: "POWER II", totalMin: 26955905621 },
  { class: "POWER III", totalMin: 19141226889 },
  { class: "BASE I", totalMin: 13960345961 },
  { class: "BASE II", totalMin: 10189224970 },
  { class: "BASE III", totalMin: 7747041813 },
  { class: "SEEKER I", totalMin: 5446673659 },
  { class: "SEEKER II", totalMin: 4014577247 },
  { class: "SEEKER III", totalMin: 2961798768 },
  { class: "REFINER I", totalMin: 2358346840 },
  { class: "REFINER II", totalMin: 1845750357 },
  { class: "REFINER III", totalMin: 1334876308 },
  { class: "BEARER I", totalMin: 984078167 },
  { class: "BEARER II", totalMin: 714619043 },
  { class: "BEARER III", totalMin: 431702990 },
  { class: "IGNITER I", totalMin: 216393332 },
  { class: "IGNITER II", totalMin: 88999166 },
  { class: "IGNITER III", totalMin: 0 },
];

/**
 * RS.08 — TRANSMITTER windowed peak badge threshold.
 *
 * TRANSMITTER is NOT a permanent class — it is a temporary peak state that any
 * experience tier can earn. An operator "transmits" when they hit BOTH:
 *   - High frequency: token throughput (total tokens in window) >= freqMin
 *   - High resonance: SIGNA RATE (composite signal quality) >= signaMin
 *
 * The badge is per-window (daily/weekly). It lapses when the operator's
 * frequency or resonance drops below the floor in subsequent windows.
 */
// OPERATOR_OVERRIDE_REQUIRED RS.08
export const RS08_TRANSMITTER_BADGE = {
  /** Minimum SIGNA RATE (resonance) to transmit. */
  signaMin: 85,
  /** Minimum token throughput (frequency) to transmit — total tokens in window. */
  freqMin: 1e9,
  /** Window granularity for badge evaluation. */
  window: "daily" as const,
};

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
