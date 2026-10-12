import { describe, expect, it } from "vitest";
import type { LeaderboardRow, HistoryPoint } from "@/lib/board/types";
import { liveCompareCandidates, resolveLiveComparePair } from "@/lib/board/compare-live";
import { datedTokenVolumes, observationSpanDays } from "@/lib/board/compare-token-longevity";

const op = (code: string, opts: {
  claimed?: boolean; pending?: boolean; input?: number; output?: number;
  rank?: number;
} = {}): LeaderboardRow => ({
  operator: { codename: code, claimed: opts.claimed ?? true },
  pending: opts.pending ?? false, global_rank: opts.rank ?? 1,
  telemetry: { fresh_input: opts.input ?? 100, output: opts.output ?? 250 },
} as unknown as LeaderboardRow);
const pt = (date: string, i: number, o: number, w = 0, r = 0): HistoryPoint => ({
  date, input_tokens: i, output_tokens: o,
  cache_creation_tokens: w, cache_read_tokens: r,
} as HistoryPoint);

describe("live-only Compare candidate gate", () => {
  const ranked = [op("live-a", { rank: 1 }), op("live-b", { rank: 2 })];
  it("drops seeded, unclaimed, pending, synthetic, UR, zero input or output", () => {
    const rows = [...ranked,
      op("seed-x", { claimed: false }), op("the-field"),
      op("ur-x", { pending: true }), op("zero-i", { input: 0 }),
      op("zero-o", { output: 0 }), op("no-rank", { rank: 0 }),
      op("LIVE-A", { rank: 3 })];
    expect(liveCompareCandidates(rows).map(r => r.operator.codename))
      .toEqual(["live-a", "live-b"]);
  });
  it("defaults exclusively to distinct qualified live operators", () => {
    const pair = resolveLiveComparePair(ranked, undefined, undefined, 0)!;
    expect(pair.map(r => r.operator.codename)).toEqual(["live-a", "live-b"]);
  });
  it("rejects forged URL codenames and repairs same-operator comparison", () => {
    const forged = resolveLiveComparePair(ranked, "seed-x", "the-field", 0)!;
    expect(forged.map(r => r.operator.codename)).toEqual(["live-a", "live-b"]);
    const same = resolveLiveComparePair(ranked, "live-b", "live-b", 0)!;
    expect(same.map(r => r.operator.codename)).toEqual(["live-b", "live-a"]);
  });
  it("does not fabricate a comparison when fewer than two live operators exist", () => {
    expect(resolveLiveComparePair([], "seed-x", "the-field")).toBeNull();
    expect(resolveLiveComparePair([ranked[0]], "live-a", "live-a")).toBeNull();
  });
});

describe("measured token longevity timeline", () => {
  it("uses the four real token pillars, sorts dates and never adds same-day rollups", () => {
    const raw = [pt("2026-10-02", 100, 200, 30, 40),
      pt("2026-10-01", 20, 30, 5, 5),
      pt("2026-10-02", 10, 20, 2, 3)];
    expect(datedTokenVolumes(raw)).toEqual([
      { date: "2026-10-01", tokens: 60 },
      { date: "2026-10-02", tokens: 370 },
    ]);
  });
  it("excludes missing/negative/unmeasured snapshots instead of inventing zeros", () => {
    const points = [pt("2026-10-01", 0, 0),
      pt("2026-10-02", -1, 20),
      pt("2026-10-03", 10, 40),
      { date: "2026-10-04", input_tokens: 15 } as HistoryPoint];
    expect(datedTokenVolumes(points)).toEqual([{ date: "2026-10-03", tokens: 50 }]);
    expect(observationSpanDays(datedTokenVolumes(points))).toBeNull();
  });
  it("reports only measured date span, never extrapolated lifespan", () => {
    expect(observationSpanDays(datedTokenVolumes([
      pt("2026-09-01", 10, 20), pt("2026-09-11", 40, 80),
    ]))).toBe(10);
  });
});
