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
