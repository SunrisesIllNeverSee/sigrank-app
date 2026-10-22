/**
 * lib/radar/points.ts — one points scale for every radar on the site (owner 2026-10-22).
 *
 * Roto scoring: on each axis an operator gets 1 point plus one for every other
 * operator it beats there (half a point per tie). The field's best on an axis
 * gets N, the worst gets 1, and the radius is points ÷ N. Axes marked dir -1
 * (input, input share, cost) score the other way: less is outward.
 *
 * Reference lines: the board's first, middle and last operator by rank, where
 * middle = floor((first + last) / 2). They are drawn white under the operators.
 *
 * The signature raw ring scores against a fixed seed league of 100 instead
 * (seed-league-100.json, from the 2026-07-13 field scrape). The seed has no
 * model mix, so its cost axis uses the live rank, scaled to the league.
 *
 * All-time only for now; radars do not follow the board window yet.
 * Token-flow shape, not a quality score.
 */
import type { LeaderboardRow } from "@/lib/board/types";
import { operatorDisplayName } from "@/lib/identity/operator-name";
import SEED from "./seed-league-100.json";

const fin = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** One operator's numbers for radar scoring. null = not available. */
export interface RadarSample {
  input: number | null;
  output: number | null;
  cacheWrite: number | null;
  cacheRead: number | null;
  yield_: number | null;
  leverage: number | null;
  snr: number | null;
  velocity: number | null;
  dev10x: number | null;
  scaleV: number | null;
  efficiency: number | null;
  construction: number | null;
  cost: number | null;
}

/** Flatten a board row. Compounding-only metrics are null for non-compounding
 *  rows (same rule as the ledger and lib/compare/radar-math sampleFromRow). */
export function radarSample(row: LeaderboardRow): RadarSample {
  const c = row.snapshot?.cascade;
  const t = row.telemetry;
  const comp = (v: number | null | undefined) => (c && !c.nonCompounding && fin(v) ? v : null);
  const any = (v: number | null | undefined) => (c && fin(v) ? v : null);
  const tok = (v: number | null | undefined) => (t && fin(v) && v >= 0 ? v : null);
  return {
    input: tok(t?.fresh_input),
    output: tok(t?.output),
    cacheWrite: tok(t?.cache_create),
    cacheRead: tok(t?.cache_read),
    yield_: comp(c?.yield_),
    leverage: comp(c?.leverage),
    snr: any(c?.snr),
    velocity: any(c?.velocity),
    dev10x: comp(c?.dev10x),
    scaleV: any(c?.scaleV),
    efficiency: any(c?.efficiency),
    construction: any(c?.construction),
    cost: c && fin(c.costPerMillion) && c.costPerMillion > 0 ? c.costPerMillion : null,
  };
}

const pillarSample = ([input, output, cacheWrite, cacheRead]: number[]): RadarSample => ({
  input, output, cacheWrite, cacheRead,
  yield_: null, leverage: null, snr: null, velocity: null, dev10x: null,
  scaleV: null, efficiency: null, construction: null, cost: null,
});

const total = (s: RadarSample): number | null =>
  fin(s.input) && fin(s.output) && fin(s.cacheWrite) && fin(s.cacheRead)
    ? s.input + s.output + s.cacheWrite + s.cacheRead
    : null;
const ratio = (n: number | null, d: number | null): number | null =>
  fin(n) && fin(d) && d > 0 && n > 0 ? n / d : null;
const share = (v: number | null, s: RadarSample): number | null => {
  const t = total(s);
  return fin(v) && fin(t) && t > 0 ? v / t : null;
};

export interface RadarAxisDef {
  key: string;
  label: string;
  short: string;
  /** 1 = more is outward, -1 = less is outward. */
  dir: 1 | -1;
  value: (s: RadarSample) => number | null;
}

