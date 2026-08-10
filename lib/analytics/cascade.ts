/**
 * lib/cascade/metrics.ts — CLIENT-SAFE cascade metric computations.
 *
 * Pure functions of the four token pillars. No server-only imports, no secret
 * weights (RS.xx). These are the public cascade diagnostics (Υ, SNR, Leverage,
 * Velocity, 10xDEV, $/1M, efficiency) that any client can compute from the
 * raw pillars alone. The scoring layer (SignaRate, class) stays server-side.
 *
 * Extracted from lib/ingest/bridge.ts to break the transitive server-only
 * import chain (bridge → engine → secret-config → 'server-only').
 */

/** The four token pillars extracted from any supported input format. */
export interface RawPillars {
  input: number;
  output: number;
  cacheCreate: number;
  cacheRead: number;
}

export interface CascadeMetrics {
  yield_: number;
  velocity: number;
  leverage: number;
  construction: number;
  snr: number;
  dev10x: number | null;
  scaleV: number;
  costPerMillion: number;
  efficiency: number;
  opRatio: string;
  cascadeStr: string;
  nonCompounding: boolean;
}

/**
 * Blended per-token list prices (USD per token) used for the $/1M display.
 * Claude pricing: input $3/M, output $15/M, cache-write $3.75/M, cache-read $0.30/M.
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
  const construction = cr > 0 ? cw / cr : 0;
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

  // dev10x = log10(leverage) = log10(cache_read / input) — needs only i > 0 && cr > 0.
  // The T×C×R cascade decomposition additionally needs cw > 0 && o > 0.
  if (i > 0 && cr > 0) {
    dev10x = Math.log10(cr / i);
    if (cw > 0 && o > 0) {
      const transmission = o / i;
      const commitment = cw / o;
      const reuse = cr / cw;
      cascadeStr = `${transmission.toFixed(1)}×${commitment.toFixed(1)}×${reuse.toFixed(1)}`;
    }
  }

  return {
    yield_,
    velocity,
    leverage,
    construction,
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

/** Format a number for display — compact notation for large values. */
export function fmt(
  n: number,
  opts?: { decimals?: number; compact?: boolean },
): string {
  if (n === 0) return "0";
  if (opts?.compact && Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (opts?.compact && Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
  const d = opts?.decimals ?? 2;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

/**
 * Self-auditing residual checks. The cascade metrics are algebraically locked:
 * Y = L*V, S = V/(1+V), D = log10(L), W/I = 4E - L - V. Any nonzero residual
 * indicates rounding, stale data, mismatched code paths, or corrupted records.
 *
 * Returns null for any check that doesn't apply (e.g. dev10x when gate doesn't fire).
 */
export function computeResiduals(m: CascadeMetrics, p: RawPillars): {
  epsilonY: number;
  epsilonS: number;
  epsilonD: number | null;
  epsilonW: number;
} {
  const safeI = Math.max(p.input, 1);
  const expectedSnr = m.velocity / (1 + m.velocity);
  const expectedWi = 4 * m.efficiency - m.leverage - m.velocity;
  const actualWi = p.cacheCreate / safeI;

  return {
    epsilonY: Math.abs(m.yield_ - m.leverage * m.velocity),
    epsilonS: Math.abs(m.snr - expectedSnr),
    epsilonD: m.dev10x !== null ? Math.abs(m.dev10x - Math.log10(m.leverage)) : null,
    epsilonW: Math.abs(actualWi - expectedWi),
  };
}
