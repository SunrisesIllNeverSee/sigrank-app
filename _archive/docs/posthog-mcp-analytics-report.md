# PostHog MCP Analytics — Setup Report

## Summary

The SignalAF MCP server (`lib/mcp/server.ts`) has been instrumented with PostHog MCP analytics using `@posthog/mcp@0.12.0`. Every tool call handled by the server will now emit `$mcp_tool_call` events to PostHog, alongside `$mcp_initialize` and `$mcp_tools_list` events.

## Server context

| Property | Value |
|---|---|
| Language | TypeScript |
| MCP SDK | `@modelcontextprotocol/server` (v2) |
| Instrumentation path | Path A — official `McpServer` object |
| Transport | Streamable HTTP (stateless, per-request factory via `createMcpHandler`) |
| Entry point | `lib/mcp/server.ts` → `createSigrankServer()` |
| Route | `app/api/mcp/route.ts` |

## Changes made

### `package.json`
- Added `@posthog/mcp: "0.12.0"` (pinned, pre-1.0 beta; ≥ 0.11.2 required for `@modelcontextprotocol/server` v2 support)

### `lib/mcp/server.ts`
- Imported `PostHog` from `posthog-node` and `instrument` from `@posthog/mcp`
- Added module-scope `posthogMcp` singleton (`PostHog | null`), created once with `flushAt: 1, flushInterval: 0, enableExceptionAutocapture: true` for serverless compatibility; guards against missing `POSTHOG_PROJECT_TOKEN` so analytics is never load-bearing
- Added `instrument(server, posthogMcp)` call immediately after `new McpServer()` inside `createSigrankServer()` — all 16 tools registered afterwards are automatically captured
- Exported `posthogMcp` so the route handler can flush it per invocation

### `app/api/mcp/route.ts`
- Imported `posthogMcp` from `@/lib/mcp/server`
- Changed the three route handlers (POST, GET, DELETE) to `await` `mcpHandler.fetch()` and then call `await posthogMcp?.flush()` before returning — ensures events are sent before Vercel freezes the function

### `bun.lock`
- Updated lockfile with `@posthog/mcp@0.12.0` and its dependencies

## Credentials

`POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` were already set in `.env.local` — no changes needed.

The server reads them via `process.env.POSTHOG_PROJECT_TOKEN` and `process.env.POSTHOG_HOST`.

## Events you will see

Once the server handles its next request, `$mcp_*` events appear in your PostHog project:

| Event | When |
|---|---|
| `$mcp_initialize` | MCP client connects and sends `initialize` |
| `$mcp_tools_list` | Client requests the tool list |
| `$mcp_tool_call` | Any of the 16 SigRank tools is invoked |
| `$exception` | A tool throws or returns `isError: true` |

Each event carries `$mcp_tool_name`, `$mcp_duration_ms`, `$mcp_is_error`, `$mcp_client_name`, `$mcp_client_version`, and `$mcp_protocol_version`.

## Manual steps

1. **Production env vars** — ensure `POSTHOG_PROJECT_TOKEN` and `POSTHOG_HOST` are set in your Vercel project environment variables (`.env.local` is local-only).

2. **Dashboard** — see the full event reference and pre-built dashboard at https://posthog.com/docs/mcp-analytics

3. **Beta SDK notice** — `@posthog/mcp` is pre-1.0 and pinned at `0.12.0`; review the changelog before upgrading.

4. **`$mcp_client_name` on 2025-11-25 traffic** — because `createSigrankServer()` creates a fresh `McpServer` per request, the SDK bridges the client name via a session token in the `Mcp-Session-Id` response header. This requires `enableJsonResponse: true` on the transport to reach the wire; if absent, `$mcp_client_name` may be missing on older clients. `$mcp_protocol_version` is always present.
