/**
 * @sigrank/cascade — Canonical cascade math for SigRank.
 *
 * Pure functions only. No filesystem, no API, no auth, no MCP transport.
 * This is the single source of truth for Υ Yield, SNR, Leverage, Velocity,
 * 10xDEV, and the 24-stage RS05 class taxonomy.
 *
 * Canonical reference: MO§ES Υ 18436.98 from (1251211, 11296121, 128196310, 2555179769).
 *
 * Consumers:
 *  - app/api/mcp/route.ts (remote HTTP MCP)
 *  - app/api/v1/benchmarks/ (public benchmark endpoints)
 *  - Eventually: sigrank-mcp (npm), bestuser-router-mcp (npm) via published package
 *
 * Null semantics: when a denominator is zero, the metric is null (not 0 or Infinity).
 * Warnings are returned alongside the result to explain why a metric is null.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Round to d decimal places. Returns null for non-finite inputs. */
export function round(n: number, d: number): number | null {
  if (!Number.isFinite(n)) return null;
  return Number(n.toFixed(d));
}

// ─── RS05 24-stage class thresholds ──────────────────────────────────────────
// Sorted descending by totalMin. classify() picks the first match.

export interface ClassThreshold {
  class: string;
  totalMin: number;
}

export const RS05_CLASS_THRESHOLDS: ClassThreshold[] = [
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

/** Classify an operator by total token volume into one of 24 RS05 stages. */
export function classify(totalTokens: number): string {
  if (!Number.isFinite(totalTokens)) return "UNCLASSED";
  for (const t of RS05_CLASS_THRESHOLDS) {
    if (totalTokens >= t.totalMin) return t.class;
  }
  return "IGNITER III";
}

// ─── Cascade result ──────────────────────────────────────────────────────────

export interface CascadeResult {
  pillars: { input: number; output: number; cacheCreate: number; cacheRead: number; total: number };
  /** Υ Yield = (cacheRead / input) × (output / input) = (cacheRead × output) / input². null if input=0. */
  yield: number | null;
  /** Signal-to-noise ratio = output / (input + output). null if input+output=0. */
  snr: number | null;
  /** Leverage = cacheRead / input. null if input=0. */
  leverage: number | null;
  /** Velocity = output / input. null if input=0. */
  velocity: number | null;
  /** 10xDEV = log10((o/i) × (cw/o) × (cr/cw)) = log10(cr/i). null if any pillar is 0. */
  dev10x: number | null;
  /** RS05 class from total token volume. */
  class: string;
  /** Explanatory warnings for null metrics. */
  warnings?: string[];
}

// ─── Canonical cascade function ──────────────────────────────────────────────

/**
 * Compute the full cascade from 4 token pillars.
 *
 * Canonical example:
 *   cascade(1251211, 11296121, 128196310, 2555179769) → Υ 18436.98
 *
 * Null semantics: when a denominator is zero, the metric is null (not 0 or
 * Infinity). Warnings explain why each null occurred.
 */
export function cascade(input: number, output: number, cacheCreate: number, cacheRead: number): CascadeResult {
  const i = Number(input), o = Number(output), cw = Number(cacheCreate), cr = Number(cacheRead);
  const total = i + o + cw + cr;
  const warnings: string[] = [];

  // SNR = output / (input + output)
  const snrDenom = i + o;
  const snr = snrDenom > 0 ? o / snrDenom : null;
  if (snr === null) warnings.push("snr_undefined: input+output=0");

  // Velocity = output / input
  const velocity = i > 0 ? o / i : null;
  if (velocity === null) warnings.push("velocity_undefined: input=0");

  // Leverage = cacheRead / input
  const leverage = i > 0 ? cr / i : null;
  if (leverage === null) warnings.push("leverage_undefined: input=0");

  // Υ Yield = leverage × velocity = (cacheRead × output) / input²
  const yieldRaw = leverage !== null && velocity !== null ? leverage * velocity : null;
  if (yieldRaw === null && !warnings.some((w) => w.startsWith("yield"))) {
    warnings.push("yield_undefined: requires input>0");
  }

  // 10xDEV = log10((o/i) × (cw/o) × (cr/cw)) = log10(cr/i) when all > 0
  let dev10x: number | null = null;
  if (i > 0 && o > 0 && cw > 0 && cr > 0) {
    dev10x = Math.log10((o / i) * (cw / o) * (cr / cw));
  } else {
    warnings.push("dev10x_undefined: requires all four pillars > 0");
  }

  const result: CascadeResult = {
    pillars: { input: i, output: o, cacheCreate: cw, cacheRead: cr, total },
    // Preserve null — do NOT convert to 0. round(null) returns null.
    yield: yieldRaw !== null ? round(yieldRaw, 2) : null,
    snr: snr !== null ? round(snr, 4) : null,
    leverage: leverage !== null ? round(leverage, 1) : null,
    velocity: velocity !== null ? round(velocity, 3) : null,
    dev10x: dev10x !== null ? round(dev10x, 2) : null,
    class: classify(total),
  };
  if (warnings.length > 0) result.warnings = warnings;
  return result;
}

// ─── Field statistics ────────────────────────────────────────────────────────

export interface FieldStats {
  count: number;
  median_yield: number;
  top_10_percent_yield: number;
  top_1_percent_yield: number;
  median_leverage: number;
  median_velocity: number;
  median_snr: number;
}

/**
 * Compute field statistics from an array of yields (and optionally leverage/velocity/snr).
 * Returns null if fewer than 5 data points — not enough for a meaningful benchmark.
 */
export function fieldStats(
  yields: number[],
  leverages?: number[],
  velocities?: number[],
  snrs?: number[],
): FieldStats | null {
  if (yields.length < 5) return null;

  const sorted = [...yields].sort((a, b) => a - b);
  const median = (arr: number[]) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };

  const top10Idx = Math.floor(sorted.length * 0.9);
  const top1Idx = Math.floor(sorted.length * 0.99);

  return {
    count: yields.length,
    median_yield: Number(median(sorted).toFixed(2)),
    top_10_percent_yield: Number((sorted[top10Idx] ?? sorted[sorted.length - 1]).toFixed(2)),
    top_1_percent_yield: Number((sorted[top1Idx] ?? sorted[sorted.length - 1]).toFixed(2)),
    median_leverage: leverages && leverages.length > 0 ? Number(median(leverages).toFixed(1)) : 0,
    median_velocity: velocities && velocities.length > 0 ? Number(median(velocities).toFixed(3)) : 0,
    median_snr: snrs && snrs.length > 0 ? Number(median(snrs).toFixed(4)) : 0,
  };
}

