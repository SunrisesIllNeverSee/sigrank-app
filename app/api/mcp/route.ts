import type { NextRequest } from "next/server";
import { getLeaderboard, getOperator } from "@/lib/board";

const PROTOCOL_VERSION = "2025-06-18";
const SUPPORTED_VERSIONS = new Set(["2025-06-18", "2025-03-26"]);

// ─── Cascade math (mirrors sigrank-mcp/analytics/cascade.mjs) ───────────────
// Pure functions, no deps. Canonical MO§ES Υ 18436.98 from (1251211, 11296121, 128196310, 2555179769).

const round = (n: number, d: number): number | null =>
  Number.isFinite(n) ? Number(n.toFixed(d)) : null;

const RS05_CLASS_THRESHOLDS: { class: string; totalMin: number }[] = [
  { class: "ARCH+ I", totalMin: 7068201104627 },
  { class: "ARCH+ II", totalMin: 3000000000000 },
  { class: "ARCH+ III", totalMin: 1000000000000 },
  { class: "ARCH I", totalMin: 186207267611 },
  { class: "ARCH II", totalMin: 98543134083 },
  { class: "ARCH III", totalMin: 68766193943 },
  { class: "POWER I", totalMin: 39958782379 },
  { class: "POWER II", totalMin: 26955905621 },
  { class: "POWER III", totalMin: 19141226889 },
  { class: "BASE I", totalMin: 13960345961 },
  { class: "BASE II", totalMin: 10189224970 },
  { class: "BASE III", totalMin: 7747041813 },
  { class: "SEEKER I", totalMin: 5446673659 },
  { class: "SEEKER II", totalMin: 4014577247 },
  { class: "SEEKER III", totalMin: 2961798768 },
  { class: "REFINER I", totalMin: 2358346840 },
  { class: "REFINER II", totalMin: 1845750357 },
  { class: "REFINER III", totalMin: 1334876308 },
  { class: "BEARER I", totalMin: 984078167 },
  { class: "BEARER II", totalMin: 714619043 },
  { class: "BEARER III", totalMin: 431702990 },
  { class: "IGNITER I", totalMin: 216393332 },
  { class: "IGNITER II", totalMin: 88999166 },
  { class: "IGNITER III", totalMin: 0 },
];

function classify(totalTokens: number): string {
  if (!Number.isFinite(totalTokens)) return "UNCLASSED";
  for (const t of RS05_CLASS_THRESHOLDS) {
    if (totalTokens >= t.totalMin) return t.class;
  }
  return "IGNITER III";
}

interface CascadeResult {
  pillars: { input: number; output: number; cacheCreate: number; cacheRead: number; total: number };
  yield: number | null;
  snr: number | null;
  leverage: number | null;
  velocity: number | null;
  dev10x: number | null;
  class: string;
  warnings?: string[];
}

