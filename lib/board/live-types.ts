/**
 * lib/board/live-types.ts — the typed contract between the live-board
 * projection (lib/board/live-projection.ts) and the frozen reference
 * workspace (components/live/*).
 *
 * Reference Implementation v1 (live-board-prototype, tag reference-v1) is the
 * visual/interaction contract. `LiveOperator` deliberately keeps the
 * prototype's compact key names so the workspace logic ports verbatim
 * (numvOf compact-number parsing, RMAX field normalization, opRadar).
 *
 * INVARIANTS (owner 2026-10-05, PHASE2B_IMPLEMENTATION_PLAN.md):
 *   - Live population ≠ reference/seed population — denominators never conflate.
 *   - All aggregates (fieldStats, movers, hall, fieldMax) derive from the FULL
 *     ranking scope for the window — never from a paginated subset.
 *   - The live denominator is the same-scope ranked count — never a fixed
 *     constant (e.g. never hard-code 1,660).
 *   - Non-compounding rows render "—" via their canonical metrics; do not
 *     synthesize zeros.
 *   - Canonical metrics only (Υ/SNR/Velocity/Leverage/10xDEV/ScaleV/Efficiency/
 *     OpRatio/Cost/raw pillars/movement/exact throughput). Legacy word-system
 *     serializer fields are NOT bound here.
 */

/** Compact metric cell as rendered by the reference workspace. */
export interface LiveOperator {
  /** Codename verbatim — also the share slug (slug === codename). */
  codename: string;
  /** Share slug — identical to codename (API codename verbatim). */
  slug: string;
  /** Resolved display handle (operatorDisplayName), e.g. "@name". */
  handle: string;
  /** Display class label, e.g. "POWER II". */
  klass: string;
  /** Canonical build-archetype key (build-archetypes.ts classifier). */
  archetype: string;
  /** Claimed profile. */
  claimed: boolean;
  /** Non-compounding row — canonical metrics render "—". */
  nc: boolean;
  /** Workflow mode tag when resolved ("hitl" | "agentic"), else null. */
  wf: "hitl" | "agentic" | null;
  /** Total tokens observed, compact-formatted ("34.2B"). */
  total: string;
  /** Υ Yield, compact-formatted. */
  yield: string;
  /** Signal-to-noise ratio [0,1]. */
  snr: number;
  /** Velocity (output / input). */
  vel: number;
  /** Leverage (cache_read / input), formatted "132,202.1×". */
  lev: string;
  /** 10xDEV = log10(Leverage). */
  dev: number;
  /** Percentile [0,100] within the live field for this scope. */
  pct: number;
  /** Scale V. */
  scalev: number;
  /** Rank movement over trailing 24h (signed, may be null). */
  mv24: number | null;
  /** Rank movement over trailing 7d — the locked momentum semantic. */
  mv7: number | null;
  /** Exact calendar prompt throughput rate, e.g. "9.4M/d" (null when absent). */
  ptpd: string | null;
  /** Exact calendar output throughput rate (null when absent). */
  otpd: string | null;
  /** Operating ratio "132202:1" (null when absent). */
  opratio: string | null;
  /** Raw pillars, compact-formatted. */
  raw: { i: string; o: string; cr: string; cw: string };
  /** Yield history series (most recent points, oldest → newest). May be empty. */
  trend: number[];
  /** Record/hall entries for this operator. EMPTY in the initial SSR payload —
   *  populated by lazy drill-down enrichment (WS-4: /operators/{codename}/records
   *  fetched on selection, never bulk-loaded into the board state). */
  recs: { metric: string; rank: number; value: string; window: string }[];
  /** Drill-down sub-line (class/archetype/records context). */
  sub: string;
  /** Verification status verbatim ("verified" | "unverified" | …). */
  verif: string;
  /** Supporter tier ("free" | tier key). */
  supporter: string;
  /** Human delta copy, e.g. "+8 spots vs 7d" (derived from mv7). */
  delta: string;
  /** Last snapshot date, short display form. */
  last: string;
  /** Account age in days. */
  age: number;
  /** Lifetime turns/messages count. */
  msgs: number;
  /** Cost per million tokens, display ("$0.42"). */
  cost: string;
  /** Efficiency display ("33.8K" — tokens per dollar or canonical eff). */
  eff: string;
  /** Primary platform key ("claude" | "codex" | "multi" | …). */
  platform: string;
  /** Server-projected raw numerics for math paths (sort, radar, field
   *  normalization). The compact display strings above remain the rendered
   *  values (reference-v1 renders them verbatim and re-parses via numvOf);
   *  `num` exists so production math never needs to re-parse a formatted
   *  string when an exact value is available. */
  num: {
    yield: number;
    lev: number;
    total: number;
    cost: number;
  };
}

/** Field-strip stat cell (FIELD_STATS equivalent). */
export interface FieldStat {
  /** Stat key, e.g. "total_operators", "median_yield". */
  field: string;
  /** Display value. */
  value: string;
}

/** Movers-rail entry — derived from the FULL scope's movement_7d. */
export interface MoverEntry {
  codename: string;
  slug: string;
  handle: string;
  klass: string;
  mv7: number;
  delta: string;
}

/** Hall-of-Signal teaser entry. */
export interface HallEntry {
  /** Display record line, e.g. "TransVaultOrigin — 0.9694". */
  value: string;
  codename?: string;
  metric?: string;
}

/** Featured-operator summary (rank-1 context block). */
export interface FeaturedOperator {
  name: string;
  handle: string;
  rank: number;
  klass: string;
  archetype: string;
  yield: string;
  delta: string;
  blurb: string;
}

/** Full-scope maxima for radar normalization (client RMAX equivalent). */
export interface FieldMaxima {
  yield: number;
  lev: number;
  vel: number;
  snr: number;
  dev: number;
  scalev: number;
}

/** Live population descriptor — the same-scope ranked denominator. */
export interface LivePopulation {
  /** Ranked operators in this scope — the live denominator. */
  count: number;
  /** Display tag, e.g. "LIVE FIELD · ALL-TIME". */
  tag: string;
}

/** Provenance block for the workspace header/footer. */
export interface LiveMeta {
  window: string;
  generatedAt: string;
  ruleset: string | null;
  source: string;
}

/**
 * The initial SSR payload for /board/[window]. `operators` carries the first
 * page; all aggregate members are computed from the FULL scope server-side.
 */
export interface LiveBoardInitialState {
  meta: LiveMeta;
  operators: LiveOperator[];
  population: LivePopulation;
  fieldStats: FieldStat[];
  movers: MoverEntry[];
  hall: HallEntry[];
  featured: FeaturedOperator | null;
  /** Full-scope maxima — radar/rail normalization must use these, not the
   *  maxima of `operators` (which may be a paginated subset). */
  fieldMax: FieldMaxima;
  /** Total ranked rows available for the client to page through (may exceed
   *  operators.length when pagination applies). */
  totalOperators: number;
}
