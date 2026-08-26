/**
 * GET /api/v1/premium/insights — x402-protected premium operator insights.
 *
 * Returns deep-dive analytics including cascade analysis, archetype
 * distribution, and efficiency projections. Protected by the x402 payment
 * protocol — agents without a valid payment receive HTTP 402 with payment
 * requirements that they can fulfill automatically.
 */

import { NextResponse, type NextRequest } from "next/server";
import { withX402 } from "@x402/next";
import { getX402Server, x402Config } from "@/lib/x402";

export const dynamic = "force-dynamic";

const handler = async (_request: NextRequest): Promise<NextResponse> => {
  const insights = {
    type: "premium-insights",
    description:
      "Deep-dive analytics: cascade analysis, archetype distribution, and efficiency projections",
    data: {
      archetype_distribution: {
        HighYield: { count: 142, avg_yield: 18436.98 },
        HighLeverage: { count: 89, avg_leverage: 12.4 },
        HighVelocity: { count: 67, avg_velocity: 3.2 },
        Balanced: { count: 234, avg_yield: 8200.5 },
      },
      efficiency_projections: {
        top_quartile_trend: "improving",
        median_yield_delta_30d: 4.2,
        cache_read_adoption_rate: 0.78,
      },
      cascade_summary: {
        avg_input_tokens: 125000,
        avg_output_tokens: 89000,
        avg_cache_read_tokens: 340000,
        avg_cache_write_tokens: 45000,
        avg_yield: 18436.98,
      },
    },
  };

  return NextResponse.json(insights, {
    headers: { "Cache-Control": "private, max-age=300" },
  });
};

export const GET = withX402(
  handler,
  {
    accepts: {
      scheme: "exact",
      price: "$0.01",
      network: x402Config.network,
      payTo: x402Config.payTo,
    },
    description: "Premium operator insights — cascade analysis, archetype distribution, and efficiency projections",
  },
  getX402Server(),
);
