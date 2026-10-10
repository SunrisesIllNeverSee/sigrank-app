export const ANONYMOUS_ANALYST_HOST = "analyst.signalaf.com";
export const ANONYMOUS_ANALYST_MCP_PATH = "/api/plugins/sigrank/mcp";

export function anonymousAnalystRoute(
  hostname: string,
  pathname: string,
): "public" | "blocked" | null {
  if (hostname.toLowerCase() !== ANONYMOUS_ANALYST_HOST) return null;
  return pathname === ANONYMOUS_ANALYST_MCP_PATH ||
    pathname === "/.well-known/openai-apps-challenge"
    ? "public"
    : "blocked";
}

export function anonymousAnalystChallenge(method: string): Response {
  if (method !== "GET" && method !== "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  return new Response(
    method === "HEAD" ? null : "BcUWbu8C0IdvuJ0MtTnzQzMcajWl2xL7hHqN8XQy6To\n",
    { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } },
  );
}
