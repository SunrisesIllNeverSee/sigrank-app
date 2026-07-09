/**
 * __tests__/data/baseline-labels.test.mjs
 * CLAIM 8: Two (actually three) different "average operator" baselines ship in
 * the same product without disambiguation. This test verifies the labeling fix:
 * each surface now documents which baseline it uses.
 * Run: node --test __tests__/data/baseline-labels.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

test("FIX 8: SplitFlapCard documents its baseline as AA-modeled (not live field)", () => {
  const src = read("components/signature/SplitFlapCard.tsx");
  assert.ok(
    /AA-modeled|3\.5:1:0\.5.*NOT.*live/i.test(src),
    "SplitFlapCard must label its AVG column as the AA-modeled 3.5:1:0.5 baseline, not the live field",
  );
});

test("FIX 8: /compare documents its baseline as live field median", () => {
  const src = read("app/compare/page.tsx");
  assert.ok(
    /median.*[Uu]psilon|field median|live field/i.test(src),
    '/compare must label The Field as the live field median, not just "average"',
  );
});

test("FIX 8: ThreeDegreesChart already labels its baselines (parity check)", () => {
  const src = read("components/marketing/ThreeDegreesChart.tsx");
  assert.ok(
    /modeled baseline/i.test(src),
    'ThreeDegreesChart must label its baseline as "modeled"',
  );
  assert.ok(
    /median/i.test(src),
    "ThreeDegreesChart must reference the median for the power-user baseline",
  );
});

test("FIX 8: field-average.ts is the live field mean (not the AA model)", () => {
  const src = read("lib/data/field-average.ts");
  assert.ok(
    /mean|average/i.test(src),
    "field-average.ts computes the live field mean",
  );
  // It should NOT hardcode 3.5:1:0.5 or 1.57.
  assert.ok(
    !src.includes("1.57"),
    "field-average.ts must not hardcode the AA-modeled Υ 1.57",
  );
});