/**
 * Compute percentile of a value against a field.
 * Returns the percentage of field values below the given value.
 */
export function percentileOf(value: number, field: number[]): number {
  if (field.length === 0) return 0;
  let below = 0;
  for (const v of field) {
    if (v < value) below++;
  }
  return Number(((below / field.length) * 100).toFixed(1));
}

/**
 * Compute rank of a value against a field (1 = best).
 */
export function rankOf(value: number, field: number[]): number {
  return field.filter((v) => v > value).length + 1;
}

// ─── OperatorEvaluation (canonical normalized object) ────────────────────────

/**
 * Canonical OperatorEvaluation — one normalized object every interface returns.
 * CLI, HTTP MCP, BestUser, SigEconomy, profile pages, enterprise reports
 * all consume the same evaluation object.
 */
export interface OperatorEvaluation {
  operator: {
    codename: string | null;
    display_name: string | null;
  };
  pillars: {
    input: number;
    output: number;
    cache_read: number;
    cache_write: number;
  };
  metrics: {
    yield: number | null;
    snr: number | null;
    leverage: number | null;
    velocity: number | null;
    dev10x: number | null;
    class: string;
  };
  rank: {
    global_rank: number | null;
    percentile: number | null;
    total_operators: number | null;
  };
  benchmark: {
    median_yield: number | null;
    top_10_percent_yield: number | null;
    top_1_percent_yield: number | null;
    distance_from_median_pct: number | null;
    distance_from_top_10_pct: number | null;
  } | null;
  signature: {
    code: string;
    archetype: string;
    dominant_trait: string;
  };
  interpretation: string | null;
  provenance: {
    source: "pillars" | "codename" | "leaderboard";
    window: string | null;
    computed_at: string;
  };
  warnings?: string[];
}

/**
 * Generate a compact operating signature from cascade metrics.
 * Format: L{leverage}-V{velocity}-S{snr}-C{construction}
 */
