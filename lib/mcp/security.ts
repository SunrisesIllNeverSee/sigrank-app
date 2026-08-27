/**
 * lib/mcp/security.ts — Origin validation and security helpers for MCP routes.
 *
 * Extracted from lib/mcp/protocol.ts as Phase 2 of the MCP structural
 * renovation. protocol.ts re-exports allowedOrigin from here for backward
 * compatibility.
 */

import type { NextRequest } from "next/server";

export function allowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  return origin === req.nextUrl.origin;
}
