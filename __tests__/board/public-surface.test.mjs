/**
 * __tests__/board/public-surface.test.mjs
 *
 * Lock tests for the 2026-09-27 public-surface consistency pass. Mirrors the
 * pure logic in JS — the same discipline operator-pick.test.mjs /
 * windows.test.mjs use (no TypeScript path aliases). If the source changes,
 * update these mirrors in lockstep.
 *
 *   - windowParamToEnum (lib/board/windows.ts): the 'all' slug → 'all_time'
 *     enum alias. ?window=all silently returned an empty board because no row
 *     carries window_type='all'.
 *   - claimedOnly re-rank (lib/board/queries.ts getLeaderboard): unclaimed
 *     operators are dropped BEFORE the sort+re-rank so global_rank is the
 *     position on the displayed (claimed) board — the same basis the profile
 *     rank uses (recomputeRank over claimed ids). Fixes board #105 vs profile
 *     #11 divergence.
 *   - mapOperator privacy redaction (lib/board/mappers.ts): per migration
 *     0021, profile_visibility='private' exposes codename + computed metrics
 *     only — display_name, handle, avatar_url, bio, links, location are
 *     owner-only.
 *
 *   node --test __tests__/board/public-surface.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";

// ---- Mirror of lib/board/windows.ts windowParamToEnum ----
const SLUG_TO_ENUM = new Map([
  ["7d", "7d"],
  ["30d", "30d"],
  ["90d", "90d"],
  ["all", "all_time"],
]);
function windowParamToEnum(param) {
  return SLUG_TO_ENUM.get(param) ?? param;
}

// ---- Mirror of the getLeaderboard filter → sort → re-rank tail ----
// rows arrive joined; claimedOnly drops unclaimed BEFORE rank assignment.
function rankRows(rows, { claimedOnly }) {
  let r = [...rows];
  if (claimedOnly) r = r.filter((x) => x.operator.claimed);
  r.sort((a, b) => b.yield_ - a.yield_);
  return r.map((x, i) => ({ ...x, global_rank: i + 1 }));
}

// ---- Mirror of lib/board/mappers.ts mapOperator privacy branch ----
function mapOperator(o) {
  const priv = o.profile_visibility === "private";
  return {
    codename: o.codename,
    display_name: priv ? null : (o.display_name ?? null),
    handle: priv ? null : (o.handle ?? null),
    avatar_url: priv ? null : (o.avatar_url ?? null),
    bio: priv ? null : (o.bio ?? null),
    links: priv ? null : (o.links ?? null),
    location: priv ? null : (o.location ?? null),
    claimed: o.claimed ?? false,
    profile_visibility: priv ? "private" : "public",
  };
}

// ───────────────────────────────────────────────────────────────────────────
// windowParamToEnum — 'all' slug alias
// ───────────────────────────────────────────────────────────────────────────

test("windowParamToEnum: 'all' slug maps to all_time enum", () => {
  assert.equal(windowParamToEnum("all"), "all_time");
});

test("windowParamToEnum: documented enums pass through", () => {
  for (const w of ["7d", "30d", "90d", "all_time"])
    assert.equal(windowParamToEnum(w), w);
});

test("windowParamToEnum: unknown values pass through unchanged", () => {
  assert.equal(windowParamToEnum("everything"), "everything");
});

// ───────────────────────────────────────────────────────────────────────────
// claimedOnly re-rank — board rank = display position among claimed ops
// ───────────────────────────────────────────────────────────────────────────

const OP = (id, claimed) => ({ operator_id: id, claimed });
const ROW = (id, claimed, yield_) => ({ operator: OP(id, claimed), yield_ });

test("claimedOnly: ranks are contiguous over the claimed set", () => {
  // Corpus order: a claimed op (y=9), 2 unclaimed seeds (y=8,7), claimed (y=6).
  const rows = rankRows(
    [ROW("a", true, 9), ROW("s1", false, 8), ROW("s2", false, 7), ROW("b", true, 6)],
    { claimedOnly: true },
  );
  assert.deepEqual(
    rows.map((r) => [r.operator.operator_id, r.global_rank]),
    [["a", 1], ["b", 2]],
  );
});

test("claimedOnly=false keeps the corpus-wide gappy rank", () => {
  const rows = rankRows(
    [ROW("a", true, 9), ROW("s1", false, 8), ROW("s2", false, 7), ROW("b", true, 6)],
    { claimedOnly: false },
  );
  // 'b' sits at corpus rank 4 — the gap that made MO§ES™ display #105.
  assert.equal(rows.find((r) => r.operator.operator_id === "b").global_rank, 4);
});

test("claimedOnly: profile-rank basis — position in the claimed ordering", () => {
  // recomputeRank mirrors this: filter latest snaps to claimed ids, sort by
  // yield desc, index+1. The same value the board's # column shows.
  const collapsed = [
    { operator_id: "a", yield_: 9 },
    { operator_id: "seed", yield_: 8 },
    { operator_id: "b", yield_: 6 },
  ];
  const claimedIds = new Set(["a", "b"]);
  const ranked = collapsed
    .filter((s) => claimedIds.has(s.operator_id))
    .sort((x, y) => y.yield_ - x.yield_);
  const rank = ranked.findIndex((r) => r.operator_id === "b") + 1;
  assert.equal(rank, 2);
});

// ───────────────────────────────────────────────────────────────────────────
// mapOperator privacy redaction (migration 0021)
// ───────────────────────────────────────────────────────────────────────────

const PRIVATE_OP = {
  codename: "signal-abc123",
  display_name: "Real Name",
  handle: "realhandle",
  avatar_url: "https://x/ava.png",
  bio: "hello",
  links: { github: "gh" },
  location: "NYC",
  claimed: true,
  profile_visibility: "private",
};

test("private operator: identity fields redacted, codename + flags kept", () => {
  const o = mapOperator(PRIVATE_OP);
  assert.equal(o.codename, "signal-abc123"); // codename stays public per spec
  assert.equal(o.display_name, null);
  assert.equal(o.handle, null);
  assert.equal(o.avatar_url, null);
  assert.equal(o.bio, null);
  assert.equal(o.links, null);
  assert.equal(o.location, null);
  assert.equal(o.profile_visibility, "private");
  assert.equal(o.claimed, true); // board fields unaffected
});

test("public operator: all identity fields pass through", () => {
  const o = mapOperator({ ...PRIVATE_OP, profile_visibility: "public" });
  assert.equal(o.display_name, "Real Name");
  assert.equal(o.handle, "realhandle");
  assert.equal(o.location, "NYC");
});

test("null visibility defaults to public (pre-0021 rows)", () => {
  const o = mapOperator({ ...PRIVATE_OP, profile_visibility: null });
  assert.equal(o.display_name, "Real Name");
  assert.equal(o.profile_visibility, "public");
});
