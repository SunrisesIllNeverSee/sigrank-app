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
 * The seven levels (LEVEL 0–LEVEL 6) follow the maturity ladder specified in
 * the ecosystem-split build-out prompt:
 *   LEVEL 0 — Concept
 *   LEVEL 1 — Operational definition
 *   LEVEL 2 — Demonstration
 *   LEVEL 3 — Repeated experiment
 *   LEVEL 4 — Cross-model replication
 *   LEVEL 5 — Controlled validation
 *   LEVEL 6 — Production evidence
 *
 * Usage:
 *   import { EVIDENCE_LEVELS, evidenceLevelById } from "@/lib/wiki/evidence-ladder";
 *   const level = evidenceLevelById("concept"); // → EVIDENCE_LEVELS[0]
 */

/** A single evidence maturity level on the 7-rung ladder. */
export interface EvidenceLevel {
  /** Numeric rank (0-6), used for comparison. */
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

/** The canonical evidence level IDs (LEVEL 0–LEVEL 6). */
export type EvidenceLevelId =
  | "concept"
  | "operational-definition"
  | "demonstration"
  | "repeated-experiment"
  | "cross-model-replication"
  | "controlled-validation"
  | "production-evidence";

/** The seven evidence maturity levels, in ascending order. */
export const EVIDENCE_LEVELS: EvidenceLevel[] = [
  {
    rank: 0,
    id: "concept",
    label: "Concept",
    description:
      "LEVEL 0 — Proposed concept. A theoretical prediction or idea awaiting operational definition and evidence.",
    color: "text-text-muted",
  },
  {
    rank: 1,
    id: "operational-definition",
    label: "Operational definition",
    description:
      "LEVEL 1 — Defined operationally. The concept has an exact operational meaning: what is observed, what is calculated, what would falsify it. Not yet demonstrated.",
    color: "text-text-secondary",
  },
  {
    rank: 2,
    id: "demonstration",
    label: "Demonstration",
    description:
      "LEVEL 2 — Demonstrated. Shown in at least one concrete instance. Empirical but not yet repeated or validated.",
    color: "text-text-accent",
  },
  {
    rank: 3,
    id: "repeated-experiment",
    label: "Repeated experiment",
    description:
      "LEVEL 3 — Repeated. The demonstration has been reproduced across multiple runs or windows. Reproducible from the four token pillars.",
    color: "text-text-accent",
  },
  {
    rank: 4,
    id: "cross-model-replication",
    label: "Cross-model replication",
    description:
      "LEVEL 4 — Replicated across models. The result holds across multiple AI systems, not just a single model or framework.",
    color: "text-gold",
  },
  {
    rank: 5,
    id: "controlled-validation",
    label: "Controlled validation",
    description:
      "LEVEL 5 — Validated under control. Tested against controlled conditions with known confounds addressed. No known counterexamples under the controlled setup.",
    color: "text-gold",
  },
  {
    rank: 6,
    id: "production-evidence",
    label: "Production evidence",
    description:
      "LEVEL 6 — Production evidence. Enshrined in the SigRank Standard / MO§ES™ production canon. Immutable. Changing this requires a spec revision.",
    color: "text-gold",
  },
];

/** Look up an evidence level by its ID. Returns the LEVEL 0 (concept) level if not found. */
export function evidenceLevelById(id: string): EvidenceLevel {
  return EVIDENCE_LEVELS.find((l) => l.id === id) ?? EVIDENCE_LEVELS[0];
}

/** Look up an evidence level by its numeric rank (0-6). */
export function evidenceLevelByRank(rank: number): EvidenceLevel {
  return EVIDENCE_LEVELS.find((l) => l.rank === rank) ?? EVIDENCE_LEVELS[0];
}

/**
 * Wiki entry categories — the top-level grouping for the evidence layer.
 * Each wiki entry belongs to exactly one category.
 *
 * Note: the category IDs use display-friendly slugs (system-tests,
 * commitment-theory) but the actual URL paths use shorter prefixes
 * (tests, ct) — see slugPrefix for the correct URL prefix per category.
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
  /** The URL prefix for entries in this category, e.g. /wiki/measurement/ */
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
    slugPrefix: "/wiki/tests/",
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
      "The MO§ES governance framework and how it applies to SigRank. Authority, boundaries, and ownership.",
    slugPrefix: "/wiki/governance/",
  },
  {
    id: "commitment-theory",
    label: "Commitment Theory",
    description:
      "The Conservation Law of Commitment and its relationship to the token cascade.",
    slugPrefix: "/wiki/ct/",
  },
];

