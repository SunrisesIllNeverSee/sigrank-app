import type { HistoryPoint } from "@/lib/board/types";

export interface DatedTokenVolume {
  date: string;
  tokens: number;
}

/** Snapshot counts describe dated observations, not additive/deduplicated
 * lifetime volume. A single max-value observation per date prevents
 * counting multiple platform/window rollups several times. */
export function datedTokenVolumes(points: readonly HistoryPoint[]): DatedTokenVolume[] {
  const days = new Map<string, number>();
  for (const p of points) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date)) continue;
    const tokens = [p.input_tokens, p.output_tokens,
      p.cache_read_tokens, p.cache_creation_tokens];
    if (tokens.some(n => !Number.isFinite(n) || n === undefined || n === null || n < 0))
      continue;
    const total = tokens.reduce<number>((a, n) => a + (n ?? 0), 0);
    if (total <= 0) continue;
    days.set(p.date, Math.max(total, days.get(p.date) ?? 0));
  }
  return [...days].sort(([a], [b]) => a.localeCompare(b))
    .map(([date, tokens]) => ({ date, tokens }));
}

export function observationSpanDays(points: readonly DatedTokenVolume[]): number | null {
  if (points.length < 2) return null;
  const first = Date.parse(points[0].date + "T00:00:00Z");
  const last = Date.parse(points[points.length - 1].date + "T00:00:00Z");
  if (!Number.isFinite(first) || !Number.isFinite(last)) return null;
  return Math.max(0, Math.round((last - first) / 86_400_000));
}
