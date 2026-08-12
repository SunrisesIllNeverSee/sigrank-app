import { NextResponse } from "next/server";
import { bumpComparisonsRan } from "@/lib/board/queries";

/**
 * POST /api/v1/stats/compare-bump — increments the "comparisons_ran" site
 * counter. Called client-side by TrackCompareView when both operands are
 * user-chosen (not the default landing). Fire-and-forget; errors are swallowed
 * by bumpComparisonsRan itself.
 *
 * This was previously done server-side in the /compare page (with headers()
 * prefetch detection), but moved to a client-side API call so the /compare
 * page can be ISR (no headers() = no dynamic rendering).
 */
export const dynamic = "force-dynamic";

export async function POST() {
  await bumpComparisonsRan();
  return NextResponse.json({ ok: true });
}
