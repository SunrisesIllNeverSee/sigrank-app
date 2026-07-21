/**
 * GET /api/v1/hall-of-signal — prestige / achievements board
 * (api_spec.md §hall-of-signal).
 *
 * Reads through the @/lib/data facade so it 200s on seed data with Supabase
 * unset. Emits the api_spec `categories[]` shape, distinguishing two record
 * kinds:
 *   - single-op records   → { value, operator, achieved_at }
 *   - multi-recipient      → { operators: [...] }  (e.g. RW.34 Fivefold Hold)
 *
 * The mock dataset carries the single-op records (RW.28..RW.33). The
 * multi-recipient Fivefold Hold (RW.34) is a known multi-recipient catalog entry
 * with no seeded recipients yet, so it is emitted with an empty operators[] and
 * marked as a placeholder.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getHallOfSignal } from "@/lib/board";
import { REWARDS } from "@/lib/identity/canon-ids";
import { rateLimit, rateLimitedResponse } from "@/lib/infra/api-gate";

const FIVEFOLD_HOLD_REWARD_ID = "RW.34";

export async function GET(req: NextRequest) {
  // CORPUS gate (Gate #3): best-effort per-IP rate limit before any read. The
  // hall is a public read and was the one /api/v1 endpoint left unguarded. It
  // serves prestige records (not the bulk corpus), so it needs the rate limit
  // but no list-size gate. rateLimit degrades open, so it can't break the read.
  const rl = rateLimit(req);
  if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

  const records = await getHallOfSignal();

  // Single-op record categories (RW.28..RW.33).
  const singleOp = records.map((r) => ({
    reward_id: r.reward_id,
    name: r.title,
    value: r.value,
    operator: r.operator_codename,
    achieved_at: r.date,
    is_placeholder: r.isPlaceholder,
  }));

  // Multi-recipient category — Fivefold Hold (RW.34). No seeded recipients yet.
  const fivefold = REWARDS[FIVEFOLD_HOLD_REWARD_ID];
  const multiRecipient = [
    {
      reward_id: FIVEFOLD_HOLD_REWARD_ID,
      name: "Fivefold Hold Recipients",
      operators: [] as string[],
      is_placeholder: true,
      note: fivefold?.reward,
    },
  ];

  const body = {
    generated_at: "2026-05-19T00:00:00Z",
    categories: [...singleOp, ...multiRecipient],
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control":
        "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
