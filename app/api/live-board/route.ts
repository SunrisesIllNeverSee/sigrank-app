/**
 * GET /api/live-board — same-origin field feed for the live-board workspace
 * (Phase-2B WS-3, PHASE2B_IMPLEMENTATION_PLAN.md). Returns the workspace's
 * `LiveOperator[]` projection for /board/[window], sliced by offset/limit so
 * the client can hydrate the remaining field after the SSR first page.
 *
 * This is a FIRST-PARTY UI route — /api/v1/leaderboard remains the public
 * API surface. It serves the identical ranking scope the board page renders
 * (getLeaderboard({ windowFilter, operatorTotal, claimedOnly, mode:"all" })
 * via lib/board/live-projection), so client-hydrated rows are byte-identical
 * to SSR rows — the LiveOperator mapping lives server-side only and is never
 * duplicated in the client.
 *
 * Params:
 *   window — route slug ("7d"|"30d"|"90d"|"all") or DB enum ("all_time").
 *            Unknown windows → 400 (problem+json).
 *   offset — rows to skip (default 0). The workspace passes its SSR row
 *            count so hydration resumes exactly where SSR stopped.
 *   limit  — rows to return (default MAX_LIMIT), capped at 2,000 — the same
 *            ceiling as the public API (PUBLIC_TOP_N === MAX_LIMIT, so the
 *            list gate is a no-op here and is not re-applied; the per-IP
 *            rate limit still applies). At ~1,650 ranked operators a single
 *            offset fetch returns the whole remaining field. If the field
 *            ever outgrows 2,000 rows the client must page:
 *            offset += rows.length until operators.length < limit.
 *
 * Response: { window, generated_at, total_operators, offset, limit,
 *             operators: LiveOperator[] }
 *   total_operators is the FULL-scope live denominator (population.count) —
 *   derived from the ranking scope, never a constant, and may exceed
 *   operators.length when pagination applies.
 *
 * Caching: same cadence as /api/v1/leaderboard — Cache-Control 1800s +
 * 3600s stale-while-revalidate; snapshot submission triggers on-demand
 * revalidation of the underlying cached getters.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getLiveBoardInitialState } from "@/lib/board";
import { boardWindowByEnum, windowParamToEnum } from "@/lib/board/windows";
import { LEADERBOARD_CACHE_CONTROL } from "@/lib/board/api-leaderboard";
import {
  rateLimit,
  rateLimitHeaders,
  rateLimitedResponse,
} from "@/lib/infra/api-gate";
import { problemResponse } from "@/lib/infra/problem";

/** Row ceiling per request — matches the public leaderboard cap. */
const MAX_LIMIT = 2000;

export async function GET(req: NextRequest) {
  const rl = rateLimit(req);
  if (!rl.ok) return rateLimitedResponse(rl);

  const sp = req.nextUrl.searchParams;
  const windowEnum = windowParamToEnum(sp.get("window") ?? "all");
  if (!boardWindowByEnum(windowEnum)) {
    return problemResponse({
      status: 400,
      title: "Invalid board window",
      detail: `Unknown live-board window "${sp.get("window")}".`,
      code: "invalid_window",
      hint: "Use one of: 7d, 30d, 90d, all (slugs) or the DB enum (all_time).",
      type: "https://signalaf.com/developers#errors",
      instance: req.nextUrl.pathname,
      headers: rateLimitHeaders(rl),
    });
  }

  const offsetRaw = Number.parseInt(sp.get("offset") ?? "", 10);
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;
  const limitRaw = Number.parseInt(sp.get("limit") ?? "", 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
    : MAX_LIMIT;

  // projectLiveBoard slices operators[] at pageSize; requesting
  // pageSize = offset + limit covers the slice without a second code path.
  // Full-scope aggregates are recomputed but only the row slice + the
  // denominator ship in this envelope.
  const state = await getLiveBoardInitialState(windowEnum, {
    pageSize: offset + limit,
  });
  const operators = state.operators.slice(offset, offset + limit);

  return NextResponse.json(
    {
      window: windowEnum,
      generated_at: state.meta.generatedAt,
      total_operators: state.totalOperators,
      offset,
      limit,
      operators,
    },
    {
      headers: {
        "Cache-Control": LEADERBOARD_CACHE_CONTROL,
        ...rateLimitHeaders(rl),
      },
    },
  );
}
