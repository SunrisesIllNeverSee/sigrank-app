import { describe, it, expect } from "vitest";
import { genomeRoto, rowGenomeScores, GENOME_KEYS } from "@/lib/radar/genome";
import type { LeaderboardRow } from "@/lib/board/types";

const row = (codename: string, rank: number, i: number, o: number, cw: number, cr: number, sessions: number, turns: number): LeaderboardRow => ({
  operator: { codename, display_name: codename } as LeaderboardRow["operator"],
  snapshot: { cascade: null } as LeaderboardRow["snapshot"],
  global_rank: rank,
  percentile: 0,
  telemetry: { fresh_input: i, output: o, cache_create: cw, cache_read: cr, sessions, turns },
});

const rows = [
  row("b", 2, 5e6, 2e6, 1e8, 2e9, 40, 900),
  row("a", 1, 1e6, 3e6, 5e8, 9e9, 120, 6000),
  row("c", 3, 9e7, 1e6, 1e7, 1e8, 5, 40),
];

describe("genomeRoto", () => {
  it("ranks Core 5 scores against the live field", () => {
    const top = rowGenomeScores(rows[1])!;
    const scores = Object.fromEntries(GENOME_KEYS.map((k, i) => [k, top[i] + 1])) as unknown as Parameters<typeof genomeRoto>[0];
    const r = genomeRoto(scores, rows)!;
    expect(r.size).toBe(3);
    expect(r.points.every((p) => p >= 1 && p <= 4)).toBe(true);
    expect(r.fracs.every((f) => f > 0 && f <= 1)).toBe(true);
  });
  it("draws the first, middle and last operator by board rank", () => {
    const s = Object.fromEntries(GENOME_KEYS.map((k) => [k, 50])) as unknown as Parameters<typeof genomeRoto>[0];
    const r = genomeRoto(s, rows)!;
    expect(r.refs.map((x) => [x.role, x.name, x.rank])).toEqual([["first", "a", 1], ["middle", "b", 2], ["last", "c", 3]]);
    for (const ref of r.refs) expect(ref.fracs).toHaveLength(5);
  });
  it("needs at least two operators", () => {
    const s = Object.fromEntries(GENOME_KEYS.map((k) => [k, 50])) as unknown as Parameters<typeof genomeRoto>[0];
    expect(genomeRoto(s, rows.slice(0, 1))).toBeNull();
  });
});
