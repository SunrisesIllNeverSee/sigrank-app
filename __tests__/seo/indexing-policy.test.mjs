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
