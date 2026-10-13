/**
 * GET /api/v1/premium/cascade-report — unavailable until real reports are implemented.
 * No payment is requested or processed while this endpoint is unavailable.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { error: "Premium report is not available yet.", code: "REPORT_NOT_IMPLEMENTED", payment_required: false },
    { status: 501, headers: { "Cache-Control": "no-store" } },
  );
}