const AXES = {
  yield_: { key: "yield_", label: "Yield", short: "Υ", dir: 1, value: (s) => s.yield_ },
  leverage: { key: "leverage", label: "Leverage", short: "LEV", dir: 1, value: (s) => s.leverage },
  snr: { key: "snr", label: "SNR", short: "SNR", dir: 1, value: (s) => s.snr },
  velocity: { key: "velocity", label: "Velocity", short: "VEL", dir: 1, value: (s) => s.velocity },
  dev10x: { key: "dev10x", label: "10xDEV", short: "10X", dir: 1, value: (s) => s.dev10x },
  scaleV: { key: "scaleV", label: "Scale V", short: "SCV", dir: 1, value: (s) => s.scaleV },
  efficiency: { key: "efficiency", label: "Efficiency", short: "EFF", dir: 1, value: (s) => s.efficiency },
  cost: { key: "cost", label: "Cost per 1M", short: "$/1M", dir: -1, value: (s) => s.cost },
  construction: { key: "construction", label: "Construction", short: "CONSTR", dir: 1, value: (s) => s.construction },
  transmission: { key: "transmission", label: "Transmission", short: "TRANS", dir: 1, value: (s) => ratio(s.output, s.input) },
  commitment: { key: "commitment", label: "Commitment", short: "COMMIT", dir: 1, value: (s) => ratio(s.cacheWrite, s.output) },
  reuse: { key: "reuse", label: "Reuse", short: "REUSE", dir: 1, value: (s) => ratio(s.cacheRead, s.cacheWrite) },
  stageLeverage: { key: "stageLeverage", label: "Leverage", short: "LEV", dir: 1, value: (s) => ratio(s.cacheRead, s.input) },
  stageYield: {
    key: "stageYield", label: "Yield", short: "Υ", dir: 1,
    value: (s) => {
      const lev = ratio(s.cacheRead, s.input);
      const tr = ratio(s.output, s.input);
      return lev !== null && tr !== null ? lev * tr : null;
    },
  },
  inShare: { key: "inShare", label: "Input share", short: "IN%", dir: -1, value: (s) => share(s.input, s) },
  outShare: { key: "outShare", label: "Output share", short: "OUT%", dir: 1, value: (s) => share(s.output, s) },
  cwShare: { key: "cwShare", label: "Cache write share", short: "CW%", dir: 1, value: (s) => share(s.cacheWrite, s) },
  crShare: { key: "crShare", label: "Cache read share", short: "CR%", dir: 1, value: (s) => share(s.cacheRead, s) },
  input: { key: "input", label: "Input", short: "IN", dir: -1, value: (s) => s.input },
  output: { key: "output", label: "Output", short: "OUT", dir: 1, value: (s) => s.output },
  cacheWrite: { key: "cacheWrite", label: "Cache write", short: "CW", dir: 1, value: (s) => s.cacheWrite },
  cacheRead: { key: "cacheRead", label: "Cache read", short: "CR", dir: 1, value: (s) => s.cacheRead },
  total: { key: "total", label: "Total", short: "TOTAL", dir: 1, value: total },
} satisfies Record<string, RadarAxisDef>;

export type RadarKind = "composite" | "stages" | "mix" | "share" | "dock" | "metric" | "raw" | "archetype";

/** Axes per radar, in drawing order (clockwise from 12 o'clock). */
export const RADAR_KINDS: Record<RadarKind, RadarAxisDef[]> = {
  composite: [AXES.yield_, AXES.leverage, AXES.snr, AXES.velocity, AXES.dev10x, AXES.efficiency, AXES.cost],
  stages: [AXES.transmission, AXES.commitment, AXES.reuse, AXES.stageLeverage, AXES.stageYield],
  mix: [AXES.inShare, AXES.outShare, AXES.cwShare, AXES.crShare],
  share: [AXES.yield_, AXES.snr, AXES.leverage, AXES.velocity, AXES.cost],
  dock: [AXES.yield_, AXES.leverage, AXES.velocity, AXES.snr, AXES.dev10x],
  // Board signature metric ring, passport card and link preview: one radar.
  metric: [AXES.snr, AXES.velocity, AXES.leverage, AXES.dev10x, AXES.scaleV, AXES.efficiency],
  raw: [AXES.input, AXES.output, AXES.cacheRead, AXES.cacheWrite, AXES.total, AXES.cost],
  archetype: [AXES.leverage, AXES.velocity, AXES.construction],
};

/** Which pool each radar scores against. */
const SEEDED: ReadonlySet<RadarKind> = new Set<RadarKind>(["raw"]);

/** Points for `value` among `pool` (the other operators): 1 + beaten + ½ per tie.
 *  null when the value is missing; missing pool values are skipped. */
