import "server-only";

/**
 * lib/share/mcp-card.ts — shared logic for the /share/mcp route.
 *
 * The share_url format generated in MCP tool outputs is:
 *   https://signalaf.com/share/mcp?t=<tool_name>&d=<url_encoded_json_params>
 *
 * This module parses those params, calls the local /api/mcp route (JSON-RPC
 * tools/call) to re-run the tool server-side, and normalizes the result into a
 * flat set of headline metrics so the page + OG image can render a share card
 * without duplicating the fetch/parse logic.
 */

/** Known MCP tool names that produce shareable cascade results. */
export const SHAREABLE_TOOLS = new Set([
  "rank_paste",
  "get_operator",
  "benchmark_me",
  "rank_if",
  "simulate_change",
  "diagnose_cascade",
  "suggest_improvements",
  "self_improve",
  "rank_windows",
  "compare_to_field",
  "operator_gap",
  "who_operates_like_me",
  "operator_signature",
  "field_anomaly",
]);

export interface ShareCardMetrics {
  /** Tool name (e.g. "benchmark_me"). */
  toolName: string;
  /** Human-readable tool title for the card header. */
  toolTitle: string;
  /** Headline metrics, formatted as display strings (null when absent). */
  yield: string | null;
  leverage: string | null;
  velocity: string | null;
  snr: string | null;
  signalClass: string | null;
  percentile: string | null;
  rank: string | null;
  /** One-line interpretation / message, when the tool provides one. */
  interpretation: string | null;
  /** The full parsed result object (for the raw JSON fallback view). */
  raw: Record<string, unknown>;
  /** True when the tool returned an error result. */
  isError: boolean;
}

export interface ShareCardError {
  error: string;
  detail?: string;
}

export type ShareCardResult =
  | ({ ok: true } & ShareCardMetrics)
  | ({ ok: false } & ShareCardError);

/** Human-readable titles for the card header, keyed by tool name. */
const TOOL_TITLES: Record<string, string> = {
  rank_paste: "Rank Paste — Token Cascade",
  get_operator: "Operator Profile",
  benchmark_me: "Benchmark — Field Position",
  rank_if: "Rank If — Counterfactual",
  simulate_change: "Simulate Change — What-If",
  diagnose_cascade: "Diagnose Cascade — Leak Finder",
  suggest_improvements: "Suggest Improvements — Yield Optimizer",
  self_improve: "Self-Improve — One-Click Cycle",
  rank_windows: "Rank Windows — Multi-Window",
  compare_to_field: "Compare to Field — You vs Field",
  operator_gap: "Operator Gap — What Separates Two",
  who_operates_like_me: "Who Operates Like Me — Nearest Neighbor",
  operator_signature: "Operator Signature — Portable Identity",
  field_anomaly: "Field Anomaly — Unusual Patterns",
};

// ── Number formatting (mirrors the OG card + API conventions) ──────────────

function fmtYield(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(0);
}

function fmtLeverage(n: number): string {
  return `${n >= 100 ? n.toFixed(0) : n.toFixed(1)}x`;
}

function fmtVelocity(n: number): string {
  return n.toFixed(2);
}

