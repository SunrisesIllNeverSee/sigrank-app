import type { NextRequest } from "next/server";
import { getLeaderboard, getOperator } from "@/lib/board";
import {
  cascade,
  classify,
  round,
  fieldStats,
  percentileOf,
  rankOf,
  operatorSignature,
  evaluateOperator,
  type CascadeResult,
  type OperatorEvaluation,
} from "@sigrank/cascade";
import {
  PROTOCOL_VERSION,
  SUPPORTED_VERSIONS,
  jsonRpc,
  rpcError,
  textResult,
  allowedOrigin,
  negotiateProtocolVersion,
  type RpcId,
  type RpcRequest,
} from "@/lib/mcp/protocol";
// Compatibility bridge: legacy Exchange tool calls through /api/mcp are
// dispatched to the shared Exchange dispatcher. Exchange tools are NOT
// advertised in tools/list — callers should migrate to /api/exchange/mcp.
import {
  dispatchExchangeTool,
  isExchangeTool,
  resolveScopes,
  enforceScopeForCall,
} from "@/lib/exchange/mcp-server";
import {
  recordMcpCall,
  hashIp,
  deriveAgentIdentity,
  deriveAuthTier,
} from "@/lib/exchange/mcp-observability";

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
  {
    name: "operator_gap",
    title: "Operator Gap — What Separates Two Operators",
    description:
      "Answers 'What specifically separates operator A from operator B?' — not just 'A has more Yield', but the primary cause, secondary cause, and offsetting weakness. Takes two codenames or two sets of pillars, computes both cascades, and decomposes the yield gap into leverage, velocity, SNR, and scale contributions. Returns the most explanatory factor.",
    annotations: READ_ONLY_ANNOTATIONS,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        a_codename: { type: "string", description: "Codename for operator A (alternative to a_* pillars)" },
        b_codename: { type: "string", description: "Codename for operator B (alternative to b_* pillars)" },
        a_input: { type: "number", minimum: 0 },
        a_output: { type: "number", minimum: 0 },
        a_cache_read: { type: "number", minimum: 0 },
        a_cache_write: { type: "number", minimum: 0 },
        b_input: { type: "number", minimum: 0 },
        b_output: { type: "number", minimum: 0 },
        b_cache_read: { type: "number", minimum: 0 },
        b_cache_write: { type: "number", minimum: 0 },
      },
    },
  },
  {
    name: "field_anomaly",
    title: "Field Anomaly — Unusual Patterns in the Leaderboard",
    description:
      "Finds unusual operators, metric relationships, and outliers in the live leaderboard — without user prompting. Returns: highest velocity among below-median leverage operators, only top-50 operator with near-zero cache write, largest 30-day yield improvement, rarest signature, and extreme divergence. Powers automated micro-marketing and field insights.",
    annotations: READ_ONLY_ANNOTATIONS,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        window: { type: "string", enum: ["7d", "30d", "90d", "all_time"], default: "30d" },
      },
    },
  },
  {
    name: "who_operates_like_me",
    title: "Who Operates Like Me — Nearest Neighbor Finder",
    description:
      "Finds operators whose operating signature most resembles yours. Takes 4 pillars or a codename, computes your signature, then searches the live leaderboard for the nearest neighbors by signature distance. Returns: nearest operators, similarity %, where they outperform you, where you outperform them, and what separates you from the better operator. Makes the leaderboard feel like a network, not a list.",
    annotations: READ_ONLY_ANNOTATIONS,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        input: { type: "number", minimum: 0 },
        output: { type: "number", minimum: 0 },
        cache_read: { type: "number", minimum: 0 },
        cache_write: { type: "number", minimum: 0 },
        codename: { type: "string", description: "Operator codename (alternative to pillars)" },
        window: { type: "string", enum: ["7d", "30d", "90d", "all_time"], default: "30d" },
        limit: { type: "number", minimum: 1, maximum: 20, default: 5, description: "Number of nearest neighbors to return (default 5)" },
      },
    },
  },
  {
    name: "compare_to_field",
    title: "Compare to Field — You vs Field vs Top 10% vs Top 1%",
    description:
      "Creates a 'YOU vs FIELD vs TOP 10% vs TOP 1%' comparison table for your cascade metrics. Takes 4 pillars or a codename, fetches the live leaderboard, and returns your metrics alongside field median, top quartile, top decile, and top percentile for yield, leverage, velocity, and SNR. Simple, useful, and immediately understandable.",
    annotations: READ_ONLY_ANNOTATIONS,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        input: { type: "number", minimum: 0 },
        output: { type: "number", minimum: 0 },
        cache_read: { type: "number", minimum: 0 },
        cache_write: { type: "number", minimum: 0 },
        codename: { type: "string", description: "Operator codename (alternative to pillars)" },
        window: { type: "string", enum: ["7d", "30d", "90d", "all_time"], default: "30d" },
      },
    },
  },
  {
    name: "operator_signature",
    title: "Operator Signature — Portable Identity Object",
    description:
      "Computes a normalized operating signature from 4 token pillars or a codename. Returns: signature code (L240-V0.31-S0.24-C0.08 format), archetype (CONTEXTUAL, GENERATOR, BALANCED_ELITE, READER, COMMITTER, STANDARD), dominant trait, and closest comparable operators from the live board. A portable identity object that can feed profile cards, social sharing, enterprise clustering, peer discovery, and longitudinal drift.",
    annotations: READ_ONLY_ANNOTATIONS,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {
        input: { type: "number", minimum: 0 },
        output: { type: "number", minimum: 0 },
        cache_read: { type: "number", minimum: 0 },
        cache_write: { type: "number", minimum: 0 },
        codename: { type: "string", description: "Operator codename (alternative to pillars)" },
        window: { type: "string", enum: ["7d", "30d", "90d", "all_time"], default: "30d" },
      },
    },
  },
] as const;

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

