/**
 * lib/ingest/bridge.ts — token_metric_bridge: RawPillars → Core5Raw.
 *
 * Maps the four token pillars (i, o, cw, cr) from moses-sigrank/metrics.py
 * to the Core 5 raw inputs the RNS scoring engine expects (engine.ts).
 *
 * This is the TypeScript version of the token_metric_bridge.md mapping.
 * Both systems measure the same conservation law at the same resolution.
 *
 * Metric derivations (CANON §IV, token_metric_bridge.md):
 *
 *   M.01 compression_ratio = o / (i + o)            [SNR in moses-sigrank]
 *        Range: [0, 1]. Higher = more output per fresh input (cache efficiency).
 *        For Υ-less platforms (ChatGPT/Gemini, no cache tokens), still valid.
 *
 *   M.02 prompt_complexity  = logNorm(turns_per_session)
 *        Free-tier proxy: turns_per_session = turns_total / sessions_count.
 *        Returns [0, 100]. Confidence: 'low' for free tier, 'exact' for
 *        precision tier (sig_army word-level analysis).
 *
 *   M.03 cross_thread        = logNorm(cr / max(cw, 1))
 *        Cache reuse ratio — how much of what was written is being reread.
 *        Clamped to [0, 100] after log normalization.
 *
 *   M.04 session_depth       = turns_total / max(sessions_count, 1)
 *        Raw avg reply-chain length. RS.02 bucketizes this to [0,100] score.
 *
 *   M.05 token_throughput    = total tokens
 *        Used for log normalization in the engine. Raw count, no transform here.
 *
 * All derivations are pure functions of the telemetry inputs — no wall-clock,
 * no RNG. Safe to call from server actions, API routes, or tests.
 */

import type { RawPillars } from "./types";
import type { Core5Raw } from "@/lib/scoring/types";
import { logNorm } from "@/lib/scoring/engine";

export interface BridgeInput {
  pillars: RawPillars;
  /** Total sessions in the window — from ccusage sessions_count. */
  sessionsCount: number;
  /** Total turns in the window — from ccusage turns_total. */
  turnsTotal: number;
}

export interface BridgeResult {
  core5: Core5Raw;
  /**
   * PC confidence. Always 'low' from the ingest bridge (free-tier proxy).
   * Precision-tier prompt complexity comes from sig_army word analysis, not here.
   */
  pcConfidence: "exact" | "low";
  /** Total tokens (all four pillars summed). */
  tokensTotal: number;
  /** Blended compression ratio, alias for core5.compression_ratio. */
  compressionRatio: number;
}

/**
 * pillarsToCore5 — convert raw token pillars + session counts to Core5Raw.
 *
 * This is the bridge between the ingest parser (parse.ts) and the scoring
 * engine (engine.ts). All Core 5 metrics are derived deterministically from
 * the four pillars plus session/turn counts.
 */
export function pillarsToCore5(input: BridgeInput): BridgeResult {
  const { pillars, sessionsCount, turnsTotal } = input;
  const { input: i, output: o, cacheCreate: cw, cacheRead: cr } = pillars;

  const safeSess = Math.max(sessionsCount, 1);
  const total = i + o + cw + cr;

  // M.01 — Compression Ratio (= SNR in moses-sigrank: o / (i + o))
  const compression_ratio = i + o > 0 ? o / (i + o) : 0;

  // M.02 — Prompt Complexity (free-tier proxy: logNorm of turns-per-session)
  const turnsPerSession = turnsTotal / safeSess;
  const prompt_complexity = logNorm(turnsPerSession);

  // M.03 — Cross-Thread Referencing (cache reuse ratio, log-normed)
  const reuseRatio = cr / Math.max(cw, 1);
  const cross_thread = Math.min(100, logNorm(reuseRatio));

  // M.04 — Session Depth (raw avg turns per session; engine bucketizes)
  const session_depth = turnsTotal / safeSess;

  // M.05 — Token Throughput (total tokens, raw)
  const token_throughput = total;

  return {
    core5: {
      compression_ratio,
      prompt_complexity,
      cross_thread,
      session_depth,
      token_throughput,
    },
    pcConfidence: "low",
    tokensTotal: total,
    compressionRatio: compression_ratio,
  };
}

