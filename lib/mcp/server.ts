/**
 * lib/mcp/server.ts — SignalAF MCP server built on the official MCP SDK v2.
 *
 * Creates an McpServer instance with all 15 SigRank tools, 6 resources, and
 * 5 prompts registered. Uses the SDK's native protocol negotiation, capability
 * declaration, and Streamable HTTP transport.
 *
 * The server factory is called per-request by createMcpHandler (stateless mode).
 *
 * Extension points for future MO§ES canon integration:
 *   - Additional tools can be registered via server.registerTool()
 *   - Additional resources can be registered via server.registerResource()
 *   - Additional prompts can be registered via server.registerPrompt()
 *   - Transport/protocol code does NOT need to change for canon additions
 */

import {
  McpServer,
  fromJsonSchema,
  type StandardSchemaWithJSON,
  type CallToolResult,
  type ReadResourceCallback,
  type PromptCallback,
} from "@modelcontextprotocol/server";
import { TOOLS, callTool } from "@/lib/mcp/tools";
import { RESOURCES, readResource } from "@/lib/mcp/resources";
import { PROMPTS, getPrompt } from "@/lib/mcp/prompts";
import {
  observabilityFromRequest,
  recordToolCallResult,
  type ToolCallObservability,
} from "@/lib/mcp/telemetry";
import type { NextRequest } from "next/server";

/**
 * Create a SignalAF MCP server with all tools, resources, and prompts registered.
 *
 * This factory is called per-request by the Streamable HTTP transport handler.
 * Each request gets a fresh server instance (stateless mode).
 *
 * The optional `req` parameter is passed to callTool for tools that need
 * request context (e.g., for shareable URL generation).
 */
export function createSigrankServer(req?: NextRequest): McpServer {
  // Extract per-request observability context (stamped onto the request by the
  // route via x-mcp-start-time / x-request-id headers) so tool handlers can
  // record the ACTUAL result and duration after callTool completes.
  const obs: ToolCallObservability | undefined = req
    ? observabilityFromRequest(req)
    : undefined;

  const server = new McpServer(
    {
      name: "sigrank",
      version: "1.0.0",
      title: "SigRank SignalAF",
      description:
        "AI operator benchmark measuring token-cascade efficiency from privacy-preserving telemetry.",
      websiteUrl: "https://signalaf.com",
    },
    {
      capabilities: {
        tools: {},
        resources: { subscribe: false },
        prompts: {},
      },
    },
  );

  // ── Register all 15 SigRank tools ──────────────────────────────────────
  // Each tool's handler delegates to the existing callTool dispatcher,
  // preserving the exact behavior from the pre-migration implementation.
  // fromJsonSchema wraps raw JSON Schema into StandardSchema for the SDK.
  for (const tool of TOOLS) {
    const toolName = tool.name;
    const inputSchema = fromJsonSchema(
      tool.inputSchema as Record<string, unknown>,
    ) as StandardSchemaWithJSON<Record<string, unknown>, Record<string, unknown>>;
    const outputSchema =
      "outputSchema" in tool && tool.outputSchema
        ? (fromJsonSchema(
            tool.outputSchema as Record<string, unknown>,
          ) as StandardSchemaWithJSON<Record<string, unknown>, Record<string, unknown>>)
        : undefined;

    const toolConfig = {
      title: tool.title,
      description: tool.description,
      annotations: tool.annotations,
      inputSchema,
      ...(outputSchema ? { outputSchema } : {}),
    };

    const toolHandler = async (
      args: Record<string, unknown>,
    ): Promise<CallToolResult> => {
      const toolArgs =
        args && typeof args === "object" && !Array.isArray(args)
          ? (args as Record<string, unknown>)
          : {};
      const result = (await callTool(
        toolName,
        toolArgs,
        req!,
      )) as CallToolResult;

      // Record observability with the ACTUAL result and ACTUAL duration
      // (measured from request start through tool execution). This restores
      // the pre-migration observability semantics that the route used to own
      // before the SDK v2 migration moved tool dispatch into the SDK handler.
      if (obs) {
        await recordToolCallResult(obs, toolName, result).catch(() => {
          // Observability must never break the request
        });
      }

      // callTool returns { content: [{ type: "text", text: "..." }], isError?: boolean }.
      // When the tool declares an outputSchema, the SDK validates structuredContent
      // against it. Extract structuredContent from the text content (which is the
      // JSON-serialized result data) so the SDK's output validation passes.
      if (
        outputSchema &&
        result.content?.[0] &&
        "text" in result.content[0] &&
        !result.structuredContent
      ) {
        try {
          const structured = JSON.parse(result.content[0].text);
          return { ...result, structuredContent: structured };
        } catch {
          // Text content isn't JSON — return as-is (SDK will flag validation error)
          return result;
        }
      }
      return result;
    };

    server.registerTool(toolName, toolConfig, toolHandler);
  }

  // ── Register all 6 resources ───────────────────────────────────────────
  for (const resource of RESOURCES) {
    const resourceConfig = {
      description: resource.description,
      mimeType: resource.mimeType,
    };

    const resourceHandler: ReadResourceCallback = async (uri) => {
      const result = await readResource(uri.href);
      if (!result) {
        return { contents: [] };
      }
      return result;
    };

    server.registerResource(
      resource.name,
      resource.uri,
      resourceConfig,
      resourceHandler,
    );
  }

  // ── Register all 5 prompts ─────────────────────────────────────────────
  for (const prompt of PROMPTS) {
    const promptName = prompt.name;
    const promptConfig = {
      title: prompt.title,
      description: prompt.description,
    };

    const promptHandler: PromptCallback<StandardSchemaWithJSON> = (args) => {
      const promptArgs =
        args && typeof args === "object"
          ? (args as Record<string, string | number>)
          : {};
      const result = getPrompt(promptName, promptArgs);
      if (!result) {
        return { messages: [] };
      }
      // getPrompt returns role: string; the SDK expects role: "user" | "assistant".
      // All prompt messages use role: "user" — cast to satisfy the SDK's narrower type.
      return result as { messages: Array<{ role: "user" | "assistant"; content: { type: "text"; text: string } }> };
    };

    server.registerPrompt(promptName, promptConfig, promptHandler);
  }

  return server;
}

/**
 * Server metadata for discovery and identification.
 */
export const SERVER_INFO = {
  name: "sigrank",
  title: "SigRank SignalAF",
  version: "1.0.0",
  description:
    "AI operator benchmark measuring token-cascade efficiency from privacy-preserving telemetry.",
  websiteUrl: "https://signalaf.com",
} as const;

/**
 * Instructions sent to clients during initialization.
 */
export const SERVER_INSTRUCTIONS =
  "Use SignalAF to benchmark AI operators from privacy-preserving token telemetry. Benchmark tools: rank_paste (compute cascade from 4 token counts), get_leaderboard (public rankings), get_operator (operator profile by codename). Analytical tools (pure math): simulate_change, diagnose_cascade, suggest_improvements, self_improve, rank_windows. Field-relative tools: benchmark_me, rank_if, operator_gap, field_anomaly, who_operates_like_me, compare_to_field, operator_signature. Contribution Exchange tools are now available at a dedicated MCP endpoint: https://signalaf.com/api/exchange/mcp. Do not treat benchmark metrics as a model-quality or downstream-productivity benchmark.";
