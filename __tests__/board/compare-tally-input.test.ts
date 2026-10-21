import { describe, expect, it } from "vitest";
import type { LeaderboardRow } from "@/lib/board/types";
import { compareTally } from "@/lib/analytics/compare-facts";

// owner 2026-10-21: fresh input is LOWER-wins in the compare tally (Yield denominator).
// Higher y = better on all six derived metrics (cost is lower-wins, so invert it).
const cascade = (y: number) => ({
  yield_: y, snr: y / 100, leverage: y, velocity: y, dev10x: y, costPerMillion: 100 / y,
  nonCompounding: false,
});
const row = (
  y: number,
  t: { fresh_input: number; output: number; cache_read: number; cache_create: number },
) => ({ snapshot: { cascade: cascade(y) }, telemetry: t }) as unknown as LeaderboardRow;

describe("compareTally fresh input", () => {
  // MO§ES vs Kabir (live numbers 2026-10-21); Kabir wins all 6 derived metrics.
  const moses = row(1, {
    fresh_input: 25_766_329, output: 199.3e6, cache_read: 51_791.3e6, cache_create: 2_737.8e6,
  });
  const kabir = row(10, {
    fresh_input: 387_900, output: 192.0e6, cache_read: 50_412.5e6, cache_create: 939.2e6,
  });

  it("gives the lower fresh input the win (Kabir 7, MO§ES 3 instead of 6-4)", () => {
    expect(compareTally(moses, kabir)).toEqual({ aWins: 3, bWins: 7 });
    expect(compareTally(kabir, moses)).toEqual({ aWins: 7, bWins: 3 });
  });

  it("keeps output, cache read and cache write as higher-wins", () => {
    const lo = row(1, { fresh_input: 100, output: 1, cache_read: 1, cache_create: 1 });
    const hi = row(1, { fresh_input: 100, output: 2, cache_read: 2, cache_create: 2 });
    expect(compareTally(hi, lo)).toEqual({ aWins: 3, bWins: 0 });
  });

  it("scores input alone as lower-wins when everything else ties", () => {
    const t = { output: 5, cache_read: 5, cache_create: 5 };
    expect(compareTally(row(1, { ...t, fresh_input: 10 }), row(1, { ...t, fresh_input: 20 })))
      .toEqual({ aWins: 1, bWins: 0 });
  });
});
