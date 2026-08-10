/**
 * lib/analytics/compare-narrate.ts — CMP-2
 *
 * Deterministic build archetype narration. Replaces the 5-regime classifier
 * with the 10 build archetype system. `regimeOf()` classifies an operator's
 * cascade into one of ten build archetypes from three derived dimensions:
 *   - leverage     = cache_read / input
 *   - velocity     = output / input
 *   - construction = cache_write / cache_read
 *
 * Classification order (priority — first match wins):
 *   1. CONVERGENT     — P80 on all 3 dims (multi-axis elite)
 *   2. KINETIC        — velocity >= 0.8
 *   3. Construction   — construction >= 0.02 (BUILDER / RECURSIVE / AMPLIFIER by leverage)
 *   4. Reuse depth    — else (INPUT-BOUND / PRIMING / CONTEXTUAL / DEEP READER / ARCHIVIST by leverage)
 *
 * TODO(OPERATOR_OVERRIDE_REQUIRED): the breakpoints below are proprietary
 * tuning constants the owner owns (RS.xx-class). Surface them from the
 * ruleset once finalized rather than inlining here.
 */

import {
  buildArchetypeOf,
  type BuildArchetype,
  type BuildArchetypeInput,
} from "@/lib/analytics/build-archetypes";

export interface RegimeInput {
  velocity: number;
  leverage: number;
  /** cache_write / cache_read */
  construction?: number;
  nonCompounding?: boolean;
}

export type RegimeKey =
  | "convergent"
  | "kinetic"
  | "input-bound"
  | "priming"
  | "contextual"
  | "deep-reader"
  | "archivist"
  | "builder"
  | "recursive"
  | "amplifier"
  | "stateless";

export interface Regime {
  key: RegimeKey;
  word: string; // short label for a chip / verdict
  blurb: string; // one terse sentence
}

/** Classify a cascade into its build archetype. */
export function regimeOf(m: RegimeInput): Regime {
  // Stateless pipe: no cache commits, cascade can't form.
  if (m.nonCompounding) {
    return {
      key: "stateless",
      word: "stateless pipe",
      blurb:
        "No cache commits — the cascade can't form. Reuse without building forward.",
    };
  }

  const input: BuildArchetypeInput = {
    leverage: m.leverage ?? 0,
    velocity: m.velocity ?? 0,
    construction: m.construction ?? 0,
  };

  const arch: BuildArchetype = buildArchetypeOf(input);

  return {
    key: arch.key as RegimeKey,
    word: arch.word,
    blurb: arch.blurb,
  };
}
