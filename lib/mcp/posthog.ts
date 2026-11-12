/**
 * lib/mcp/posthog.ts — the PostHog client behind MCP analytics ($mcp_* events).
 *
 * Shared by the SigRank MCP server (lib/mcp/server.ts) and the Analyst plugin
 * server (lib/mcp/plugin/server.ts). Null when no token is configured:
 * analytics is additive and must never break a server.
 */
import { PostHog } from "posthog-node";

// Module-scope PostHog client for MCP analytics — created once, flushed per invocation.
// Guards against a missing token: analytics is additive and must never break the server.
// Reads the SAME env vars as the existing PostHog integration (lib/infra/posthog/*),
// including the Vercel PostHog integration fallbacks.
const _phToken = process.env.POSTHOG_KEY
  || process.env.POSTHOG_PROJECT_TOKEN
  || process.env.NEXT_PUBLIC_POSTHOG_KEY
  || process.env.NEXT_PUBLIC_sigrank_POSTHOG_PROJECT_TOKEN
  || process.env.sigrank_POSTHOG_PROJECT_TOKEN;
const _phHost = process.env.NEXT_PUBLIC_POSTHOG_HOST
  || process.env.POSTHOG_HOST
  || process.env.NEXT_PUBLIC_sigrank_POSTHOG_HOST
  || "https://us.i.posthog.com";
export const posthogMcp: PostHog | null = _phToken
  ? new PostHog(_phToken, {
      host: _phHost,
      flushAt: 1,
      flushInterval: 0,
      requestTimeout: 5000,
      enableExceptionAutocapture: true,
    })
  : null;