/** Look up a wiki category by its ID. */
export function wikiCategoryById(id: string): WikiCategoryDef | undefined {
  return WIKI_CATEGORIES.find((c) => c.id === id);
}

/**
 * The anchor ID used on the wiki hub page for each evidence-layer category.
 *
 * Uses an `evidence-` prefix to avoid collisions with the existing console
 * group IDs on /wiki (e.g. the console "metrics" group has id="metrics";
 * the evidence-layer Metrics category uses id="evidence-metrics").
 *
 * WikiCategoryIndex cards, WikiEntry breadcrumbs, and the hub page section
 * anchors all use this function so they stay in sync.
 */
export function wikiCategoryHubAnchor(categoryId: string): string {
  return `evidence-${categoryId}`;
}

/** A single wiki entry within a category, for the hub page listing. */
export interface WikiCategoryEntry {
  /** The page slug (full path, e.g. "/wiki/measurement/operator"). */
  slug: string;
  /** Display label for the entry. */
  label: string;
}

/** The pages in each evidence-layer category, in display order. */
export const WIKI_CATEGORY_PAGES: Record<WikiCategory, WikiCategoryEntry[]> = {
  measurement: [
    { slug: "/wiki/measurement/operator", label: "Operator" },
    { slug: "/wiki/measurement/system", label: "System" },
    { slug: "/wiki/measurement/operator-system-dyad", label: "Operator–System Dyad" },
    { slug: "/wiki/measurement/composition", label: "Composition" },
    { slug: "/wiki/measurement/trajectory", label: "Trajectory" },
    { slug: "/wiki/measurement/cohort", label: "Cohort" },
    { slug: "/wiki/measurement/reference-field", label: "Reference Field" },
  ],
  metrics: [
    { slug: "/wiki/metrics/yield", label: "Yield (Υ)" },
    { slug: "/wiki/metrics/leverage", label: "Leverage" },
    { slug: "/wiki/metrics/velocity", label: "Velocity" },
    { slug: "/wiki/metrics/snr", label: "Signal-to-Noise Ratio (SNR)" },
    { slug: "/wiki/metrics/output-flow-share", label: "Output Flow Share" },
    { slug: "/wiki/metrics/context-activity-ratio", label: "Context Activity Ratio" },
    { slug: "/wiki/metrics/active-output-share", label: "Active Output Share" },
  ],
  "system-tests": [
    { slug: "/wiki/tests/lineage", label: "Lineage Test" },
    { slug: "/wiki/tests/compression", label: "Compression Test" },
    { slug: "/wiki/tests/purpose-coherence", label: "Purpose Coherence Test" },
    { slug: "/wiki/tests/modularity", label: "Modularity Test" },
    { slug: "/wiki/tests/verifiability", label: "Verifiability Test" },
    { slug: "/wiki/tests/recursive-self-evaluation", label: "Recursive Self-Evaluation Test" },
  ],
  validation: [
    { slug: "/wiki/validation/test-retest", label: "Test–Retest" },
    { slug: "/wiki/validation/operator-separability", label: "Operator Separability" },
    { slug: "/wiki/validation/operator-system-interaction", label: "Operator–System Interaction" },
    { slug: "/wiki/validation/transportability", label: "Transportability" },
    { slug: "/wiki/validation/task-conditioning", label: "Task Conditioning" },
    { slug: "/wiki/validation/convergent-validity", label: "Convergent Validity" },
  ],
  governance: [
    { slug: "/wiki/governance/alignment-vs-governance", label: "Alignment vs Governance" },
    { slug: "/wiki/governance/persistent-governing-state", label: "Persistent Governing State" },
    { slug: "/wiki/governance/execution-layer-governance", label: "Execution-Layer Governance" },
    { slug: "/wiki/governance/lineage-preservation", label: "Lineage Preservation" },
    { slug: "/wiki/governance/abstention", label: "Abstention" },
    { slug: "/wiki/governance/re-grounding", label: "Re-Grounding" },
  ],
  "commitment-theory": [
    { slug: "/wiki/ct/commitment", label: "Commitment" },
    { slug: "/wiki/ct/conservation", label: "Conservation Law of Commitment" },
    { slug: "/wiki/ct/transformation", label: "Transformation" },
    { slug: "/wiki/ct/resonance", label: "Resonance" },
    { slug: "/wiki/ct/semantic-entropy", label: "Semantic Entropy" },
    { slug: "/wiki/ct/blackhole-law", label: "Blackhole Law" },
  ],
};