function cascade(input: number, output: number, cacheCreate: number, cacheRead: number): CascadeResult {
  const i = Number(input), o = Number(output), cw = Number(cacheCreate), cr = Number(cacheRead);
  const total = i + o + cw + cr;
  const warnings: string[] = [];

  const snrDenom = i + o;
  const snr = snrDenom > 0 ? o / snrDenom : null;
  if (snr === null) warnings.push("snr_undefined: input+output=0");

  const velocity = i > 0 ? o / i : null;
  if (velocity === null) warnings.push("velocity_undefined: input=0");

  const leverage = i > 0 ? cr / i : null;
  if (leverage === null) warnings.push("leverage_undefined: input=0");

  const yield_ = leverage !== null && velocity !== null ? leverage * velocity : null;
  if (yield_ === null && !warnings.some((w) => w.startsWith("yield")))
    warnings.push("yield_undefined: requires input>0");

  let dev10x: number | null = null;
  if (i > 0 && o > 0 && cw > 0 && cr > 0) {
    dev10x = Math.log10((o / i) * (cw / o) * (cr / cw));
  } else {
    warnings.push("dev10x_undefined: requires all four pillars > 0");
  }

  const result: CascadeResult = {
    pillars: { input: i, output: o, cacheCreate: cw, cacheRead: cr, total },
    yield: round(yield_ ?? 0, 2),
    snr: round(snr ?? 0, 4),
    leverage: round(leverage ?? 0, 1),
    velocity: round(velocity ?? 0, 3),
    dev10x: round(dev10x ?? 0, 2),
    class: classify(total),
  };
  if (warnings.length > 0) result.warnings = warnings;
  return result;
}

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const TOOLS = [
  {
    name: "rank_paste",
    title: "Rank Paste — Local Token Cascade Calculator",
    description:
      "Calculate SigRank cascade metrics from four non-negative token counts without submitting data. Returns Yield, Leverage, Velocity, SNR, and 10xDEV. No data is persisted.",
    annotations: READ_ONLY_ANNOTATIONS,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["input", "output", "cache_read", "cache_write"],
      properties: {
        input: { type: "number", minimum: 0, description: "Total input tokens consumed in the session." },
        output: { type: "number", minimum: 0, description: "Total output tokens generated." },
        cache_read: { type: "number", minimum: 0, description: "Tokens read from prompt cache (reused context)." },
        cache_write: { type: "number", minimum: 0, description: "Tokens written to prompt cache (new context stored for reuse)." },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        input: { type: "number", description: "Echoed input token count." },
        output: { type: "number", description: "Echoed output token count." },
        cache_read: { type: "number", description: "Echoed cache-read token count." },
        cache_write: { type: "number", description: "Echoed cache-write token count." },
        yield_: { type: "number", description: "Yield (Υ) = (cache_read × output) / input². Headline cascade efficiency." },
        leverage: { type: "number", description: "Leverage = cache_read / input. Reusable context amplification." },
        velocity: { type: "number", description: "Velocity = output / input. Output per unit of input." },
        snr: { type: "number", description: "Signal-to-noise ratio = output / (input + output)." },
        dev10x: { type: ["number", "null"], description: "log₁₀(Leverage). Logarithmic context amplification." },
        non_compounding: { type: "boolean", description: "True if cache_write is zero (no compounding context)." },
      },
    },
  },
  {
    name: "get_leaderboard",
    title: "Get Leaderboard — Public Operator Rankings",
    description:
      "Read the current public SigRank operator leaderboard. Returns ranked operators with Yield, Leverage, class tier, and display name.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        limit: { type: "integer", minimum: 1, maximum: 100, default: 25, description: "Maximum number of operators to return (1–100, default 25)." },
        window: { type: "string", enum: ["7d", "30d", "90d", "all_time"], default: "30d", description: "Time window for the leaderboard: 7d, 30d, 90d, or all_time." },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        window: { type: "string", description: "The time window used for the query." },
        total_operators: { type: "integer", description: "Number of operators returned." },
        entries: {
          type: "array",
          items: {
            type: "object",
            properties: {
              rank: { type: "integer", description: "Global rank position." },
              codename: { type: "string", description: "Operator's unique codename (URL key, not display name)." },
              display_name: { type: "string", description: "Human-readable operator display name." },
              class_tier: { type: "string", description: "Operator class tier." },
              yield_: { type: ["number", "null"], description: "Yield (Υ) if compounding, else null." },
              leverage: { type: ["number", "null"], description: "Leverage if compounding, else null." },
            },
          },
        },
      },
    },
  },
  {
    name: "get_operator",
    title: "Get Operator — Public Profile by Codename",
    description:
      "Read one public operator profile by codename. Returns class tier, rank, percentile, Yield, Leverage, Velocity, and SNR.",
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["codename"],
      properties: {
        codename: { type: "string", minLength: 1, maxLength: 128, description: "The operator's unique codename (e.g. signal-ae3b5c3c55). Not the display name." },
      },
    },
    outputSchema: {
      type: "object",
      properties: {
        codename: { type: "string", description: "Operator's unique codename." },
        display_name: { type: "string", description: "Human-readable display name." },
        class_tier: { type: "string", description: "Operator class tier." },
        rank: { type: "integer", description: "Global rank position." },
        percentile: { type: "number", description: "Percentile in the public field." },
        yield_: { type: ["number", "null"], description: "Yield (Υ) if compounding, else null." },
        leverage: { type: ["number", "null"], description: "Leverage if compounding, else null." },
        velocity: { type: ["number", "null"], description: "Velocity = output / input." },
        snr: { type: ["number", "null"], description: "Signal-to-noise ratio." },
      },
    },
  },
  {
    name: "simulate_change",
    title: "Simulate Change — What-If Cascade Predictor",
    description:
      "Prescriptive 'what if' tool — takes your current 4 token pillars and proposed changes, runs the cascade on both, returns the exact Υ Yield delta, class change, and per-metric diffs. Test proposed pillar changes and see the payoff before changing your workflow. Changes can be absolute numbers (replace) or strings starting with +/- for relative deltas.",
    annotations: READ_ONLY_ANNOTATIONS,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["input", "output", "cache_read", "cache_write", "changes"],
      properties: {
        input: { type: "number", minimum: 0, description: "Current input tokens." },
        output: { type: "number", minimum: 0, description: "Current output tokens." },
        cache_read: { type: "number", minimum: 0, description: "Current cache-read tokens." },
        cache_write: { type: "number", minimum: 0, description: "Current cache-write tokens." },
        changes: {
          type: "object",
          description: "Proposed changes. Keys: input, output, cache_read, cache_write. Values are absolute numbers (replace) or strings starting with +/- for relative deltas. Omitted pillars are unchanged.",
          properties: {
            input: { type: ["number", "string"], description: "New input (absolute) or '+/-N' (relative)" },
            output: { type: ["number", "string"], description: "New output (absolute) or '+/-N' (relative)" },
            cache_read: { type: ["number", "string"], description: "New cache_read (absolute) or '+/-N' (relative)" },
            cache_write: { type: ["number", "string"], description: "New cache_write (absolute) or '+/-N' (relative)" },
          },
        },
      },
    },
  },
  {
    name: "diagnose_cascade",
    title: "Diagnose Cascade — Efficiency Leak Finder",
    description:
      "Analyzes your token cascade and diagnoses where you're leaking efficiency. Takes 4 token pillars and produces a ranked list of efficiency leaks with severity (critical/warning/info), findings, recommendations, and estimated Υ impact. Checks: cache leverage, velocity, SNR, cache creation ratio, input bloat, and 10xDEV compounding. Use this before simulate_change to understand what's wrong.",
    annotations: READ_ONLY_ANNOTATIONS,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["input", "output", "cache_read", "cache_write"],
      properties: {
        input: { type: "number", minimum: 0, description: "Total input tokens." },
        output: { type: "number", minimum: 0, description: "Total output tokens." },
        cache_read: { type: "number", minimum: 0, description: "Cache-read tokens." },
        cache_write: { type: "number", minimum: 0, description: "Cache-write tokens." },
      },
    },
  },
  {
    name: "suggest_improvements",
    title: "Suggest Improvements — Ranked Yield Optimizer",
    description:
      "Generates ranked, simulated improvement suggestions for your token cascade. Takes 4 token pillars, tests multiple strategies (increase cache reads, reduce input, increase output, optimize cache creation), simulates each, and returns them ranked by Υ yield impact. Each suggestion includes the action, pillar to change, projected Υ, yield delta, projected class, and rationale. Returns the single highest-impact change as best_single_change.",
    annotations: READ_ONLY_ANNOTATIONS,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["input", "output", "cache_read", "cache_write"],
      properties: {
        input: { type: "number", minimum: 0, description: "Total input tokens." },
        output: { type: "number", minimum: 0, description: "Total output tokens." },
        cache_read: { type: "number", minimum: 0, description: "Cache-read tokens." },
        cache_write: { type: "number", minimum: 0, description: "Cache-write tokens." },
      },
    },
  },
  {
    name: "self_improve",
    title: "Self-Improve — One-Click Cascade Optimizer",
    description:
      "Runs the full self-improvement cycle in one call: (1) computes your current cascade from 4 token pillars, (2) diagnoses efficiency leaks, (3) generates ranked improvement suggestions, (4) simulates the top suggestion, and (5) returns the complete cycle: diagnosis + suggestions + simulated impact of the best change. The 'one-click optimize' tool — call it at the end of a session to see what to improve next time.",
    annotations: READ_ONLY_ANNOTATIONS,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["input", "output", "cache_read", "cache_write"],
      properties: {
        input: { type: "number", minimum: 0, description: "Total input tokens." },
        output: { type: "number", minimum: 0, description: "Total output tokens." },
        cache_read: { type: "number", minimum: 0, description: "Cache-read tokens." },
        cache_write: { type: "number", minimum: 0, description: "Cache-write tokens." },
      },
    },
  },
  {
    name: "rank_windows",
    title: "Rank Windows — Multi-Window Cascade",
    description:
      "Score up to 4 time windows (7d, 30d, 90d, all-time) in one call. Each window is scored independently with the full cascade (Υ, SNR, Leverage, Velocity, 10xDEV, class). Omit windows you don't have — partial input is allowed (1-4 windows). Does NOT submit to the board.",
    annotations: READ_ONLY_ANNOTATIONS,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        "7d": {
          type: "object",
          additionalProperties: false,
          properties: {
            input: { type: "number", minimum: 0 },
            output: { type: "number", minimum: 0 },
            cache_read: { type: "number", minimum: 0 },
            cache_write: { type: "number", minimum: 0 },
          },
          description: "7-day window token pillars (optional)",
        },
        "30d": {
          type: "object",
          additionalProperties: false,
          properties: {
            input: { type: "number", minimum: 0 },
            output: { type: "number", minimum: 0 },
            cache_read: { type: "number", minimum: 0 },
            cache_write: { type: "number", minimum: 0 },
          },
          description: "30-day window token pillars (optional)",
        },
        "90d": {
          type: "object",
          additionalProperties: false,
          properties: {
            input: { type: "number", minimum: 0 },
            output: { type: "number", minimum: 0 },
            cache_read: { type: "number", minimum: 0 },
            cache_write: { type: "number", minimum: 0 },
          },
          description: "90-day window token pillars (optional)",
        },
        all: {
          type: "object",
          additionalProperties: false,
          properties: {
            input: { type: "number", minimum: 0 },
            output: { type: "number", minimum: 0 },
            cache_read: { type: "number", minimum: 0 },
            cache_write: { type: "number", minimum: 0 },
          },
          description: "All-time window token pillars (optional)",
        },
      },
    },
  },
  {
    name: "benchmark_me",
    title: "Benchmark Me — Field Position Analyzer",
    description:
      "Answers 'How good am I?' — benchmarks your token cascade against the live field. Takes 4 token pillars (or a codename), computes your cascade, then compares against the live leaderboard: percentile, rank, distance from median, distance from top 10%, strongest metric, weakest metric, and a one-line interpretation. This is the human-question tool — use it when someone asks 'am I a power user?' or 'how do I compare?'.",
    annotations: READ_ONLY_ANNOTATIONS,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        input: { type: "number", minimum: 0, description: "Total input tokens. Required if codename is not provided." },
        output: { type: "number", minimum: 0, description: "Total output tokens. Required if codename is not provided." },
        cache_read: { type: "number", minimum: 0, description: "Cache-read tokens. Required if codename is not provided." },
        cache_write: { type: "number", minimum: 0, description: "Cache-write tokens. Required if codename is not provided." },
        codename: { type: "string", description: "Operator codename (alternative to providing pillars). If provided, fetches live profile from the board." },
        window: { type: "string", enum: ["7d", "30d", "90d", "all_time"], default: "30d", description: "Time window for field comparison (default 30d)." },
      },
    },
  },
  {
    name: "rank_if",
    title: "Rank If — Counterfactual Rank Simulator",
    description:
      "Answers 'What would it take to reach a target rank?' — takes your current 4 token pillars and a target percentile (e.g. 90 for top 10%), then simulates the smallest metric changes needed to reach that position. Returns: current rank/percentile, simulated rank/percentile, the specific pillar changes required, and the yield delta. This turns SigRank from a scoreboard into a simulator. Use it when someone asks 'what would move my rank?' or 'how do I get to top 10%?'.",
    annotations: READ_ONLY_ANNOTATIONS,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["input", "output", "cache_read", "cache_write", "target_percentile"],
      properties: {
        input: { type: "number", minimum: 0, description: "Current input tokens." },
        output: { type: "number", minimum: 0, description: "Current output tokens." },
        cache_read: { type: "number", minimum: 0, description: "Current cache-read tokens." },
        cache_write: { type: "number", minimum: 0, description: "Current cache-write tokens." },
        target_percentile: { type: "number", minimum: 0, maximum: 100, description: "Target percentile (0-100). E.g. 90 for top 10%, 99 for top 1%." },
        window: { type: "string", enum: ["7d", "30d", "90d", "all_time"], default: "30d", description: "Time window for field comparison (default 30d)." },
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

function parsePillars(args: Record<string, unknown>): { input: number; output: number; cacheCreate: number; cacheRead: number } | { error: string } {
  const { input, output, cache_read, cache_write } = args;
  if (![input, output, cache_read, cache_write].every(validNumber)) {
    return { error: "input, output, cache_read, and cache_write must be non-negative finite numbers" };
  }
  return {
    input: input as number,
    output: output as number,
    cacheCreate: cache_write as number,
    cacheRead: cache_read as number,
  };
}

function metricDelta(curr: number | null, sim: number | null) {
  if (curr == null && sim == null) return null;
  if (curr == null) return { from: null, to: sim, delta: null };
  if (sim == null) return { from: curr, to: null, delta: null };
  return { from: curr, to: sim, delta: Number((sim - curr).toFixed(4)) };
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

  // ─── Pure-math tools (no network, no filesystem) ───────────────────

  if (name === "simulate_change") {
    const parsed = parsePillars(args);
    if ("error" in parsed) {
      return textResult({ code: "invalid_arguments", message: parsed.error }, true);
    }
    const changes = args.changes;
    if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
      return textResult({ code: "invalid_arguments", message: "changes must be an object with at least one pillar change" }, true);
    }
    const current = cascade(parsed.input, parsed.output, parsed.cacheCreate, parsed.cacheRead);
    const PILLAR_MAP: Record<string, keyof typeof parsed> = {
      input: "input", output: "output", cache_read: "cacheRead", cache_write: "cacheCreate",
    };
    const simulated = { ...parsed };
    const appliedChanges: Record<string, { from: number; to: number; delta: number }> = {};
    for (const [apiKey, pillarKey] of Object.entries(PILLAR_MAP)) {
      const raw = (changes as Record<string, unknown>)[apiKey];
      if (raw == null) continue;
      let newVal: number;
      if (typeof raw === "number") {
        newVal = raw;
      } else if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (trimmed.startsWith("+") || trimmed.startsWith("-")) {
          const delta = Number(trimmed);
          if (!Number.isFinite(delta)) {
            return textResult({ code: "invalid_change", detail: `changes.${apiKey}: "${raw}" is not a valid relative delta.` }, true);
          }
          newVal = parsed[pillarKey] + delta;
        } else {
          newVal = Number(trimmed);
        }
      } else {
        return textResult({ code: "invalid_change", detail: `changes.${apiKey}: expected number or string, got ${typeof raw}.` }, true);
      }
      if (!Number.isFinite(newVal) || newVal < 0) {
        return textResult({ code: "invalid_change", detail: `changes.${apiKey}: result ${newVal} is invalid — token counts must be >= 0.` }, true);
      }
      simulated[pillarKey] = newVal;
      appliedChanges[apiKey] = { from: parsed[pillarKey], to: newVal, delta: newVal - parsed[pillarKey] };
    }
    if (Object.keys(appliedChanges).length === 0) {
      return textResult({ code: "no_changes", detail: "No pillar changes specified in the changes object." }, true);
    }
    const simResult = cascade(simulated.input, simulated.output, simulated.cacheCreate, simulated.cacheRead);
    const classChanged = current.class !== simResult.class;
    return textResult({
      current: {
        pillars: { input: parsed.input, output: parsed.output, cache_read: parsed.cacheRead, cache_write: parsed.cacheCreate },
        yield: current.yield, snr: current.snr, leverage: current.leverage, velocity: current.velocity, dev10x: current.dev10x, class: current.class,
      },
      simulated: {
        pillars: { input: simulated.input, output: simulated.output, cache_read: simulated.cacheRead, cache_write: simulated.cacheCreate },
        yield: simResult.yield, snr: simResult.snr, leverage: simResult.leverage, velocity: simResult.velocity, dev10x: simResult.dev10x, class: simResult.class,
      },
      changes: appliedChanges,
      deltas: {
        yield: metricDelta(current.yield, simResult.yield),
        snr: metricDelta(current.snr, simResult.snr),
        leverage: metricDelta(current.leverage, simResult.leverage),
        velocity: metricDelta(current.velocity, simResult.velocity),
        dev10x: metricDelta(current.dev10x, simResult.dev10x),
      },
      class_changed: classChanged,
      ...(classChanged ? { class_transition: `${current.class} → ${simResult.class}` } : {}),
      ...(simResult.warnings ? { simulated_warnings: simResult.warnings } : {}),
      note: "Local simulation only — no submission. The actual score depends on server-side RS.xx weights and class thresholds.",
    });
  }

  if (name === "diagnose_cascade") {
    const parsed = parsePillars(args);
    if ("error" in parsed) {
      return textResult({ code: "invalid_arguments", message: parsed.error }, true);
    }
    const result = cascade(parsed.input, parsed.output, parsed.cacheCreate, parsed.cacheRead);
    const { input: i, output: o, cacheCreate: cw, cacheRead: cr } = parsed;
    const diagnosis: Array<Record<string, unknown>> = [];

    // Cache leverage check
    const leverage = result.leverage;
    if (leverage !== null) {
      if (leverage < 10) {
        diagnosis.push({
          metric: "cache_leverage", severity: "critical",
          finding: `Cache leverage is ${leverage}× — you're reading only ${leverage}× your fresh input from cache. Top-tier operators hit 200×+.`,
          recommendation: "Increase context reuse: load prior session context, use longer conversation threads, reference earlier outputs.",
          estimated_yield_impact: `+${Math.round((1 - leverage / 50) * 100)}% Υ potential`,
        });
      } else if (leverage < 50) {
        diagnosis.push({
          metric: "cache_leverage", severity: "warning",
          finding: `Cache leverage is ${leverage}× — decent but below the ARCH+ threshold (~100×+).`,
          recommendation: "Push cache reads higher by reusing prior context more aggressively.",
          estimated_yield_impact: `+${Math.round((1 - leverage / 100) * 50)}% Υ potential`,
        });
      }
    }

    // Velocity check
    const velocity = result.velocity;
    if (velocity !== null) {
      if (velocity < 0.5) {
        diagnosis.push({
          metric: "velocity", severity: "critical",
          finding: `Velocity is ${velocity} — generating only ${velocity}× your input as output. You're reading more than you produce.`,
          recommendation: "Increase output: ask the agent to generate more code/text per turn, reduce over-reading.",
          estimated_yield_impact: `+${Math.round((0.5 - velocity) * 100)}% Υ per 0.1 velocity gain`,
        });
      } else if (velocity < 1.0) {
        diagnosis.push({
          metric: "velocity", severity: "warning",
          finding: `Velocity is ${velocity} — below 1.0 (output < input). Healthy operators hit 1.5×+.`,
          recommendation: "Generate more output per input token — larger edits, more complete responses.",
          estimated_yield_impact: `+${Math.round((1 - velocity) * 30)}% Υ potential`,
        });
      }
    }

    // SNR check
    const snr = result.snr;
    if (snr !== null && snr < 0.3) {
      diagnosis.push({
        metric: "snr", severity: "warning",
        finding: `SNR is ${snr} — less than 30% of your token flow is output. Input is dominating.`,
        recommendation: "Reduce fresh input (reuse context) or increase output generation.",
        estimated_yield_impact: "Indirect — improves both velocity and leverage",
      });
    }

    // Cache creation ratio
    if (cw > 0 && o > 0) {
      const commitRatio = cw / o;
      if (commitRatio > 20) {
        diagnosis.push({
          metric: "cache_creation", severity: "info",
          finding: `Cache creation is ${commitRatio.toFixed(1)}× your output — high commitment. Fine if you're rereading it (check leverage), but wasteful if not.`,
          recommendation: "Ensure you're rereading committed context. If leverage is low, you're writing cache you never read.",
          estimated_yield_impact: "Cost reduction, not Υ directly",
        });
      }
    }

    // Input bloat
    const total = i + o + cw + cr;
    if (total > 0) {
      const inputPct = (i / total) * 100;
      if (inputPct > 10) {
        diagnosis.push({
          metric: "input_bloat", severity: "warning",
          finding: `Fresh input is ${inputPct.toFixed(1)}% of your total token flow — high. Efficient operators keep input under 1% by leaning on cache.`,
          recommendation: "Reduce fresh input by reusing prior context instead of re-pasting it.",
          estimated_yield_impact: `+${Math.round((inputPct - 1) * 5)}% Υ potential`,
        });
      }
    }

    // 10xDEV check
    if (result.dev10x === null && cw === 0) {
      diagnosis.push({
        metric: "10xdev", severity: "critical",
        finding: "No cache creation — the cascade cannot compound. You're operating in a non-compounding mode (like ChatGPT without prompt caching).",
        recommendation: "Switch to a platform with prompt caching (Claude Code) or enable caching if available.",
        estimated_yield_impact: "Enables the full cascade — potentially 10×+ Υ",
      });
    } else if (result.dev10x !== null && result.dev10x < 1.0) {
      diagnosis.push({
        metric: "10xdev", severity: "info",
        finding: `10xDEV is ${result.dev10x} — below 1.0 (BASE threshold). The cascade is compounding but not strongly.`,
        recommendation: "Improve both leverage AND velocity — 10xDEV = log10(transmission × commitment × reuse).",
        estimated_yield_impact: "Class tier improvement",
      });
    }

    const sevOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
    diagnosis.sort((a, b) => sevOrder[a.severity as string] - sevOrder[b.severity as string]);
    const healthScore = diagnosis.filter((d) => d.severity === "critical").length;
    const summary =
      healthScore === 0
        ? `Cascade is healthy — Υ ${result.yield}, class ${result.class}. ${diagnosis.length} minor optimizations available.`
        : `Cascade has ${healthScore} critical leak${healthScore > 1 ? "s" : ""} — Υ ${result.yield}, class ${result.class}. Fix the critical items first.`;

    return textResult({
      pillars: { input: i, output: o, cache_read: cr, cache_write: cw },
      cascade: {
        yield_: result.yield, snr: result.snr, leverage: result.leverage,
        velocity: result.velocity, tenx_dev: result.dev10x, class: result.class,
        warnings: result.warnings,
      },
      diagnosis,
      summary,
    });
  }

  if (name === "suggest_improvements") {
    const parsed = parsePillars(args);
    if ("error" in parsed) {
      return textResult({ code: "invalid_arguments", message: parsed.error }, true);
    }
    const current = cascade(parsed.input, parsed.output, parsed.cacheCreate, parsed.cacheRead);
    const { input: i, output: o, cacheCreate: cw, cacheRead: cr } = parsed;
    const candidates: Array<Record<string, unknown>> = [];

    // Strategy 1: Increase cache reads
    const crBoosts = cr > 0 ? [1.5, 2, 3, 5] : [];
    for (const mult of crBoosts) {
      const sim = cascade(parsed.input, parsed.output, parsed.cacheCreate, Math.round(cr * mult));
      if (sim.yield !== null) {
        candidates.push({
          action: `Increase cache reads by ${Math.round((mult - 1) * 100)}%`,
          pillar: "cache_read",
          delta: `+${Math.round(cr * (mult - 1)).toLocaleString()}`,
          simulated_yield: sim.yield,
          yield_delta: Number((sim.yield - (current.yield ?? 0)).toFixed(2)),
          class_after: sim.class,
          rationale: "Cache reads are the strongest Υ multiplier. More reuse = higher leverage = higher yield.",
        });
      }
    }
    if (cr === 0 && cw === 0) {
      const starterAmounts = [Math.round(i * 10), Math.round(i * 50), Math.round(i * 100)];
      for (const amt of starterAmounts) {
        const sim = cascade(parsed.input, parsed.output, Math.round(amt * 0.5), amt);
        if (sim.yield !== null && sim.yield > 0) {
          candidates.push({
            action: `Enable caching with ${amt.toLocaleString()} cache reads`,
            pillar: "cache_read", delta: `+${amt.toLocaleString()}`,
            simulated_yield: sim.yield,
            yield_delta: Number((sim.yield - (current.yield ?? 0)).toFixed(2)),
            class_after: sim.class,
            rationale: "You have no cache — enabling it unlocks the cascade. Start by reusing prior context.",
          });
        }
      }
    }

    // Strategy 2: Reduce fresh input
    for (const mult of [0.9, 0.75, 0.5]) {
      const newInput = Math.round(i * mult);
      if (newInput < 1) continue;
      const sim = cascade(newInput, parsed.output, parsed.cacheCreate, parsed.cacheRead);
      if (sim.yield !== null) {
        candidates.push({
          action: `Reduce fresh input by ${Math.round((1 - mult) * 100)}%`,
          pillar: "input", delta: `-${Math.round(i * (1 - mult)).toLocaleString()}`,
          simulated_yield: sim.yield,
          yield_delta: Number((sim.yield - (current.yield ?? 0)).toFixed(2)),
          class_after: sim.class,
          rationale: "Input is squared in the Υ denominator (Υ = Cr·O/I²). Reducing input has a quadratic payoff.",
        });
      }
    }

    // Strategy 3: Increase output
    for (const mult of [1.25, 1.5, 2]) {
      const sim = cascade(parsed.input, Math.round(o * mult), parsed.cacheCreate, parsed.cacheRead);
      if (sim.yield !== null) {
        candidates.push({
          action: `Increase output by ${Math.round((mult - 1) * 100)}%`,
          pillar: "output", delta: `+${Math.round(o * (mult - 1)).toLocaleString()}`,
          simulated_yield: sim.yield,
          yield_delta: Number((sim.yield - (current.yield ?? 0)).toFixed(2)),
          class_after: sim.class,
          rationale: "Output is a linear multiplier in Υ. More output per session = higher yield.",
        });
      }
    }

    // Strategy 4: Optimize cache creation
    if (cw > o * 10) {
      const sim = cascade(parsed.input, parsed.output, Math.round(o * 5), parsed.cacheRead);
      if (sim.yield !== null) {
        candidates.push({
          action: "Reduce cache creation to 5× output",
          pillar: "cache_write", delta: `-${Math.round(cw - o * 5).toLocaleString()}`,
          simulated_yield: sim.yield,
          yield_delta: Number((sim.yield - (current.yield ?? 0)).toFixed(2)),
          class_after: sim.class,
          rationale: "You're over-committing cache (cw >> output). Trimming to a healthy ratio reduces cost without hurting yield.",
        });
      }
    }

    candidates.sort((a, b) => (b.yield_delta as number) - (a.yield_delta as number));
    const top: Array<Record<string, unknown>> = candidates.slice(0, 8).map((c, idx) => ({ rank: idx + 1, ...c }));
    const best = top[0] as Record<string, unknown> | undefined;
    return textResult({
      suggestions: top,
      current_yield: current.yield,
      current_class: current.class,
      best_single_change: best
        ? `${best.action} (Υ ${current.yield} → ${best.simulated_yield}, +${best.yield_delta} yield, class ${best.class_after})`
        : "No improvements found — your cascade is already optimized.",
    });
  }

  if (name === "self_improve") {
    const parsed = parsePillars(args);
    if ("error" in parsed) {
      return textResult({ code: "invalid_arguments", message: parsed.error }, true);
    }
    const currentResult = cascade(parsed.input, parsed.output, parsed.cacheCreate, parsed.cacheRead);
    const { input: i, output: o, cacheCreate: cw, cacheRead: cr } = parsed;

    // Step 1: Diagnose (inline)
    const diagnosis: Array<Record<string, unknown>> = [];
    const leverage = currentResult.leverage;
    if (leverage !== null && leverage < 10) {
      diagnosis.push({
        metric: "cache_leverage", severity: "critical",
        finding: `Cache leverage is ${leverage}× — top-tier operators hit 200×+.`,
        recommendation: "Increase context reuse: load prior session context, use longer threads.",
      });
    } else if (leverage !== null && leverage < 50) {
      diagnosis.push({
        metric: "cache_leverage", severity: "warning",
        finding: `Cache leverage is ${leverage}× — below ARCH+ threshold (~100×+).`,
        recommendation: "Push cache reads higher by reusing prior context.",
      });
    }
    const velocity = currentResult.velocity;
    if (velocity !== null && velocity < 0.5) {
      diagnosis.push({
        metric: "velocity", severity: "critical",
        finding: `Velocity is ${velocity} — generating only ${velocity}× input as output.`,
        recommendation: "Increase output per turn, reduce over-reading.",
      });
    } else if (velocity !== null && velocity < 1.0) {
      diagnosis.push({
        metric: "velocity", severity: "warning",
        finding: `Velocity is ${velocity} — below 1.0. Healthy operators hit 1.5×+.`,
        recommendation: "Generate more output per input token.",
      });
    }
    if (currentResult.dev10x === null && cw === 0) {
      diagnosis.push({
        metric: "10xdev", severity: "critical",
        finding: "No cache creation — cascade cannot compound.",
        recommendation: "Switch to a platform with prompt caching (Claude Code).",
      });
    }
    const total = i + o + cw + cr;
    if (total > 0 && (i / total) * 100 > 10) {
      diagnosis.push({
        metric: "input_bloat", severity: "warning",
        finding: `Fresh input is ${((i / total) * 100).toFixed(1)}% of total flow — efficient operators keep it under 1%.`,
        recommendation: "Reduce fresh input by reusing prior context.",
      });
    }

    // Step 2: Suggest (inline)
    const candidates: Array<Record<string, unknown>> = [];
    const crBoosts = cr > 0 ? [1.5, 2, 3, 5] : [];
    for (const mult of crBoosts) {
      const sim = cascade(parsed.input, parsed.output, parsed.cacheCreate, Math.round(cr * mult));
      if (sim.yield !== null) {
        candidates.push({
          action: `Increase cache reads by ${Math.round((mult - 1) * 100)}%`,
          pillar: "cache_read", delta: `+${Math.round(cr * (mult - 1)).toLocaleString()}`,
          simulated_yield: sim.yield,
          yield_delta: Number((sim.yield - (currentResult.yield ?? 0)).toFixed(2)),
          class_after: sim.class,
          rationale: "Cache reads are the strongest Υ multiplier.",
        });
      }
    }
    if (cr === 0 && cw === 0) {
      for (const amt of [Math.round(i * 10), Math.round(i * 50), Math.round(i * 100)]) {
        const sim = cascade(parsed.input, parsed.output, Math.round(amt * 0.5), amt);
        if (sim.yield !== null && sim.yield > 0) {
          candidates.push({
            action: `Enable caching with ${amt.toLocaleString()} cache reads`,
            pillar: "cache_read", delta: `+${amt.toLocaleString()}`,
            simulated_yield: sim.yield,
            yield_delta: Number((sim.yield - (currentResult.yield ?? 0)).toFixed(2)),
            class_after: sim.class,
            rationale: "You have no cache — enabling it unlocks the cascade.",
          });
        }
      }
    }
    for (const mult of [0.9, 0.75, 0.5]) {
      const newInput = Math.round(i * mult);
      if (newInput < 1) continue;
      const sim = cascade(newInput, parsed.output, parsed.cacheCreate, parsed.cacheRead);
      if (sim.yield !== null) {
        candidates.push({
          action: `Reduce fresh input by ${Math.round((1 - mult) * 100)}%`,
          pillar: "input", delta: `-${Math.round(i * (1 - mult)).toLocaleString()}`,
          simulated_yield: sim.yield,
          yield_delta: Number((sim.yield - (currentResult.yield ?? 0)).toFixed(2)),
          class_after: sim.class,
          rationale: "Input is squared in the Υ denominator. Reducing input has a quadratic payoff.",
        });
      }
    }
    for (const mult of [1.25, 1.5, 2]) {
      const sim = cascade(parsed.input, Math.round(o * mult), parsed.cacheCreate, parsed.cacheRead);
      if (sim.yield !== null) {
        candidates.push({
          action: `Increase output by ${Math.round((mult - 1) * 100)}%`,
          pillar: "output", delta: `+${Math.round(o * (mult - 1)).toLocaleString()}`,
          simulated_yield: sim.yield,
          yield_delta: Number((sim.yield - (currentResult.yield ?? 0)).toFixed(2)),
          class_after: sim.class,
          rationale: "Output is a linear multiplier in Υ.",
        });
      }
    }
    if (cw > o * 10) {
      const sim = cascade(parsed.input, parsed.output, Math.round(o * 5), parsed.cacheRead);
      if (sim.yield !== null) {
        candidates.push({
          action: "Reduce cache creation to 5× output",
          pillar: "cache_write", delta: `-${Math.round(cw - o * 5).toLocaleString()}`,
          simulated_yield: sim.yield,
          yield_delta: Number((sim.yield - (currentResult.yield ?? 0)).toFixed(2)),
          class_after: sim.class,
          rationale: "Over-committing cache. Trimming reduces cost without hurting yield.",
        });
      }
    }
    candidates.sort((a, b) => (b.yield_delta as number) - (a.yield_delta as number));
    const suggestions: Array<Record<string, unknown>> = candidates.slice(0, 8).map((c, idx) => ({ rank: idx + 1, ...c }));

    // Step 3: Simulate the best suggestion
    const best = suggestions[0] as Record<string, unknown> | undefined;
    let bestSimulation: Record<string, unknown> | null = null;
    if (best) {
      const bestPillar = best.pillar as string;
      const bestDeltaStr = best.delta as string;
      const isRelative = bestDeltaStr.startsWith("+") || bestDeltaStr.startsWith("-");
      const deltaNum = Number(bestDeltaStr.replace(/[+,]/g, ""));
      const simPillars = { ...parsed };
      if (bestPillar === "cache_read") {
        simPillars.cacheRead = isRelative ? parsed.cacheRead + deltaNum : deltaNum;
      } else if (bestPillar === "input") {
        simPillars.input = isRelative ? parsed.input + deltaNum : deltaNum;
      } else if (bestPillar === "output") {
        simPillars.output = isRelative ? parsed.output + deltaNum : deltaNum;
      } else if (bestPillar === "cache_write") {
        simPillars.cacheCreate = isRelative ? parsed.cacheCreate + deltaNum : deltaNum;
      }
      const simResult = cascade(simPillars.input, simPillars.output, simPillars.cacheCreate, simPillars.cacheRead);
      bestSimulation = {
        action: best.action,
        simulated_yield: simResult.yield,
        yield_delta: Number(((simResult.yield ?? 0) - (currentResult.yield ?? 0)).toFixed(2)),
        class_after: simResult.class,
        class_changed: currentResult.class !== simResult.class,
      };
    }

    const sevOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
    diagnosis.sort((a, b) => sevOrder[a.severity as string] - sevOrder[b.severity as string]);

    return textResult({
      pillars: { input: i, output: o, cache_read: cr, cache_write: cw },
      current_cascade: {
        yield_: currentResult.yield, snr: currentResult.snr, leverage: currentResult.leverage,
        velocity: currentResult.velocity, dev10x: currentResult.dev10x, class: currentResult.class,
      },
      diagnosis,
      suggestions,
      best_simulation: bestSimulation,
      cycle_summary: best
        ? `Diagnosis: ${diagnosis.length} findings. Best change: ${best.action} (+${best.yield_delta} Υ, class ${best.class_after}).`
        : `Diagnosis: ${diagnosis.length} findings. No improvements found — cascade is already optimized.`,
    });
  }

  if (name === "rank_windows") {
    const WINDOW_KEYS = ["7d", "30d", "90d", "all"] as const;
    const windows: Array<Record<string, unknown>> = [];
    for (const wk of WINDOW_KEYS) {
      const w = args[wk];
      if (!w || typeof w !== "object" || Array.isArray(w)) continue;
      const wArgs = w as Record<string, unknown>;
      const parsed = parsePillars(wArgs);
      if ("error" in parsed) continue;
      const c = cascade(parsed.input, parsed.output, parsed.cacheCreate, parsed.cacheRead);
      windows.push({
        window: wk,
        pillars: { input: parsed.input, output: parsed.output, cache_read: parsed.cacheRead, cache_write: parsed.cacheCreate },
        cascade: {
          yield_: c.yield, snr: c.snr, leverage: c.leverage,
          velocity: c.velocity, dev10x: c.dev10x, class: c.class,
          warnings: c.warnings,
        },
      });
    }
    if (windows.length === 0) {
      return textResult({ code: "invalid_arguments", message: "rank_windows requires at least one window (7d, 30d, 90d, or all) with valid token pillars." }, true);
    }
    return textResult({
      windows,
      note: "Local preview only — use the npm package (npx sigrank) to submit to the board.",
    });
  }

  // ─── Field-relative tools (need leaderboard data) ──────────────────

  if (name === "benchmark_me") {
    const window = typeof args.window === "string" ? args.window : "30d";
    const codename = typeof args.codename === "string" ? args.codename.trim() : null;

    let pillars: { input: number; output: number; cacheCreate: number; cacheRead: number };
    let operatorName: string | null = null;

    if (codename) {
      const row = await getOperator(codename);
      if (!row) {
        return textResult({ code: "operator_not_found", message: `No operator with codename "${codename}".` }, true);
      }
      const t = row.operator;
      operatorName = t.display_name || t.codename;
      const tel = row.telemetry;
      if (!tel) {
        return textResult({ code: "no_telemetry", message: `Operator "${codename}" has no telemetry data.` }, true);
      }
      pillars = {
        input: tel.fresh_input,
        output: tel.output,
        cacheCreate: tel.cache_create,
        cacheRead: tel.cache_read,
      };
    } else {
      const parsed = parsePillars(args);
      if ("error" in parsed) {
        return textResult({ code: "invalid_arguments", message: parsed.error + " Or provide a codename instead." }, true);
      }
      pillars = parsed;
    }

    const myCascade = cascade(pillars.input, pillars.output, pillars.cacheCreate, pillars.cacheRead);
    const board = await getLeaderboard({ window, windowFilter: true, limit: 1000 });

    if (board.length === 0) {
      return textResult({ code: "board_unavailable", message: "Live leaderboard data is unavailable. Try again later." }, true);
    }

    // Extract cascade metrics from board rows, filtering to compounding operators
    const fieldYields: number[] = [];
    const fieldLeverages: number[] = [];
    const fieldVelocities: number[] = [];
    const fieldSnrs: number[] = [];
    for (const row of board) {
      const c = row.snapshot.cascade;
      if (!c || c.nonCompounding) continue;
      if (typeof c.yield_ === "number") fieldYields.push(c.yield_);
      if (typeof c.leverage === "number") fieldLeverages.push(c.leverage);
      if (typeof c.velocity === "number") fieldVelocities.push(c.velocity);
      if (typeof c.snr === "number") fieldSnrs.push(c.snr);
    }

    if (fieldYields.length < 5) {
      return textResult({
        pillars: { input: pillars.input, output: pillars.output, cache_read: pillars.cacheRead, cache_write: pillars.cacheCreate },
        cascade: { yield_: myCascade.yield, snr: myCascade.snr, leverage: myCascade.leverage, velocity: myCascade.velocity, dev10x: myCascade.dev10x, class: myCascade.class },
        code: "insufficient_field",
        message: `Only ${fieldYields.length} compounding operators on the ${window} board — not enough for a meaningful benchmark.`,
      });
    }

    const myYield = myCascade.yield ?? 0;
    const sortedYields = [...fieldYields].sort((a, b) => a - b);
    const median = sortedYields[Math.floor(sortedYields.length / 2)];
    const top10Idx = Math.floor(sortedYields.length * 0.9);
    const top1Idx = Math.floor(sortedYields.length * 0.99);
    const top10Yield = sortedYields[top10Idx] ?? sortedYields[sortedYields.length - 1];
    const top1Yield = sortedYields[top1Idx] ?? sortedYields[sortedYields.length - 1];

    // Compute my percentile against the field
    let below = 0;
    for (const y of fieldYields) {
      if (y < myYield) below++;
    }
    const myPercentile = Number(((below / fieldYields.length) * 100).toFixed(1));
    const myRank = fieldYields.filter((y) => y > myYield).length + 1;

    // Strongest / weakest metric (compare my metrics to field medians)
    const fieldMedian = (arr: number[]) => {
      const s = [...arr].sort((a, b) => a - b);
      return s[Math.floor(s.length / 2)];
    };
    const medLev = fieldMedian(fieldLeverages);
    const medVel = fieldMedian(fieldVelocities);
    const medSnr = fieldMedian(fieldSnrs);

    const myLev = myCascade.leverage ?? 0;
    const myVel = myCascade.velocity ?? 0;
    const mySnr = myCascade.snr ?? 0;

    const metricRatios: Array<{ metric: string; ratio: number; mine: number; field: number }> = [
      { metric: "leverage", ratio: medLev > 0 ? myLev / medLev : 0, mine: myLev, field: medLev },
      { metric: "velocity", ratio: medVel > 0 ? myVel / medVel : 0, mine: myVel, field: medVel },
      { metric: "snr", ratio: medSnr > 0 ? mySnr / medSnr : 0, mine: mySnr, field: medSnr },
    ];
    metricRatios.sort((a, b) => b.ratio - a.ratio);
    const strongest = metricRatios[0];
    const weakest = metricRatios[metricRatios.length - 1];

    const distFromMedian = Number(((myYield / median - 1) * 100).toFixed(1));
    const distFromTop10 = Number(((myYield / top10Yield - 1) * 100).toFixed(1));

    // One-line interpretation
    let interpretation: string;
    if (myPercentile >= 95) {
      interpretation = `Top ${Math.round(100 - myPercentile)}% of the field — elite operator. ${strongest.metric.charAt(0).toUpperCase() + strongest.metric.slice(1)} is your engine (${strongest.ratio.toFixed(1)}× field median).`;
    } else if (myPercentile >= 75) {
      interpretation = `${myPercentile}th percentile — above average. ${weakest.metric.charAt(0).toUpperCase() + weakest.metric.slice(1)} is holding you back (${weakest.ratio.toFixed(1)}× field median). Push it to break into the top 10%.`;
    } else if (myPercentile >= 50) {
      interpretation = `${myPercentile}th percentile — middle of the pack. ${weakest.metric.charAt(0).toUpperCase() + weakest.metric.slice(1)} is your weak link (${weakest.ratio.toFixed(1)}× field median). Fix it to climb.`;
    } else {
      interpretation = `${myPercentile}th percentile — below median. ${weakest.metric.charAt(0).toUpperCase() + weakest.metric.slice(1)} is critically low (${weakest.ratio.toFixed(1)}× field median). Focus there first.`;
    }

    return textResult({
      operator: operatorName ? { codename: codename, display_name: operatorName } : null,
      pillars: { input: pillars.input, output: pillars.output, cache_read: pillars.cacheRead, cache_write: pillars.cacheCreate },
      your_cascade: {
        yield_: myCascade.yield, snr: myCascade.snr, leverage: myCascade.leverage,
        velocity: myCascade.velocity, dev10x: myCascade.dev10x, class: myCascade.class,
      },
      field_position: {
        percentile: myPercentile,
        estimated_rank: myRank,
        total_operators: fieldYields.length,
        window: window,
      },
      field_benchmarks: {
        median_yield: Number(median.toFixed(2)),
        top_10_percent_yield: Number(top10Yield.toFixed(2)),
        top_1_percent_yield: Number(top1Yield.toFixed(2)),
        median_leverage: Number(medLev.toFixed(1)),
        median_velocity: Number(medVel.toFixed(3)),
        median_snr: Number(medSnr.toFixed(4)),
      },
      distance: {
        from_median_pct: distFromMedian,
        from_top_10_pct: distFromTop10,
      },
      strongest_metric: {
        metric: strongest.metric,
        yours: Number(strongest.mine.toFixed(2)),
        field_median: Number(strongest.field.toFixed(2)),
        ratio_to_median: Number(strongest.ratio.toFixed(2)),
      },
      weakest_metric: {
        metric: weakest.metric,
        yours: Number(weakest.mine.toFixed(2)),
        field_median: Number(weakest.field.toFixed(2)),
        ratio_to_median: Number(weakest.ratio.toFixed(2)),
      },
      interpretation,
    });
  }

  if (name === "rank_if") {
    const parsed = parsePillars(args);
    if ("error" in parsed) {
      return textResult({ code: "invalid_arguments", message: parsed.error }, true);
    }
    const targetPercentile = args.target_percentile;
    if (typeof targetPercentile !== "number" || !Number.isFinite(targetPercentile) || targetPercentile < 0 || targetPercentile > 100) {
      return textResult({ code: "invalid_arguments", message: "target_percentile must be a number between 0 and 100." }, true);
    }
    const window = typeof args.window === "string" ? args.window : "30d";

    const myCascade = cascade(parsed.input, parsed.output, parsed.cacheCreate, parsed.cacheRead);
    const myYield = myCascade.yield ?? 0;

    // Fetch the live board to find the target yield threshold
    const board = await getLeaderboard({ window, windowFilter: true, limit: 1000 });
    if (board.length === 0) {
      return textResult({ code: "board_unavailable", message: "Live leaderboard data is unavailable. Try again later." }, true);
    }

    const fieldYields: number[] = [];
    for (const row of board) {
      const c = row.snapshot.cascade;
      if (!c || c.nonCompounding) continue;
      if (typeof c.yield_ === "number") fieldYields.push(c.yield_);
    }

    if (fieldYields.length < 5) {
      return textResult({ code: "insufficient_field", message: `Only ${fieldYields.length} compounding operators on the ${window} board — not enough for a meaningful simulation.` }, true);
    }

    const sortedYields = [...fieldYields].sort((a, b) => a - b);
    // target_percentile = 90 means "be better than 90% of the field"
    // → the yield at the 90th percentile of the sorted array
    const targetIdx = Math.floor(sortedYields.length * (targetPercentile / 100));
    const targetYield = sortedYields[Math.min(targetIdx, sortedYields.length - 1)];

    // Current position
    let below = 0;
    for (const y of fieldYields) {
      if (y < myYield) below++;
    }
    const currentPercentile = Number(((below / fieldYields.length) * 100).toFixed(1));
    const currentRank = fieldYields.filter((y) => y > myYield).length + 1;

    // If already at or above target
    if (currentPercentile >= targetPercentile) {
      return textResult({
        pillars: { input: parsed.input, output: parsed.output, cache_read: parsed.cacheRead, cache_write: parsed.cacheCreate },
        current: { yield: myYield, percentile: currentPercentile, rank: currentRank, class: myCascade.class },
        target: { percentile: targetPercentile, required_yield: Number(targetYield.toFixed(2)) },
        already_achieved: true,
        message: `You're already at the ${currentPercentile}th percentile — above your target of ${targetPercentile}th.`,
      });
    }

    const yieldGap = targetYield - myYield;
    if (yieldGap <= 0) {
      return textResult({
        pillars: { input: parsed.input, output: parsed.output, cache_read: parsed.cacheRead, cache_write: parsed.cacheCreate },
        current: { yield: myYield, percentile: currentPercentile, rank: currentRank, class: myCascade.class },
        target: { percentile: targetPercentile, required_yield: Number(targetYield.toFixed(2)) },
        already_achieved: true,
        message: `Your yield already exceeds the ${targetPercentile}th percentile threshold.`,
      });
    }

    // Simulate strategies to find the smallest change that reaches targetYield
    // Υ = (cacheRead / input) × (output / input) = (cacheRead × output) / input²
    // Strategies: increase cacheRead, decrease input, increase output, or combinations
    const strategies: Array<Record<string, unknown>> = [];

    // Strategy 1: Increase cache reads only — find the multiplier needed
    // myYield × mult = targetYield → mult = targetYield / myYield
    if (myYield > 0 && parsed.cacheRead > 0) {
      const crMult = targetYield / myYield;
      const newCr = Math.round(parsed.cacheRead * crMult);
      const sim = cascade(parsed.input, parsed.output, parsed.cacheCreate, newCr);
      if (sim.yield !== null && sim.yield >= targetYield) {
        strategies.push({
          strategy: `Increase cache reads by ${Math.round((crMult - 1) * 100)}%`,
          pillar_changed: "cache_read",
          change: `+${(newCr - parsed.cacheRead).toLocaleString()} tokens`,
          new_value: newCr,
          simulated_yield: Number(sim.yield.toFixed(2)),
          yield_delta: Number((sim.yield - myYield).toFixed(2)),
          simulated_class: sim.class,
          class_changed: myCascade.class !== sim.class,
        });
      }
    }

    // Strategy 2: Decrease input only
    // Υ = (cr × o) / i² → targetYield = (cr × o) / i² → i = sqrt(cr × o / targetYield)
    if (targetYield > 0 && parsed.cacheRead > 0 && parsed.output > 0) {
      const newInput = Math.floor(Math.sqrt((parsed.cacheRead * parsed.output) / targetYield));
      if (newInput > 0 && newInput < parsed.input) {
        const sim = cascade(newInput, parsed.output, parsed.cacheCreate, parsed.cacheRead);
        if (sim.yield !== null && sim.yield >= targetYield) {
          strategies.push({
            strategy: `Reduce fresh input by ${Math.round((1 - newInput / parsed.input) * 100)}%`,
            pillar_changed: "input",
            change: `-${(parsed.input - newInput).toLocaleString()} tokens`,
            new_value: newInput,
            simulated_yield: Number(sim.yield.toFixed(2)),
            yield_delta: Number((sim.yield - myYield).toFixed(2)),
            simulated_class: sim.class,
            class_changed: myCascade.class !== sim.class,
          });
        }
      }
    }

    // Strategy 3: Increase output only
    // targetYield = (cr × o_new) / i² → o_new = targetYield × i² / cr
    if (targetYield > 0 && parsed.cacheRead > 0 && parsed.input > 0) {
      const newOutput = Math.ceil((targetYield * parsed.input * parsed.input) / parsed.cacheRead);
      if (newOutput > parsed.output) {
        const sim = cascade(parsed.input, newOutput, parsed.cacheCreate, parsed.cacheRead);
        if (sim.yield !== null && sim.yield >= targetYield) {
          strategies.push({
            strategy: `Increase output by ${Math.round((newOutput / parsed.output - 1) * 100)}%`,
            pillar_changed: "output",
            change: `+${(newOutput - parsed.output).toLocaleString()} tokens`,
            new_value: newOutput,
            simulated_yield: Number(sim.yield.toFixed(2)),
            yield_delta: Number((sim.yield - myYield).toFixed(2)),
            simulated_class: sim.class,
            class_changed: myCascade.class !== sim.class,
          });
        }
      }
    }

    // Strategy 4: Balanced — 50% from cache reads, 50% from input reduction
    if (myYield > 0 && parsed.cacheRead > 0) {
      const sqrtMult = Math.sqrt(targetYield / myYield);
      const newCr2 = Math.round(parsed.cacheRead * sqrtMult);
      const newInput2 = Math.round(parsed.input / sqrtMult);
      if (newInput2 > 0) {
        const sim = cascade(newInput2, parsed.output, parsed.cacheCreate, newCr2);
        if (sim.yield !== null && sim.yield >= targetYield) {
          strategies.push({
            strategy: `Balanced: +${Math.round((sqrtMult - 1) * 100)}% cache reads, -${Math.round((1 - 1 / sqrtMult) * 100)}% input`,
            pillar_changed: "cache_read + input",
            change: `cache_read: +${(newCr2 - parsed.cacheRead).toLocaleString()}, input: -${(parsed.input - newInput2).toLocaleString()}`,
            new_values: { cache_read: newCr2, input: newInput2 },
            simulated_yield: Number(sim.yield.toFixed(2)),
            yield_delta: Number((sim.yield - myYield).toFixed(2)),
            simulated_class: sim.class,
            class_changed: myCascade.class !== sim.class,
          });
        }
      }
    }

    // Strategy 5: If no cache, enable caching
    if (parsed.cacheRead === 0 && parsed.cacheCreate === 0 && parsed.input > 0 && parsed.output > 0) {
      // Need cr such that (cr × output) / input² >= targetYield
      const minCr = Math.ceil((targetYield * parsed.input * parsed.input) / parsed.output);
      const sim = cascade(parsed.input, parsed.output, Math.round(minCr * 0.5), minCr);
      if (sim.yield !== null && sim.yield >= targetYield) {
        strategies.push({
          strategy: `Enable caching with ${minCr.toLocaleString()} cache reads`,
          pillar_changed: "cache_read",
          change: `+${minCr.toLocaleString()} tokens (from zero)`,
          new_value: minCr,
          simulated_yield: Number(sim.yield.toFixed(2)),
          yield_delta: Number((sim.yield - myYield).toFixed(2)),
          simulated_class: sim.class,
          class_changed: myCascade.class !== sim.class,
        });
      }
    }

    if (strategies.length === 0) {
      return textResult({
        pillars: { input: parsed.input, output: parsed.output, cache_read: parsed.cacheRead, cache_write: parsed.cacheCreate },
        current: { yield: myYield, percentile: currentPercentile, rank: currentRank, class: myCascade.class },
        target: { percentile: targetPercentile, required_yield: Number(targetYield.toFixed(2)) },
        yield_gap: Number(yieldGap.toFixed(2)),
        message: `No single-pillar strategy could reach the ${targetPercentile}th percentile from your current position. The gap (${yieldGap.toFixed(1)} Υ) is too large for one change — consider combining multiple improvements.`,
      });
    }

    // Sort by smallest token change (simplest path)
    strategies.sort((a, b) => (a.yield_delta as number) - (b.yield_delta as number));
    const bestPath = strategies[0] as Record<string, unknown>;

    // Compute simulated rank
    const simYield = bestPath.simulated_yield as number;
    let simBelow = 0;
    for (const y of fieldYields) {
      if (y < simYield) simBelow++;
    }
    const simPercentile = Number(((simBelow / fieldYields.length) * 100).toFixed(1));
    const simRank = fieldYields.filter((y) => y > simYield).length + 1;

    return textResult({
      pillars: { input: parsed.input, output: parsed.output, cache_read: parsed.cacheRead, cache_write: parsed.cacheCreate },
      current: {
        yield: myYield,
        percentile: currentPercentile,
        rank: currentRank,
        class: myCascade.class,
      },
      target: {
        percentile: targetPercentile,
        required_yield: Number(targetYield.toFixed(2)),
        yield_gap: Number(yieldGap.toFixed(2)),
      },
      simulated: {
        yield: simYield,
        percentile: simPercentile,
        rank: simRank,
        class: bestPath.simulated_class,
        class_changed: bestPath.class_changed,
      },
      best_path: bestPath,
      all_paths: strategies,
      interpretation: `To move from the ${currentPercentile}th to the ${targetPercentile}th percentile, the smallest change is: ${bestPath.strategy}. This would move you from rank #${currentRank} to ~#${simRank} (${simPercentile}th percentile).`,
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
        description: "AI operator benchmark measuring token-cascade efficiency from privacy-preserving telemetry.",
        websiteUrl: "https://signalaf.com",
      },
      instructions:
        "Use SignalAF to benchmark AI operators from privacy-preserving token telemetry. Read tools: rank_paste (compute cascade from 4 token counts), get_leaderboard (public rankings), get_operator (operator profile by codename). Analytical tools (pure math): simulate_change (what-if pillar changes), diagnose_cascade (efficiency leak finder), suggest_improvements (ranked yield optimizer), self_improve (one-click full cycle), rank_windows (multi-window cascade). Field-relative tools (need leaderboard): benchmark_me (answers 'how good am I?' — percentile, rank, strongest/weakest metric vs field), rank_if (answers 'what would it take to reach top 10%?' — counterfactual rank simulator). Do not treat these metrics as a model-quality or downstream-productivity benchmark.",
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
