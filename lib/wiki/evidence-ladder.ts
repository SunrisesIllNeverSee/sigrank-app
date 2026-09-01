/**
 * lib/wiki/evidence-ladder.ts — the evidence maturity ladder for wiki entries.
 *
 * Every wiki entry on signalaf.com/wiki carries an evidence level that classifies
 * how mature the claim or definition is. This is the foundation of the evidence
 * layer: cold, factual, and honest about what is proven vs proposed.
 *
 * The ladder is monotonic: each level includes the evidence of all lower levels.
 * An entry can only be at one level at a time, and the level can only increase
 * (never decrease) as evidence accumulates — except by owner override with a
 * documented reason in the entry's lineage.
 *
 * Usage:
 *   import { EVIDENCE_LEVELS, evidenceLevelById } from "@/lib/wiki/evidence-ladder";
 *   const level = evidenceLevelById("tested"); // → EVIDENCE_LEVELS[2]
 */

/** The five evidence maturity levels, ordered from least to most mature. */
export interface EvidenceLevel {
  /** Numeric rank (0-4), used for comparison. */
  rank: number;
  /** Machine-readable identifier. */
  id: EvidenceLevelId;
  /** Short human-readable label. */
  label: string;
  /** One-line description of what this level means. */
  description: string;
  /** Tailwind color token for the badge. */
  color: string;
}

/** The canonical evidence level IDs. */
export type EvidenceLevelId =
  | "hypothesized"
  | "observed"
  | "tested"
  | "verified"
  | "canonical";

/** The five evidence maturity levels, in ascending order. */
export const EVIDENCE_LEVELS: EvidenceLevel[] = [
  {
    rank: 0,
    id: "hypothesized",
    label: "Hypothesized",
    description:
      "Proposed but not yet observed in data. A theoretical prediction awaiting evidence.",
    color: "text-text-muted",
  },
  {
    rank: 1,
    id: "observed",
    label: "Observed",
    description:
      "Seen in real operator data but not yet validated against a test suite. Empirical but not confirmed.",
    color: "text-text-secondary",
  },
  {
    rank: 2,
    id: "tested",
    label: "Tested",
    description:
      "Validated against the SigRank test suite. Reproducible from the four token pillars.",
    color: "text-text-accent",
  },
  {
    rank: 3,
    id: "verified",
    label: "Verified",
    description:
      "Independently reproduced across multiple operators, windows, and platforms. No known counterexamples.",
    color: "text-gold",
  },
  {
    rank: 4,
    id: "canonical",
    label: "Canonical",
    description:
      "Enshrined in the SigRank Standard. Immutable. Changing this requires a spec revision.",
    color: "text-gold",
  },
];

/** Look up an evidence level by its ID. Returns the hypothesized level if not found. */
export function evidenceLevelById(id: string): EvidenceLevel {
  return EVIDENCE_LEVELS.find((l) => l.id === id) ?? EVIDENCE_LEVELS[0];
}

/** Look up an evidence level by its numeric rank. */
export function evidenceLevelByRank(rank: number): EvidenceLevel {
  return EVIDENCE_LEVELS.find((l) => l.rank === rank) ?? EVIDENCE_LEVELS[0];
}

/**
 * Wiki entry categories — the top-level grouping for the evidence layer.
 * Each wiki entry belongs to exactly one category.
 */
export type WikiCategory =
  | "measurement"
  | "metrics"
  | "system-tests"
  | "validation"
  | "governance"
  | "commitment-theory";

export interface WikiCategoryDef {
  id: WikiCategory;
  label: string;
  description: string;
  /** The slug prefix for entries in this category, e.g. /wiki/measurement/ */
  slugPrefix: string;
}

/** The six wiki categories, in display order. */
export const WIKI_CATEGORIES: WikiCategoryDef[] = [
  {
    id: "measurement",
    label: "Measurement",
    description:
      "How token telemetry is collected, signed, and submitted. The four pillars and the submission pipeline.",
    slugPrefix: "/wiki/measurement/",
  },
  {
    id: "metrics",
    label: "Metrics",
    description:
      "The cascade metrics derived from the four pillars. Definitions, formulas, and evidence for each.",
    slugPrefix: "/wiki/metrics/",
  },
  {
    id: "system-tests",
    label: "System Tests",
    description:
      "The conformance suite, canonical values, and regression tests that guard the math.",
    slugPrefix: "/wiki/system-tests/",
  },
  {
    id: "validation",
    label: "Validation",
    description:
      "How submitted snapshots are validated. Signing, provenance, plausibility, and anti-gaming.",
    slugPrefix: "/wiki/validation/",
  },
  {
    id: "governance",
    label: "Governance",
    description:
      "The MOSES governance framework and how it applies to SigRank. Authority, boundaries, and ownership.",
    slugPrefix: "/wiki/governance/",
  },
  {
    id: "commitment-theory",
    label: "Commitment Theory",
    description:
      "The Conservation Law of Commitment and its relationship to the token cascade.",
    slugPrefix: "/wiki/commitment-theory/",
  },
];

/** Look up a wiki category by its ID. */
export function wikiCategoryById(id: string): WikiCategoryDef | undefined {
  return WIKI_CATEGORIES.find((c) => c.id === id);
}
