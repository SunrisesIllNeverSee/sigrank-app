/**
 * app/api/exchange/observability/summary/route.ts
 *
 * Owner-facing aggregate observability API for MCP and WebMCP usage.
 * Returns aggregated counts and funnel metrics, not raw rows.
 *
 * Authentication: requires authenticated admin/owner Supabase session.
 * Filters: period, domain, transport, tool, result
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getObservabilitySummary } from "@/lib/exchange/mcp-observability";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Verify admin/owner authentication
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  // Create a client with the user's token to verify their role
  const userClient = createClient(supabaseUrl, token, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
  }

  // Check admin/owner role
  const { data: profile } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "owner"].includes(profile.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  // Parse filters
  const url = new URL(req.url);
  const filters = {
    period: url.searchParams.get("period") ?? "7d",
    domain: url.searchParams.get("domain") ?? undefined,
    transport: (url.searchParams.get("transport") as "remote_mcp" | "webmcp" | "direct_http") ?? undefined,
    tool: url.searchParams.get("tool") ?? undefined,
    result: (url.searchParams.get("result") as "success" | "error" | "denied" | "rate_limited" | "invalid_request") ?? undefined,
  };

  const summary = await getObservabilitySummary(filters);

  return NextResponse.json({
    filters,
    ...summary,
    data_sources: {
      durable: "Supabase (exchange_mcp_calls)",
      behavioral: "PostHog (exchange_mcp_call event)",
      operational: "Vercel request telemetry",
    },
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
