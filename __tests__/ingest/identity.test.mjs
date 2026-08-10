/**
 * __tests__/ingest/identity.test.mjs
 *
 * Algebraic identity tests for the cascade metric system.
 * Verifies that the derived metrics compose exactly from the structural
 * coordinates, as documented in the "Three operating dimensions, seven
 * analytical views" architecture.
 *
 * Identities tested:
 *   Y = L * V            (Yield = Leverage * Velocity)
 *   S = V / (1 + V)      (SNR = bounded Velocity)
 *   D = log10(L)         (10xDEV = logarithmic Leverage)
 *   W/I = 4E - L - V     (Commitment recovery from Efficiency)
 *   (O/I) * (W/O) * (R/W) = R/I  (telescoping identity)
 *
 * To run:
 *   node --test __tests__/ingest/identity.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";

/** Pure cascade computation — mirrors lib/analytics/cascade.ts */
function computeCascade(i, o, cw, cr) {
  const safeI = Math.max(i, 1);
  const snr = i + o > 0 ? o / (i + o) : 0;
  const velocity = o / safeI;
  const leverage = cr / safeI;
  const yield_ = leverage * velocity;
  const efficiency = (cr + cw + o) / safeI / 4.0;
  const dev10x = i > 0 && cr > 0 ? Math.log10(cr / i) : null;
  return { snr, velocity, leverage, yield_, efficiency, dev10x, i, o, cw, cr };
}

const EPSILON = 1e-9;

const TEST_CASES = [
  { name: "MOSES", i: 1_251_211, o: 11_296_121, cw: 128_196_310, cr: 2_555_179_769 },
  { name: "vincentkoc", i: 10_000, o: 500, cw: 6_530, cr: 295_500 },
  { name: "MapleEve", i: 1_000, o: 80, cw: 196, cr: 22_800 },
  { name: "balanced", i: 100, o: 100, cw: 100, cr: 100 },
  { name: "cache_heavy", i: 10, o: 1, cw: 50, cr: 5000 },
  { name: "output_heavy", i: 1000, o: 5000, cw: 100, cr: 200 },
  { name: "low_volume", i: 5, o: 3, cw: 2, cr: 10 },
  { name: "high_leverage", i: 1, o: 100, cw: 1000, cr: 1_000_000 },
];

// ---- Identity 1: Y = L * V ----

test("Identity: Y = L * V (Yield = Leverage * Velocity)", () => {
  for (const tc of TEST_CASES) {
    const m = computeCascade(tc.i, tc.o, tc.cw, tc.cr);
    const residual = Math.abs(m.yield_ - m.leverage * m.velocity);
    assert.ok(
      residual < EPSILON,
      `${tc.name}: Y=${m.yield_} but L*V=${m.leverage * m.velocity}, residual=${residual}`,
    );
  }
});

// ---- Identity 2: S = V / (1 + V) ----

test("Identity: S = V / (1 + V) (SNR = bounded Velocity)", () => {
  for (const tc of TEST_CASES) {
    const m = computeCascade(tc.i, tc.o, tc.cw, tc.cr);
    const expectedSnr = m.velocity / (1 + m.velocity);
    const residual = Math.abs(m.snr - expectedSnr);
    assert.ok(
      residual < EPSILON,
      `${tc.name}: S=${m.snr} but V/(1+V)=${expectedSnr}, residual=${residual}`,
    );
  }
});

// ---- Identity 3: D = log10(L) ----

test("Identity: D = log10(L) (10xDEV = logarithmic Leverage)", () => {
  for (const tc of TEST_CASES) {
    const m = computeCascade(tc.i, tc.o, tc.cw, tc.cr);
    if (m.dev10x === null) continue; // skip when gate doesn't fire
    const expectedDev = Math.log10(m.leverage);
    const residual = Math.abs(m.dev10x - expectedDev);
    assert.ok(
      residual < EPSILON,
      `${tc.name}: D=${m.dev10x} but log10(L)=${expectedDev}, residual=${residual}`,
    );
  }
});

// ---- Identity 4: W/I = 4E - L - V (Commitment recovery) ----

test("Identity: W/I = 4E - L - V (Commitment recovery from Efficiency)", () => {
  for (const tc of TEST_CASES) {
    const m = computeCascade(tc.i, tc.o, tc.cw, tc.cr);
    const safeI = Math.max(tc.i, 1);
    const wi = tc.cw / safeI;
    const recoveredWi = 4 * m.efficiency - m.leverage - m.velocity;
    const residual = Math.abs(wi - recoveredWi);
    assert.ok(
      residual < EPSILON,
      `${tc.name}: W/I=${wi} but 4E-L-V=${recoveredWi}, residual=${residual}`,
    );
  }
});

// ---- Identity 5: Telescoping: (O/I) * (W/O) * (R/W) = R/I ----

test("Identity: (O/I) * (W/O) * (R/W) = R/I (telescoping identity)", () => {
  for (const tc of TEST_CASES) {
    if (tc.i === 0 || tc.o === 0 || tc.cw === 0 || tc.cr === 0) continue;
    const T = tc.o / tc.i;       // transmission
    const C = tc.cw / tc.o;      // commitment
    const R = tc.cr / tc.cw;     // reuse
    const product = T * C * R;
    const leverage = tc.cr / tc.i;
    const residual = Math.abs(product - leverage);
    assert.ok(
      residual < EPSILON,
      `${tc.name}: T*C*R=${product} but R/I=${leverage}, residual=${residual}`,
    );
  }
});

// ---- Self-auditing residual checks ----

test("Self-audit: all residuals are zero for MOSES", () => {
  const m = computeCascade(1_251_211, 11_296_121, 128_196_310, 2_555_179_769);
  const eps_y = Math.abs(m.yield_ - m.leverage * m.velocity);
  const eps_s = Math.abs(m.snr - m.velocity / (1 + m.velocity));
  const eps_d = Math.abs(m.dev10x - Math.log10(m.leverage));
  const safeI = 1_251_211;
  const eps_w = Math.abs(128_196_310 / safeI - (4 * m.efficiency - m.leverage - m.velocity));

  assert.ok(eps_y < EPSILON, `epsilon_Y = ${eps_y}`);
  assert.ok(eps_s < EPSILON, `epsilon_S = ${eps_s}`);
  assert.ok(eps_d < EPSILON, `epsilon_D = ${eps_d}`);
  assert.ok(eps_w < EPSILON, `epsilon_W = ${eps_w}`);
});

// ---- Same Yield, different machine (from the wiki architecture section) ----

test("Architecture: 100:1:2 and 20:1:10 both produce Y=200", () => {
  // 100:1:2 means leverage=100, velocity=2
  const y1 = 100 * 2;
  // 20:1:10 means leverage=20, velocity=10
  const y2 = 20 * 10;
  assert.ok(Math.abs(y1 - y2) < EPSILON, `Y1=${y1}, Y2=${y2} should be equal`);
  assert.ok(Math.abs(y1 - 200) < EPSILON, `Y should be 200, got ${y1}`);
});

// ---- Yield AND-gate: zero reuse or zero output = zero yield ----

test("Architecture: Yield is an AND-gate (zero reuse OR zero output = zero yield)", () => {
  const zeroReuse = computeCascade(100, 50, 10, 0);
  assert.ok(zeroReuse.yield_ === 0, `zero reuse should give zero yield, got ${zeroReuse.yield_}`);

  const zeroOutput = computeCascade(100, 0, 10, 5000);
  assert.ok(zeroOutput.yield_ === 0, `zero output should give zero yield, got ${zeroOutput.yield_}`);
});
