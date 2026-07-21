/**
 * __tests__/ingest/rs06-wiring.test.mjs
 * CLAIM 1: applyRS06Penalty / battery signals are defined but never wired into
 * the scoring or persistence path. This test PASSES if the claim is TRUE (dead code).
 * Run: node --test __tests__/ingest/rs06-wiring.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("applyRS06Penalty is never called outside its own definition file", () => {
  const files = [
    "lib/ingest/materialize.ts",
    "lib/ingest/gates.ts",
    "lib/analytics/scoring-engine.ts",
    "app/api/v1/snapshots/route.ts",
  ];
  for (const f of files) {
    const src = read(f);
    assert.ok(
      !src.includes("applyRS06Penalty"),
      `EXPECTED dead code, but ${f} references applyRS06Penalty — claim is FALSE`,
    );
  }
});

test("materialize.ts never consumes battery signals / flag counts", () => {
  const src = read("lib/ingest/materialize.ts");
  for (const token of [
    "applyRS06",
    "battery_flag_total",
    "batteryFlags",
    "signals",
  ]) {
    assert.ok(
      !src.includes(token),
      `materialize.ts references "${token}" — the penalty may be wired after all`,
    );
  }
});

test("recomputeFromPillars scores from pillars only — no penalty argument", () => {
  const src = read("lib/ingest/materialize.ts");
  // scoreSnapshot is called with raw/pcConfidence/totals/age — no flag/penalty input.
  const call = src.slice(src.indexOf("scoreSnapshot({"));
  assert.ok(
    !/penalt|flag/i.test(call.slice(0, 300)),
    "scoreSnapshot() call appears to receive penalty/flag input — claim is FALSE",
  );
});
