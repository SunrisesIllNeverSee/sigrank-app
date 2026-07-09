/**
 * lib/data/field-average.ts — per-metric averages across the current field.
 *
 * One source of truth for every "average operator" reference on the profile
 * card: the AVG USER column, the radar's field polygon, and the op-ratio
 * footer all read from the same FieldAverages object, so they can never
 * disagree. Computed from live leaderboard rows (ranked, compounding only);
 * every field is null when the board has no usable rows, and consumers fall
 * back to the historical hardcoded references.
 */

import type { LeaderboardRow } from "@/lib/data/types";

export interface FieldAverages {
  yield_: number | null;
  snr: number | null;
  leverage: number | null;
  velocity: number | null;
  dev10x: number | null;
  scaleV: number | null;
  efficiency: number | null;
  costPerMillion: number | null;
  /** Mean token ratios normalized to input = 1 (the op-ratio components). */
  crRatio: number | null;
  outRatio: number | null;
  cwRatio: number | null;
  /** "cr:1:out" built from the ratio means above. */
  opRatio: string | null;
}

const mean = (xs: number[]): number | null =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

export function computeFieldAverages(rows: LeaderboardRow[]): FieldAverages {
  const ranked = rows.filter(
    (r) =>
      !r.pending && r.snapshot.cascade && !r.snapshot.cascade.nonCompounding,
  );
  const nums = (
    f: (r: LeaderboardRow) => number | null | undefined,
  ): number[] =>
    ranked.map(f).filter((v): v is number => v != null && Number.isFinite(v));

  const withInput = ranked.filter(
    (r) => r.telemetry && r.telemetry.fresh_input > 0,
  );
  const crRatio = mean(
    withInput.map((r) => r.telemetry.cache_read / r.telemetry.fresh_input),
  );
  const outRatio = mean(
    withInput.map((r) => r.telemetry.output / r.telemetry.fresh_input),
  );
  const cwRatio = mean(
    withInput.map((r) => r.telemetry.cache_create / r.telemetry.fresh_input),
  );

  return {
    yield_: mean(nums((r) => r.snapshot.cascade!.yield_)),
    snr: mean(nums((r) => r.snapshot.cascade!.snr)),
    leverage: mean(nums((r) => r.snapshot.cascade!.leverage)),
    velocity: mean(nums((r) => r.snapshot.cascade!.velocity)),
    dev10x: mean(nums((r) => r.snapshot.cascade!.dev10x)),
    scaleV: mean(nums((r) => r.snapshot.cascade!.scaleV)),
    efficiency: mean(nums((r) => r.snapshot.cascade!.efficiency)),
    costPerMillion: mean(nums((r) => r.snapshot.cascade!.costPerMillion)),
    crRatio,
    outRatio,
    cwRatio,
    opRatio:
      crRatio != null && outRatio != null
        ? `${crRatio.toFixed(1)}:1:${outRatio.toFixed(1)}`
        : null,
  };
}
