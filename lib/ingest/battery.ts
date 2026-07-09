import "server-only";

/**
 * lib/ingest/battery.ts — SERVER-ONLY proprietary verification battery (Gate 5).
 *
 * The anomaly-detection layer that catches *careful* fabrication — the stuff the
 * plausibility gate (Gate 1) can't: Benford's-law violations on token distributions,
 * machine-perfect cadence patterns, and observer-contamination signatures (claude-mem
 * inflation). This is the moat: the implementation lives server-side only and is never
 * shipped to the public repo or the open agent.
 *
 * Contract: matches GateContext.battery in gates.ts (p) => { tier?, flags[], signals }.
 * Pure + deterministic — no wall-clock, no RNG, no external state.
 */

import type { SnapshotPayloadV1 } from "@/lib/payload/schema";
import type { GateReason, VerificationTier } from "@/lib/ingest/gates";

const flag = (code: string, detail: string): GateReason => ({
  gate: "battery",
  code,
  severity: "flag",
  detail,
});

/**
 * Benford's-law first-digit check on the 4 token pillars.
 *
 * Real token counts from Claude/LLM sessions follow a log-normal-ish distribution
 * where leading digits 1-3 dominate (~60% per Benford's law). A fabricator who
 * picks "round" numbers (50000, 100000, 200000) violates this — their leading digits
 * cluster on 5, 1, 2 in a non-Benford pattern.
 *
 * We check the 4 pillars (input, output, cache_read, cache_creation) when at least
 * 3 are non-zero. Below 25% leading digits in 1-3 is a flag.
 */
function benfordCheck(p: SnapshotPayloadV1): GateReason | null {
  const rt = p.raw_telemetry;
  const vals = [
    rt.tokens_input_fresh,
    rt.tokens_output,
    rt.tokens_cache_read,
    rt.tokens_cache_creation,
  ].filter((v) => v > 0);
  if (vals.length < 3) return null; // too few pillars to test

  const leadingDigits = vals.map((v) => parseInt(String(v)[0], 10));
  const lowDigitFraction =
    leadingDigits.filter((d) => d <= 3).length / leadingDigits.length;
  if (lowDigitFraction < 0.25) {
    return flag(
      "benford_violation",
      `leading-digit distribution ${Math.round(lowDigitFraction * 100)}% in 1-3 (expected ~60% per Benford's law)`,
    );
  }
  return null;
}

/**
 * Cadence regularity — turns per active minute.
 *
 * Real Claude Code sessions exhibit 0.5-10 turns/min (humans pause, read, think).
 * A fabricator who generates 1000 turns in 1 active minute = synthetic. Above 50
 * turns/min is a flag (not a reject — rare burst patterns are possible).
 */
function cadenceCheck(p: SnapshotPayloadV1): GateReason | null {
  const rt = p.raw_telemetry;
  if (rt.active_minutes_est <= 0) return null;
  const turnsPerMin = rt.turns_total / rt.active_minutes_est;
  if (turnsPerMin > 50) {
    return flag(
      "implausible_cadence",
      `${turnsPerMin.toFixed(1)} turns/min (real sessions: 0.5-10)`,
    );
  }
  return null;
}

/**
 * Observer-contamination signature — claude-mem inflation pattern.
 *
 * claude-mem and similar context-injection tools inflate cache_read without
 * proportional cache_creation. But a real cascade REQUIRES writing cache before
 * reading it — cache_read > 0 with cache_creation = 0 is physically impossible
 * for a genuine Claude session. Additionally, cache_read/cache_creation > 100:1
 * is extreme (real max ~30:1 for highly-cached power users).
 */
function contaminationCheck(p: SnapshotPayloadV1): GateReason | null {
  const rt = p.raw_telemetry;

  // Impossible cascade: cache_read with zero cache_creation
  if (rt.tokens_cache_read > 1_000 && rt.tokens_cache_creation === 0) {
    return flag(
      "contamination_signature",
      `${rt.tokens_cache_read} cache_read with 0 cache_creation (impossible cascade — must write before read)`,
    );
  }

  // Extreme cache ratio (real max ~30:1, flag at 100:1)
  if (
    rt.tokens_cache_creation > 0 &&
    rt.tokens_cache_read / rt.tokens_cache_creation > 100
  ) {
    return flag(
      "extreme_cache_ratio",
      `cache_read/cache_creation = ${(rt.tokens_cache_read / rt.tokens_cache_creation).toFixed(1)}:1 (real max ~30:1)`,
    );
  }

  return null;
}

/**
 * runBattery — the Gate 5 entry point. Runs all three checks and returns flags +
 * signals. The gate chain (gates.ts:185-190) consumes this: any flag downgrades
 * the tier to 'flagged', and the signals feed RS.06 score-level penalties.
 *
 * Returns { flags, signals } — tier is left undefined so gates.ts:188 can set it
 * based on the overall decision (any flag → 'flagged').
 */
export function runBattery(p: SnapshotPayloadV1): {
  tier?: VerificationTier;
  flags: GateReason[];
  signals: Record<string, number>;
} {
  const flags: GateReason[] = [];
  const signals: Record<string, number> = {};

  const benford = benfordCheck(p);
  if (benford) flags.push(benford);

  const cadence = cadenceCheck(p);
  if (cadence) flags.push(cadence);

  const contamination = contaminationCheck(p);
  if (contamination) flags.push(contamination);

  // Signals for downstream RS.06 scoring penalty consumption
  signals.benford_flags = flags.filter((f) =>
    f.code.startsWith("benford"),
  ).length;
  signals.cadence_flags = flags.filter(
    (f) =>
      f.code.startsWith("cadence") || f.code.startsWith("implausible_cadence"),
  ).length;
  signals.contamination_flags = flags.filter(
    (f) =>
      f.code.startsWith("contamination") || f.code.startsWith("extreme_cache"),
  ).length;
  signals.battery_flag_total = flags.length;

  return { flags, signals };
}
