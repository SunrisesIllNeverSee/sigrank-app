/**
 * lib/compare/radar-math.ts — pure helpers behind the /compare radars.
 *
 * Percentiles, cascade stages, token mix and log/sqrt radial scaling. No React,
 * no I/O. Everything here describes token-flow relationships between public
 * fields; none of it is a quality, skill or effort score.
 *
 * Missing data is `null`, never 0: a pillar or metric an operator lacks is
 * excluded from the field and drawn as missing.
 */
import type { LeaderboardRow } from "@/lib/board/types";

const fin = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

/** One operator's public numbers, flattened. null = not available. */
export interface FieldSample {
  yield_: number | null;
  snr: number | null;
  leverage: number | null;
  velocity: number | null;
  dev10x: number | null;
  cost: number | null;
  efficiency: number | null;
  opRatio: number | null;
  input: number | null;
  output: number | null;
  cacheWrite: number | null;
  cacheRead: number | null;
  total: number | null;
}

/** Flatten a board row. Compounding-only metrics are null for non-compounding rows
 *  (same rule as the ledger and the board's sort values). */
export function sampleFromRow(row: LeaderboardRow): FieldSample {
  const c = row.snapshot?.cascade;
  const t = row.telemetry;
  const comp = (v: number | null | undefined) =>
    c && !c.nonCompounding && fin(v) ? v : null;
  const any = (v: number | null | undefined) => (c && fin(v) ? v : null);
  const tok = (v: number | null | undefined) => (t && fin(v) && v >= 0 ? v : null);
  const parts = [t?.fresh_input, t?.output, t?.cache_create, t?.cache_read];
  const total = t && parts.every((p) => fin(p)) ? parts.reduce<number>((s, p) => s + (p as number), 0) : null;
  return {
    yield_: comp(c?.yield_),
    snr: any(c?.snr),
    leverage: comp(c?.leverage),
    velocity: any(c?.velocity),
    dev10x: comp(c?.dev10x),
    cost: c && fin(c.costPerMillion) && c.costPerMillion > 0 ? c.costPerMillion : null,
    efficiency: any(c?.efficiency),
    // Ledger convention: Op Ratio ranks on its lead term (leverage).
    opRatio: comp(c?.leverage),
    input: tok(t?.fresh_input),
    output: tok(t?.output),
    cacheWrite: tok(t?.cache_create),
    cacheRead: tok(t?.cache_read),
    total,
  };
}

/**
 * Percentile of `value` within `field` on 0..100 (100 = top of the field).
 * Mid-rank for ties; top = 100, bottom = 0. Null values in the field are ignored.
 * Returns null when value is missing or fewer than 2 comparable values exist.
 * `higherIsBetter=false` inverts (cost): lowest value maps to 100.
 */
export function percentileRank(
  value: number | null | undefined,
  field: ReadonlyArray<number | null | undefined>,
  higherIsBetter = true,
): number | null {
  if (!fin(value)) return null;
  const vals = field.filter(fin);
  if (vals.length < 2) return null;
  let below = 0;
  let equal = 0;
  for (const v of vals) {
    if (v < value) below++;
    else if (v === value) equal++;
  }
  // `equal` includes the value itself when it is a member of the field.
  const eq = Math.max(equal, 1);
  const pct = ((below + 0.5 * (eq - 1)) / (vals.length - 1)) * 100;
  const clamped = Math.max(0, Math.min(100, pct));
  return higherIsBetter ? clamped : 100 - clamped;
}

export interface MetricDef {
  key: keyof FieldSample;
  label: string;
  /** Short label for tight radars. */
  short: string;
  higherIsBetter: boolean;
}

/** The 8 cascade metrics, in radar order (long labels away from the clipping edge). */
export const COMPOSITE_METRICS: MetricDef[] = [
  { key: "yield_", label: "Yield", short: "Υ Yield", higherIsBetter: true },
  { key: "leverage", label: "Leverage", short: "Leverage", higherIsBetter: true },
  { key: "snr", label: "SNR", short: "SNR", higherIsBetter: true },
  { key: "velocity", label: "Velocity", short: "Velocity", higherIsBetter: true },
  { key: "dev10x", label: "10xDEV", short: "10xDEV", higherIsBetter: true },
  { key: "efficiency", label: "Efficiency", short: "Efficiency", higherIsBetter: true },
  { key: "cost", label: "Cost per 1M", short: "$/1M", higherIsBetter: false },
  { key: "opRatio", label: "Op Ratio (lead term)", short: "Op Ratio", higherIsBetter: true },
];

export const COMPOSITE_PILLARS: MetricDef[] = [
  { key: "input", label: "Input", short: "In", higherIsBetter: true },
  { key: "output", label: "Output", short: "Out", higherIsBetter: true },
  { key: "cacheWrite", label: "Cache write", short: "CW", higherIsBetter: true },
  { key: "cacheRead", label: "Cache read", short: "CR", higherIsBetter: true },
  { key: "total", label: "Total", short: "Total", higherIsBetter: true },
];

export interface PercentilePoint {
  key: keyof FieldSample;
  label: string;
  short: string;
  raw: number | null;
  /** 0..100, outward = better (cost already inverted); null = missing. */
  pct: number | null;
}