function fmtSnr(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

function fmtPercentile(n: number): string {
  return `${n.toFixed(0)}th`;
}

function fmtRank(n: number): string {
  return `#${Math.round(n)}`;
}

/** Coerce an unknown value to a finite number, or null. */
function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Pick the first non-null value from a list of candidates. */
function firstNum(...vals: unknown[]): number | null {
  for (const v of vals) {
    const n = num(v);
    if (n != null) return n;
  }
  return null;
}

/** Pick the first non-empty string from a list of candidates. */
function firstStr(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return null;
}

/**
 * Extract a flat set of headline metrics from a parsed tool result.
 *
 * Tool result shapes vary — some nest metrics under `your_cascade`, `current`,
 * `simulated`, `field_position`, etc. This walks the known nesting patterns
 * and pulls the canonical cascade fields (yield, leverage, velocity, snr,
 * class, percentile, rank) plus an interpretation/message line.
 */
export function extractMetrics(
  toolName: string,
  result: Record<string, unknown>,
  isError = false,
): ShareCardMetrics {
  // Common nested containers that hold cascade metrics.
  const yourCascade = result.your_cascade as Record<string, unknown> | undefined;
  const current = result.current as Record<string, unknown> | undefined;
  const simulated = result.simulated as Record<string, unknown> | undefined;
  const fieldPosition = result.field_position as
    | Record<string, unknown>
    | undefined;
  const currentField = result.current as Record<string, unknown> | undefined;

  const y = (k: string) =>
    firstNum(
      result[k],
      yourCascade?.[k],
      current?.[k],
      simulated?.[k],
    );

  const yieldN = firstNum(
    result.yield_,
    result.yield,
    yourCascade?.yield_,
    yourCascade?.yield,
    current?.yield,
    simulated?.yield,
  );
  const leverageN = y("leverage");
  const velocityN = y("velocity");
  const snrN = y("snr");
  const classVal = firstStr(
    result.class,
    result.class_tier,
    yourCascade?.class,
    current?.class,
    simulated?.class,
  );
  const percentileN = firstNum(
    result.percentile,
    fieldPosition?.percentile,
    currentField?.percentile,
  );
  const rankN = firstNum(
    result.rank,
    result.estimated_rank,
    fieldPosition?.estimated_rank,
    currentField?.rank,
  );
  const interpretation = firstStr(result.interpretation, result.message);

  return {
    toolName,
    toolTitle: TOOL_TITLES[toolName] ?? toolName,
    yield: yieldN != null ? fmtYield(yieldN) : null,
    leverage: leverageN != null ? fmtLeverage(leverageN) : null,
    velocity: velocityN != null ? fmtVelocity(velocityN) : null,
    snr: snrN != null ? fmtSnr(snrN) : null,
    signalClass: classVal,
    percentile: percentileN != null ? fmtPercentile(percentileN) : null,
    rank: rankN != null ? fmtRank(rankN) : null,
    interpretation,
    raw: result,
    isError,
  };
}

/** Decode the `d` search param into a JSON arguments object. */
export function decodeParams(d: string | string[] | undefined): {
  params: Record<string, unknown>;
} | { error: string } {
  if (typeof d !== "string" || d.length === 0) {
    return { error: "Missing or empty `d` parameter (encoded JSON params)." };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeURIComponent(d));
  } catch {
    return { error: "The `d` parameter is not valid URL-encoded JSON." };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { error: "The decoded `d` parameter is not a JSON object." };
  }
  return { params: parsed as Record<string, unknown> };
}

/**
 * Resolve the absolute origin for an internal server-side fetch.
 *
 * Uses the incoming request `host` + forwarded-proto header so it works in dev
 * (localhost:3000) and prod (signalaf.com). Falls back to SITE_ORIGIN.
 */
async function resolveOrigin(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";
    if (host) return `${proto}://${host}`;
  } catch {
    // headers() unavailable (e.g. OG image generation context) — fall through.
  }
  return "https://signalaf.com";
}

/** Call the local /api/mcp route (JSON-RPC tools/call) and parse the result. */
export async function fetchMcpToolResult(
  toolName: string,
  args: Record<string, unknown>,
): Promise<ShareCardResult> {
  const origin = await resolveOrigin();
  let res: Response;
  try {
    res = await fetch(`${origin}/api/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: toolName, arguments: args },
      }),
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach the MCP API to re-run this tool.",
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: `The MCP API returned HTTP ${res.status}.`,
    };
  }

  const body = (await res.json()) as {
    result?: { content?: { type: string; text?: string }[]; isError?: boolean };
    error?: { message?: string };
  };

  if (body.error?.message) {
    return { ok: false, error: body.error.message };
  }

  const text = body.result?.content?.find((c) => c.type === "text")?.text;
  if (!text) {
    return {
      ok: false,
      error: "The tool returned no text content.",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: "The tool result was not valid JSON.",
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      ok: false,
      error: "The tool result is not a JSON object.",
    };
  }

  const resultObj = parsed as Record<string, unknown>;
  const isError = body.result?.isError === true;

  // An error result carries a code/message — surface that.
  if (isError && typeof resultObj.message === "string") {
    return { ok: false, error: resultObj.message };
  }

  return {
    ok: true,
    ...extractMetrics(toolName, resultObj, isError),
  };
}

/**
 * Top-level entry: parse search params and fetch the tool result.
 * Used by both the page and the OG image route.
 */
export async function buildShareCard(
  t: string | string[] | undefined,
  d: string | string[] | undefined,
): Promise<ShareCardResult> {
  if (typeof t !== "string" || t.length === 0) {
    return { ok: false, error: "Missing or empty `t` parameter (tool name)." };
  }
  if (!SHAREABLE_TOOLS.has(t)) {
    return {
      ok: false,
      error: `Tool "${t}" is not shareable or does not exist.`,
    };
  }
  const decoded = decodeParams(d);
  if ("error" in decoded) {
    return { ok: false, error: decoded.error };
  }
  return fetchMcpToolResult(t, decoded.params);
}
