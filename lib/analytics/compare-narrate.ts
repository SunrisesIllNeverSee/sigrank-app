/**
 * lib/compare/narrate.ts — CMP-2
 *
 * Deterministic regime narration, ported from moses-sigrank/narrate.py `_template`
 * (its non-blocking template fallback). The optional MiniCPM LLM path is intentionally
 * NOT ported: a server component can't depend on a model, and the token-era card wants
 * a deterministic verdict. `regimeOf()` classifies an operator's cascade into one of five
 * archetypes from its velocity (output/input) and leverage (cache_read/input) — the same
 * axis boundaries narrate.py uses.
 *
 * TODO(CMP-2 · OPERATOR_OVERRIDE_REQUIRED): the velocity/leverage breakpoints below
 * (1.0, 100, 10, 0.8, 2) are proprietary tuning constants the owner owns (RS.xx-class).
 * Surface them from the ruleset once finalized rather than inlining here.
 */

export interface RegimeInput {
  velocity: number;
  leverage: number;
  nonCompounding?: boolean;
}

export type RegimeKey =
  "stateless" | "kinetic" | "archival" | "volatile" | "transient";

export interface Regime {
  key: RegimeKey;
  word: string; // short label for a chip / verdict
  blurb: string; // one terse sentence
}

// TODO(CMP-2): OPERATOR_OVERRIDE_REQUIRED — proprietary regime breakpoints.
const T = { vHigh: 1, lHigh: 100, lMid: 10, vMid: 0.8, lLow: 2 };

/** Classify a cascade into its operating regime (narrate.py `_template` parity). */
export function regimeOf(m: RegimeInput): Regime {
  const v = m.velocity ?? 0;
  const l = m.leverage ?? 0;
  if (m.nonCompounding) {
    return {
      key: "stateless",
      word: "stateless pipe",
      blurb:
        "No cache commits — the cascade can't form. Reuse without building forward.",
    };
  }
  if (v >= T.vHigh && l >= T.lHigh) {
    return {
      key: "kinetic",
      word: "closed kinetic loop",
      blurb:
        "Holds both axes at once — high generation AND deep memory leverage. The rare operator the tradeoff says shouldn't exist.",
    };
  }
  if (l >= T.lMid && v < T.vHigh) {
    return {
      key: "archival",
      word: "archival sponge",
      blurb:
        "Deep reuse, light generation — holds context beautifully, executes little with it.",
    };
  }
  if (v >= T.vMid && l < T.lLow) {
    return {
      key: "volatile",
      word: "volatile ingestor",
      blurb:
        "Fast on single shots, resets between turns — memory doesn't persist into a compounding loop.",
    };
  }
  return {
    key: "transient",
    word: "transient",
    blurb:
      "Low on both axes — neither building state nor converting input to output efficiently.",
  };
}
