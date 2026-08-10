/**
 * lib/analytics/build-archetypes.ts — 10 build archetype classifier.
 *
 * Replaces the 8 K-Means population clusters and the 5-regime classifier
 * (compare-narrate.ts) with a single deterministic 10-type system where each
 * type is defined by a different primary dimension of the token cascade.
 *
 * Classification order (priority — first match wins):
 *   1. CONVERGENT       — multi-axis elite (P80 on all 3: leverage + velocity + construction)
 *   2. KINETIC PRODUCER  — output (velocity >= 0.8)
 *   3. RAW INJECTOR      — input (leverage < 5)
 *   4. CACHE WARMING     — input (leverage 5-10)
 *   5. SHALLOW READER    — cache_read (leverage 10-15, passive)
 *   6. READER            — cache_read (leverage 15-23, passive)
 *   7. ARCHIVAL          — cache_read (leverage 23+, passive, deep reuse)
 *   8. BUILDER           — cache_write (construction >= 0.02, leverage < 30)
 *   9. RECURSIVE MOMENTUM — compound (construction >= 0.02, leverage 30-50)
 *  10. COMPOUND AMPLIFIER — compound (construction >= 0.02, leverage 50+)
 *
 * The three derived dimensions:
 *   leverage     = cache_read / input        (how much you reuse vs fresh input)
 *   velocity     = output / input            (how much you generate vs take in)
 *   construction = cache_write / cache_read  (how much new context you build per read)
 *
 * CONVERGENT pulls out operators who are P80+ on ALL THREE dimensions — the
 * multi-axis elite who don't fit cleanly into a single-axis type.
 *
 * TODO(OPERATOR_OVERRIDE_REQUIRED): the P80 thresholds below are calibrated
 * from the 1,586-operator HCM cut of field-analysis.json. They should be
 * surfaced from the ruleset (RS.xx) once finalized.
 */

export type BuildArchetypeKey =
  | "convergent"
  | "kinetic-producer"
  | "raw-injector"
  | "cache-warming"
  | "shallow-reader"
  | "reader"
  | "archival"
  | "builder"
  | "recursive-momentum"
  | "compound-amplifier";