export function rotoPoints(
  value: number | null | undefined,
  pool: ReadonlyArray<number | null | undefined>,
  dir: 1 | -1 = 1,
): number | null {
  if (!fin(value)) return null;
  let pts = 1;
  for (const v of pool) {
    if (!fin(v)) continue;
    if (v === value) pts += 0.5;
    else if (dir > 0 ? v < value : v > value) pts += 1;
  }
  return pts;
}

/** Board positions (0-based) of the first, middle and last operator in a field
 *  of n: middle = floor((first + last) / 2) by rank, so #11 of 22. */
export function referenceIndexes(n: number): { first: number; middle: number; last: number } | null {
  if (n < 1) return null;
  return { first: 0, middle: Math.floor((1 + n) / 2) - 1, last: n - 1 };
}

export interface RadarRef {
  role: "first" | "middle" | "last";
  name: string;
  rank: number;
  pts: (number | null)[];
}

/** A scored field for one radar kind. Plain JSON so it can cross to the client. */
export interface RadarField {
  kind: RadarKind;
  labels: string[];
  dirs: (1 | -1)[];
  /** Points scale: N live operators, or league size + 1 for seeded radars. */
  max: number;
  /** Live operators scored. */
  size: number;
  pool: "live" | "seed100";
  /** codename → points per axis */
  points: Record<string, (number | null)[]>;
  refs: RadarRef[];
}

const SEED_SAMPLES: RadarSample[] = (SEED.rows as number[][]).map(pillarSample);

/**
 * Score every operator in `rows` (the all-time ranked board) on one radar.
 * Rows are ranked by global_rank for the reference lines.
 */
export function scoreRadarField(rows: ReadonlyArray<LeaderboardRow>, kind: RadarKind): RadarField {
  const ranked = [...rows].sort((a, b) => a.global_rank - b.global_rank);
  const samples = ranked.map(radarSample);
  const defs = RADAR_KINDS[kind];
  const n = ranked.length;
  const seeded = SEEDED.has(kind);
  const max = seeded ? SEED_SAMPLES.length + 1 : n;

  const liveVals = defs.map((d) => samples.map(d.value));
  const seedVals = defs.map((d) => (seeded ? SEED_SAMPLES.map(d.value) : []));
  const live = (i: number, k: number) =>
    rotoPoints(liveVals[k][i], liveVals[k].filter((_, j) => j !== i), defs[k].dir);
  const scoreOne = (i: number): (number | null)[] =>
    defs.map((d, k) => {
      if (!seeded) return live(i, k);
      if (seedVals[k].some(fin)) return rotoPoints(liveVals[k][i], seedVals[k], d.dir);
      // Seed lacks this axis (cost): live rank, scaled to the league.
      const p = live(i, k);
      return p === null || n < 1 ? null : Math.round((p / n) * max);
    });

  const points: Record<string, (number | null)[]> = {};
  const all = ranked.map((_, i) => scoreOne(i));
  ranked.forEach((r, i) => {
    points[r.operator.codename] = all[i];
  });

  const idx = referenceIndexes(n);
  const refs: RadarRef[] = idx
    ? (["first", "middle", "last"] as const).map((role) => {
        const i = idx[role];
        return { role, name: operatorDisplayName(ranked[i]), rank: ranked[i].global_rank, pts: all[i] };
      })
    : [];

  return {
    kind,
    labels: defs.map((d) => d.label),
    dirs: defs.map((d) => d.dir),
    max,
    size: n,
    pool: seeded ? "seed100" : "live",
    points,
    refs,
  };
}

/** Radius fractions (0..1) for a points array; null stays null. */
export function radarFractions(pts: ReadonlyArray<number | null>, max: number): (number | null)[] {
  return pts.map((p) => (p === null || !(max > 0) ? null : Math.max(0, Math.min(1, p / max))));
}

/** Reference-line styling shared by every radar: first solid, middle dashed, last dotted. */
export const RADAR_REF_STYLE: Record<RadarRef["role"], { dash?: string; opacity: number; width: number; label: string }> = {
  first: { opacity: 0.9, width: 1.1, label: "first" },
  middle: { dash: "5 4", opacity: 0.7, width: 1.2, label: "middle" },
  last: { dash: "1.5 3.5", opacity: 0.55, width: 1.3, label: "last" },
};