/**
 * cascadeMetrics — the Υ-layer diagnostics from moses-sigrank/metrics.py.
 *
 * These are NOT part of the Core 5 scoring pipeline but are shown on operator
 * profiles as the cascade diagnostic layer (and used for species classification).
 * Returns null components if cache data is absent (non-Claude platforms).
 */
export interface CascadeMetrics {
  /** Yield: (cr/i) × (o/i). The headline cascade metric. */
  yield_: number;
  /** Velocity: o/i. Output rate per fresh input. */
  velocity: number;
  /** Leverage: cr/i. Cache reuse per fresh input. */
  leverage: number;
  /** SNR (alias: compression_ratio). Duplicate for display clarity. */
  snr: number;
  /** log10(transmission × commitment × reuse). null if any component is zero. */
  dev10x: number | null;
  /** Scale V = log10(total tokens). Raw scale of the operator. */
  scaleV: number;
  /** Blended cost per 1M tokens (USD). Efficiency at the wallet. */
  costPerMillion: number;
  /** Efficiency = ((cacheRead + cacheCreate + output) / input) / 4.0 (vs AA baseline). */
  efficiency: number;
  /** Operating ratio shorthand "cr:1:vel" — cache_read per input : 1 : output per input. */
  opRatio: string;
  /** Human-readable cascade string e.g. "9.0×0.01×20000.0". */
  cascadeStr: string;
  /** True if this operator has no cache data (non-Claude or Codex baseline). */
  nonCompounding: boolean;
}

/**
 * Blended per-token list prices (USD per token) used for the $/1M display
 * metric. Claude pricing: input $3/M, output $15/M, cache-write $3.75/M,
 * cache-read $0.30/M. This is a display estimate (CANON_QUICKREF §1 $/1M),
 * not the operator's actual billed cost.
 */
const PRICE = {
  input: 3 / 1e6,
  output: 15 / 1e6,
  cacheCreate: 3.75 / 1e6,
  cacheRead: 0.3 / 1e6,
};

export function computeCascadeMetrics(pillars: RawPillars): CascadeMetrics {
  const { input: i, output: o, cacheCreate: cw, cacheRead: cr } = pillars;
  const safeI = Math.max(i, 1);

  const snr = i + o > 0 ? o / (i + o) : 0;
  const velocity = o / safeI;
  const leverage = cr / safeI;
  const yield_ = leverage * velocity;

  const total = i + o + cw + cr;
  const scaleV = total > 0 ? Math.log10(total) : 0;
  const cost =
    i * PRICE.input +
    o * PRICE.output +
    cw * PRICE.cacheCreate +
    cr * PRICE.cacheRead;
  const costPerMillion = total > 0 ? cost / (total / 1e6) : 0;
  const efficiency = (cr + cw + o) / safeI / 4.0;
  const opRatio = `${Math.round(leverage)}:1:${velocity.toFixed(velocity < 1 ? 2 : 1)}`;

  let dev10x: number | null = null;
  let cascadeStr = "—";

  if (cw > 0 && o > 0 && i > 0 && cr > 0) {
    const transmission = o / i;
    const commitment = cw / o;
    const reuse = cr / cw;
    dev10x = Math.log10(transmission * commitment * reuse);
    cascadeStr = `${transmission.toFixed(1)}×${commitment.toFixed(1)}×${reuse.toFixed(1)}`;
  }

  return {
    yield_,
    velocity,
    leverage,
    snr,
    dev10x,
    scaleV,
    costPerMillion,
    efficiency,
    opRatio,
    cascadeStr,
    nonCompounding: cw === 0,
  };
}
