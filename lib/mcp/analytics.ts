/**
 * lib/mcp/analytics.ts — PostHog MCP analytics options shared by both SigRank
 * MCP servers: the main `sigrank` server and the Analyst connector
 * (`sigrank-signalaf`, behind the ChatGPT app and the Claude plugin).
 *
 * Every event gets two extra properties so the dashboards are usable:
 *   - `sigrank_mcp_surface`: chatgpt | claude | codex | other | unknown, read
 *     from the client name and User-Agent (best effort; both are unverified).
 *   - `sigrank_traffic`: "probe" for monitors, registries, indexers and other
 *     bots, else "client". Most traffic to both servers is bots, so filter on
 *     `sigrank_traffic = client` to see real use.
 *
 * Patterns come from the client names seen in PostHog (project 491591) on
 * 2026-11-11: real apps were `claude-ai` / `Claude-User/1.0 (Anthropic MCP
 * client)`, `claude-code` and `codex-mcp-client`; ~90% of connections were bots.
 */
import { instrument, type MCPAnalyticsOptions } from "@posthog/mcp";
import type { PostHog } from "posthog-node";

type Surface = "chatgpt" | "claude" | "codex" | "other" | "unknown";

const PROBE =
  /probe|sentinel|scan|monitor|uptime|health|liveness|census|crawl|collector|harvest|index|catalog|registry|bench|trust|watch|archive|tripwire|glama|\bcheck|bot\b|bot\/|spike/i;

const CHATGPT = /openai-mcp|chatgpt|openai/i;
const CLAUDE = /claude-ai|claude-user|claude-code|claude desktop|claude-desktop|anthropic/i;
const CODEX = /codex-mcp-client|codex[-_ ]cli|^codex$/i;

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function mcpSurface(clientName: string, userAgent: string): Surface {
  const seen = `${clientName} ${userAgent}`;
  if (!seen.trim()) return "unknown";
  if (CODEX.test(clientName) || CODEX.test(userAgent)) return "codex";
  if (CHATGPT.test(seen)) return "chatgpt";
  if (CLAUDE.test(seen)) return "claude";
  return "other";
}

export function mcpTraffic(clientName: string, userAgent: string): "probe" | "client" {
  return PROBE.test(`${clientName} ${userAgent}`) ? "probe" : "client";
}

export function mcpAnalyticsOptions(): MCPAnalyticsOptions {
  return {
    // Keep the published tool schemas exactly as written: in @posthog/mcp 0.25
    // these features inject extra tool parameters (conversation_id, llm_model,
    // context) by default, with context and llm_model marked required.
    enableConversationId: false,
    captureModel: false,
    context: false,
    // isError results are expected user errors (unknown operator, bad
    // arguments), not bugs; they stay on $mcp_tool_call, out of error tracking.
    enableExceptionAutocapture: false,
    ...(process.env.VERCEL_GIT_COMMIT_SHA ? { serverBuild: process.env.VERCEL_GIT_COMMIT_SHA } : {}),
    beforeSend: event => {
      const props = event.properties;
      const clientName = text(props.$mcp_client_name);
      const userAgent = text(props.$mcp_client_user_agent);
      props.sigrank_mcp_surface = mcpSurface(clientName, userAgent);
      props.sigrank_traffic = mcpTraffic(clientName, userAgent);
      return event;
    },
  };
}

export function instrumentMcp(server: unknown, posthog: PostHog | null): void {
  if (!posthog) return;
  instrument(server, posthog, mcpAnalyticsOptions());
}