export interface BuildArchetype {
  key: BuildArchetypeKey;
  name: string;
  /** Short label for chips/badges. */
  word: string;
  /** One terse sentence describing the operating pattern. */
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

// P80 thresholds calibrated from HCM cut (1,586 operators).
// lev P80 = 74.6, vel P80 = 0.340, constr P80 = 0.0431
const CONVERGENT_T = { levP80: 74.6, velP80: 0.34, constrP80: 0.0431 };

const VEL_OUTPUT = 0.8; // velocity threshold for KINETIC PRODUCER
const LEV_INPUT_LOW = 5; // leverage threshold for RAW INJECTOR / CACHE WARMING
const LEV_INPUT_HIGH = 10; // leverage threshold for CACHE WARMING / SHALLOW READER
const LEV_READ_LOW = 15; // leverage threshold for SHALLOW READER / READER
const LEV_READ_HIGH = 23; // leverage threshold for READER / ARCHIVAL
const CONSTR_ACTIVE = 0.02; // construction threshold for active cache writing
const LEV_COMPOUND_LOW = 30; // leverage threshold for BUILDER / RECURSIVE MOMENTUM
const LEV_COMPOUND_HIGH = 50; // leverage threshold for RECURSIVE MOMENTUM / COMPOUND AMPLIFIER

const ARCHETYPES: Record<BuildArchetypeKey, BuildArchetype> = {
  convergent: {
    key: "convergent",
    name: "CONVERGENT",
    word: "convergent",
    blurb:
      "Elite on all three axes — deep reuse, active construction, and high generation. The rare operator who breaks the tradeoffs.",
    definedBy: "multi-axis (P80 on leverage + velocity + construction)",
  },
  "kinetic-producer": {
    key: "kinetic-producer",
    name: "KINETIC PRODUCER",
    word: "kinetic producer",
    blurb:
      "Output exceeds input — generating more than consumed. High velocity, the engine of the field.",
    definedBy: "output (velocity >= 0.8)",
  },
  "raw-injector": {
    key: "raw-injector",
    name: "RAW INJECTOR",
    word: "raw injector",
    blurb:
      "High input proportion, barely any cache reuse. Tokens going in, not much coming back.",
    definedBy: "input (leverage < 5)",
  },
  "cache-warming": {
    key: "cache-warming",
    name: "CACHE WARMING",
    word: "cache warming",
    blurb:
      "Reuse is forming but shallow. Cache is starting to build, still finding its rhythm.",
    definedBy: "input (leverage 5-10)",
  },
  "shallow-reader": {
    key: "shallow-reader",
    name: "SHALLOW READER",
    word: "shallow reader",
    blurb:
      "Moderate cache reads, passive consumption. Reading context but not building new context.",
    definedBy: "cache_read (leverage 10-15, passive)",
  },
  reader: {
    key: "reader",
    name: "READER",
    word: "reader",
    blurb:
      "Solid cache reuse, still passive. Holds context well, executes little with it.",
    definedBy: "cache_read (leverage 15-23, passive)",
  },
  archival: {
    key: "archival",
    name: "ARCHIVAL",
    word: "archival",
    blurb:
      "Extreme cache reuse — near-total reads, deep context library. Holds everything, generates little.",
    definedBy: "cache_read (leverage 23+, passive)",
  },
  builder: {
    key: "builder",
    name: "BUILDER",
    word: "builder",
    blurb:
      "Actively writing cache, building new context. Construction is happening, reuse is moderate.",
    definedBy: "cache_write (construction >= 0.02, leverage < 30)",
  },
  "recursive-momentum": {
    key: "recursive-momentum",
    name: "RECURSIVE MOMENTUM",
    word: "recursive momentum",
    blurb:
      "Building on built — the feedback loop. Deep reuse plus active construction, compounding forward.",
    definedBy: "compound (construction >= 0.02, leverage 30-50)",
  },
  "compound-amplifier": {
    key: "compound-amplifier",
    name: "COMPOUND AMPLIFIER",
    word: "compound amplifier",
    blurb:
      "The loop at scale — massive context library, still growing. Returns amplifying on returns.",
    definedBy: "compound (construction >= 0.02, leverage 50+)",
  },
};

/** Classify an operator's cascade into one of 10 build archetypes. */
export function buildArchetypeOf(m: BuildArchetypeInput): BuildArchetype {
  const lev = m.leverage ?? 0;
  const vel = m.velocity ?? 0;
  const constr = m.construction ?? 0;

  // 1. CONVERGENT — multi-axis elite (P80 on all 3)
  if (
    lev > CONVERGENT_T.levP80 &&
    vel > CONVERGENT_T.velP80 &&
    constr > CONVERGENT_T.constrP80
  ) {
    return ARCHETYPES.convergent;
  }

  // 2. KINETIC PRODUCER — output (vel >= 0.8)
  if (vel >= VEL_OUTPUT) {
    return ARCHETYPES["kinetic-producer"];
  }

  // 3-4. Input types
  if (lev < LEV_INPUT_LOW) {
    return ARCHETYPES["raw-injector"];
  }
  if (lev < LEV_INPUT_HIGH) {
    return ARCHETYPES["cache-warming"];
  }

  // 5-7. Cache read types (passive, low construction)
  if (constr < CONSTR_ACTIVE) {
    if (lev < LEV_READ_LOW) {
      return ARCHETYPES["shallow-reader"];
    }
    if (lev < LEV_READ_HIGH) {
      return ARCHETYPES.reader;
    }
    return ARCHETYPES.archival;
  }

  // 8. Builder (active construction, moderate reuse)
  if (lev < LEV_COMPOUND_LOW) {
    return ARCHETYPES.builder;
  }

  // 9-10. Compounder (active construction, deep reuse)
  if (lev < LEV_COMPOUND_HIGH) {
    return ARCHETYPES["recursive-momentum"];
  }
  return ARCHETYPES["compound-amplifier"];
}

/** All 10 build archetypes in classification order. */
export const BUILD_ARCHETYPES: BuildArchetype[] = [
  ARCHETYPES.convergent,
  ARCHETYPES["kinetic-producer"],
  ARCHETYPES["raw-injector"],
  ARCHETYPES["cache-warming"],
  ARCHETYPES["shallow-reader"],
  ARCHETYPES.reader,
  ARCHETYPES.archival,
  ARCHETYPES.builder,
  ARCHETYPES["recursive-momentum"],
  ARCHETYPES["compound-amplifier"],
];

/** Map a build archetype key to its display name. */
export function buildArchetypeName(key: BuildArchetypeKey): string {
  return ARCHETYPES[key]?.name ?? "UNKNOWN";
}

/** Map a build archetype key to its short word (for chips/badges). */
export function buildArchetypeWord(key: BuildArchetypeKey): string {
  return ARCHETYPES[key]?.word ?? "unknown";
}
