/**
 * GET /api/v1/operators/{codename}/records — hall records an operator holds
 * (api_spec.md §operators/{codename}/records).
 *
 * The reverse lookup from operator → records. Combines:
 *   - static curated Hall records (getHallOfSignal filtered to this operator)
 *   - dynamic metric records (#1/#2/#3 on each of the 15 metric boards)
 *
 * Reads through the @/lib/data facade so it 200s on seed data with Supabase
 * unset, and 404s only when the codename is genuinely unknown. D19 cache
 * window applies (this is a board read).
 */

import { NextResponse, type NextRequest } from "next/server";
import { getOperatorRecords } from "@/lib/board";
import { rateLimit, rateLimitedResponse } from "@/lib/infra/api-gate";

export const revalidate = 3600;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ codename: string }> },
) {
  // CORPUS gate: best-effort per-IP rate limit blocks per-operator sweep scraping
  // (defense-in-depth). Single-operator reads have no list limit, so only the
  // rate limit applies here.
  const rl = rateLimit(req);
  if (!rl.ok) return rateLimitedResponse(rl.retryAfter);

  const { codename } = await params;
  const result = await getOperatorRecords(codename);

  if (!result) {
    return NextResponse.json(
      {
        status: "not_found",
        detail: `No operator with codename "${codename}".`,
      },
      { status: 404 },
    );
  }

  return NextResponse.json(result, {
    headers: {
      "Cache-Control":
        "public, max-age=300, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