/** Generate a shareable URL and text snippet for a tool result. */
function shareable(toolName: string, params: Record<string, unknown>, summary: string): { share_url: string; share_text: string } {
  const encoded = encodeURIComponent(JSON.stringify(params));
  const url = `https://signalaf.com/share/mcp?t=${toolName}&d=${encoded}`;
  return {
    share_url: url,
    share_text: summary,
  };
}

async function callTool(name: string, args: Record<string, unknown>, req: NextRequest) {
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
    const c = cascade(input as number, output as number, cacheWrite as number, cacheRead as number);
    const nonCompounding = (cacheWrite as number) === 0;
    const evaluation = evaluateOperator(
      { input: input as number, output: output as number, cache_read: cacheRead as number, cache_write: cacheWrite as number },
    );
    return textResult({
      input,
      output,
      cache_read: cacheRead,
      cache_write: cacheWrite,
      yield_: c.yield,
      leverage: c.leverage,
      velocity: c.velocity,
      snr: c.snr,
      dev10x: c.dev10x,
      class: c.class,
      non_compounding: nonCompounding,
      ...(c.warnings ? { warnings: c.warnings } : {}),
      evaluation,
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
      share: shareable("benchmark_me", { input: pillars.input, output: pillars.output, cache_read: pillars.cacheRead, cache_write: pillars.cacheCreate, window }, interpretation),
      evaluation: evaluateOperator(
        { input: pillars.input, output: pillars.output, cache_read: pillars.cacheRead, cache_write: pillars.cacheCreate },
        { codename: codename ?? undefined, display_name: operatorName ?? undefined, fieldYields, fieldLeverages, fieldVelocities, fieldSnrs, window },
      ),
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
      if (newInput >= 1000 && newInput < parsed.input) {
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
      if (newInput2 >= 1000) {
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
      share: shareable("rank_if", { input: parsed.input, output: parsed.output, cache_read: parsed.cacheRead, cache_write: parsed.cacheCreate, target_percentile: targetPercentile, window }, `Rank ${currentRank} → ~${simRank} (${currentPercentile}th → ${simPercentile}th percentile) via: ${bestPath.strategy}`),
    });
  }

  // ─── #2: operator_gap, field_anomaly, who_operates_like_me, compare_to_field, operator_signature

  if (name === "operator_gap") {
    // Parse operator A
    let aPillars: { input: number; output: number; cacheCreate: number; cacheRead: number };
    let aName: string | null = null;
    if (typeof args.a_codename === "string") {
      const row = await getOperator(args.a_codename.trim());
      if (!row) return textResult({ code: "operator_not_found", message: `No operator with codename "${args.a_codename}".` }, true);
      aName = row.operator.display_name || row.operator.codename;
      const tel = row.telemetry;
      if (!tel) return textResult({ code: "no_telemetry", message: `Operator "${args.a_codename}" has no telemetry.` }, true);
      aPillars = { input: tel.fresh_input, output: tel.output, cacheCreate: tel.cache_create, cacheRead: tel.cache_read };
    } else {
      const parsed = parsePillars({
        input: args.a_input, output: args.a_output,
        cache_read: args.a_cache_read, cache_write: args.a_cache_write,
      });
      if ("error" in parsed) return textResult({ code: "invalid_arguments", message: "Operator A: " + parsed.error + " Or provide a_codename." }, true);
      aPillars = parsed;
    }

    // Parse operator B
    let bPillars: { input: number; output: number; cacheCreate: number; cacheRead: number };
    let bName: string | null = null;
    if (typeof args.b_codename === "string") {
      const row = await getOperator(args.b_codename.trim());
      if (!row) return textResult({ code: "operator_not_found", message: `No operator with codename "${args.b_codename}".` }, true);
      bName = row.operator.display_name || row.operator.codename;
      const tel = row.telemetry;
      if (!tel) return textResult({ code: "no_telemetry", message: `Operator "${args.b_codename}" has no telemetry.` }, true);
      bPillars = { input: tel.fresh_input, output: tel.output, cacheCreate: tel.cache_create, cacheRead: tel.cache_read };
    } else {
      const parsed = parsePillars({
        input: args.b_input, output: args.b_output,
        cache_read: args.b_cache_read, cache_write: args.b_cache_write,
      });
      if ("error" in parsed) return textResult({ code: "invalid_arguments", message: "Operator B: " + parsed.error + " Or provide b_codename." }, true);
      bPillars = parsed;
    }

    const aC = cascade(aPillars.input, aPillars.output, aPillars.cacheCreate, aPillars.cacheRead);
    const bC = cascade(bPillars.input, bPillars.output, bPillars.cacheCreate, bPillars.cacheRead);
    const aYield = aC.yield ?? 0;
    const bYield = bC.yield ?? 0;
    const yieldGap = aYield - bYield;

    // Decompose the yield gap into metric contributions
    // Υ = leverage × velocity = (cr/i) × (o/i)
    const aLev = aC.leverage ?? 0;
    const bLev = bC.leverage ?? 0;
    const aVel = aC.velocity ?? 0;
    const bVel = bC.velocity ?? 0;
    const aSnr = aC.snr ?? 0;
    const bSnr = bC.snr ?? 0;

    const levGap = aLev - bLev;
    const velGap = aVel - bVel;
    const snrGap = aSnr - bSnr;

    // Rank the contributing factors
    const factors: Array<{ factor: string; gap: number; description: string }> = [
      { factor: "leverage", gap: levGap, description: `cache reuse (${aLev.toFixed(1)}× vs ${bLev.toFixed(1)}×)` },
      { factor: "velocity", gap: velGap, description: `output rate (${aVel.toFixed(2)}× vs ${bVel.toFixed(2)}×)` },
      { factor: "snr", gap: snrGap, description: `signal-to-noise (${aSnr.toFixed(3)} vs ${bSnr.toFixed(3)})` },
    ];
    factors.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));

    const primary = factors[0];
    const secondary = factors[1];
    const offsetting = factors.find((f) => f.gap < 0);

    const winner = yieldGap > 0 ? (aName || "A") : (bName || "B");
    const rankDiff = Math.abs(yieldGap) > 0 ? `${Math.abs(yieldGap).toFixed(1)} Υ` : "tied";

    return textResult({
      operator_a: { codename: args.a_codename ?? null, display_name: aName, yield: aYield, leverage: aLev, velocity: aVel, snr: aSnr, class: aC.class },
      operator_b: { codename: args.b_codename ?? null, display_name: bName, yield: bYield, leverage: bLev, velocity: bVel, snr: bSnr, class: bC.class },
      yield_gap: Number(yieldGap.toFixed(2)),
      winner,
      margin: rankDiff,
      primary_cause: { factor: primary.factor, gap: Number(primary.gap.toFixed(4)), description: primary.description },
      secondary_cause: { factor: secondary.factor, gap: Number(secondary.gap.toFixed(4)), description: secondary.description },
      ...(offsetting ? { offsetting_weakness: { factor: offsetting.factor, gap: Number(offsetting.gap.toFixed(4)), description: offsetting.description } } : {}),
      most_explanatory_factor: primary.factor,
      interpretation: `${winner} outranks by ${rankDiff}. Primary cause: ${primary.description}. Secondary: ${secondary.description}.${offsetting ? ` Offsetting weakness: ${offsetting.description}.` : ""}`,
    });
  }

  if (name === "field_anomaly") {
    const window = typeof args.window === "string" ? args.window : "30d";
    const board = await getLeaderboard({ window, windowFilter: true, limit: 1000 });
    if (board.length === 0) {
      return textResult({ code: "board_unavailable", message: "Live leaderboard data is unavailable." }, true);
    }

    // Collect compounding operators
    const ops: Array<{ codename: string; display_name: string; yield: number; leverage: number; velocity: number; snr: number; cache_write: number; rank: number; movement_7d: number; class: string }> = [];
    for (const row of board) {
      const c = row.snapshot.cascade;
      if (!c || c.nonCompounding) continue;
      ops.push({
        codename: row.operator.codename,
        display_name: row.operator.display_name || row.operator.codename,
        yield: c.yield_ ?? 0,
        leverage: c.leverage ?? 0,
        velocity: c.velocity ?? 0,
        snr: c.snr ?? 0,
        cache_write: row.telemetry?.cache_create ?? 0,
        rank: row.global_rank,
        movement_7d: row.snapshot.movement_7d,
        class: row.snapshot.class_tier,
      });
    }

    if (ops.length < 5) {
      return textResult({ code: "insufficient_field", message: `Only ${ops.length} compounding operators — not enough for anomaly detection.` });
    }

    const medianLev = [...ops.map((o) => o.leverage)].sort((a, b) => a - b)[Math.floor(ops.length / 2)];
    const anomalies: Array<Record<string, unknown>> = [];

    // 1. Highest velocity among below-median leverage operators
    const belowMedianLev = ops.filter((o) => o.leverage < medianLev);
    if (belowMedianLev.length > 0) {
      const top = [...belowMedianLev].sort((a, b) => b.velocity - a.velocity)[0];
      anomalies.push({
        type: "high_velocity_low_leverage",
        title: `Highest Velocity among below-median Leverage operators`,
        operator: top.codename,
        display_name: top.display_name,
        velocity: top.velocity,
        leverage: top.leverage,
        finding: `${top.display_name} has velocity ${top.velocity.toFixed(2)}× with only ${top.leverage.toFixed(1)}× leverage — generating fast without much context reuse.`,
      });
    }

    // 2. Only top-50 operator with near-zero cache write
    const top50 = ops.slice(0, Math.min(50, ops.length));
    const nearZeroCw = top50.filter((o) => o.cache_write < o.yield * 0.01);
    if (nearZeroCw.length > 0 && nearZeroCw.length <= 3) {
      for (const op of nearZeroCw) {
        anomalies.push({
          type: "top_50_zero_cache_write",
          title: `Top-50 operator with near-zero cache write`,
          operator: op.codename,
          display_name: op.display_name,
          rank: op.rank,
          cache_write: op.cache_write,
          finding: `${op.display_name} is rank #${op.rank} with near-zero cache creation — non-compounding or barely committing context.`,
        });
      }
    }

    // 3. Largest 7-day yield improvement
    const movers = [...ops].filter((o) => o.movement_7d > 0).sort((a, b) => b.movement_7d - a.movement_7d);
    if (movers.length > 0) {
      const top = movers[0];
      anomalies.push({
        type: "largest_7d_improvement",
        title: `Largest 7-day rank improvement`,
        operator: top.codename,
        display_name: top.display_name,
        movement_7d: top.movement_7d,
        finding: `${top.display_name} climbed ${top.movement_7d} positions in the last 7 days — the largest field movement.`,
      });
    }

    // 4. Extreme divergence: highest yield with lowest class
    const sortedByYield = [...ops].sort((a, b) => b.yield - a.yield);
    const topYield = sortedByYield[0];
    const bottomYield = sortedByYield[sortedByYield.length - 1];
    if (topYield && bottomYield && topYield.yield > 0) {
      const ratio = bottomYield.yield > 0 ? topYield.yield / bottomYield.yield : Infinity;
      if (ratio > 100) {
        anomalies.push({
          type: "extreme_yield_divergence",
          title: `Extreme yield divergence`,
          top: { operator: topYield.codename, yield: topYield.yield },
          bottom: { operator: bottomYield.codename, yield: bottomYield.yield },
          ratio: ratio === Infinity ? "infinite" : Number(ratio.toFixed(1)),
          finding: `Top operator ${topYield.display_name} (Υ ${topYield.yield.toFixed(1)}) outperforms bottom ${bottomYield.display_name} (Υ ${bottomYield.yield.toFixed(1)}) by ${ratio === Infinity ? "∞" : ratio.toFixed(0) + "×"}.`,
        });
      }
    }

    // 5. Rarest signature (compute signatures and find the most unusual)
    const sigs = ops.map((o) => operatorSignature(cascade(0, 0, 0, 0))); // placeholder — would need pillars
    // Skip signature rarity for now — needs pillar data from the board

    return textResult({
      window,
      total_operators: ops.length,
      anomalies,
      summary: `${anomalies.length} anomalies detected across ${ops.length} compounding operators.`,
    });
  }

  if (name === "who_operates_like_me") {
    const window = typeof args.window === "string" ? args.window : "30d";
    const limit = typeof args.limit === "number" ? Math.min(20, Math.max(1, Math.trunc(args.limit))) : 5;
    const codename = typeof args.codename === "string" ? args.codename.trim() : null;

    let myPillars: { input: number; output: number; cacheCreate: number; cacheRead: number };
    let myName: string | null = null;

    if (codename) {
      const row = await getOperator(codename);
      if (!row) return textResult({ code: "operator_not_found", message: `No operator with codename "${codename}".` }, true);
      myName = row.operator.display_name || row.operator.codename;
      const tel = row.telemetry;
      if (!tel) return textResult({ code: "no_telemetry", message: `Operator "${codename}" has no telemetry.` }, true);
      myPillars = { input: tel.fresh_input, output: tel.output, cacheCreate: tel.cache_create, cacheRead: tel.cache_read };
    } else {
      const parsed = parsePillars(args);
      if ("error" in parsed) return textResult({ code: "invalid_arguments", message: parsed.error + " Or provide a codename." }, true);
      myPillars = parsed;
    }

    const myC = cascade(myPillars.input, myPillars.output, myPillars.cacheCreate, myPillars.cacheRead);
    const mySig = operatorSignature(myC);
    const myLev = myC.leverage ?? 0;
    const myVel = myC.velocity ?? 0;
    const mySnr = myC.snr ?? 0;

    const board = await getLeaderboard({ window, windowFilter: true, limit: 1000 });
    if (board.length === 0) {
      return textResult({ code: "board_unavailable", message: "Live leaderboard data is unavailable." }, true);
    }

    // Compute signature distance to each board operator
    const neighbors: Array<Record<string, unknown>> = [];
    for (const row of board) {
      const c = row.snapshot.cascade;
      if (!c || c.nonCompounding) continue;
      if (codename && row.operator.codename.toLowerCase() === codename.toLowerCase()) continue;

      const theirLev = c.leverage ?? 0;
      const theirVel = c.velocity ?? 0;
      const theirSnr = c.snr ?? 0;

      // Normalized Euclidean distance on (leverage, velocity, snr)
      // Normalize by field scale: leverage ~100s, velocity ~1-10, snr ~0-1
      const dLev = (myLev - theirLev) / 100;
      const dVel = (myVel - theirVel) / 5;
      const dSnr = (mySnr - theirSnr) / 1;
      const distance = Math.sqrt(dLev * dLev + dVel * dVel + dSnr * dSnr);
      const similarity = Math.max(0, Number((100 - distance * 10).toFixed(1)));

      neighbors.push({
        codename: row.operator.codename,
        display_name: row.operator.display_name || row.operator.codename,
        rank: row.global_rank,
        yield: c.yield_,
        leverage: theirLev,
        velocity: theirVel,
        snr: theirSnr,
        class: row.snapshot.class_tier,
        signature_distance: Number(distance.toFixed(3)),
        similarity_pct: similarity,
        ...(theirLev > myLev ? { they_outperform_you_on: "leverage" } : {}),
        ...(theirVel > myVel ? { they_outperform_you_on_velocity: true } : {}),
        ...(c.yield_ && c.yield_ > (myC.yield ?? 0) ? { separates_you_from_better: `+${Number((c.yield_ - (myC.yield ?? 0)).toFixed(1))} Υ` } : {}),
      });
    }

    neighbors.sort((a, b) => (a.signature_distance as number) - (b.signature_distance as number));
    const top = neighbors.slice(0, limit);

    return textResult({
      you: {
        codename: codename,
        display_name: myName,
        signature: mySig.code,
        archetype: mySig.archetype,
        dominant_trait: mySig.dominant_trait,
        yield: myC.yield,
        leverage: myLev,
        velocity: myVel,
        snr: mySnr,
      },
      nearest_neighbors: top,
      window,
      total_compared: neighbors.length,
      evaluation: evaluateOperator(
        { input: myPillars.input, output: myPillars.output, cache_read: myPillars.cacheRead, cache_write: myPillars.cacheCreate },
        { codename: codename ?? undefined, display_name: myName ?? undefined, window },
      ),
    });
  }

  if (name === "compare_to_field") {
    const window = typeof args.window === "string" ? args.window : "30d";
    const codename = typeof args.codename === "string" ? args.codename.trim() : null;

    let pillars: { input: number; output: number; cacheCreate: number; cacheRead: number };
    let myName: string | null = null;

    if (codename) {
      const row = await getOperator(codename);
      if (!row) return textResult({ code: "operator_not_found", message: `No operator with codename "${codename}".` }, true);
      myName = row.operator.display_name || row.operator.codename;
      const tel = row.telemetry;
      if (!tel) return textResult({ code: "no_telemetry", message: `Operator "${codename}" has no telemetry.` }, true);
      pillars = { input: tel.fresh_input, output: tel.output, cacheCreate: tel.cache_create, cacheRead: tel.cache_read };
    } else {
      const parsed = parsePillars(args);
      if ("error" in parsed) return textResult({ code: "invalid_arguments", message: parsed.error + " Or provide a codename." }, true);
      pillars = parsed;
    }

    const myC = cascade(pillars.input, pillars.output, pillars.cacheCreate, pillars.cacheRead);
    const board = await getLeaderboard({ window, windowFilter: true, limit: 1000 });
    if (board.length === 0) {
      return textResult({ code: "board_unavailable", message: "Live leaderboard data is unavailable." }, true);
    }

    const yields: number[] = [], leverages: number[] = [], velocities: number[] = [], snrs: number[] = [];
    for (const row of board) {
      const c = row.snapshot.cascade;
      if (!c || c.nonCompounding) continue;
      if (typeof c.yield_ === "number") yields.push(c.yield_);
      if (typeof c.leverage === "number") leverages.push(c.leverage);
      if (typeof c.velocity === "number") velocities.push(c.velocity);
      if (typeof c.snr === "number") snrs.push(c.snr);
    }

    if (yields.length < 5) {
      return textResult({ code: "insufficient_field", message: `Only ${yields.length} compounding operators.` });
    }

    const bands = (arr: number[]) => {
      const s = [...arr].sort((a, b) => a - b);
      return {
        median: s[Math.floor(s.length / 2)],
        top_25: s[Math.floor(s.length * 0.75)] ?? s[s.length - 1],
        top_10: s[Math.floor(s.length * 0.9)] ?? s[s.length - 1],
        top_1: s[Math.floor(s.length * 0.99)] ?? s[s.length - 1],
      };
    };

    const yB = bands(yields), lB = bands(leverages), vB = bands(velocities), sB = bands(snrs);

    const row = (label: string, mine: number | null, field: { median: number; top_25: number; top_10: number; top_1: number }) => ({
      metric: label,
      you: mine,
      field_median: Number(field.median.toFixed(4)),
      top_25_percent: Number(field.top_25.toFixed(4)),
      top_10_percent: Number(field.top_10.toFixed(4)),
      top_1_percent: Number(field.top_1.toFixed(4)),
      delta_from_median: mine !== null ? Number((mine - field.median).toFixed(4)) : null,
    });

    return textResult({
      operator: myName ? { codename, display_name: myName } : null,
      window,
      total_operators: yields.length,
      comparison: [
        row("yield", myC.yield, yB),
        row("leverage", myC.leverage, lB),
        row("velocity", myC.velocity, vB),
        row("snr", myC.snr, sB),
      ],
      evaluation: evaluateOperator(
        { input: pillars.input, output: pillars.output, cache_read: pillars.cacheRead, cache_write: pillars.cacheCreate },
        { codename: codename ?? undefined, display_name: myName ?? undefined, fieldYields: yields, fieldLeverages: leverages, fieldVelocities: velocities, fieldSnrs: snrs, window },
      ),
    });
  }

  if (name === "operator_signature") {
    const window = typeof args.window === "string" ? args.window : "30d";
    const codename = typeof args.codename === "string" ? args.codename.trim() : null;

    let pillars: { input: number; output: number; cacheCreate: number; cacheRead: number };
    let myName: string | null = null;

    if (codename) {
      const row = await getOperator(codename);
      if (!row) return textResult({ code: "operator_not_found", message: `No operator with codename "${codename}".` }, true);
      myName = row.operator.display_name || row.operator.codename;
      const tel = row.telemetry;
      if (!tel) return textResult({ code: "no_telemetry", message: `Operator "${codename}" has no telemetry.` }, true);
      pillars = { input: tel.fresh_input, output: tel.output, cacheCreate: tel.cache_create, cacheRead: tel.cache_read };
    } else {
      const parsed = parsePillars(args);
      if ("error" in parsed) return textResult({ code: "invalid_arguments", message: parsed.error + " Or provide a codename." }, true);
      pillars = parsed;
    }

    const myC = cascade(pillars.input, pillars.output, pillars.cacheCreate, pillars.cacheRead);
    const sig = operatorSignature(myC);

    // Find closest comparable operators from the board
    const board = await getLeaderboard({ window, windowFilter: true, limit: 1000 });
    const comparables: Array<Record<string, unknown>> = [];
    if (board.length > 0) {
      const myLev = myC.leverage ?? 0;
      const myVel = myC.velocity ?? 0;
      const mySnr = myC.snr ?? 0;
      const candidates: Array<Record<string, unknown>> = [];
      for (const row of board) {
        const c = row.snapshot.cascade;
        if (!c || c.nonCompounding) continue;
        if (codename && row.operator.codename.toLowerCase() === codename.toLowerCase()) continue;
        const dLev = (myLev - (c.leverage ?? 0)) / 100;
        const dVel = (myVel - (c.velocity ?? 0)) / 5;
        const dSnr = (mySnr - (c.snr ?? 0)) / 1;
        const dist = Math.sqrt(dLev * dLev + dVel * dVel + dSnr * dSnr);
        candidates.push({
          codename: row.operator.codename,
          display_name: row.operator.display_name || row.operator.codename,
          rank: row.global_rank,
          yield: c.yield_,
          signature_distance: Number(dist.toFixed(3)),
        });
      }
      candidates.sort((a, b) => (a.signature_distance as number) - (b.signature_distance as number));
      comparables.push(...candidates.slice(0, 5));
    }

    return textResult({
      operator: myName ? { codename, display_name: myName } : null,
      signature: sig.code,
      archetype: sig.archetype,
      dominant_trait: sig.dominant_trait,
      metrics: {
        yield: myC.yield,
        leverage: myC.leverage,
        velocity: myC.velocity,
        snr: myC.snr,
        dev10x: myC.dev10x,
        class: myC.class,
      },
      closest_comparables: comparables,
      window,
      share: shareable("operator_signature", { codename: codename, input: pillars.input, output: pillars.output, cache_read: pillars.cacheRead, cache_write: pillars.cacheCreate, window }, `${sig.archetype} operator — ${sig.code} — ${sig.dominant_trait}`),
      evaluation: evaluateOperator(
        { input: pillars.input, output: pillars.output, cache_read: pillars.cacheRead, cache_write: pillars.cacheCreate },
        { codename: codename ?? undefined, display_name: myName ?? undefined, window },
      ),
    });
  }

  // ── Compatibility bridge: legacy Exchange tool calls ───────────────────
  // Exchange tools are no longer advertised in this server's tools/list.
  // Clients calling /api/mcp with a known exchange_* tool name are dispatched
  // through the shared Exchange dispatcher with a deprecation notice.
  // Migration target: https://signalaf.com/api/exchange/mcp
  if (isExchangeTool(name)) {
    const result = await dispatchExchangeTool(name, args, req);
    // Attach deprecation metadata to the text content
    if (result && typeof result === "object" && "content" in result) {
      const content = (result as { content: Array<{ type: string; text: string }> }).content;
      if (content[0]?.text) {
        try {
          const parsed = JSON.parse(content[0].text);
          parsed._deprecated_endpoint = true;
          parsed._migration_target = "https://signalaf.com/api/exchange/mcp";
          parsed._deprecation_notice = "Exchange tools have moved to the dedicated Contribution Exchange MCP at /api/exchange/mcp. This compatibility bridge will be removed.";
          content[0].text = JSON.stringify(parsed, null, 2);
        } catch {
          // If JSON parse fails, append a note
          content[0].text += '\n\n[DEPRECATED] Exchange tools have moved to /api/exchange/mcp';
        }
      }
    }
    return result;
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
    const negotiated = negotiateProtocolVersion(message.params?.protocolVersion);
    return jsonRpc(id, {
      protocolVersion: negotiated,
      capabilities: { tools: {}, resources: { listChanged: false }, prompts: { listChanged: false } },
      serverInfo: {
        name: "sigrank-signalaf",
        title: "SigRank SignalAF",
        version: "1.0.0",
        description: "AI operator benchmark measuring token-cascade efficiency from privacy-preserving telemetry.",
        websiteUrl: "https://signalaf.com",
      },
      instructions:
        "Use SignalAF to benchmark AI operators from privacy-preserving token telemetry. Benchmark tools: rank_paste (compute cascade from 4 token counts), get_leaderboard (public rankings), get_operator (operator profile by codename). Analytical tools (pure math): simulate_change, diagnose_cascade, suggest_improvements, self_improve, rank_windows. Field-relative tools: benchmark_me, rank_if, operator_gap, field_anomaly, who_operates_like_me, compare_to_field, operator_signature. Contribution Exchange tools are now available at a dedicated MCP endpoint: https://signalaf.com/api/exchange/mcp. Do not treat benchmark metrics as a model-quality or downstream-productivity benchmark.",
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
  if (message.method === "tools/list") {
    // SigRank-only: all 15 tools are read-only and always visible.
    // Exchange tools have moved to /api/exchange/mcp.
    return jsonRpc(id, { tools: TOOLS });
  }

  if (message.method === "tools/call") {
    const name = message.params?.name;
    const args = message.params?.arguments;
    if (typeof name !== "string") {
      return rpcError(id, -32602, "Invalid params", { required: "params.name" });
    }
    // Scope enforcement for legacy Exchange tool calls (compatibility bridge).
    // SigRank tools are all read-only and need no scope check.
    // Exchange tools require exchange:attempt or exchange:propose for mutations.
    if (isExchangeTool(name)) {
      const scopes = resolveScopes(req);
      const scopeError = enforceScopeForCall(name, scopes);
      if (scopeError) {
        return jsonRpc(id, scopeError);
      }
    }
    const result = await callTool(
      name,
      args && typeof args === "object" && !Array.isArray(args)
        ? (args as Record<string, unknown>)
        : {},
      req,
    );
    return jsonRpc(id, result);
  }

  // ── resources/list ──
  if (message.method === "resources/list") {
    return jsonRpc(id, {
      resources: [
        {
          uri: "sigrank://methodology",
          name: "Methodology",
          description: "How SigRank measures AI operators — the cascade metric system, formulas, and class taxonomy",
          mimeType: "text/plain",
        },
        {
          uri: "sigrank://metrics",
          name: "Metric Definitions",
          description: "Definitions of Yield (Υ), Leverage, Velocity, SNR, 10xDEV, Scale V, and class tiers",
          mimeType: "text/plain",
        },
        {
          uri: "sigrank://platforms",
          name: "Supported Platforms",
          description: "AI platforms tracked by SigRank",
          mimeType: "application/json",
        },
        {
          uri: "sigrank://formulas",
          name: "Canonical Formulas",
          description: "The frozen canonical formulas — Υ, Leverage, Velocity, SNR, 10xDEV, Scale V",
          mimeType: "text/plain",
        },
        {
          uri: "sigrank://classes",
          name: "RS05 Class Taxonomy",
          description: "The 24-stage class taxonomy from IGNITER III to ARCH+ I with token thresholds",
          mimeType: "application/json",
        },
        {
          uri: "sigrank://benchmarks",
          name: "Live Field Benchmarks",
          description: "Current field-wide benchmark statistics (median, top 10%, top 1%) from the live leaderboard",
          mimeType: "application/json",
        },
      ],
    });
  }

  // ── resources/read ──
  if (message.method === "resources/read") {
    const uri = message.params?.uri;
    if (typeof uri !== "string") {
      return rpcError(id, -32602, "Invalid params", { required: "params.uri" });
    }

    if (uri === "sigrank://methodology") {
      return jsonRpc(id, {
        contents: [{
          uri,
          mimeType: "text/plain",
          text: `SigRank Methodology

SigRank measures AI operator efficiency from privacy-preserving token telemetry.
No prompts, no code, no content — only token counts.

Core metric: Yield (Υ)
  Υ = (cache_read × output) / input²

Yield captures how efficiently an operator converts input tokens into output
through context reuse. Higher Yield = more efficient operator.

Supporting metrics:
  Leverage = cache_read / input
  Velocity = output / input
  SNR = output / (input + output)
  10xDEV = log10(cache_read / input)
  Scale V = log10(total_tokens)

Class taxonomy (24 stages, RS05): IGNITER III → ARCH+ I
Class is determined by total token volume. Rank is field position by Yield.
Archetype is operating shape (leverage/velocity/SNR ratios).

SigRank evaluates AI operators, not models. The harness measures authority
but cannot manufacture authority.`,
        }],
      });
    }

    if (uri === "sigrank://metrics") {
      return jsonRpc(id, {
        contents: [{
          uri,
          mimeType: "text/plain",
          text: `SigRank Metric Definitions

Yield (Υ): (cache_read × output) / input²
  The canonical efficiency metric.

Leverage: cache_read / input
  How many cache-read tokens per input token.

Velocity: output / input
  How many output tokens per input token.

SNR: output / (input + output)
  What fraction of total flow is output.

10xDEV: log10(cache_read / input)
  Log-scale leverage. Requires all four pillars > 0.

Scale V: log10(total_tokens)
  Total volume on a log scale. Used for class tier assignment.

Class Tier: 24-stage taxonomy from IGNITER III to ARCH+ I.
  Determined by total token volume thresholds (RS05).

Archetype: Operating shape.
  CONTEXTUAL: high leverage, low velocity
  GENERATOR: low leverage, high velocity
  BALANCED_ELITE: high leverage AND high velocity
  READER: very low velocity
  COMMITTER: high cache creation
  STANDARD: moderate all-around`,
        }],
      });
    }

    if (uri === "sigrank://platforms") {
      return jsonRpc(id, {
        contents: [{
          uri,
          mimeType: "application/json",
          text: JSON.stringify({
            platforms: ["claude", "cursor", "cline", "windsurf", "codex", "gemini", "chatgpt", "other"],
            description: "SigRank tracks AI operators across these platforms.",
          }, null, 2),
        }],
      });
    }

    if (uri === "sigrank://formulas") {
      return jsonRpc(id, {
        contents: [{
          uri,
          mimeType: "text/plain",
          text: `Canonical SigRank Formulas (frozen)

Yield (Υ):        (cache_read × output) / input²
Leverage:         cache_read / input
Velocity:         output / input
SNR:              output / (input + output)
10xDEV:           log10(cache_read / input)
Scale V:          log10(total_tokens)
Construction:     cache_write / cache_read

Canonical seed values:
  input       = 1,251,211
  output      = 11,296,121
  cache_read  = 128,196,310
  cache_write = 2,555,179,769
  Υ           = 18,436.98

These formulas are frozen. Do not modify without owner approval.`,
        }],
      });
    }

    if (uri === "sigrank://classes") {
      return jsonRpc(id, {
        contents: [{
          uri,
          mimeType: "application/json",
          text: JSON.stringify({
            taxonomy: "RS05",
            stages: 24,
            thresholds: [
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
            ],
          }, null, 2),
        }],
      });
    }

    if (uri === "sigrank://benchmarks") {
      const board = await getLeaderboard({ window: "30d", windowFilter: true, limit: 1000 });
      const yields: number[] = [], leverages: number[] = [], velocities: number[] = [], snrs: number[] = [];
      for (const row of board) {
        const c = row.snapshot.cascade;
        if (!c || c.nonCompounding) continue;
        if (typeof c.yield_ === "number") yields.push(c.yield_);
        if (typeof c.leverage === "number") leverages.push(c.leverage);
        if (typeof c.velocity === "number") velocities.push(c.velocity);
        if (typeof c.snr === "number") snrs.push(c.snr);
      }
      const bands = (arr: number[]) => {
        const s = [...arr].sort((a, b) => a - b);
        return {
          median: s[Math.floor(s.length / 2)],
          top_10: s[Math.floor(s.length * 0.9)] ?? s[s.length - 1],
          top_1: s[Math.floor(s.length * 0.99)] ?? s[s.length - 1],
        };
      };
      return jsonRpc(id, {
        contents: [{
          uri,
          mimeType: "application/json",
          text: JSON.stringify({
            window: "30d",
            generated_at: new Date().toISOString(),
            total_operators: board.length,
            compounding_operators: yields.length,
            yield: bands(yields),
            leverage: bands(leverages),
            velocity: bands(velocities),
            snr: bands(snrs),
          }, null, 2),
        }],
      });
    }

    return rpcError(id, -32602, "Unknown resource", { uri });
  }

  // ── prompts/list ──
  if (message.method === "prompts/list") {
    return jsonRpc(id, {
      prompts: [
        {
          name: "benchmark-my-operator",
          title: "Benchmark My AI Operator",
          description: "Compute your cascade metrics, compare against the live field, and get a one-line interpretation of where you stand.",
          arguments: [
            { name: "input", description: "Total input tokens", required: true },
            { name: "output", description: "Total output tokens", required: true },
            { name: "cache_read", description: "Cache-read tokens", required: true },
            { name: "cache_write", description: "Cache-write tokens", required: true },
            { name: "window", description: "Time window (7d, 30d, 90d, all_time)", required: false },
          ],
        },
        {
          name: "how-do-i-reach-top-10",
          title: "How Do I Reach Top 10%?",
          description: "Counterfactual analysis — finds the smallest pillar change needed to reach a target percentile.",
          arguments: [
            { name: "input", description: "Current input tokens", required: true },
            { name: "output", description: "Current output tokens", required: true },
            { name: "cache_read", description: "Current cache-read tokens", required: true },
            { name: "cache_write", description: "Current cache-write tokens", required: true },
            { name: "target_percentile", description: "Target percentile (0-100, e.g. 90 for top 10%)", required: true },
          ],
        },
        {
          name: "explain-my-signature",
          title: "Explain My Operating Signature",
          description: "Computes your operating archetype, dominant trait, and finds comparable operators on the live board.",
          arguments: [
            { name: "input", description: "Total input tokens", required: true },
            { name: "output", description: "Total output tokens", required: true },
            { name: "cache_read", description: "Cache-read tokens", required: true },
            { name: "cache_write", description: "Cache-write tokens", required: true },
          ],
        },
        {
          name: "diagnose-inefficiency",
          title: "Diagnose My Inefficiency",
          description: "Identifies efficiency leaks in your token cascade with severity, findings, and estimated yield impact per fix.",
          arguments: [
            { name: "input", description: "Total input tokens", required: true },
            { name: "output", description: "Total output tokens", required: true },
            { name: "cache_read", description: "Cache-read tokens", required: true },
            { name: "cache_write", description: "Cache-write tokens", required: true },
          ],
        },
        {
          name: "field-anomaly-report",
          title: "Field Anomaly Report",
          description: "Scans the live leaderboard for unusual patterns — no input required.",
          arguments: [
            { name: "window", description: "Time window (7d, 30d, 90d, all_time)", required: false },
          ],
        },
      ],
    });
  }

  // ── prompts/get ──
  if (message.method === "prompts/get") {
    const promptName = message.params?.name;
    const promptArgs = (message.params?.arguments ?? {}) as Record<string, string | number>;
    if (typeof promptName !== "string") {
      return rpcError(id, -32602, "Invalid params", { required: "params.name" });
    }

    const prompts: Record<string, { messages: Array<{ role: string; content: { type: string; text: string } }> }> = {
      "benchmark-my-operator": {
        messages: [{
          role: "user",
          content: { type: "text", text: `I have an AI operator with these token counts:\n  input: ${promptArgs.input || "?"}\n  output: ${promptArgs.output || "?"}\n  cache_read: ${promptArgs.cache_read || "?"}\n  cache_write: ${promptArgs.cache_write || "?"}\n\nUse the benchmark_me tool to compute my cascade metrics, compare me against the live field, and tell me:\n1. My percentile and estimated rank\n2. My strongest and weakest metric vs the field median\n3. What that means in plain English\n\nThen use the operator_signature tool to tell me my operating archetype and dominant trait.` },
        }],
      },
      "how-do-i-reach-top-10": {
        messages: [{
          role: "user",
          content: { type: "text", text: `My current token counts:\n  input: ${promptArgs.input || "?"}\n  output: ${promptArgs.output || "?"}\n  cache_read: ${promptArgs.cache_read || "?"}\n  cache_write: ${promptArgs.cache_write || "?"}\n\nI want to reach the ${promptArgs.target_percentile || 90}th percentile. Use the rank_if tool to find the smallest pillar change that would get me there. Tell me:\n1. My current rank and percentile\n2. The best path to reach the target\n3. What the simulated rank would be after the change` },
        }],
      },
      "explain-my-signature": {
        messages: [{
          role: "user",
          content: { type: "text", text: `My token counts:\n  input: ${promptArgs.input || "?"}\n  output: ${promptArgs.output || "?"}\n  cache_read: ${promptArgs.cache_read || "?"}\n  cache_write: ${promptArgs.cache_write || "?"}\n\nUse the operator_signature tool to compute my operating signature. Then use who_operates_like_me to find operators with similar signatures. Tell me:\n1. My archetype and dominant trait\n2. Who operates like me\n3. Where they outperform me` },
        }],
      },
      "diagnose-inefficiency": {
        messages: [{
          role: "user",
          content: { type: "text", text: `My token counts:\n  input: ${promptArgs.input || "?"}\n  output: ${promptArgs.output || "?"}\n  cache_read: ${promptArgs.cache_read || "?"}\n  cache_write: ${promptArgs.cache_write || "?"}\n\nUse the diagnose_cascade tool to identify efficiency leaks in my token cascade. Then use suggest_improvements to rank potential fixes by yield impact. Tell me:\n1. My most severe inefficiency\n2. The top 3 recommended fixes\n3. The estimated yield improvement for each` },
        }],
      },
      "field-anomaly-report": {
        messages: [{
          role: "user",
          content: { type: "text", text: `Use the field_anomaly tool to scan the live leaderboard for unusual patterns. Then summarize the most interesting anomalies in plain English — who is doing something unusual, what they're doing, and why it matters.` },
        }],
      },
    };

    const prompt = prompts[promptName];
    if (!prompt) {
      return rpcError(id, -32602, "Unknown prompt", { name: promptName });
    }
    return jsonRpc(id, prompt);
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
