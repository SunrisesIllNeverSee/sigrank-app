import { McpServer, fromJsonSchema, type StandardSchemaWithJSON, type CallToolResult } from "@modelcontextprotocol/server";
import contracts from "./contracts.json";
import { callPluginTool } from "./service";

export function createPluginServer(request: Request): McpServer {
  const server = new McpServer(
    { name: "sigrank-signalaf", title: "SigRank | SignalAF", version: "1.0.0", websiteUrl: "https://signalaf.com" },
    { capabilities: { tools: {} }, instructions: "Tokenpull measures → SigRank evaluates → SignalAF publishes. Metrics describe observable AI operating structure, not intelligence, productivity, or work quality. Archetypes are operating patterns, not personality. Public exploration does not scan local logs." },
  );
  for (const tool of contracts.tools) {
    const inputSchema = fromJsonSchema(tool.inputSchema as Record<string, unknown>) as StandardSchemaWithJSON<Record<string, unknown>, Record<string, unknown>>;
    const outputSchema = fromJsonSchema(tool.outputSchema as Record<string, unknown>) as StandardSchemaWithJSON<Record<string, unknown>, Record<string, unknown>>;
    server.registerTool(tool.name, {
      title: tool.title, description: tool.description, inputSchema, outputSchema,
      annotations: tool.annotations,
      _meta: { securitySchemes: tool.securitySchemes },
    }, async (args: Record<string, unknown>): Promise<CallToolResult> => {
      const result = await callPluginTool(tool.name, args, request);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
        ...(result.status === "error" ? { isError: true } : {}),
        ...(result.status === "error" && result.error?.code === "AUTH_REQUIRED"
          ? { _meta: { "mcp/www_authenticate": ['Bearer resource_metadata="https://signalaf.com/.well-known/oauth-protected-resource", scope="profile", error="invalid_token", error_description="Connect your SignalAF account to continue"'] } }
          : {}),
      };
    });
  }
  return server;
}
