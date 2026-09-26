/**
 * __tests__/board/live-board-contract.test.mjs
 *
 * Regression tests for the 2026-09-26 live-board data contract
 * (lib/board/live.ts + queryBoard/fallback wiring + the scope=live API).
 *
 * What they pin down:
 *   1. Live eligibility = claimed operators OR The Field — applied BEFORE
 *      sort/rank/limit (displayed ranks describe the live population).
 *   2. The Field (unclaimed baseline) is NEVER filtered out — the old page
 *      silently dropped it via a bare `claimed` check.
 *   3. The live fallback path serves ONLY the real cold-store snapshot —
 *      hand-authored mock rows can never reach the production shell.
 *   4. Eligible-population counts are distinct OPERATORS, not row-records.
 *   5. The API's scope=live contract: slug↔enum window normalization,
 *      breakdown validation, provenance + population fields.
 *   6. Legacy callers (no scope / no live flag) keep byte-identical behaviour.
 *
 * live.ts is pure (type-only imports) so it imports directly under
 * --experimental-strip-types. Structural assertions on queries/fallback/route
 * follow the repo's source-text test convention.
 *
 * Run: node --test __tests__/board/live-board-contract.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  FIELD_CODENAME,
  FIELD_OPERATOR_ID,
  isLiveBoardOperator,
  liveBoardParams,
} from "../../lib/board/live.ts";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

// ── Eligibility predicate ────────────────────────────────────────────────────

test("claimed operators are live-eligible", () => {
  assert.equal(isLiveBoardOperator({ claimed: true }), true);
  assert.equal(
    isLiveBoardOperator({ operator_id: "any", codename: "x", claimed: true }),
    true,
  );
});

test("The Field is live-eligible despite being unclaimed", () => {
  assert.equal(
    isLiveBoardOperator({
      operator_id: FIELD_OPERATOR_ID,
      codename: FIELD_CODENAME,
      claimed: false,
    }),
    true,
  );
  // Each identifier alone must suffice — don't rely on both being present.
  assert.equal(
    isLiveBoardOperator({ operator_id: FIELD_OPERATOR_ID, claimed: false }),
    true,
  );
  assert.equal(
    isLiveBoardOperator({ codename: FIELD_CODENAME, claimed: false }),
    true,
  );
});

test("unclaimed non-Field operators are NOT live-eligible (seed corpus)", () => {
  assert.equal(
    isLiveBoardOperator({ operator_id: "seed-1", codename: "furic", claimed: false }),
    false,
  );
  assert.equal(isLiveBoardOperator({ claimed: false }), false);
  assert.equal(isLiveBoardOperator({ claimed: null }), false);
  assert.equal(isLiveBoardOperator({}), false);
});

// ── Query mapping ────────────────────────────────────────────────────────────

test("liveBoardParams: /board/all keeps the latest-submission selection (no window filter)", () => {
  const p = liveBoardParams({ window: "all_time", breakdown: "total" });
  assert.equal(p.windowFilter, false, "all_time must NOT window-filter");
  assert.equal(p.operatorTotal, true);
  assert.equal(p.live, true);
});

test("liveBoardParams: bounded windows filter by window_type", () => {
  for (const w of ["7d", "30d", "90d"]) {
    const p = liveBoardParams({ window: w, breakdown: "total" });
    assert.equal(p.windowFilter, true, `${w} must window-filter`);
    assert.equal(p.window, w);
  }
});

test("liveBoardParams: breakdown selects collapse shape", () => {
  const total = liveBoardParams({ window: "30d", breakdown: "total" });
  assert.equal(total.operatorTotal, true);
  assert.equal(total.perPlatform, false);

  const platforms = liveBoardParams({ window: "30d", breakdown: "platforms" });
  assert.equal(platforms.perPlatform, true);
  assert.equal(platforms.operatorTotal, false);
});

// ── Ordering: eligibility BEFORE sort/rank/limit (queries.ts) ────────────────

test("queries.ts applies live eligibility BEFORE sort, rank and limit", () => {
  const src = read("lib/board/queries.ts");
  const eligIdx = src.indexOf("isLiveBoardOperator(r.operator)");
  const sortIdx = src.indexOf("rows.sort((a, b) => sortValue(b, sort)");
  const rankIdx = src.indexOf("global_rank: i + 1");
  const limitIdx = src.indexOf("rows.slice(0, params.limit)");
  assert.ok(eligIdx > -1, "live eligibility filter present in queryBoard");
  assert.ok(eligIdx < sortIdx, "eligibility must precede sorting");
  assert.ok(eligIdx < rankIdx, "eligibility must precede rank assignment");
  assert.ok(eligIdx < limitIdx, "eligibility must precede limit/pagination");
});

test("queries.ts counts the eligible population as DISTINCT operators", () => {
  const src = read("lib/board/queries.ts");
  assert.ok(
    src.includes("new Set(rows.map((r) => r.operator.operator_id)).size"),
    "eligible population must dedupe operator×platform rows to operators",
  );
});

// ── Live fallback: cold-store only, never mock ───────────────────────────────

test("fallback.ts exposes a live-only path over the cold store — never mock", () => {
  const src = read("lib/board/fallback.ts");
  assert.ok(src.includes("filterLiveFallbackBoard"), "live fallback exists");
  // The live fallback must read the COLD_STORE snapshots — NOT fallbackRows()
  // (which degrades to MOCK_LEADERBOARD when the store is empty).
  const fnStart = src.indexOf("export function filterLiveFallbackBoard");
  const fnEnd = src.indexOf("\n}", fnStart);
  const body = src.slice(fnStart, fnEnd);
  assert.ok(body.includes("COLD_STORE"), "live fallback reads the cold store");
  assert.ok(
    !body.includes("MOCK_LEADERBOARD") && !body.includes("fallbackRows()"),
    "live fallback must never serve hand-authored mock rows",
  );
  assert.ok(
    body.includes("hasStore"),
    "live fallback reports whether a store exists (snapshot vs unavailable)",
  );
});

test("fallback.ts applies live eligibility BEFORE sort/limit too", () => {
  const src = read("lib/board/fallback.ts");
  const eligIdx = src.indexOf("isLiveBoardOperator(r.operator)");
  const sortIdx = src.indexOf("rows.sort((a, b) => sortValue(b, sort)");
  const limitIdx = src.indexOf("rows.slice(0, params.limit)");
  assert.ok(eligIdx > -1 && eligIdx < sortIdx && eligIdx < limitIdx,
    "fallback pipeline applies eligibility before sort/rank/limit");
});

// ── API route contract ───────────────────────────────────────────────────────

test("API route wires scope=live through getLiveBoard with provenance", () => {
  const src = read("app/api/v1/leaderboard/route.ts");
  assert.ok(src.includes('scopeParam === "live"'), "scope=live branch exists");
  assert.ok(src.includes("getLiveBoard"), "live scope calls getLiveBoard");
  assert.ok(src.includes("population"), "response reports population");
  assert.ok(src.includes("operators_returned"), "response reports distinct ops");
  assert.ok(src.includes("source"), "response reports provenance");
  assert.ok(src.includes("source_date"), "response reports source date");
});

test("API route normalizes the 'all' slug to the all_time enum", () => {
  const src = read("app/api/v1/leaderboard/route.ts");
  assert.ok(src.includes("normalizeWindowParam"), "window normalization exists");
  assert.ok(
    src.includes("boardWindowBySlug"),
    "slug→enum mapping via BOARD_WINDOWS",
  );
});

test("API route validates breakdown and rejects unknown windows under scope=live", () => {
  const src = read("app/api/v1/leaderboard/route.ts");
  assert.ok(
    src.includes('"total", "platforms"') || src.includes("'total', 'platforms'"),
    "breakdown allowlist exists",
  );
  assert.ok(src.includes("invalid breakdown"), "invalid breakdown → 400");
  assert.ok(src.includes("invalid window"), "invalid window → 400");
});

// ── Client fetches stay in live scope ────────────────────────────────────────

test("BoardTableClient sends scope=live on every fetch (no population drift)", () => {
  const src = read("components/board/BoardTableClient.tsx");
  assert.ok(src.includes('scope: "live"'), "client fetches use scope=live");
  assert.ok(
    src.includes('breakdown,') || src.includes("breakdown:"),
    "client declares breakdown on fetches",
  );
  assert.ok(
    src.includes("AbortController"),
    "fetches are abortable — stale responses can't commit",
  );
});

// ── Legacy scope preserved ───────────────────────────────────────────────────

test("legacy API path (no scope) is unchanged — no live filtering", () => {
  const src = read("app/api/v1/leaderboard/route.ts");
  const liveBranch = src.indexOf('scopeParam === "live"');
  const legacyTail = src.slice(liveBranch);
  const legacyStart = legacyTail.indexOf("// ── Legacy scope");
  assert.ok(legacyStart > -1, "legacy branch retained");
  const legacyBody = legacyTail.slice(legacyStart);
  assert.ok(
    !legacyBody.includes("isLiveBoardOperator"),
    "legacy branch must not apply live eligibility",
  );
});

// ── Review-pass 2 regression coverage (stale window state, privacy, fallback) ──

test("BoardTableClient keys EVERY fetched slot to windowEnum (no stale-window rows)", () => {
  const src = read("components/board/BoardTableClient.tsx");
  // All three fetch slots carry the window they were fetched for — an
  // unkeyed slot would render the previous window's rows after soft nav.
  for (const slot of ["breakdown", "refreshedTotals", "fullBoard"]) {
    const stateDecl = src.indexOf(`[${slot}, set`);
    assert.ok(stateDecl > -1, `${slot} state exists`);
    const declBlock = src.slice(stateDecl, src.indexOf(">(null)", stateDecl));
    assert.ok(
      declBlock.includes("windowEnum: string"),
      `${slot} must be keyed to windowEnum`,
    );
  }
  // The render branch must consult the *_ForWindow projections, never the
  // raw slots.
  assert.ok(src.includes("refreshedTotalsForWindow"), "keyed totals guard");
  assert.ok(src.includes("breakdownForWindow"), "keyed breakdown guard");
  assert.ok(src.includes("fullBoardForWindow"), "keyed full-board guard");
});

test("private operators render codename-only on the board + API (migration 0021)", () => {
  const toEntry = read("lib/board/to-entry.ts");
  const api = read("lib/board/api-leaderboard.ts");
  assert.ok(
    toEntry.includes('profile_visibility === "private"'),
    "toEntry consults profile_visibility",
  );
  assert.ok(
    api.includes('profile_visibility === "private"'),
    "API serializer consults profile_visibility",
  );
  // Both surfaces must gate the identity fields the profile page hides:
  // display_name, handle, location.
  for (const field of ["display_name", "handle", "location"]) {
    assert.ok(
      api.includes(`${field}: isPrivate`),
      `serializer redacts ${field} for private operators`,
    );
  }
});

test("live fallback mirrors the live collapse ladder + platform-set matching", () => {
  const src = read("lib/board/fallback.ts");
  assert.ok(
    src.includes("latestPerOperatorPlatform"),
    "breakdown=platforms collapse exists under fallback",
  );
  assert.ok(
    src.includes("operatorTotalCollapse"),
    "breakdown=total collapse exists under fallback",
  );
  // Window filtering must happen on SNAPSHOTS before collapse — collapsing
  // first would pick all_time rows and drop them in the window filter.
  const fn = src.indexOf("function liveColdStoreRows");
  assert.ok(fn > -1, "live collapse builder exists");
  const body = src.slice(fn, src.indexOf("return buildRows", fn));
  const winIdx = body.indexOf("filterToWindow(COLD_STORE.snaps");
  const collapseIdx = body.indexOf("operatorTotalCollapse");
  assert.ok(
    winIdx > -1 && collapseIdx > -1 && winIdx < collapseIdx,
    "window filter must precede the collapse ladder",
  );
  // Platform filter must match the submitted platform SET, not just the row's
  // single platform (a 'multi' total row must still match platform=claude).
  assert.ok(
    src.includes(".platforms?.some("),
    "platform filter checks the operator's platform set",
  );
});

test("unavailable live reads are evicted from the memo cache (retry works)", () => {
  const src = read("lib/board/cached.ts");
  assert.ok(
    src.includes('r.source === "unavailable"') &&
      src.includes("memoInvalidate(key)"),
    "an 'unavailable' result must not pin the outage for the full TTL",
  );
});

test("unavailable state exposes a retry affordance wired to the live API", () => {
  const shell = read("components/live-board/LiveBoardShell.tsx");
  assert.ok(shell.includes("BoardRetry"), "shell renders the retry control");
  const retry = read("components/live-board/BoardRetry.tsx");
  assert.ok(
    retry.includes("scope=live"),
    "retry probes the live-scope API (not ISR-cached)",
  );
});

test("snapshot script writes the board path and redacts private operators", () => {
  const src = read("scripts/snapshot-db.mjs");
  assert.ok(
    src.includes('"lib", "board", "snapshot.json"'),
    "snapshot output path must be lib/board (the module moved out of lib/data)",
  );
  assert.ok(
    src.includes('profile_visibility === "private"'),
    "committed snapshot must redact private identity fields at write time",
  );
  assert.ok(
    src.includes("platform,"),
    "snapshots must capture per-submission platform for collapse parity",
  );
});