export function percentilesFor(
  sample: FieldSample,
  field: ReadonlyArray<FieldSample>,
  defs: MetricDef[],
): PercentilePoint[] {
  return defs.map((d) => ({
    key: d.key,
    label: d.label,
    short: d.short,
    raw: sample[d.key],
    pct: percentileRank(sample[d.key], field.map((f) => f[d.key]), d.higherIsBetter),
  }));
}

/* ------------------------------------------------------------------ */
/* Cascade stages                                                      */
/* ------------------------------------------------------------------ */

export interface CascadeStages {
  transmission: number | null; // output / input
  commitment: number | null; // cache_write / output
  reuse: number | null; // cache_read / cache_write
  /** Transmission × Commitment × Reuse = cache_read / input (the telescope). */
  leverage: number | null;
  /** Υ = Leverage × Transmission = cache_read × output / input². */
  yield_: number | null;
}

const ratio = (n: number | null, d: number | null): number | null =>
  fin(n) && fin(d) && d > 0 && n > 0 ? n / d : null;

/** Stage ratios from raw pillars. A stage is null if any pillar it needs is
 *  missing or zero (a zero numerator has no log). */
export function cascadeStages(s: FieldSample): CascadeStages {
  const transmission = ratio(s.output, s.input);
  const commitment = ratio(s.cacheWrite, s.output);
  const reuse = ratio(s.cacheRead, s.cacheWrite);
  const leverage = ratio(s.cacheRead, s.input);
  const yield_ = leverage !== null && transmission !== null ? leverage * transmission : null;
  return { transmission, commitment, reuse, leverage, yield_ };
}

/* ------------------------------------------------------------------ */
/* Token mix                                                           */
/* ------------------------------------------------------------------ */

export interface TokenMix {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

/** Share (0..100) of each pillar in the operator's own total; sums to 100.
 *  Null if any pillar is missing or the total is 0. */
export function tokenMix(s: FieldSample): TokenMix | null {
  const { input, output, cacheWrite, cacheRead } = s;
  if (!fin(input) || !fin(output) || !fin(cacheWrite) || !fin(cacheRead)) return null;
  const total = input + output + cacheWrite + cacheRead;
  if (!(total > 0)) return null;
  const p = (v: number) => (v / total) * 100;
  return { input: p(input), output: p(output), cacheWrite: p(cacheWrite), cacheRead: p(cacheRead) };
}

/* ------------------------------------------------------------------ */
/* Radial scales                                                       */
/* ------------------------------------------------------------------ */

export interface LogScale {
  loExp: number;
  hiExp: number;
  /** Decade exponents to draw as rings, ascending. Last equals hiExp. */
  ticks: number[];
  /** value -> 0..1 radius fraction; null for non-positive/missing. */
  project: (v: number | null | undefined) => number | null;
}

/** One shared log10 scale across every value given (so gaps are comparable
 *  between axes). Bounds snap to whole decades; rings every decade, or every two
 *  decades when the span is wide. Falls back to 1e-1..1e1 with no data. */
export function logScale(values: ReadonlyArray<number | null | undefined>): LogScale {
  const pos = values.filter((v): v is number => fin(v) && v > 0);
  let lo = -1;
  let hi = 1;
  if (pos.length) {
    lo = Math.floor(Math.log10(Math.min(...pos)));
    hi = Math.ceil(Math.log10(Math.max(...pos)));
    if (hi - lo < 2) {
      hi = lo + 2;
    }
  }
  const step = hi - lo > 5 ? 2 : 1;
  if (step === 2 && (hi - lo) % 2) hi += 1;
  const ticks: number[] = [];
  for (let e = lo; e <= hi; e += step) ticks.push(e);
  return {
    loExp: lo,
    hiExp: hi,
    ticks,
    project: (v) =>
      fin(v) && v > 0 ? Math.max(0, Math.min(1, (Math.log10(v) - lo) / (hi - lo))) : null,
  };
}

/** Square-root radial scale for percent shares (0..100) so a 0.3% slice stays
 *  visible next to a 95% one. Returns 0..1. */
export function sqrtShare(pct: number | null | undefined): number | null {
  return fin(pct) ? Math.sqrt(Math.max(0, Math.min(100, pct)) / 100) : null;
}

/** Compact number for axis tips (K/M/B/T); small values keep sensible decimals. */
export function compactNumber(n: number | null | undefined): string {
  if (!fin(n)) return "—";
  const a = Math.abs(n);
  if (a >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (a >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (a >= 1e4) return `${(n / 1e3).toFixed(0)}K`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  if (a >= 100) return n.toFixed(0);
  if (a >= 10) return n.toFixed(1);
  if (a >= 1) return n.toFixed(2);
  if (a === 0) return "0";
  return n.toFixed(a < 0.01 ? 3 : 2);
}

/** Tick label for a decade exponent: 0.01, 0.1, 1, 10, 100, 1K ... 100M, 1B. */
export function decadeLabel(exp: number): string {
  if (exp < -3) return `1e${exp}`;
  if (exp < 0) return String(Math.pow(10, exp));
  const units: [number, string][] = [[12, "T"], [9, "B"], [6, "M"], [3, "K"]];
  for (const [e, u] of units) {
    if (exp >= e) return `${Math.pow(10, exp - e)}${u}`;
  }
  return String(Math.pow(10, exp));
}
