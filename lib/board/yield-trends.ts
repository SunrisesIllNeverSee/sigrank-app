/**
 * lib/board/yield-trends.ts — dated Yield series for the board TREND column.
 *
 * metric_snapshots stores the four raw pillars only; Yield is derived on read
 * with computeCascadeMetrics, the same path as the board's Yield column
 * (lib/board/mappers.ts). Non-compounding (cache_write = 0) and legacy
 * pillar-less rows are skipped, matching where the Yield column shows "—".
 *
 * Import-free apart from the pure cascade module so node --test can load it.
 */
import { computeCascadeMetrics } from "../analytics/cascade.ts";

/** The metric_snapshots columns the trends endpoint reads. */
export const TREND_COLUMNS =
  "operator_id,snapshot_date,platform,input_tokens,output_tokens,cache_creation_tokens,cache_read_tokens";

export interface TrendSnapshotRow {
  operator_id: string;
  snapshot_date: string | null;
  platform: string | null;
  input_tokens: number | string | null;
  output_tokens: number | string | null;
  cache_creation_tokens: number | string | null;
  cache_read_tokens: number | string | null;
}

const MAX_POINTS = 40;

/** Codename → oldest-first Yield series (at most the latest 40 days). */
export function buildYieldTrends(
  rows: TrendSnapshotRow[],
  codenames: Map<string, string>,
): Record<string, number[]> {
  const daily = new Map<string, Map<string, { value: number; multi: boolean }>>();
  for (const row of rows) {
    if (!row.snapshot_date) continue;
    const pillars = [row.input_tokens, row.output_tokens, row.cache_creation_tokens, row.cache_read_tokens];
    if (pillars.every((v) => v == null)) continue;
    const [input, output, cacheCreate, cacheRead] = pillars.map((v) => Number(v ?? 0));
    const cascade = computeCascadeMetrics({ input, output, cacheCreate, cacheRead });
    if (cascade.nonCompounding || !Number.isFinite(cascade.yield_) || cascade.yield_ <= 0) continue;
    const byDay = daily.get(row.operator_id) ?? new Map();
    const multi = row.platform === "multi";
    const current = byDay.get(row.snapshot_date);
    // One point per day; the multi-platform rollup wins over a single-platform row.
    if (!current || (multi && !current.multi)) byDay.set(row.snapshot_date, { value: cascade.yield_, multi });
    daily.set(row.operator_id, byDay);
  }
  const trends: Record<string, number[]> = {};
  for (const [id, days] of daily) {
    const code = codenames.get(id);
    if (!code) continue;
    trends[code] = [...days.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-MAX_POINTS)
      .map(([, v]) => v.value);
  }
  return trends;
}
