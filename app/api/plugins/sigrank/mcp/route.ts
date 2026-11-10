import type { NextRequest } from "next/server";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { allowedOrigin } from "@/lib/mcp/protocol";
import { createPluginServer } from "@/lib/mcp/plugin/server";
import { mcpRateLimitResponse } from "@/lib/mcp/route-limit";
import { sanitizeUntrusted } from "@/lib/mcp/untrusted";
import contracts from "@/lib/mcp/plugin/contracts.json";

export const runtime = "nodejs";
export const maxDuration = 60;

const BODY_TIMEOUT_MS = 10_000;
const HANDLER_TIMEOUT_MS = 30_000;
const STALL_LOG_MS = 10_000;

const handler = createMcpHandler(({ requestInfo }) => createPluginServer(requestInfo ?? new Request("https://signalaf.com/api/plugins/sigrank/mcp")));

const TIMED_OUT = Symbol("timed-out");

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T | typeof TIMED_OUT> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expiry = new Promise<typeof TIMED_OUT>(resolve => { timer = setTimeout(() => resolve(TIMED_OUT), ms); });
  return Promise.race([work, expiry]).finally(() => clearTimeout(timer));
}

interface RequestSummary { method: string; tool: string; client: string; agent: string }

function summarize(raw: string, req: NextRequest): RequestSummary {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { parsed = undefined; }
  const messages = (Array.isArray(parsed) ? parsed : [parsed]) as { method?: unknown; params?: { name?: unknown; clientInfo?: { name?: unknown } } }[];
  const pick = (get: (m: (typeof messages)[number]) => unknown) =>
    messages.map(m => sanitizeUntrusted(m && typeof m === "object" ? get(m) : undefined)).filter(Boolean).join(",");
  return {
    method: pick(m => m.method),
    tool: pick(m => m.params?.name),
    client: pick(m => m.params?.clientInfo?.name),
    agent: sanitizeUntrusted(req.headers.get("user-agent") ?? ""),
  };
}

function rpcError(status: number, message: string): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message }, id: null }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  if (!allowedOrigin(req)) return new Response("Forbidden", { status: 403 });
  const limited = await mcpRateLimitResponse(req, "plugin");
  if (limited) return limited;

  const raw = await withTimeout(req.text(), BODY_TIMEOUT_MS);
  if (raw === TIMED_OUT) {
    console.warn("plugin mcp: request body not received", { agent: sanitizeUntrusted(req.headers.get("user-agent") ?? "") });
    return rpcError(408, "Request body not received in time");
  }
  const summary = summarize(raw, req);
  const stallLog = setTimeout(() => console.warn("plugin mcp: request still open", summary), STALL_LOG_MS);
  const done = () => clearTimeout(stallLog);

  const headers = new Headers(req.headers);
  headers.delete("content-length");
  const response = await withTimeout(handler.fetch(new Request(req.url, { method: "POST", headers, body: raw })), HANDLER_TIMEOUT_MS);
  if (response === TIMED_OUT) {
    done();
    console.warn("plugin mcp: handler timed out", summary);
    return rpcError(504, "Request timed out");
  }

  // The pinned SDK accepts securitySchemes in _meta but does not expose the
  // standard top-level field in tools/list. Decorate this endpoint's list only;
  // tool execution and all other protocol messages remain SDK-owned.
  if (summary.method !== "tools/list" || !response.ok) {
    if (!response.body) { done(); return response; }
    const body = response.body.pipeThrough(new TransformStream({ flush: done }));
    return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  }
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
  done();
  const updated = type.includes("text/event-stream")
    ? body.split("\n").map(line => line.startsWith("data: ") ? `data: ${decorate(line.slice(6))}` : line).join("\n")
    : decorate(body);
  const outHeaders = new Headers(response.headers);
  outHeaders.delete("content-length");
  return new Response(updated, { status: response.status, statusText: response.statusText, headers: outHeaders });
}

export async function GET(req: NextRequest) {
  if (!allowedOrigin(req)) return new Response("Forbidden", { status: 403 });
  return handler.fetch(req);
}

export async function DELETE(req: NextRequest) {
  if (!allowedOrigin(req)) return new Response("Forbidden", { status: 403 });
  return handler.fetch(req);
}
