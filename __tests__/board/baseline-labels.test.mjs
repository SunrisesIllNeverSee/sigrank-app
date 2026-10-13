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

test("FIX 8: /compare carries no unlabeled field baseline", () => {
  const src = read("app/compare/page.tsx");
  // The live-operators-only rework removed the "The Field" pseudo-operator
  // baseline row entirely — liveCompareCandidates now excludes "the-field".
  // If a field baseline ever returns to the page, the FIX 8 labeling rule
  // still applies: it must be labeled as the live field median.
  const hasBaseline = /the[- ]field|baseline|average user|avg\b/i.test(src);
  if (hasBaseline) {
    assert.ok(
      /median.*[Uu]psilon|field median|live field/i.test(src),
      '/compare must label The Field as the live field median, not just "average"',
    );
  }
});

test("FIX 8: FourDegreesChart already labels its baselines (parity check)", () => {
  const src = read("components/marketing/FourDegreesChart.tsx");
  assert.ok(
    /modeled baseline/i.test(src),
    'FourDegreesChart must label its baseline as "modeled"',
  );
  assert.ok(
    /median/i.test(src),
    "FourDegreesChart must reference the median for the power-user baseline",
  );
});

test("FIX 8: field-average.ts is the live field mean (not the AA model)", () => {
  const src = read("lib/analytics/field-average.ts");
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
