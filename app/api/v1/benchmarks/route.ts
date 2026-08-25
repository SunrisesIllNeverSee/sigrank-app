import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/board";
import { fieldStats } from "@/lib/cascade";

export const revalidate = 300;

/**
 * GET /api/v1/benchmarks
 *
 * Returns field-wide benchmark statistics (median, top 10%, top 1%) for
 * yield, leverage, velocity, and SNR. Computed from the live leaderboard.
 *
 * Query params:
 *  - window: 7d | 30d | 90d | all_time (default: 30d)
 *
 * Response:
 *  {
 *    window: "30d",
 *    generated_at: "...",
 *    total_operators: 42,
 *    compounding_operators: 38,
 *    yield: { median, top_10, top_1 },
 *    leverage: { median, top_10, top_1 },
 *    velocity: { median, top_10, top_1 },
 *    snr: { median, top_10, top_1 }
 *  }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const window = url.searchParams.get("window") || "30d";

  const board = await getLeaderboard({ window, windowFilter: true, limit: 1000 });

  if (board.length === 0) {
    return NextResponse.json(
      { error: "Leaderboard data unavailable", code: "board_unavailable" },
      { status: 503 },
    );
  }

  const yields: number[] = [];
  const leverages: number[] = [];
  const velocities: number[] = [];
  const snrs: number[] = [];

  for (const row of board) {
    const c = row.snapshot.cascade;
    if (!c || c.nonCompounding) continue;
    if (typeof c.yield_ === "number") yields.push(c.yield_);
    if (typeof c.leverage === "number") leverages.push(c.leverage);
    if (typeof c.velocity === "number") velocities.push(c.velocity);
    if (typeof c.snr === "number") snrs.push(c.snr);
  }

  if (yields.length < 5) {
    return NextResponse.json({
      window,
      generated_at: new Date().toISOString(),
      total_operators: board.length,
      compounding_operators: yields.length,
      code: "insufficient_field",
      message: `Only ${yields.length} compounding operators — not enough for meaningful benchmarks.`,
    });
  }

  const computeBands = (arr: number[]) => {
    const sorted = [...arr].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const top10 = sorted[Math.floor(sorted.length * 0.9)] ?? sorted[sorted.length - 1];
    const top1 = sorted[Math.floor(sorted.length * 0.99)] ?? sorted[sorted.length - 1];
    return {
      median: Number(median.toFixed(4)),
      top_10: Number(top10.toFixed(4)),
      top_1: Number(top1.toFixed(4)),
    };
  };

  return NextResponse.json({
    window,
    generated_at: new Date().toISOString(),
    total_operators: board.length,
    compounding_operators: yields.length,
    yield: computeBands(yields),
    leverage: computeBands(leverages),
    velocity: computeBands(velocities),
    snr: computeBands(snrs),
  }, {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
