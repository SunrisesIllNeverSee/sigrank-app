/**
 * __tests__/seo/indexing-policy.test.mjs
 *
 * SEARCH-RECOVERY Phase 1 contract tests for the shared operator
 * search-indexing policy (lib/seo/indexing-policy.ts).
 *
 * The policy decides two things that must NEVER disagree:
 *   1. the `robots` metadata on /user/<codename> profile pages, and
 *   2. whether that profile URL appears in sitemap.xml.
 *
 * These tests import the real policy module (not a mirror) so a drifted copy
 * cannot pass while production emits the opposite signal.
 *
 *   node --experimental-strip-types --test __tests__/seo/indexing-policy.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  isIndexableOperatorProfile,
  operatorProfileRobots,
  operatorSitemapEntry,
} from "../../lib/seo/indexing-policy.ts";

const ORIGIN = "https://signalaf.test";

async function source(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), "utf8");
}

// ── Policy matrix (SEARCH-RECOVERY Phase 1 spec) ──────────────────────────

const CLAIMED_PUBLIC_ACTIVE = {
  codename: "claimedop",
  claimed: true,
  status: "active",
  profile_visibility: "public",
};

test("claimed + public + active + snapshot -> index", () => {
  assert.equal(isIndexableOperatorProfile(CLAIMED_PUBLIC_ACTIVE, true), true);
});

test("claimed + public + active + no snapshot -> noindex", () => {
  assert.equal(isIndexableOperatorProfile(CLAIMED_PUBLIC_ACTIVE, false), false);
});

test("unclaimed + snapshot -> noindex", () => {
  const op = { ...CLAIMED_PUBLIC_ACTIVE, claimed: false };
  assert.equal(isIndexableOperatorProfile(op, true), false);
});

test("private claimed + snapshot -> noindex", () => {
  const op = { ...CLAIMED_PUBLIC_ACTIVE, profile_visibility: "private" };
  assert.equal(isIndexableOperatorProfile(op, true), false);
});

test("retired claimed + snapshot -> noindex", () => {
  const op = { ...CLAIMED_PUBLIC_ACTIVE, status: "retired" };
  assert.equal(isIndexableOperatorProfile(op, true), false);
});

// Null/absent fields must not accidentally grant eligibility — a claimed op
// with unset status/visibility is still indexable (defaults are open), but an
// unclaimed op never is.
test("claimed op with null status/visibility + snapshot -> index", () => {
  const op = {
    codename: "nullable",
    claimed: true,
    status: null,
    profile_visibility: null,
  };
  assert.equal(isIndexableOperatorProfile(op, true), true);
});

// ── Sitemap contract ──────────────────────────────────────────────────────

test("sitemap: unclaimed seed profile -> absent", () => {
  const seed = { ...CLAIMED_PUBLIC_ACTIVE, codename: "operator-deadbeef", claimed: false };
  assert.equal(operatorSitemapEntry(seed, true, ORIGIN), null);
});

test("sitemap: claimed active public profile with a snapshot -> present", () => {
  const entry = operatorSitemapEntry(CLAIMED_PUBLIC_ACTIVE, true, ORIGIN);
  assert.ok(entry);
  assert.equal(entry.url, `${ORIGIN}/user/claimedop`);
});

test("sitemap: claimed active public profile without a snapshot -> absent", () => {
  assert.equal(operatorSitemapEntry(CLAIMED_PUBLIC_ACTIVE, false, ORIGIN), null);
});

test("sitemap: private profile -> absent", () => {
  const op = { ...CLAIMED_PUBLIC_ACTIVE, profile_visibility: "private" };
  assert.equal(operatorSitemapEntry(op, true, ORIGIN), null);
});

test("sitemap: retired profile -> absent", () => {
  const op = { ...CLAIMED_PUBLIC_ACTIVE, status: "retired" };
  assert.equal(operatorSitemapEntry(op, true, ORIGIN), null);
});

test("sitemap entry carries no lastModified (no synthetic freshness)", () => {
  const entry = operatorSitemapEntry(CLAIMED_PUBLIC_ACTIVE, true, ORIGIN);
  assert.ok(entry);
  assert.equal("lastModified" in entry, false);
});

test("sitemap URL is URL-encoded to byte-match the self-canonical", () => {
  const op = { ...CLAIMED_PUBLIC_ACTIVE, codename: "op name·x" };
  const entry = operatorSitemapEntry(op, true, ORIGIN);
  assert.ok(entry);
  assert.equal(entry.url, `${ORIGIN}/user/op%20name%C2%B7x`);
  assert.equal(entry.url.includes(" "), false);
});

// ── The core invariant: profile robots eligibility == sitemap eligibility ──

test("profile metadata indexing eligibility == sitemap eligibility", () => {
  const cases = [
    { op: CLAIMED_PUBLIC_ACTIVE, snap: true },
    { op: CLAIMED_PUBLIC_ACTIVE, snap: false },
    { op: { ...CLAIMED_PUBLIC_ACTIVE, claimed: false }, snap: true },
    { op: { ...CLAIMED_PUBLIC_ACTIVE, profile_visibility: "private" }, snap: true },
    { op: { ...CLAIMED_PUBLIC_ACTIVE, status: "retired" }, snap: true },
    { op: { ...CLAIMED_PUBLIC_ACTIVE, status: null, profile_visibility: null }, snap: true },
  ];
  for (const { op, snap } of cases) {
    const pageDecision = operatorProfileRobots(op, snap).index;
    const sitemapDecision = operatorSitemapEntry(op, snap, ORIGIN) !== null;
    assert.equal(
      pageDecision,
      sitemapDecision,
      `robots/sitemap disagreement for ${JSON.stringify(op)} snap=${snap}`,
    );
    // And both must agree with the predicate itself.
    assert.equal(pageDecision, isIndexableOperatorProfile(op, snap));
  }
});

test("noindex profiles still allow follow (links stay crawlable)", () => {
  const seed = { ...CLAIMED_PUBLIC_ACTIVE, claimed: false };
  assert.deepEqual(operatorProfileRobots(seed, true), {
    index: false,
    follow: true,
  });
});

// ── Source invariants (guard rails against regression) ────────────────────

test("sitemap does not source operators from the public leaderboard HTTP API", async () => {
  const sitemap = await source("app/sitemap.ts");
  assert.equal(
    sitemap.includes("/api/v1/leaderboard"),
    false,
    "sitemap.xml must not be generated from the public leaderboard API — it is a rate-limited, window-filtered view, not the indexing contract",
  );
});

test("sitemap does not emit generation-time or shared-fallback lastmod", async () => {
  const sitemap = await source("app/sitemap.ts");
  assert.doesNotMatch(sitemap, /lastModified:\s*now\b/);
  assert.equal(sitemap.includes("STATIC_LAST_MODIFIED"), false);
});

test("sitemap applies the shared indexing policy", async () => {
  const sitemap = await source("app/sitemap.ts");
  assert.match(sitemap, /seo\/indexing-policy/);
});

test("profile page applies the shared indexing policy to robots metadata", async () => {
  const page = await source("app/user/[codename]/page.tsx");
  assert.match(page, /seo\/indexing-policy/);
  assert.match(page, /robots/);
});

// ── Cache invalidation: policy-relevant flag writes must bust every cached
//    surface so the sitemap and the ISR profile page never disagree ────────

test("claim route invalidates operator index state after flipping claimed", async () => {
  const route = await source("app/api/v1/claim/route.ts");
  assert.match(route, /revalidateOperatorIndexState\(codename\)/);
});

test("profile route invalidates operator index state after profile_visibility writes", async () => {
  const route = await source("app/api/v1/profile/route.ts");
  assert.match(route, /revalidateOperatorIndexState\(op\.codename\)/);
});

test("revalidateOperatorIndexState busts page, sitemap, and tagged caches", async () => {
  const src = await source("lib/ingest/materialize.ts");
  const fn = src.match(
    /export function revalidateOperatorIndexState[\s\S]*?\n}/,
  );
  assert.ok(fn, "revalidateOperatorIndexState must exist in materialize.ts");
  const body = fn[0];
  for (const needle of [
    'revalidateTag("operator"',
    'revalidateTag("board"',
    "revalidatePath(`/user/${codename}`)",
    'revalidatePath("/sitemap.xml")',
    'revalidatePath("/board/all")',
  ]) {
    assert.ok(
      body.includes(needle),
      `revalidateOperatorIndexState missing ${needle}`,
    );
  }
});

test("indexable-operator snapshot check chunks the IN clause below the PostgREST URL limit", async () => {
  const src = await source("lib/board/queries.ts");
  const fn = src.match(
    /export async function getIndexableOperatorRows[\s\S]*?\n}\n/,
  );
  assert.ok(fn, "getIndexableOperatorRows must exist in queries.ts");
  // An unbounded .in("operator_id", ids) silently errors past ~1600 UUIDs →
  // [] → the sitemap drops every operator URL. Chunking must be present.
  assert.match(fn[0], /slice\(i, i \+ \d+\)/);
  assert.doesNotMatch(fn[0], /\.in\("operator_id",\s*ids\)/);
});
