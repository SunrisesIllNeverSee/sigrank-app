/**
 * POST /api/board/retry?window=<slug> — retry affordance for the live-board
 * unavailable state.
 *
 * The board pages are ISR-cached (revalidate=3600): once a render resolves to
 * the unavailable state it stays pinned until the TTL expires, so a plain
 * client reload can't observe a recovered data layer inside the window. This
 * route revalidatePath()s the requested window — the only mechanism that
 * forces regeneration — after a cheap liveness probe confirms the data layer
 * is back (avoids re-rendering into the same unavailable state).
 *
 * Rate-limited like every public API route (cache-bust endpoints are a mild
 * DoS amplifier — each call forces a regenerate + DB read).
 */

import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { boardWindowBySlug, boardWindowByEnum } from "@/lib/board/windows";
import { getLiveBoard } from "@/lib/board";
import {
  rateLimit,
  rateLimitHeaders,
  rateLimitedResponse,
} from "@/lib/infra/api-gate";

export async function POST(req: NextRequest) {
  const rl = rateLimit(req);
  if (!rl.ok) return rateLimitedResponse(rl);

  // Accept either the URL slug ('30d') or the DB enum ('all_time').
  const param = req.nextUrl.searchParams.get("window") ?? "";
  const win = boardWindowBySlug(param) ?? boardWindowByEnum(param);
  if (!win) {
    return NextResponse.json(
      { error: `invalid window '${param}' — expected 7d|30d|90d|all(_time)` },
      { status: 400 },
    );
  }

  // Liveness probe: if the live read is still unavailable (or throws), the
  // board would just regenerate into the same state — report it instead of
  // burning a render. 'unavailable' results are memo-evicted upstream, so
  // this always reads the fresh ladder.
  let board;
  try {
    board = await getLiveBoard({ window: win.enum, breakdown: "total" });
  } catch {
    board = null;
  }
  if (!board || board.source === "unavailable") {
    return NextResponse.json(
      { ok: false, source: board?.source ?? "unavailable" },
      { status: 503, headers: rateLimitHeaders(rl) },
    );
  }

  revalidatePath(`/board/${win.slug}`);
  return NextResponse.json(
    { ok: true, source: board.source },
    { headers: rateLimitHeaders(rl) },
  );
}
