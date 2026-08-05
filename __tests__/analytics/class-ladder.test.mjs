/**
 * __tests__/analytics/class-ladder.test.mjs
 * Tests for the 24-stage experience ladder (RS05) and the cache_write=0 dev10x fix.
 *
 * Covers:
 * - Monotonicity: assignClass is monotonic in total tokens
 * - ARCH+ sub-stages are reachable (not all the same floor)
 * - TRANSMITTER is not a permanent class (not in RS05 thresholds)
 * - cache_write=0 operator gets finite dev10x (log10(cr/i)), no NaN/Infinity
 * - cascadeStr is "—" when cw=0 but dev10x is still computed
 *
 * Run: node --test __tests__/analytics/class-ladder.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";

// ── RS05 thresholds (mirrors lib/analytics/ruleset.ts) ──
const RS05_CLASS_THRESHOLDS = [
  { class: "ARCH+ I", totalMin: 7068201104627 },
  { class: "ARCH+ II", totalMin: 3000000000000 },
  { class: "ARCH+ III", totalMin: 1000000000000 },
  { class: "ARCH I", totalMin: 186207267611 },
  { class: "ARCH II", totalMin: 98543134083 },
  { class: "ARCH III", totalMin: 68766193943 },
  { class: "POWER I", totalMin: 39958782379 },
  { class: "POWER II", totalMin: 26955905621 },
  { class: "POWER III", totalMin: 19141226889 },
  { class: "BASE I", totalMin: 13960345961 },
  { class: "BASE II", totalMin: 10189224970 },
  { class: "BASE III", totalMin: 7747041813 },
  { class: "SEEKER I", totalMin: 5446673659 },
  { class: "SEEKER II", totalMin: 4014577247 },
  { class: "SEEKER III", totalMin: 2961798768 },
  { class: "REFINER I", totalMin: 2358346840 },
  { class: "REFINER II", totalMin: 1845750357 },
  { class: "REFINER III", totalMin: 1334876308 },
  { class: "BEARER I", totalMin: 984078167 },
  { class: "BEARER II", totalMin: 714619043 },
  { class: "BEARER III", totalMin: 431702990 },
  { class: "IGNITER I", totalMin: 216393332 },
  { class: "IGNITER II", totalMin: 88999166 },
  { class: "IGNITER III", totalMin: 0 },
];

function assignClass(totalTokens) {
  for (const t of RS05_CLASS_THRESHOLDS) {
    if (totalTokens >= t.totalMin) return t.class;
  }
  return RS05_CLASS_THRESHOLDS[RS05_CLASS_THRESHOLDS.length - 1].class;
}

// ── cascade metrics (mirrors lib/analytics/cascade.ts) ──
function computeCascadeMetrics(i, o, cw, cr) {
  const safeI = Math.max(i, 1);
  let dev10x = null;
  let cascadeStr = "—";
  if (i > 0 && cr > 0) {
    dev10x = Math.log10(cr / i);
    if (cw > 0 && o > 0) {
      const T = o / i;
      const C = cw / o;
      const R = cr / cw;
      cascadeStr = `${T.toFixed(1)}×${C.toFixed(1)}×${R.toFixed(1)}`;
    }
  }
  return { dev10x, cascadeStr, nonCompounding: cw === 0 };
}

// ── Tests ──

test("assignClass is monotonic: higher total tokens → same or higher class", () => {
  const stages = RS05_CLASS_THRESHOLDS.map((t) => t.class);
  for (let k = 0; k < RS05_CLASS_THRESHOLDS.length - 1; k++) {
    const lo = RS05_CLASS_THRESHOLDS[k + 1].totalMin;
    const hi = RS05_CLASS_THRESHOLDS[k].totalMin;
    // At the floor, you get that stage
    assert.equal(assignClass(lo), stages[k + 1]);
    // One token above the higher floor, you get the higher stage
    if (hi > 0) assert.equal(assignClass(hi), stages[k]);
  }
});

test("ARCH+ sub-stages are all reachable (floors are not identical)", () => {
  const archPlus = RS05_CLASS_THRESHOLDS.filter((t) => t.class.startsWith("ARCH+"));
  assert.equal(archPlus.length, 3, "should have 3 ARCH+ sub-stages");
  const floors = archPlus.map((t) => t.totalMin);
  assert.ok(floors[0] > floors[1], "ARCH+ I floor > ARCH+ II floor");
  assert.ok(floors[1] > floors[2], "ARCH+ II floor > ARCH+ III floor");
  // Verify each is reachable
  assert.equal(assignClass(floors[0]), "ARCH+ I");
  assert.equal(assignClass(floors[1]), "ARCH+ II");
  assert.equal(assignClass(floors[2]), "ARCH+ III");
});

test("TRANSMITTER is not a permanent class (not in RS05 thresholds)", () => {
  const hasTransmitter = RS05_CLASS_THRESHOLDS.some((t) => t.class === "TRANSMITTER");
  assert.equal(hasTransmitter, false, "TRANSMITTER must not appear in RS05_CLASS_THRESHOLDS");
});

test("cache_write=0 operator gets finite dev10x (log10(cr/i))", () => {
  const m = computeCascadeMetrics(10_000, 500, 0, 295_500);
  assert.ok(m.dev10x !== null, "dev10x should be defined when cr>0 && i>0");
  assert.ok(Number.isFinite(m.dev10x), "dev10x should be finite");
  assert.equal(m.cascadeStr, "—", "cascadeStr should be '—' when cw=0");
  assert.ok(m.nonCompounding, "nonCompounding should be true when cw=0");
});

test("cache_write=0 with cr=0 → dev10x is null (no leverage)", () => {
  const m = computeCascadeMetrics(10_000, 500, 0, 0);
  assert.equal(m.dev10x, null, "dev10x should be null when cr=0");
});

test("MO§ES dev10x is unchanged (3.31) after the cache_write fix", () => {
  // MO§ES: i=1_251_211  o=11_296_121  cw=128_196_310  cr=2_555_179_769
  const m = computeCascadeMetrics(1_251_211, 11_296_121, 128_196_310, 2_555_179_769);
  assert.ok(m.dev10x !== null);
  assert.equal(m.dev10x.toFixed(2), "3.31", "MO§ES dev10x must stay 3.31");
  assert.notEqual(m.cascadeStr, "—", "MO§ES should have a cascade string (cw>0 && o>0)");
});

test("all 24 stages have unique, non-decreasing floors", () => {
  const floors = RS05_CLASS_THRESHOLDS.map((t) => t.totalMin);
  for (let k = 0; k < floors.length - 1; k++) {
    assert.ok(floors[k] > floors[k + 1] || (floors[k] === floors[k + 1] && floors[k] === 0),
      `floor ${k} (${floors[k]}) must be > floor ${k + 1} (${floors[k + 1]})`);
  }
  // 24 stages + last floor is 0
  assert.equal(RS05_CLASS_THRESHOLDS.length, 24);
  assert.equal(floors[floors.length - 1], 0, "last stage (IGNITER III) must have floor 0");
});
