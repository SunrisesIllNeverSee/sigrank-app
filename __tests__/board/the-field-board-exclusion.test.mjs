/**
 * __tests__/data/the-field-board-exclusion.test.mjs
 * CLAIM 9 (REVERSED): The Field (operator_id = f1e1d000-...) is intentionally
 * KEPT on the ranked board — it's the average/baseline operator that makes
 * "you vs. the field" plug-and-play. The owner confirmed this is the desired
 * behavior. The devinreview suggested excluding it, but the utility of having
 * the average baseline visible outweighs the operatorCount inflation concern.
 *
 * This test confirms The Field is NOT filtered from either the live path
 * (queries.ts) or the fallback path (fallback.ts).
 *
 * Run: node --test __tests__/data/the-field-board-exclusion.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

const FIELD_OPERATOR_ID = "f1e1d000-0000-4000-8000-000000000001";

test("The Field is KEPT on the ranked board (live path — queries.ts)", () => {
  const src = read("lib/board/queries.ts");
  // The Field constant may exist for other uses, but there should be NO
  // filter that excludes it from snapRows.
  assert.ok(
    !src.includes("s.operator_id !== FIELD_OPERATOR_ID"),
    "queries.ts must NOT filter The Field from snapRows (owner wants it on the board)",
  );
});

test("The Field is KEPT on the ranked board (fallback path — fallback.ts)", () => {
  const src = read("lib/board/fallback.ts");
  assert.ok(
    !src.includes("r.operator.operator_id !== 'f1e1d000"),
    "fallback.ts must NOT filter The Field from the mock/cold-store board",
  );
});

test("The Field exists in snapshot.json (confirming it ships in the cold store)", () => {
  const src = read("lib/board/snapshot.json");
  assert.ok(
    src.includes(FIELD_OPERATOR_ID),
    "snapshot.json contains The Field — it ships as the average-baseline reference",
  );
});

test("/compare uses The Field as the default opponent B (baseline)", () => {
  const src = read("app/compare/page.tsx");
  assert.ok(
    src.includes("the-field"),
    "/compare page uses the-field as the default compare baseline",
  );
});
