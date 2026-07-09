/**
 * __tests__/ingest/throttle-toctou.test.mjs
 * CLAIM 7: the throttle decision is a pure function of a pre-fetched count, so
 * concurrent requests reading the same count all pass. PASSES if TRUE.
 * Also documents the fix: atomic count-and-enforce in the RPC.
 * Run: node --test __tests__/ingest/throttle-toctou.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";

const CAP = 24;

// Old throttle (pure function of pre-fetched count — TOCTOU).
function oldThrottleGate(recentCount) {
  return recentCount >= CAP
    ? { rejected: true, reason: "rate_limited" }
    : { rejected: false };
}

// Simulated atomic throttle (count is read inside the transaction, so
// concurrent requests see each other's inserts).
function atomicThrottle(deviceId, db) {
  // In the real fix, this count runs INSIDE the materialize RPC transaction.
  // Here we simulate by counting committed rows (including concurrent inserts).
  const count = db.filter((r) => r.device_id === deviceId).length;
  return count >= CAP
    ? { rejected: true, reason: "throttle_exceeded" }
    : { rejected: false };
}

test("CLAIM 7: N concurrent requests sharing one pre-fetch count all clear the gate", () => {
  const prefetched = CAP - 1; // 23 — one below cap, as every concurrent request sees
  const results = Array.from({ length: 10 }, () => oldThrottleGate(prefetched));
  assert.ok(
    results.every((r) => !r.rejected),
    "all 10 pass despite 23 already-in-window → effective cap = 23 + inflight",
  );
});

test("CLAIM 7: the race window is real (cap can be exceeded by inflight count)", () => {
  // 23 in window + 10 concurrent = 33 total, but all 10 see count=23 and pass.
  const prefetched = CAP - 1;
  const inflight = 10;
  const totalAfterCommit = prefetched + inflight;
  assert.ok(
    totalAfterCommit > CAP,
    `effective cap = ${totalAfterCommit} > nominal cap ${CAP}`,
  );
});

test("FIX 7: atomic throttle rejects when count reaches cap (no TOCTOU gap)", () => {
  // Simulate: 24 rows already committed for this device.
  const db = Array.from({ length: CAP }, (_, i) => ({
    device_id: "d1",
    id: i,
  }));
  const result = atomicThrottle("d1", db);
  assert.equal(result.rejected, true);
  assert.equal(result.reason, "throttle_exceeded");
});

test("FIX 7: atomic throttle allows when count is below cap", () => {
  const db = Array.from({ length: CAP - 1 }, (_, i) => ({
    device_id: "d1",
    id: i,
  }));
  const result = atomicThrottle("d1", db);
  assert.equal(result.rejected, false);
});

test("FIX 7: concurrent inserts are caught (count includes just-committed rows)", () => {
  // Simulate: 23 committed, then 1 more commits before the 25th request checks.
  const db = Array.from({ length: 23 }, (_, i) => ({ device_id: "d1", id: i }));
  db.push({ device_id: "d1", id: 23 }); // 24th commits
  const result = atomicThrottle("d1", db);
  assert.equal(
    result.rejected,
    true,
    "24th committed row → 25th request is rejected",
  );
});
