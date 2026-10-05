import type { LeaderboardRow } from "../board/types";

const PILLARS = ["fresh_input", "output", "cache_create", "cache_read"] as const;

export function summarizeReferenceTelemetry(rows: LeaderboardRow[]) {
  const means: Record<typeof PILLARS[number], number | null> = {
    fresh_input: null, output: null, cache_create: null, cache_read: null,
  };
  const coverage = { fresh_input: 0, output: 0, cache_create: 0, cache_read: 0 };
  for (const pillar of PILLARS) {
    const observed = rows.map(row => row.telemetry?.[pillar]).filter(
      (value): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0,
    );
    coverage[pillar] = observed.length;
    if (rows.length > 0 && observed.length === rows.length) {
      const mean = observed.reduce((sum, value) => sum + value / rows.length, 0);
      means[pillar] = Number.isFinite(mean) ? mean : null;
    }
  }
  const dates = rows.map(row => row.snapshot_date ?? row.snapshot.snapshot_date)
    .filter((date): date is string => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)).sort();
  return {
    population: rows.length,
    means,
    coverage,
    earliest_snapshot: dates[0] ?? null,
    latest_snapshot: dates.at(-1) ?? null,
  };
}
