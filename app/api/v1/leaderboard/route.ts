/**
 * GET /api/v1/leaderboard — the main leaderboard (api_spec.md §leaderboard).
 *
 * LIVE SCOPE (2026-09-26): `?scope=live` opts into the live-board contract
 * (lib/board/live.ts) — the population the public board pages render:
 * claimed operators + The Field baseline, eligible-filtered before rank/
 * limit, with provenance + population meta in the response. `breakdown`
 * selects the row shape: 'total' (default; one operator-total row per
 * operator) or 'platforms' (one row per operator×platform).
 *
 * Without `scope`, the legacy behaviour is preserved byte-for-byte: the full
 * field (including unclaimed seed operators), windowFilter on the given
 * window_type, and the implicit platform→perPlatform collapse.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getLeaderboard, getLiveBoard } from "@/lib/board";
import { SORT_DEFAULT } from "@/lib/constants";
import {
  LEADERBOARD_CACHE_CONTROL,
  serializeLeaderboardEntry,
} from "@/lib/board/api-leaderboard";
import { boardWindowByEnum, boardWindowBySlug } from "@/lib/board/windows";
import type { LiveBoardBreakdown } from "@/lib/board/live";
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

const BREAKDOWNS: ReadonlySet<string> = new Set(["total", "platforms"]);

/**
 * Normalize the `window` param: accept either the URL slug ('all') or the DB
 * enum ('all_time') — they name the same window; unknown values pass through
 * unchanged (legacy behaviour: they simply match no window_type).
 */
function normalizeWindowParam(w: string): string {
  return boardWindowBySlug(w)?.enum ?? boardWindowByEnum(w)?.enum ?? w;
}

export async function GET(req: NextRequest) {
  const rl = rateLimit(req);
  if (!rl.ok) return rateLimitedResponse(rl);

  const sp = req.nextUrl.searchParams;
  const metricParam = sp.get("metric") ?? "yield";
  const sort = METRIC_PARAM_TO_SORT[metricParam] ?? SORT_DEFAULT;
  const windowParam = sp.get("window") ?? "30d";
  const windowEnum = normalizeWindowParam(windowParam);
  const platformParam = sp.get("platform");
  const classParam = sp.get("class");
  const scopeParam = sp.get("scope");
  const breakdownParam = sp.get("breakdown") ?? "total";

  const limitRaw = Number.parseInt(sp.get("limit") ?? "", 10);
  const requestedLimit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  const { limit, gated } = enforceListGate(req, requestedLimit);
  const hasPlatformFilter = platformParam && platformParam !== "all";

  // ── Live-board scope: validated params, live population, provenance. ──
  if (scopeParam === "live") {
    if (!BREAKDOWNS.has(breakdownParam)) {
      return NextResponse.json(
        { error: `invalid breakdown '${breakdownParam}' — expected total|platforms` },
        { status: 400 },
      );
    }
    if (!boardWindowByEnum(windowEnum)) {
      return NextResponse.json(
        { error: `invalid window '${windowParam}' — expected 7d|30d|90d|all(_time)` },
        { status: 400 },
      );
    }
    const board = await getLiveBoard({
      window: windowEnum,
      breakdown: breakdownParam as LiveBoardBreakdown,
      platform: hasPlatformFilter ? platformParam : null,
      classScope: classParam ?? undefined,
      sort,
      limit,
    });
    const entries = board.rows.map(serializeLeaderboardEntry);
    return NextResponse.json(
      {
        metric: metricParam,
        window: windowEnum,
        scope: "live",
        breakdown: breakdownParam,
        generated_at: new Date().toISOString(),
        ruleset_version: "1.0",
        // Counts the shell names honestly: the eligible population BEFORE
        // filters/limit, the distinct operators actually returned, and the
        // row count (per-platform breakdown can exceed operator count).
        population: board.population,
        operators_returned: board.returnedOperators,
        total_operators: board.returnedOperators,
        returned_rows: entries.length,
        source: board.source,
        source_date: board.sourceDate,
        entries,
        ...(gated ? { gated: true, note: GATED_NOTE } : {}),
      },
      {
        headers: {
          "Cache-Control": LEADERBOARD_CACHE_CONTROL,
          ...rateLimitHeaders(rl),
        },
      },
    );
  }

  // ── Legacy scope (unchanged): full field incl. unclaimed seeds. ──
  const rows = await getLeaderboard({
    window: windowEnum,
    windowFilter: true,
    platform: hasPlatformFilter ? platformParam : null,
    perPlatform: !!hasPlatformFilter,
    classScope: classParam ?? undefined,
    sort,
    limit,
  });

  const body = {
    metric: metricParam,
    window: windowEnum,
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
