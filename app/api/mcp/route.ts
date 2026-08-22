import type { NextRequest } from "next/server";
import { getLeaderboard, getOperator } from "@/lib/board";

const PROTOCOL_VERSION = "2025-06-18";
const SUPPORTED_VERSIONS = new Set(["2025-06-18", "2025-03-26"]);

const TOOLS = [
  {
    name: "rank_paste",
    description:
      "Calculate SigRank cascade metrics from four non-negative token counts without submitting data.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["input", "output", "cache_read", "cache_write"],
      properties: {
        input: { type: "number", minimum: 0 },
        output: { type: "number", minimum: 0 },
        cache_read: { type: "number", minimum: 0 },
        cache_write: { type: "number", minimum: 0 },
      },
    },
  },
  {
    name: "get_leaderboard",
    description: "Read the current public SigRank operator leaderboard.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 100, default: 25 },
        window: { type: "string", enum: ["7d", "30d", "90d", "all_time"], default: "30d" },
      },
    },
  },
  {
    name: "get_operator",
    description: "Read one public operator profile by codename.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["codename"],
      properties: {
        codename: { type: "string", minLength: 1, maxLength: 128 },
      },
    },
  },
] as const;

type RpcId = string | number | null;
type RpcRequest = {
  jsonrpc?: string;
  id?: RpcId;
  method?: string;
  params?: Record<string, unknown>;
};

function jsonRpc(id: RpcId, result: unknown, status = 200) {
  return Response.json(
    { jsonrpc: "2.0", id, result },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "MCP-Protocol-Version": PROTOCOL_VERSION,
      },
    },
  );
}

function rpcError(
  id: RpcId,
  code: number,
  message: string,
  data?: unknown,
  status = 200,
) {
  return Response.json(
    {
      jsonrpc: "2.0",
      id,
      error: { code, message, ...(data === undefined ? {} : { data }) },
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "MCP-Protocol-Version": PROTOCOL_VERSION,
      },
    },
  );
}

function textResult(value: unknown, isError = false) {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
    ...(isError ? { isError: true } : {}),
  };
}

function allowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  return origin === req.nextUrl.origin;
}

function validNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

async function callTool(name: string, args: Record<string, unknown>) {
  if (name === "rank_paste") {
    const input = args.input;
    const output = args.output;
    const cacheRead = args.cache_read;
    const cacheWrite = args.cache_write;
    if (![input, output, cacheRead, cacheWrite].every(validNumber)) {
      return textResult(
        { code: "invalid_arguments", message: "input, output, cache_read, and cache_write must be non-negative finite numbers" },
        true,
      );
    }
    const safeInput = Math.max(input as number, 1);
    const leverage = (cacheRead as number) / safeInput;
    const velocity = (output as number) / safeInput;
    const yield_ = leverage * velocity;
    const snr = (input as number) + (output as number) > 0
      ? (output as number) / ((input as number) + (output as number))
      : 0;
    const nonCompounding = (cacheWrite as number) === 0;
    return textResult({
      input,
      output,
      cache_read: cacheRead,
      cache_write: cacheWrite,
      yield_,
      leverage,
      velocity,
      snr,
      dev10x: (input as number) > 0 && (cacheRead as number) > 0
        ? Math.log10((cacheRead as number) / (input as number))
        : null,
      non_compounding: nonCompounding,
    });
  }

  if (name === "get_leaderboard") {
    const requestedLimit = typeof args.limit === "number" ? Math.trunc(args.limit) : 25;
    const limit = Math.min(100, Math.max(1, requestedLimit));
    const window = typeof args.window === "string" ? args.window : "30d";
    const rows = await getLeaderboard({ window, windowFilter: true, limit });
    return textResult({
      window,
      total_operators: rows.length,
      entries: rows.map((row) => ({
        rank: row.global_rank,
        codename: row.operator.codename,
        display_name: row.operator.display_name,
        class_tier: row.snapshot.class_tier,
        yield_: row.snapshot.cascade && !row.snapshot.cascade.nonCompounding
          ? row.snapshot.cascade.yield_
          : null,
        leverage: row.snapshot.cascade && !row.snapshot.cascade.nonCompounding
          ? row.snapshot.cascade.leverage
          : null,
      })),
    });
  }

  if (name === "get_operator") {
    const codename = typeof args.codename === "string" ? args.codename.trim() : "";
    if (!codename) {
      return textResult({ code: "invalid_arguments", message: "codename is required" }, true);
    }
    const row = await getOperator(codename);
    if (!row) {
      return textResult({ code: "operator_not_found", message: `No operator with codename "${codename}".` }, true);
    }
    const cascade = row.snapshot.cascade;
    return textResult({
      codename: row.operator.codename,
      display_name: row.operator.display_name,
      class_tier: row.snapshot.class_tier,
      rank: row.global_rank,
      percentile: row.percentile,
      yield_: cascade && !cascade.nonCompounding ? cascade.yield_ : null,
      leverage: cascade && !cascade.nonCompounding ? cascade.leverage : null,
      velocity: cascade ? cascade.velocity : null,
      snr: cascade ? cascade.snr : row.snapshot.compression_ratio,
    });
  }

  return textResult({ code: "tool_not_found", message: `Unknown tool: ${name}` }, true);
}

export async function POST(req: NextRequest) {
  if (!allowedOrigin(req)) {
    return new Response("Forbidden", { status: 403 });
  }

  let message: RpcRequest;
  try {
    message = (await req.json()) as RpcRequest;
  } catch {
    return rpcError(null, -32700, "Parse error", undefined, 400);
  }

  if (message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return rpcError(message.id ?? null, -32600, "Invalid Request", undefined, 400);
  }

  const id = message.id ?? null;

  if (message.method === "initialize") {
    const requested = message.params?.protocolVersion;
    const negotiated = typeof requested === "string" && SUPPORTED_VERSIONS.has(requested)
      ? requested
      : PROTOCOL_VERSION;
    return jsonRpc(id, {
      protocolVersion: negotiated,
      capabilities: { tools: {} },
      serverInfo: {
        name: "sigrank-signalaf",
        title: "SigRank SignalAF",
        version: "1.0.0",
      },
      instructions:
        "Use SignalAF to benchmark AI operators from privacy-preserving token telemetry. Use rank_paste for local calculations, get_leaderboard for public field position, and get_operator for a public operator profile. Do not treat these metrics as a model-quality or downstream-productivity benchmark.",
    });
  }

  if (message.method === "notifications/initialized") {
    return new Response(null, {
      status: 202,
      headers: { "MCP-Protocol-Version": PROTOCOL_VERSION },
    });
  }

  const version = req.headers.get("mcp-protocol-version");
  if (version && !SUPPORTED_VERSIONS.has(version)) {
    return rpcError(id, -32602, "Unsupported protocol version", {
      supported: [...SUPPORTED_VERSIONS],
      requested: version,
    }, 400);
  }

  if (message.method === "ping") return jsonRpc(id, {});
  if (message.method === "tools/list") return jsonRpc(id, { tools: TOOLS });

  if (message.method === "tools/call") {
    const name = message.params?.name;
    const args = message.params?.arguments;
    if (typeof name !== "string") {
      return rpcError(id, -32602, "Invalid params", { required: "params.name" });
    }
    const result = await callTool(
      name,
      args && typeof args === "object" && !Array.isArray(args)
        ? (args as Record<string, unknown>)
        : {},
    );
    return jsonRpc(id, result);
  }

  return rpcError(id, -32601, "Method not found", { method: message.method });
}

export async function GET() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });
}

export async function DELETE() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });
}
