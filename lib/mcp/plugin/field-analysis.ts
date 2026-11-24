import { createHash } from "node:crypto";

export const METRICS = ["yield", "leverage", "velocity", "snr", "construction", "dev10x", "scale_v"] as const;
export const TOKEN_METRICS = ["input", "output", "cache_write", "cache_read", "total"] as const;
export const SORT_METRICS = [...METRICS, ...TOKEN_METRICS] as const;
export type SortMetric = typeof SORT_METRICS[number];
export interface FieldEntry {
  codename: string;
  rank?: number | null;
  pillars: { input: number | null; output: number | null; cache_write: number | null; cache_read: number | null };
  metrics: Record<typeof METRICS[number], number | null>;
}

export function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
export function tokenCount(value: unknown): number | null {
  const n = finite(value);
  return n !== null && n >= 0 ? n : null;
}
export function metricValue(entry: FieldEntry, metric: SortMetric): number | null {
  if ((METRICS as readonly string[]).includes(metric)) return finite(entry.metrics[metric as typeof METRICS[number]]);
  if (metric !== "total") return tokenCount(entry.pillars[metric as keyof FieldEntry["pillars"]]);
  const values = Object.values(entry.pillars).map(tokenCount);
  return values.some(v => v === null) ? null : finite((values as number[]).reduce((a, b) => a + b, 0));
}
export function distribution(values: Array<number | null>) {
  const sorted = values.filter((v): v is number => finite(v) !== null).sort((a, b) => a - b);
  const quantile = (p: number) => {
    if (!sorted.length) return null;
    const x = (sorted.length - 1) * p, lo = Math.floor(x), hi = Math.ceil(x);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (x - lo);
  };
  return {
    n: sorted.length, missing_count: values.length - sorted.length,
    zero_count: sorted.filter(v => v === 0).length,
    mean: sorted.length ? sorted.reduce((sum, v) => sum + v / sorted.length, 0) : null,
    min: sorted[0] ?? null, p25: quantile(.25), median: quantile(.5),
    p75: quantile(.75), p95: quantile(.95), max: sorted.at(-1) ?? null,
  };
}
export function summarizeField(entries: FieldEntry[]) {
  return {
    distributions: Object.fromEntries(METRICS.map(m => [m, distribution(entries.map(e => metricValue(e, m)))])),
    token_distributions: Object.fromEntries(TOKEN_METRICS.map(m => [m, distribution(entries.map(e => metricValue(e, m)))])),
  };
}

export function orderedEntries<T extends FieldEntry>(entries: T[], metric: SortMetric, order: "asc" | "desc"): T[] {
  return [...entries].sort((a, b) => {
    const av = metricValue(a, metric), bv = metricValue(b, metric);
    if (av === null && bv !== null) return 1;
    if (bv === null && av !== null) return -1;
    const delta = av === null || bv === null ? 0 : (order === "asc" ? av - bv : bv - av);
    return delta || ((a.rank ?? Infinity) - (b.rank ?? Infinity))
      || (a.codename < b.codename ? -1 : a.codename > b.codename ? 1 : 0);
  });
}

/** Scope-bound, revision-bound cursor. Public data only; never an authorization token. */
export function fieldPage<T>(entries: T[], query: unknown, limit: number, cursor: unknown) {
  const digest = (value: unknown) => createHash("sha256")
    .update(JSON.stringify(value, (key, item) => key === "retrieved_at" ? undefined : item)).digest("hex");
  const queryId = digest(query), revision = digest(entries);
  let offset = 0;
  if (cursor !== undefined && cursor !== null) {
    try {
      if (typeof cursor !== "string" || cursor.length > 1024 || !/^[A-Za-z0-9_-]+$/.test(cursor)) throw new Error();
      const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
      if (parsed.query !== queryId || parsed.revision !== revision || !Number.isInteger(parsed.offset)
        || parsed.offset < 0 || parsed.offset >= entries.length) throw new Error();
      offset = parsed.offset;
    } catch { throw new Error("INVALID_CURSOR"); }
  }
  const next = offset + limit;
  return { entries: entries.slice(offset, next), offset,
    next_cursor: next < entries.length ? Buffer.from(JSON.stringify({ query: queryId, revision, offset: next })).toString("base64url") : null };
}
