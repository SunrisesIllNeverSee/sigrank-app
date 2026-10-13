import { checkDistributedRateLimit } from "@/lib/infra/distributed-rate-limit";
import { trustedClientIp } from "@/lib/mcp/untrusted";

const MCP_RATE = { windowMs: 60_000, max: 120 };

/** Per-IP MCP request cap. Returns a JSON-RPC-shaped 429 Response when denied, else null. */
export async function mcpRateLimitResponse(req: Request, scope: string): Promise<Response | null> {
  const result = await checkDistributedRateLimit(["mcp", scope, trustedClientIp(req.headers)], MCP_RATE, false);
  if (result.ok) return null;
  const retryAfter = Math.max(1, result.retryAfter);
  return Response.json(
    { jsonrpc: "2.0", id: null, error: { code: -32029, message: "Rate limit exceeded. Please retry later.", data: { retry_after_seconds: retryAfter } } },
    { status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" } },
  );
}
