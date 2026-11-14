/**
 * __tests__/board/leaderboard-cache-size.test.ts
 *
 * Measures the serialized size of the mapped getLeaderboard result (the thing
 * the shared Data Cache stores; entries over 2 MB are silently dropped by
 * Next/Vercel). Egress fix, 2026-11-14. The rows are the real mapper output for
 * synthetic operators with every field populated, so the per-row figure is a
 * fair estimate for production.
 */
import { describe, it, expect } from "vitest";
import { assembleLeaderboard } from "@/lib/board/assemble";
import type { DbMetricSnapshot, DbOperator } from "@/lib/board/mappers";
import { LEADERBOARD_CACHE_MAX_BYTES, prepareCacheEntry } from "@/lib/board/cached";
import type { LeaderboardRow } from "@/lib/board/types";

function field(n: number) {
  const ops = new Map<string, DbOperator>();
  const snaps: DbMetricSnapshot[] = [];
  const plat = new Map<string, string[]>();
  for (let i = 1; i <= n; i++) {
    const id = `${i.toString(16).padStart(8, "0")}-0000-4000-8000-000000000000`;
    ops.set(id, {
      operator_id: id, codename: `operator-${i}`, display_name: `Operator Number ${i}`,
      claimed: true, claimed_at: "2026-01-01T00:00:00Z", current_supporter_tier: null,
      verification_status: "verified", primary_domain: "claude", account_age_days: 100,
      total_messages_lifetime: 1000, handle: `op${i}`, avatar_url: `https://example.org/a/${i}.png`,
      bio: "A short public bio for this operator.", links: { github: `https://github.com/op${i}`, site: "https://example.org", x: `https://x.com/op${i}` },
      location: "Somewhere", profile_visibility: "public", status: "active",
    } as DbOperator);
    snaps.push({
      metric_snapshot_id: `${i.toString(16).padStart(8, "0")}-1111-4000-8000-000000000000`,
      operator_id: id, snapshot_date: "2026-11-14", window_type: "all_time", platform: "multi",
      source_submission_id: `${i.toString(16).padStart(8, "0")}-2222-4000-8000-000000000000`,
      window_start: "2026-01-01", window_end: "2026-11-14",
      compression_ratio: 1.2345, prompt_complexity: 3.21, cross_thread: 7, session_depth: 12.5,
      token_throughput: 1_234_567, signa_rate: 4.2, sdot_score: 1.1, sdrm_score: 2.2, signal_force: 3.3,
      drift_ratio: 0.5, class_tier: "POWER I", movement_24h: 1, movement_7d: 2, ruleset_version: "v1",
      input_tokens: 1000 + i, output_tokens: 2000 + i, cache_creation_tokens: 500 + i, cache_read_tokens: 50_000 + i * 13,
      account_age_days: 100, total_messages: 1000,
    } as DbMetricSnapshot);
    plat.set(id, ["claude", "codex", "multi"]);
  }
  return assembleLeaderboard(snaps, plat, ops, new Map(), { window: "all_time", operatorTotal: true, mode: "all" });
}

describe("getLeaderboard cache entry size (2 MB Data Cache cap)", () => {
  const bytes = (rows: unknown[]) => Buffer.byteLength(JSON.stringify(rows));
  const perRow = bytes(field(200)) / 200;

  it("reports the per-row size", () => {
    console.log(`[size] ~${Math.round(perRow)} bytes per LeaderboardRow`);
    expect(perRow).toBeGreaterThan(500);
    expect(perRow).toBeLessThan(4000);
  });

  it("a claimed-only board (hundreds of operators) fits under the cap", () => {
    const rows = field(500);
    console.log(`[size] 500 rows = ${bytes(rows)} bytes (cap ${LEADERBOARD_CACHE_MAX_BYTES})`);
    expect(bytes(rows)).toBeLessThan(LEADERBOARD_CACHE_MAX_BYTES);
  });

  it("the full unfiltered field (1,693 operators) is over the cap and takes the memo fallback", () => {
    const rows = field(1693);
    console.log(`[size] 1,693 rows = ${bytes(rows)} bytes (cap ${LEADERBOARD_CACHE_MAX_BYTES})`);
    expect(bytes(rows)).toBeGreaterThan(LEADERBOARD_CACHE_MAX_BYTES);
  });

  it("prepareCacheEntry: hit and miss return identical data (NaN/undefined normalized as JSON would)", () => {
    const rows = field(3) as unknown as Record<string, unknown>[];
    rows[0].percentile = NaN;
    rows[1].window_start = undefined;
    rows[2].extra = Infinity;
    const entry = prepareCacheEntry(rows as unknown as LeaderboardRow[]);
    expect("rows" in entry).toBe(true);
    const got = (entry as unknown as { rows: Record<string, unknown>[] }).rows;
    expect(got[0].percentile).toBeNull();
    expect("window_start" in got[1]).toBe(false);
    expect(got[2].extra).toBeNull();
    // what a cache hit would return is the JSON round-trip of the stored value
    expect(JSON.parse(JSON.stringify(got))).toEqual(got);
  });

  it("prepareCacheEntry: measures UTF-8 bytes, not characters", () => {
    const row = { ...(field(1)[0] as object), bio: "é".repeat(1_000_000) } as unknown as LeaderboardRow;
    const text = JSON.stringify([row]);
    expect(text.length).toBeLessThan(LEADERBOARD_CACHE_MAX_BYTES);
    expect(Buffer.byteLength(text, "utf8")).toBeGreaterThan(LEADERBOARD_CACHE_MAX_BYTES);
    expect(prepareCacheEntry([row])).toEqual({ oversize: true });
  });
});
