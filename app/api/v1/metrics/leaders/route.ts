/**
 * GET /api/v1/metrics/leaders — top performers per metric (api_spec.md
 * §metrics/leaders, the "metric pages").
 *
 * `metric` is REQUIRED. Reads through the @/lib/data facade so it 200s on seed
 * data with Supabase unset. Returns the leaderboard payload sorted by the
 * requested metric. D19 cache window applies (this is a board read).
 */

import { NextResponse, type NextRequest } from "next/server";
import { getMetricLeaders } from "@/lib/board";
import {
  LEADERBOARD_CACHE_CONTROL,
  serializeLeaderboardEntry,
} from "@/lib/board/api-leaderboard";
import {
  enforceListGate,
  rateLimit,
  rateLimitedResponse,
} from "@/lib/infra/api-gate";

/** Note surfaced when an unauthenticated caller is clamped to the public top-N. */
const GATED_NOTE = "top N public; full corpus requires an API key";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;

/** Map the metric query alias (api_spec.md) to a metric_snapshots sort column.
 * Covers all 9 canonical metrics (sigarena/lib/prompts.ts) + legacy aliases. */
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
  // CORPUS gate: best-effort per-IP rate limit (defense-in-depth) before any read.
  const rl = rateLimit(req);
  if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

  const sp = req.nextUrl.searchParams;

  const metricParam = sp.get("metric");
  if (!metricParam) {
    return NextResponse.json(
      {
        status: "rejected",
        reason: "metric_required",
        detail: "The `metric` query parameter is required.",
      },
      { status: 400 },
    );
  }
  const sort = METRIC_PARAM_TO_SORT[metricParam];
  if (!sort) {
    return NextResponse.json(
      {
        status: "rejected",
        reason: "metric_invalid",
        detail: `Unknown metric "${metricParam}". Allowed: ${Object.keys(METRIC_PARAM_TO_SORT).join(", ")}.`,
      },
      { status: 400 },
    );
  }

  const windowParam = sp.get("window") ?? "30d";
  const platformParam = sp.get("platform");
  const classParam = sp.get("class");
  const limitRaw = Number.parseInt(sp.get("limit") ?? "", 10);
  const requestedLimit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  // CORPUS gate: unauthenticated callers are clamped to the public top-N; a valid
  // x-api-key lifts the cap for bulk/full corpus reads.
  const { limit, gated } = enforceListGate(req, requestedLimit);

  const hasPlatformFilter = platformParam && platformParam !== "all";

  const rows = await getMetricLeaders(sort, {
    window: windowParam,
    windowFilter: true,
    platform: hasPlatformFilter ? platformParam : null,
    perPlatform: !!hasPlatformFilter,
    classScope: classParam ?? undefined,
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
    headers: { "Cache-Control": LEADERBOARD_CACHE_CONTROL },
  });
}
