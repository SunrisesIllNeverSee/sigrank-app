/**
 * GET /api/search-index — read-only feed for the title-bar global search
 * (owner 2026-10-21). First-party UI route: returns ONLY what the board
 * already shows publicly (codename, display name, handle, class) for every
 * operator on the all-time board, plus the page index built from the
 * existing content sources (lib/search/page-index). Same projection and
 * cache cadence as /api/live-board; per-IP rate limit applies.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getLiveBoardInitialState } from "@/lib/board";
import { LEADERBOARD_CACHE_CONTROL } from "@/lib/board/api-leaderboard";
import { buildPageIndex } from "@/lib/search/page-index";
import {
  rateLimit,
  rateLimitHeaders,
  rateLimitedResponse,
} from "@/lib/infra/api-gate";

export async function GET(req: NextRequest) {
  const rl = rateLimit(req);
  if (!rl.ok) return rateLimitedResponse(rl);

  const [state, pages] = await Promise.all([
    getLiveBoardInitialState("all_time", { pageSize: 5000 }),
    buildPageIndex(),
  ]);
  const operators = state.operators.map((o) => ({
    codename: o.codename,
    name: o.name,
    handle: o.handle,
    klass: o.klass,
  }));

  return NextResponse.json(
    { operators, pages },
    {
      headers: {
        "Cache-Control": LEADERBOARD_CACHE_CONTROL,
        ...rateLimitHeaders(rl),
      },
    },
  );
}
