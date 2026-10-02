import type { NextRequest } from "next/server";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { allowedOrigin } from "@/lib/mcp/protocol";
import { createPluginServer } from "@/lib/mcp/plugin/server";
import contracts from "@/lib/mcp/plugin/contracts.json";

export const runtime = "nodejs";

const handler = createMcpHandler(({ requestInfo }) => createPluginServer(requestInfo ?? new Request("https://signalaf.com/api/plugins/sigrank/mcp")));

export async function POST(req: NextRequest) {
  if (!allowedOrigin(req)) return new Response("Forbidden", { status: 403 });
  // The pinned SDK accepts securitySchemes in _meta but does not expose the
  // standard top-level field in tools/list. Decorate this endpoint's list only;
  // tool execution and all other protocol messages remain SDK-owned.
  let listRequest = false;
  try { listRequest = (await req.clone().json()).method === "tools/list"; } catch { /* SDK owns parse errors */ }
  const response = await handler.fetch(req);
  if (!listRequest || !response.ok) return response;
  const schemes = new Map(contracts.tools.map(tool => [tool.name, tool.securitySchemes]));
  const decorate = (message: string) => {
    try {
      const parsed = JSON.parse(message);
      const tools = parsed?.result?.tools;
      if (!Array.isArray(tools)) return message;
      for (const tool of tools) if (schemes.has(tool.name)) tool.securitySchemes = schemes.get(tool.name);
      return JSON.stringify(parsed);
    } catch { return message; }
  };
  const type = response.headers.get("content-type") ?? "";
  const body = await response.text();
  const updated = type.includes("text/event-stream")
    ? body.split("\n").map(line => line.startsWith("data: ") ? `data: ${decorate(line.slice(6))}` : line).join("\n")
    : decorate(body);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(updated, { status: response.status, statusText: response.statusText, headers });
}

export async function GET(req: NextRequest) {
  if (!allowedOrigin(req)) return new Response("Forbidden", { status: 403 });
  return handler.fetch(req);
}

export async function DELETE(req: NextRequest) {
  if (!allowedOrigin(req)) return new Response("Forbidden", { status: 403 });
  return handler.fetch(req);
}
