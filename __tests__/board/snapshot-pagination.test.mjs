/**
 * snapshot-pagination.test.mjs — behavioral tests for scripts/lib/paginate-all.mjs
 * and the deterministic-ordering contract in scripts/snapshot-db.mjs.
 *
 * Codex finding: ordering metric_snapshots only by operator_id is a PARTIAL
 * order — several snapshots share the value. A page boundary splitting
 * same-operator rows lets the range silently skip/duplicate records; sorting
 * the assembled artifact afterwards cannot recover them.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { paginateAll } from "../../scripts/lib/paginate-all.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = readFileSync(
  join(__dirname, "../../scripts/snapshot-db.mjs"),
  "utf8",
);

/** Simulate a PostgREST table: rows sorted by `cols`, range() slices the
 *  sorted array — exactly what the server does under a total ordering. */
function fakeTable(rows, cols) {
  const sorted = [...rows].sort((a, b) => {
    for (const c of cols) {
      const cmp = String(a[c]).localeCompare(String(b[c]));
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
  return async (from, to) => sorted.slice(from, to + 1);
}

test("paginateAll collects every row when a page boundary splits one operator", async () => {
  // 5 snapshots: operator 'a' owns 3 — a pageSize of 2 splits them across
  // pages 1+2. Under a total ordering every row arrives exactly once.
  const rows = [
    { metric_snapshot_id: "a-1", operator_id: "a" },
    { metric_snapshot_id: "a-2", operator_id: "a" },
    { metric_snapshot_id: "a-3", operator_id: "a" },
    { metric_snapshot_id: "b-1", operator_id: "b" },
    { metric_snapshot_id: "b-2", operator_id: "b" },
  ];
  const out = await paginateAll(fakeTable(rows, ["operator_id", "metric_snapshot_id"]), {
    pageSize: 2,
  });
  assert.equal(out.length, 5);
  assert.deepEqual(
    [...new Set(out.map((r) => r.metric_snapshot_id))].sort(),
    ["a-1", "a-2", "a-3", "b-1", "b-2"],
  );
});

test("paginateAll stops on a short page and throws on ceiling", async () => {
  // Exact multiple of pageSize → one extra empty page confirms the end.
  const rows = Array.from({ length: 4 }, (_, i) => ({ id: `r-${i}` }));
  const out = await paginateAll(fakeTable(rows, ["id"]), { pageSize: 2 });
  assert.equal(out.length, 4);

  await assert.rejects(
    // Full-size pages forever → the ceiling is the only stop.
    paginateAll(
      () => Promise.resolve(Array.from({ length: 10 }, (_, i) => ({ id: i }))),
      { pageSize: 10, ceiling: 20 },
    ),
    (err) => err.code === "PAGINATION_CEILING",
  );
});

test("snapshot-db orders metric_snapshots by a total (unique) key", () => {
  // The pagination order must end in a unique tie-breaker — a partial order
  // makes range pages nondeterministic for rows sharing the leading key.
  assert.match(
    SCRIPT,
    /"operator_id",\s*"metric_snapshot_id"/,
    "metric_snapshots pagination must break ties on the PK",
  );
  assert.match(
    SCRIPT,
    /metric_snapshot_id,\s*operator_id/,
    "metric_snapshot_id must be in the SELECT so the artifact carries it",
  );
});
