/**
 * GET /api/v1/leaderboard — the main leaderboard (api_spec.md §leaderboard).
 */

import { NextResponse, type NextRequest } from "next/server";
import { getLeaderboard } from "@/lib/board";
import { SORT_DEFAULT } from "@/lib/constants";
import {
  LEADERBOARD_CACHE_CONTROL,
  serializeLeaderboardEntry,
} from "@/lib/board/api-leaderboard";
import {
  enforceListGate,
  rateLimit,
  rateLimitHeaders,
  rateLimitedResponse,
} from "@/lib/infra/api-gate";

const GATED_NOTE = "top N public; full corpus requires an API key";
const MAX_LIMIT = 2000;
const DEFAULT_LIMIT = 25;

const METRIC_PARAM_TO_SORT: Record<string, string> = {
  yield: "yield_",
  yield_: "yield_",
  velocity: "velocity",
  leverage: "leverage",
  snr: "snr",
  dev10x: "dev10x",
  scale_v: "scaleV",
  scaleV: "scaleV",
  efficiency: "efficiency",
  cost_per_million: "costPerMillion",
  costPerMillion: "costPerMillion",
  op_ratio: "opRatio",
  opRatio: "opRatio",
  signa_rate: "signa_rate",
  compression: "compression_ratio",
  depth: "session_depth",
  volume: "message_volume",
  complexity: "prompt_complexity",
  cross_thread: "cross_thread",
  signal_force: "signal_force",
};

export async function GET(req: NextRequest) {
  const rl = rateLimit(req);
  if (!rl.ok) return rateLimitedResponse(rl);

  const sp = req.nextUrl.searchParams;
  const metricParam = sp.get("metric") ?? "yield";
  const sort = METRIC_PARAM_TO_SORT[metricParam] ?? SORT_DEFAULT;
  const windowParam = sp.get("window") ?? "30d";
  const platformParam = sp.get("platform");
  const classParam = sp.get("class");

  const limitRaw = Number.parseInt(sp.get("limit") ?? "", 10);
  const requestedLimit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const { limit, gated } = enforceListGate(req, requestedLimit);
  const hasPlatformFilter = platformParam && platformParam !== "all";

  const rows = await getLeaderboard({
    window: windowParam,
    windowFilter: true,
    platform: hasPlatformFilter ? platformParam : null,
    perPlatform: !!hasPlatformFilter,
    classScope: classParam ?? undefined,
    sort,
    limit,
  });

  const body = {
    metric: metricParam,
    window: windowParam,
    generated_at: new Date().toISOString(),
    ruleset_version: "1.0",
    total_operators: rows.length,
    entries: rows.map(serializeLeaderboardEntry),
    ...(gated ? { gated: true, note: GATED_NOTE } : {}),
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": LEADERBOARD_CACHE_CONTROL,
      ...rateLimitHeaders(rl),
    },
  });
}
