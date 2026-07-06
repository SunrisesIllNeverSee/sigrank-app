/**
 * lib/ingest/aggregate-benford.ts — aggregate Benford's Law check.
 *
 * Per-session Benford (battery.ts:benfordCheck) is statistically vacuous at
 * n=4 data points — it can't distinguish real from fabricated data. But
 * Benford's Law has real power at the aggregate level: across many
 * submissions, the leading-digit distribution of token counts should
 * follow Benford's Law (log10(1 + 1/d)). A fabricator who submits many
 * synthetic sessions will diverge from this distribution.
 *
 * This module computes the aggregate Benford statistic across all
 * submissions from a device (or all devices) and flags if the distribution
 * diverges significantly. This is the only place Benford has real signal —
 * it catches distributed/at-scale fabrication that per-session checks
 * structurally can't.
 *
 * Server-only. Not shipped to the agent.
 */
import 'server-only'

export interface BenfordResult {
  /** Total leading digits analyzed. */
  n: number
  /** Observed frequency of each leading digit (1-9). */
  observed: number[]
  /** Expected frequency per Benford's Law (log10(1 + 1/d)). */
  expected: number[]
  /** Chi-squared statistic. */
  chiSquared: number
  /** Whether the distribution diverges enough to flag. */
  flagged: boolean
  /** Human-readable summary. */
  summary: string
}

/** Benford's Law expected frequency for leading digit d (1-9). */
export function benfordExpected(d: number): number {
  return Math.log10(1 + 1 / d)
}

/**
 * Extract leading digits from an array of positive numbers.
 * Returns array of digits (1-9), one per number > 0.
 */
export function leadingDigits(values: number[]): number[] {
  return values
    .filter((v) => v > 0 && Number.isFinite(v))
    .map((v) => parseInt(String(Math.floor(v))[0], 10))
    .filter((d) => d >= 1 && d <= 9)
}

/**
 * Compute the aggregate Benford statistic.
 *
 * @param values — all positive token counts from the submissions being checked
 *   (e.g. all input_tokens, output_tokens, cache_read, cache_creation across
 *   every submission from a device, or across the whole board)
 * @param minN — minimum sample size to run the check (below this, Benford
 *   has no power). Default 30 (needs ~8 submissions × 4 pillars).
 * @param threshold — chi-squared threshold above which to flag. Default 15.5
 *   (the 95% critical value for 8 degrees of freedom is 15.5).
 */
export function aggregateBenford(
  values: number[],
  minN = 30,
  threshold = 15.5,
): BenfordResult {
  const digits = leadingDigits(values)
  const n = digits.length

  if (n < minN) {
    return {
      n,
      observed: [],
      expected: [],
      chiSquared: 0,
      flagged: false,
      summary: `insufficient data (n=${n} < minN=${minN}) — aggregate Benford not run`,
    }
  }

  // Count observed digits (index 0 = digit 1, index 8 = digit 9)
  const observed = new Array(9).fill(0)
  for (const d of digits) observed[d - 1]++

  // Expected counts per Benford's Law
  const expected = new Array(9).fill(0)
  for (let d = 1; d <= 9; d++) {
    expected[d - 1] = benfordExpected(d) * n
  }

  // Chi-squared statistic
  let chiSquared = 0
  for (let i = 0; i < 9; i++) {
    if (expected[i] > 0) {
      chiSquared += Math.pow(observed[i] - expected[i], 2) / expected[i]
    }
  }

  const flagged = chiSquared > threshold

  const obsFreq = observed.map((c) => (c / n * 100).toFixed(1))
  const expFreq = expected.map((c) => (c / n * 100).toFixed(1))

  return {
    n,
    observed,
    expected,
    chiSquared,
    flagged,
    summary: flagged
      ? `AGGREGATE BENFORD FLAG: χ²=${chiSquared.toFixed(1)} > ${threshold} (n=${n}). Observed [${obsFreq.join(', ')}]% vs expected [${expFreq.join(', ')}]% — distributed fabrication suspected`
      : `aggregate Benford OK: χ²=${chiSquared.toFixed(1)} ≤ ${threshold} (n=${n})`,
  }
}
