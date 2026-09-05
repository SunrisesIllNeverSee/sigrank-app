/**
 * lib/analytics/build-archetypes.ts — 10 build archetype classifier.
 *
 * A composition classifier: every operator lands in exactly one state that
 * describes their operating shape — not their rank. The system has three
 * branches plus one convergence state:
 *
 *   Reuse depth:     INPUT-BOUND → PRIMING → CONTEXTUAL → DEEP READER → ARCHIVIST
 *   Construction:    BUILDER → RECURSIVE → AMPLIFIER
 *   Generation:       KINETIC
 *   Convergence:      CONVERGENT
 *
 * Classification precedence (first match wins):
 *   1. CONVERGENT   — P80+ on all 3 axes (leverage + velocity + construction)
 *   2. KINETIC      — velocity >= 0.80
 *   3. Construction  — construction >= 0.02 (BUILDER / RECURSIVE / AMPLIFIER)
 *   4. Reuse depth   — else (INPUT-BOUND / PRIMING / CONTEXTUAL / DEEP READER / ARCHIVIST)
 *
 * The three derived dimensions:
 *   leverage     = cache_read / input        (how much you reuse vs fresh input)
 *   velocity     = output / input            (how much you generate vs take in)
 *   construction = cache_write / cache_read  (how much new context you build per read)
 *
 * CONVERGENT pulls out operators who are P80+ on ALL THREE dimensions — the
 * rare composition where all three operating axes are elevated without the
 * usual tradeoffs.
 *
 * TODO(OPERATOR_OVERRIDE_REQUIRED): the P80 thresholds below are calibrated
 * from the 1,586-operator OCM cut of field-analysis.json. They should be
 * surfaced from the ruleset (RS.xx) once finalized.
 */

export type BuildArchetypeKey =
  | "convergent"
  | "kinetic"
  | "input-bound"
  | "priming"
  | "contextual"
  | "deep-reader"
  | "archivist"
  | "builder"
  | "recursive"
  | "amplifier";

export type BuildArchetypeFamily =
  | "convergence"
  | "generation"
  | "reuse"
  | "construction";

export interface BuildArchetype {
  key: BuildArchetypeKey;
  name: string;
  /** Short label for chips/badges. */
  word: string;
  /** Family: convergence / generation / reuse / construction. */
  family: BuildArchetypeFamily;
  /** Human-readable family label for UI subtitles. */
  familyLabel: string;
  /** One terse sentence describing the operating composition. */
  blurb: string;
  /** Which dimension primarily defines this type. */
  definedBy: string;
}

export interface BuildArchetypeInput {
  /** cache_read / input */
  leverage: number;
  /** output / input */
  velocity: number;
  /** cache_write / cache_read */
  construction: number;
}

// P80 thresholds calibrated from OCM cut (1,586 operators).
// lev P80 = 74.6, vel P80 = 0.340, constr P80 = 0.0431
const CONVERGENT_T = { levP80: 74.6, velP80: 0.34, constrP80: 0.0431 };

const VEL_KINETIC = 0.8; // velocity threshold for KINETIC
const LEV_INPUT_BOUND = 5; // leverage threshold for INPUT-BOUND / PRIMING
const LEV_PRIMING = 10; // leverage threshold for PRIMING / CONTEXTUAL
const LEV_CONTEXTUAL = 15; // leverage threshold for CONTEXTUAL / DEEP READER
const LEV_DEEP_READER = 23; // leverage threshold for DEEP READER / ARCHIVIST
const CONSTR_ACTIVE = 0.02; // construction threshold for active cache writing
const LEV_BUILDER = 30; // leverage threshold for BUILDER / RECURSIVE
const LEV_RECURSIVE = 50; // leverage threshold for RECURSIVE / AMPLIFIER

