/**
 * __tests__/ingest/battery.test.mjs
 *
 * Spec-lock for the Gate 5 verification battery (lib/ingest/battery.ts — the proprietary
 * anomaly-detection layer). Runs with `node --test` (no deps). Mirrors the gates.test.mjs
 * pattern: the pure battery checks are ported here so the EXPECTED behavior is locked.
 *
 * The battery catches *careful* fabrication that passes the plausibility gate:
 * - Benford's-law violations on token distributions
 * - Machine-perfect cadence patterns
 * - Observer-contamination signatures (claude-mem inflation)
 */

import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * Faithful port of runBattery (lib/ingest/battery.ts). Returns flags + signals.
 * Pure + deterministic — no wall-clock, no RNG.
 */
function runBattery(p) {
  const rt = p.raw_telemetry;
  const flags = [];

  // Benford's-law first-digit check on the 4 token pillars.
  const vals = [
    rt.tokens_input_fresh,
    rt.tokens_output,
    rt.tokens_cache_read,
    rt.tokens_cache_creation,
  ].filter((v) => v > 0);
  if (vals.length >= 3) {
    const leadingDigits = vals.map((v) => parseInt(String(v)[0], 10));
    const lowDigitFraction =
      leadingDigits.filter((d) => d <= 3).length / leadingDigits.length;
    if (lowDigitFraction < 0.25) {
      flags.push({
        gate: "battery",
        code: "benford_violation",
        severity: "flag",
      });
    }
  }

  // Cadence: turns per active minute.
  if (rt.active_minutes_est > 0) {
    const turnsPerMin = rt.turns_total / rt.active_minutes_est;
    if (turnsPerMin > 50) {
      flags.push({
        gate: "battery",
        code: "implausible_cadence",
        severity: "flag",
      });
    }
  }

  // Contamination: impossible cascade (cache_read with 0 cache_creation).
  if (rt.tokens_cache_read > 1_000 && rt.tokens_cache_creation === 0) {
    flags.push({
      gate: "battery",
      code: "contamination_signature",
      severity: "flag",
    });
  }

  // Contamination: extreme cache ratio (> 100:1).
  if (
    rt.tokens_cache_creation > 0 &&
    rt.tokens_cache_read / rt.tokens_cache_creation > 100
  ) {
    flags.push({
      gate: "battery",
      code: "extreme_cache_ratio",
      severity: "flag",
    });
  }

  const signals = {
    benford_flags: flags.filter((f) => f.code.startsWith("benford")).length,
    cadence_flags: flags.filter(
      (f) =>
        f.code.startsWith("cadence") ||
        f.code.startsWith("implausible_cadence"),
    ).length,
    contamination_flags: flags.filter(
      (f) =>
        f.code.startsWith("contamination") ||
        f.code.startsWith("extreme_cache"),
    ).length,
    battery_flag_total: flags.length,
  };

  return { flags, signals };
}

const codes = (result) => result.flags.map((f) => f.code);

/** A clean, real-shaped payload (MO§ES-like distribution, Benford-compliant). */
function cleanPayload(over = {}) {
  const rt = {
    sessions_count: 40,
    turns_total: 520,
    tokens_input_fresh: 1_251_211, // leading 1
    tokens_output: 11_296_121, // leading 1
    tokens_cache_read: 2_555_179_769, // leading 2
    tokens_cache_creation: 128_196_310, // leading 1
    active_minutes_est: 6000,
    ...over.raw_telemetry,
  };
  return { raw_telemetry: rt };
}

test("clean real-shaped payload → zero battery flags", () => {
  const r = runBattery(cleanPayload());
  assert.equal(r.flags.length, 0, `unexpected flags: ${codes(r)}`);
  assert.equal(r.signals.battery_flag_total, 0);
});

test("round fabricated numbers (5xxxxx, 7xxxxx, 9xxxxx) → benford_violation", () => {
  const r = runBattery(
    cleanPayload({
      raw_telemetry: {
        tokens_input_fresh: 500_000, // leading 5
        tokens_output: 700_000, // leading 7
        tokens_cache_read: 900_000, // leading 9
        tokens_cache_creation: 50_000, // leading 5
      },
    }),
  );
  assert.ok(codes(r).includes("benford_violation"), `flags: ${codes(r)}`);
  assert.ok(r.signals.benford_flags >= 1);
});

test("impossible cascade (cache_read > 1000, cache_creation = 0) → contamination_signature", () => {
  const r = runBattery(
    cleanPayload({
      raw_telemetry: {
        tokens_cache_read: 500_000,
        tokens_cache_creation: 0,
      },
    }),
  );
  assert.ok(codes(r).includes("contamination_signature"), `flags: ${codes(r)}`);
  assert.ok(r.signals.contamination_flags >= 1);
});

test("extreme cache ratio (1000:1) → extreme_cache_ratio", () => {
  const r = runBattery(
    cleanPayload({
      raw_telemetry: {
        tokens_cache_read: 1_000_000,
        tokens_cache_creation: 1_000,
      },
    }),
  );
  assert.ok(codes(r).includes("extreme_cache_ratio"), `flags: ${codes(r)}`);
  assert.ok(r.signals.contamination_flags >= 1);
});

test("machine-perfect cadence (100 turns in 1 minute) → implausible_cadence", () => {
  const r = runBattery(
    cleanPayload({
      raw_telemetry: {
        turns_total: 100,
        active_minutes_est: 1,
      },
    }),
  );
  assert.ok(codes(r).includes("implausible_cadence"), `flags: ${codes(r)}`);
  assert.ok(r.signals.cadence_flags >= 1);
});

test("too few pillars (< 3 non-zero) → skip benford check (no false positive)", () => {
  const r = runBattery(
    cleanPayload({
      raw_telemetry: {
        tokens_input_fresh: 500_000,
        tokens_output: 0,
        tokens_cache_read: 0,
        tokens_cache_creation: 0,
      },
    }),
  );
  assert.ok(
    !codes(r).includes("benford_violation"),
    `should not flag benford with < 3 pillars: ${codes(r)}`,
  );
});

test("signals aggregate correctly across multiple flags", () => {
  const r = runBattery(
    cleanPayload({
      raw_telemetry: {
        tokens_input_fresh: 500_000, // leading 5
        tokens_output: 700_000, // leading 7
        tokens_cache_read: 900_000, // leading 9
        tokens_cache_creation: 50_000, // leading 5
        turns_total: 100,
        active_minutes_est: 1,
      },
    }),
  );
  assert.ok(r.signals.benford_flags >= 1);
  assert.ok(r.signals.cadence_flags >= 1);
  assert.ok(r.signals.battery_flag_total >= 2);
});