export function operatorSignature(c: CascadeResult): { code: string; archetype: string; dominant_trait: string } {
  const lev = c.leverage ?? 0;
  const vel = c.velocity ?? 0;
  const snr = c.snr ?? 0;
  const construction = c.pillars.output > 0 ? c.pillars.cacheCreate / c.pillars.output : 0;

  const code = `L${lev.toFixed(0)}-V${vel.toFixed(2)}-S${snr.toFixed(2)}-C${construction.toFixed(2)}`;

  // Archetype detection
  let archetype: string;
  let dominant_trait: string;
  if (lev > 100 && vel < 5) {
    archetype = "CONTEXTUAL";
    dominant_trait = "high-context reuse";
  } else if (lev < 10 && vel > 5) {
    archetype = "GENERATOR";
    dominant_trait = "high-throughput generation";
  } else if (lev > 50 && vel > 5) {
    archetype = "BALANCED_ELITE";
    dominant_trait = "combined reuse + throughput";
  } else if (vel < 0.5) {
    archetype = "READER";
    dominant_trait = "input-heavy consumption";
  } else if (construction > 20) {
    archetype = "COMMITTER";
    dominant_trait = "high cache creation";
  } else {
    archetype = "STANDARD";
    dominant_trait = "moderate all-around";
  }

  return { code, archetype, dominant_trait };
}

/**
 * Build a full OperatorEvaluation from pillars, optionally with field data.
 */
export function evaluateOperator(
  pillars: { input: number; output: number; cache_read: number; cache_write: number },
  options?: {
    codename?: string;
    display_name?: string;
    fieldYields?: number[];
    fieldLeverages?: number[];
    fieldVelocities?: number[];
    fieldSnrs?: number[];
    rank?: number;
    window?: string;
  },
): OperatorEvaluation {
  const c = cascade(pillars.input, pillars.output, pillars.cache_write, pillars.cache_read);
  const sig = operatorSignature(c);

  let benchmark: OperatorEvaluation["benchmark"] = null;
  let rank: OperatorEvaluation["rank"] = {
    global_rank: options?.rank ?? null,
    percentile: null,
    total_operators: null,
  };

  if (options?.fieldYields && options.fieldYields.length >= 5) {
    const stats = fieldStats(options.fieldYields, options.fieldLeverages, options.fieldVelocities, options.fieldSnrs);
    if (stats) {
      const myYield = c.yield ?? 0;
      benchmark = {
        median_yield: stats.median_yield,
        top_10_percent_yield: stats.top_10_percent_yield,
        top_1_percent_yield: stats.top_1_percent_yield,
        distance_from_median_pct: stats.median_yield > 0 ? Number(((myYield / stats.median_yield - 1) * 100).toFixed(1)) : null,
        distance_from_top_10_pct: stats.top_10_percent_yield > 0 ? Number(((myYield / stats.top_10_percent_yield - 1) * 100).toFixed(1)) : null,
      };
      rank = {
        global_rank: rankOf(myYield, options.fieldYields),
        percentile: percentileOf(myYield, options.fieldYields),
        total_operators: options.fieldYields.length,
      };
    }
  }

  // Interpretation
  let interpretation: string | null = null;
  if (rank.percentile !== null) {
    if (rank.percentile >= 95) {
      interpretation = `Top ${Math.round(100 - rank.percentile)}% of the field — elite operator. ${sig.dominant_trait}.`;
    } else if (rank.percentile >= 75) {
      interpretation = `${rank.percentile}th percentile — above average. ${sig.dominant_trait}.`;
    } else if (rank.percentile >= 50) {
      interpretation = `${rank.percentile}th percentile — middle of the pack. ${sig.dominant_trait}.`;
    } else {
      interpretation = `${rank.percentile}th percentile — below median. ${sig.dominant_trait}.`;
    }
  }

  return {
    operator: {
      codename: options?.codename ?? null,
      display_name: options?.display_name ?? null,
    },
    pillars: {
      input: pillars.input,
      output: pillars.output,
      cache_read: pillars.cache_read,
      cache_write: pillars.cache_write,
    },
    metrics: {
      yield: c.yield,
      snr: c.snr,
      leverage: c.leverage,
      velocity: c.velocity,
      dev10x: c.dev10x,
      class: c.class,
    },
    rank,
    benchmark,
    signature: sig,
    interpretation,
    provenance: {
      source: options?.codename ? "codename" : "pillars",
      window: options?.window ?? null,
      computed_at: new Date().toISOString(),
    },
    warnings: c.warnings,
  };
}