const ARCHETYPES: Record<BuildArchetypeKey, BuildArchetype> = {
  convergent: {
    key: "convergent",
    name: "CONVERGENT",
    word: "convergent",
    family: "convergence",
    familyLabel: "Convergence",
    blurb:
      "Deep reuse, active construction, and high generation rise together. A rare composition where all three operating axes are elevated without the usual tradeoffs.",
    definedBy: "P80 on all 3 axes (leverage + velocity + construction)",
  },
  kinetic: {
    key: "kinetic",
    name: "KINETIC",
    word: "kinetic",
    family: "generation",
    familyLabel: "Generation",
    blurb:
      "Generation has broken out. Output approaches or exceeds fresh input, making transmission the defining feature of the composition.",
    definedBy: "velocity >= 0.80",
  },
  "input-bound": {
    key: "input-bound",
    name: "INPUT-BOUND",
    word: "input-bound",
    family: "reuse",
    familyLabel: "Reuse Depth",
    blurb:
      "Fresh input still carries most of the workload. Little prior context is returning, so each cycle depends heavily on new input.",
    definedBy: "leverage < 5",
  },
  priming: {
    key: "priming",
    name: "PRIMING",
    word: "priming",
    family: "reuse",
    familyLabel: "Reuse Depth",
    blurb:
      "Reuse is beginning to form. Prior context is returning, but the system has not yet developed deep leverage.",
    definedBy: "leverage 5–10",
  },
  contextual: {
    key: "contextual",
    name: "CONTEXTUAL",
    word: "contextual",
    family: "reuse",
    familyLabel: "Reuse Depth",
    blurb:
      "Retained context is now materially supporting the workflow. Reuse is established, while active construction remains limited.",
    definedBy: "leverage 10–15, passive",
  },
  "deep-reader": {
    key: "deep-reader",
    name: "DEEP READER",
    word: "deep reader",
    family: "reuse",
    familyLabel: "Reuse Depth",
    blurb:
      "Strong accumulated context is carrying the workflow. The operator draws deeply from retained context while creating relatively little new context.",
    definedBy: "leverage 15–23, passive",
  },
  archivist: {
    key: "archivist",
    name: "ARCHIVIST",
    word: "archivist",
    family: "reuse",
    familyLabel: "Reuse Depth",
    blurb:
      "Extreme reuse of accumulated context. A deep context library carries the system while new construction remains limited.",
    definedBy: "leverage >= 23, passive",
  },
  builder: {
    key: "builder",
    name: "BUILDER",
    word: "builder",
    family: "construction",
    familyLabel: "Active Construction",
    blurb:
      "Active context construction has begun. The system is creating material for future reuse while leverage is still developing.",
    definedBy: "construction >= 0.02, leverage < 30",
  },
  recursive: {
    key: "recursive",
    name: "RECURSIVE",
    word: "recursive",
    family: "construction",
    familyLabel: "Active Construction",
    blurb:
      "New context is being built on top of an already substantial reusable base. Construction and reuse are now feeding the same operating loop.",
    definedBy: "construction >= 0.02, leverage 30–50",
  },
  amplifier: {
    key: "amplifier",
    name: "AMPLIFIER",
    word: "amplifier",
    family: "construction",
    familyLabel: "Active Construction",
    blurb:
      "Deep reuse and active construction are operating together at scale. Existing context produces new work that expands the context available for future cycles.",
    definedBy: "construction >= 0.02, leverage >= 50",
  },
};

/** Classify an operator's cascade into one of 10 build archetypes.
 *  Precedence: CONVERGENT > KINETIC > construction branch > reuse branch. */
export function buildArchetypeOf(m: BuildArchetypeInput): BuildArchetype {
  const lev = m.leverage ?? 0;
  const vel = m.velocity ?? 0;
  const constr = m.construction ?? 0;

  // 1. CONVERGENT — all three axes elevated (P80+)
  if (
    lev > CONVERGENT_T.levP80 &&
    vel > CONVERGENT_T.velP80 &&
    constr > CONVERGENT_T.constrP80
  ) {
    return ARCHETYPES.convergent;
  }

  // 2. KINETIC — generation breakout
  if (vel >= VEL_KINETIC) {
    return ARCHETYPES.kinetic;
  }

  // 3. Construction branch — active context construction
  if (constr >= CONSTR_ACTIVE) {
    if (lev >= LEV_RECURSIVE) {
      return ARCHETYPES.amplifier;
    }
    if (lev >= LEV_BUILDER) {
      return ARCHETYPES.recursive;
    }
    return ARCHETYPES.builder;
  }

  // 4. Reuse depth branch — passive (construction < 0.02)
  if (lev >= LEV_DEEP_READER) {
    return ARCHETYPES.archivist;
  }
  if (lev >= LEV_CONTEXTUAL) {
    return ARCHETYPES["deep-reader"];
  }
  if (lev >= LEV_PRIMING) {
    return ARCHETYPES.contextual;
  }
  if (lev >= LEV_INPUT_BOUND) {
    return ARCHETYPES.priming;
  }
  return ARCHETYPES["input-bound"];
}

/** All 10 build archetypes in classification order. */
export const BUILD_ARCHETYPES: BuildArchetype[] = [
  ARCHETYPES.convergent,
  ARCHETYPES.kinetic,
  ARCHETYPES["input-bound"],
  ARCHETYPES.priming,
  ARCHETYPES.contextual,
  ARCHETYPES["deep-reader"],
  ARCHETYPES.archivist,
  ARCHETYPES.builder,
  ARCHETYPES.recursive,
  ARCHETYPES.amplifier,
];

/** Map a build archetype key to its display name. */
export function buildArchetypeName(key: BuildArchetypeKey): string {
  return ARCHETYPES[key]?.name ?? "UNKNOWN";
}

/** Map a build archetype key to its short word (for chips/badges). */
export function buildArchetypeWord(key: BuildArchetypeKey): string {
  return ARCHETYPES[key]?.word ?? "unknown";
}

/** Map a build archetype key to its family. */
export function buildArchetypeFamily(key: BuildArchetypeKey): BuildArchetypeFamily {
  return ARCHETYPES[key]?.family ?? "reuse";
}

/** Map a build archetype key to its family label (for UI subtitles). */
export function buildArchetypeFamilyLabel(key: BuildArchetypeKey): string {
  return ARCHETYPES[key]?.familyLabel ?? "Reuse Depth";
}
