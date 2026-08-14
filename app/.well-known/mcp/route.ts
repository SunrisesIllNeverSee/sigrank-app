/**
 * app/.well-known/mcp/route.ts — MCP endpoint discovery.
 *
 * Redirects to the MCP server descriptor at /.well-known/mcp.json.
 * Some agents check /.well-known/mcp (without .json) for discovery.
 */

import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET() {
  return NextResponse.json(
    {
      endpoint: "/.well-known/mcp.json",
      message: "See /.well-known/mcp.json for the MCP server descriptor",
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
        Link: '</.well-known/mcp.json>; rel="describedby"',
      },
    },
  );
}
