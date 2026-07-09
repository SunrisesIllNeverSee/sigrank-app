/**
 * __tests__/ingest/benford-vacuous.test.mjs
 * CLAIM 2: benfordCheck on 4 pillars is statistically vacuous — a fabricator using
 * leading-1-3 round numbers passes, honest high-leading data can't flag, and the
 * flag only fires at 0/4. PASSES if the claim is TRUE.
 * Run: node --test __tests__/ingest/benford-vacuous.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";

// Faithful port of benfordCheck (lib/ingest/battery.ts:37-56).
function benfordFlagged(pillars) {
  const vals = pillars.filter((v) => v > 0);
  if (vals.length < 3) return false;
  const lead = vals.map((v) => parseInt(String(v)[0], 10));
  const lowFrac = lead.filter((d) => d <= 3).length / lead.length;
  return lowFrac < 0.25;
}

test("fabricator using round leading-1-3 numbers passes cleanly", () => {
  // All "round" fabricated numbers, all leading 1-3 → lowFrac = 1.0, never flags.
  const fab = [100_000, 250_000, 180_000, 300_000];
  assert.equal(
    benfordFlagged(fab),
    false,
    "round fabricated numbers SHOULD slip through — if flagged, claim is FALSE",
  );
});

test("flag requires 0 of 4 pillars leading 1-3 (strict < 0.25)", () => {
  // Exactly 1/4 = 0.25 does NOT trigger (strict <). Need 0/4 to fire.
  const oneLow = [100_000, 500_000, 700_000, 900_000]; // 1/4 lead 1-3
  assert.equal(
    benfordFlagged(oneLow),
    false,
    "1/4 low → 0.25, not < 0.25, so no flag",
  );

  const zeroLow = [500_000, 700_000, 900_000, 800_000]; // 0/4 lead 1-3
  assert.equal(
    benfordFlagged(zeroLow),
    true,
    "only 0/4 low actually fires the flag",
  );
});

test("honest data with two high-leading pillars cannot be flagged", () => {
  // Real cascade: big output(1..) + big cache_read(2..) but 8xx input, 9xx creation.
  const honest = [880_000, 12_000_000, 2_500_000_000, 90_000_000]; // 2/4 lead 1-3
  assert.equal(
    benfordFlagged(honest),
    false,
    "the test can never reach the strength Benford needs at n=4",
  );
});
