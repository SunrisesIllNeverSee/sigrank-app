/**
 * lib/mcp/plugin/analytics.ts — PostHog MCP analytics for the Analyst connector
 * (the server behind the ChatGPT app and the Claude plugin).
 *
 * Every tool call becomes a `$mcp_tool_call` event under the server name
 * `sigrank-signalaf`, kept apart from the main `sigrank` MCP server. Two extra
 * properties make the dashboards usable:
 *   - `sigrank_mcp_surface`: chatgpt | claude | codex | other | unknown, read
 *     from the client name and User-Agent (best effort; both are unverified).
 *   - `sigrank_traffic`: "probe" for monitors and scanners, else "client", so
 *     probe traffic can be filtered out instead of drowning real usage.
 */
import { instrument, type MCPAnalyticsOptions } from "@posthog/mcp";
import type { PostHog } from "posthog-node";

type Surface = "chatgpt" | "claude" | "codex" | "other" | "unknown";

const PROBE = /probe|sentinel|scanner|aisonar|healthcheck|uptime|monitor/i;

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function analystSurface(clientName: string, userAgent: string): Surface {
  const seen = `${clientName} ${userAgent}`;
  if (!seen.trim()) return "unknown";
  if (/codex/i.test(seen)) return "codex";
  if (/openai|chatgpt/i.test(seen)) return "chatgpt";
  if (/claude|anthropic/i.test(seen)) return "claude";
  return "other";
}

export function analystTraffic(clientName: string, userAgent: string): "probe" | "client" {
  return PROBE.test(`${clientName} ${userAgent}`) ? "probe" : "client";
}

export function analystAnalyticsOptions(): MCPAnalyticsOptions {
  return {
    // Keep the published tool schemas exactly as reviewed: these features
    // inject extra tool parameters (conversation_id, llm_model, context) by default.
    enableConversationId: false,
    captureModel: false,
    context: false,
    // isError results here are expected user errors (unknown operator, bad
    // arguments), not bugs; keep them out of error tracking.
    enableExceptionAutocapture: false,
    ...(process.env.VERCEL_GIT_COMMIT_SHA ? { serverBuild: process.env.VERCEL_GIT_COMMIT_SHA } : {}),
    beforeSend: event => {
      const props = event.properties;
      const clientName = text(props.$mcp_client_name);
      const userAgent = text(props.$mcp_client_user_agent);
      props.sigrank_mcp_surface = analystSurface(clientName, userAgent);
      props.sigrank_traffic = analystTraffic(clientName, userAgent);
      return event;
    },
  };
}

export function instrumentAnalyst(server: unknown, posthog: PostHog | null): void {
  if (!posthog) return;
  instrument(server, posthog, analystAnalyticsOptions());
}
