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
  // Real wiring: sitemap delegates to sitemap-entries, which calls the shared
  // operatorSitemapEntry() policy — not a prose mention, the call chain.
  const sitemap = await source("app/sitemap.ts");
  assert.match(sitemap, /operatorSitemapEntries/);
  const entries = await source("lib/seo/sitemap-entries.ts");
  assert.match(entries, /operatorSitemapEntry\(/);
  assert.match(entries, /from "\.\/indexing-policy\.ts"/);
});

test("profile page applies the shared indexing policy to robots metadata", async () => {
  const page = await source("app/user/[codename]/page.tsx");
  assert.match(page, /seo\/indexing-policy/);
  assert.match(page, /robots/);
});

// ── Cache invalidation: policy-relevant flag writes must bust every cached
//    surface so the sitemap and the ISR profile page never disagree ────────

test("disabled seeded claims cannot change operator index state", async () => {
  const route = await source("app/api/v1/claim/route.ts");
  assert.match(route, /claim_verification_unavailable/);
  assert.doesNotMatch(route, /getSupabaseServer|\.insert\(|\.update\(/);
});

test("profile route invalidates operator index state after profile_visibility writes", async () => {
  const route = await source("app/api/v1/profile/route.ts");
  assert.match(route, /revalidateOperatorIndexState\(op\.codename\)/);
});

test("account deletion invalidates operator index state after retiring", async () => {
  const route = await source("app/api/v1/account/delete/route.ts");
  assert.match(route, /revalidateOperatorIndexState\(op\.codename\)/);
});

test("codename change invalidates both old and new indexed URLs", async () => {
  const route = await source("app/api/v1/profile/codename/route.ts");
  assert.match(route, /revalidateOperatorIndexState\(op\.codename\)/);
  assert.match(route, /revalidateOperatorIndexState\(newCodename\)/);
});

test("wrapped page applies the shared indexing policy to robots metadata", async () => {
  const page = await source("app/user/[codename]/wrapped/page.tsx");
  assert.match(page, /seo\/indexing-policy/);
  assert.match(page, /operatorProfileRobots\(row\.operator, !row\.pending\)/);
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
    "revalidatePath(`/user/${codename}/wrapped`)",
    'revalidatePath("/sitemap.xml")',
    'revalidatePath("/board/all")',
  ]) {
    assert.ok(
      body.includes(needle),
      `revalidateOperatorIndexState missing ${needle}`,
    );
  }
});

test("submit and claim revalidation also bust /s/<codename> share page and card.png", async () => {
  const src = await source("lib/ingest/materialize.ts");
  const helper = src.match(/function revalidateShareSurfaces[\s\S]*?\n}/);
  assert.ok(helper, "revalidateShareSurfaces must exist in materialize.ts");
  assert.ok(helper[0].includes("revalidatePath(`/s/${c}`)"));
  assert.ok(helper[0].includes("revalidatePath(`/s/${c}/card.png`)"));
  for (const name of ["revalidateTouchedWindows", "revalidateOperatorIndexState"]) {
    const fn = src.match(new RegExp(`export function ${name}[\\s\\S]*?\\n}`));
    assert.ok(fn, `${name} must exist`);
    assert.ok(fn[0].includes("revalidateShareSurfaces(codename)"), `${name} must bust share surfaces`);
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

// ── Sitemap URL uniqueness (closeout A) ─────────────────────────────────────
// These tests invoke the real emission builders (lib/seo/sitemap-entries.ts)
// on the real STATIC_ROUTES + BOARD_WINDOWS — the same call app/sitemap.ts
// makes — so this is the CI gate for the structural sitemap invariants
// (uniqueness, host, scheme, manifest gating). Historically /board/all lived
// in both STATIC_ROUTES and BOARD_WINDOWS.slug === "all", emitting twice.

import { BOARD_WINDOWS } from "../../lib/board/windows.ts";
import {
  STATIC_ROUTES,
  staticSitemapEntries,
  operatorSitemapEntries,
} from "../../lib/seo/sitemap-entries.ts";

// The exact emitted URL set app/sitemap.ts produces for static + board
// entries (operator rows need the data layer; tested separately below).
function emittedStaticPlusBoardUrls() {
  return staticSitemapEntries(
    STATIC_ROUTES,
    BOARD_WINDOWS.map((w) => w.slug),
    ORIGIN,
  ).map((e) => e.url);
}

test("sitemap URLs are unique (static + board windows, no double emission)", () => {
  const urls = emittedStaticPlusBoardUrls();
  assert.equal(
    new Set(urls).size,
    urls.length,
    `duplicate sitemap URLs: ${urls.filter((u, i) => urls.indexOf(u) !== i)}`,
  );
});

test("every board window URL is emitted exactly once", () => {
  const urls = emittedStaticPlusBoardUrls();
  for (const w of ["/board/7d", "/board/30d", "/board/90d", "/board/all"]) {
    const count = urls.filter((u) => u === `${ORIGIN}${w}`).length;
    assert.equal(count, 1, `${w} emitted ${count} times in sitemap`);
  }
});

test("/board/all is not re-declared in STATIC_ROUTES (single emitter)", () => {
  assert.ok(!STATIC_ROUTES.some((r) => r.path === "/board/all"));
});

test("emitted sitemap URLs satisfy the structural invariants (CI gate)", () => {
  const siteHost = new URL(ORIGIN).host;
  const utilityPrefixes = [
    "/auth", "/login", "/logout", "/settings", "/account", "/me",
    "/api", "/admin", "/onboarding", "/claim",
  ];
  for (const u of emittedStaticPlusBoardUrls()) {
    const parsed = new URL(u);
    assert.equal(parsed.protocol, "https:", `${u} not HTTPS`);
    assert.equal(parsed.host, siteHost, `${u} not on ${siteHost}`);
    assert.equal(parsed.search, "", `${u} carries a query string`);
    for (const p of utilityPrefixes) {
      assert.ok(
        parsed.pathname !== p && !parsed.pathname.startsWith(p + "/"),
        `${u} is a utility/auth/internal route`,
      );
    }
  }
});

test("utility-prefix guard actually fires (no dead prefixes)", () => {
  // Regression: a trailing-slash prefix ("/api/") composes to
  // startsWith("/api//") — never matches, silently disabling the guard.
  // Assert the predicate catches representative paths and no prefix is
  // stored with a trailing slash (scripts/validate-sitemap.mjs shares the list).
  const utilityPrefixes = [
    "/auth", "/login", "/logout", "/settings", "/account", "/me",
    "/api", "/admin", "/onboarding", "/claim",
  ];
  for (const p of utilityPrefixes) {
    assert.ok(!p.endsWith("/"), `prefix ${p} has a trailing slash — dead guard`);
  }
  const isUtility = (path) =>
    utilityPrefixes.some((p) => path === p || path.startsWith(p + "/"));
  for (const path of ["/api/v1/leaderboard", "/api", "/auth/callback", "/admin"]) {
    assert.ok(isUtility(path), `${path} must be caught by the utility guard`);
  }
  for (const path of ["/metrics", "/apple-touch-icon", "/wiki/apis"]) {
    assert.ok(!isUtility(path), `${path} must NOT be caught`);
  }
});

// ── IndexNow hardening (closeout J) ─────────────────────────────────────────
// /api/indexnow is a write action surface: it must be authed, origin-locked,
// and must not let the caller override the verification key.

test("indexnow endpoint requires bearer auth and has no anonymous path", async () => {
  const src = await source("app/api/indexnow/route.ts");
  assert.match(src, /INDEXNOW_SUBMIT_SECRET/);
  assert.match(src, /Bearer \$\{secret\}/);
  assert.match(src, /status:\s*401/);
  assert.match(src, /timingSafeEqual/); // constant-time bearer comparison
});

test("indexnow endpoint cannot accept a request-supplied key override", async () => {
  const src = await source("app/api/indexnow/route.ts");
  assert.doesNotMatch(src, /body\.key/);
  assert.match(src, /key:\s*INDEXNOW_KEY/);
});

test("indexnow endpoint rejects URLs outside SITE_ORIGIN", async () => {
  const src = await source("app/api/indexnow/route.ts");
  assert.match(src, /new URL\(SITE_ORIGIN\)\.origin/);
  assert.match(src, /\.origin !== siteOrigin/);
});

test("indexnow endpoint dedupes and caps the batch", async () => {
  const src = await source("app/api/indexnow/route.ts");
  assert.match(src, /new Set\(normalized\)/); // dedupe on normalized URLs
  assert.match(src, /slice\(0, MAX_URLS\)/);
});

// ── Static route classification manifest (closeout E+F) ─────────────────────
// lib/seo/search-index-policy.ts is the source of truth for sitemap membership:
// CORE + SUPPORTED are promoted; HOLD stays live but unadvertised; UTILITY and
// REDIRECT are never promoted.

import {
  ROUTE_CLASSES,
  isSitemapPromoted,
  routesInClass,
} from "../../lib/seo/search-index-policy.ts";

test("every emitted static sitemap route is classified", () => {
  const unclassified = STATIC_ROUTES.map((r) => r.path).filter(
    (p) => !(p in ROUTE_CLASSES),
  );
  assert.deepEqual(unclassified, []);
});

test("every board window is classified and emitted at most once per URL", () => {
  for (const w of ["/board/7d", "/board/30d", "/board/90d", "/board/all"]) {
    assert.ok(w in ROUTE_CLASSES, `${w} missing from manifest`);
  }
  const slugs = BOARD_WINDOWS.map((w) => w.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate board slugs");
});

test("the Phase-1 recovery cohort stays promoted (CORE or SUPPORTED)", () => {
  const cohort = [
    "/", "/board/all", "/methodology", "/wiki", "/science", "/research",
    "/token-telemetry", "/score", "/hall", "/compare", "/ai-operator-scoring",
    "/metrics/yield-cascade", "/metrics/cache-hit-rate",
    "/metrics/compression-ratio", "/tools/yield-calculator",
    "/tools/token-waste-calculator",
    "/guides/how-to-measure-ai-coding-efficiency", "/blog/volume-isnt-yield",
    "/vs/ccusage", "/vs/cursor", "/vs/lmsys-arena",
    "/alternatives/ccusage-alternatives", "/alternatives/token-tracking-tools",
  ];
  for (const p of cohort) {
    assert.ok(isSitemapPromoted(p), `sentinel ${p} must remain sitemap-promoted`);
  }
});

test("UTILITY and REDIRECT routes are never sitemap-promoted", () => {
  for (const p of routesInClass("UTILITY").concat(routesInClass("REDIRECT"))) {
    assert.equal(isSitemapPromoted(p), false, `${p} must not be promoted`);
  }
});

test("sitemap emits only manifest-promoted static + board paths", () => {
  for (const u of emittedStaticPlusBoardUrls()) {
    const path = new URL(u).pathname;
    assert.ok(
      isSitemapPromoted(path),
      `${path} emitted but not promoted by the manifest`,
    );
  }
});

test("operator sitemap entries pass the shared policy (no noindex rows emitted)", () => {
  const rows = [
    { ...CLAIMED_PUBLIC_ACTIVE, codename: "ok", has_metric_snapshot: true },
    { ...CLAIMED_PUBLIC_ACTIVE, codename: "seed", claimed: false, has_metric_snapshot: true },
    { ...CLAIMED_PUBLIC_ACTIVE, codename: "nosnap", has_metric_snapshot: false },
    { ...CLAIMED_PUBLIC_ACTIVE, codename: "priv", profile_visibility: "private", has_metric_snapshot: true },
  ];
  const emitted = operatorSitemapEntries(rows, ORIGIN).map((e) => e.url);
  assert.deepEqual(emitted, [`${ORIGIN}/user/ok`]);
});

// ── Post-redesign search closeout (2026-10-22) ──────────────────────────────

test("redesign-era permanent pages are promoted and emitted", () => {
  const emitted = new Set(emittedStaticPlusBoardUrls().map((u) => new URL(u).pathname));
  for (const p of ["/fieldhub", "/blog/a-tour-of-the-new-signalaf", "/wiki/metrics/scale-v"]) {
    assert.ok(isSitemapPromoted(p), `${p} must be promoted`);
    assert.ok(emitted.has(p), `${p} must be emitted in the sitemap`);
  }
});

test("HOLD AI-evaluation cluster stays unpromoted", () => {
  for (const p of ["/ai-evaluation", "/ai-evaluation-tools", "/evaluating-ai", "/ai-model-evaluation"]) {
    assert.equal(ROUTE_CLASSES[p], "HOLD");
    assert.equal(isSitemapPromoted(p), false);
  }
});

test("llms.txt advertises topic pages only through the sitemap manifest", async () => {
  const route = await source("app/llms.txt/route.ts");
  assert.match(route, /TOPIC_PAGES\.filter\(\(p\) => isSitemapPromoted\(p\.path\)\)/);
  assert.doesNotMatch(route, /\]\(\$\{SITE_ORIGIN\}\/ai-evaluation\)/);
});

test("board Dataset JSON-LD never stamps render time as dateModified", async () => {
  const board = await source("app/board/[window]/page.tsx");
  assert.doesNotMatch(board, /sigrankDataset\(\{\s*updated:\s*new Date\(/);
  assert.match(board, /sigrankDataset\(\{\s*updated:\s*SIGRANK_DATASET_PUBLISHED\s*\}\)/);
});

// ── Redesign discovery refresh (2026-10-22) ─────────────────────────────────

import { readdir } from "node:fs/promises";

async function pageRoutes(dir = new URL("../../app/", import.meta.url), prefix = "") {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      const seg = e.name.startsWith("(") ? "" : `/${e.name}`; // route groups add no segment
      out.push(...(await pageRoutes(new URL(`${e.name}/`, dir), prefix + seg)));
    } else if (/^page\.(tsx|mdx)$/.test(e.name)) {
      out.push(prefix || "/");
    }
  }
  return out;
}

test("every static page route is deliberately classified", async () => {
  const unclassified = (await pageRoutes())
    .filter((p) => !p.includes("["))
    .filter((p) => !(p in ROUTE_CLASSES));
  assert.deepEqual(unclassified, [], "classify new routes in lib/seo/search-index-policy.ts");
});

test("badge + achievement index is promoted", () => {
  assert.ok(isSitemapPromoted("/hall/badges"));
});

test("llms-full.txt gates its Ask-AI list through the sitemap manifest", async () => {
  const route = await source("app/llms-full.txt/route.ts");
  assert.match(route, /ASK_AI\.filter\(\(\[, path\]\) => isSitemapPromoted\(path\)\)/);
  assert.doesNotMatch(route, /\| 1 \| MO§ES™ \| BASE \|/, "no fabricated fallback board row");
});

test("named AI crawler groups share the default allow/disallow lists", async () => {
  const robots = await source("app/robots.ts");
  assert.doesNotMatch(robots, /disallow: \["\/api\/", "\/auth\/"\]/);
  assert.equal((robots.match(/disallow: DISALLOW/g) ?? []).length, 11);
  // ALLOW/DISALLOW must stay identical to the literal `*` group.
  assert.match(robots, /const ALLOW = \["\/", "\/api\/exchange\/signals"\];/);
  assert.match(robots, /const DISALLOW = \["\/api\/", "\/auth\/", "\/internal\/"\];/);
  assert.match(robots, /allow: \["\/", "\/api\/exchange\/signals"\],[\s\S]*disallow: \["\/api\/", "\/auth\/", "\/internal\/"\],/);
});

test("operator profile workspace does not bail out of server rendering", async () => {
  const ws = await source("components/profile-v2/ProfileWorkspace.tsx");
  assert.doesNotMatch(ws, /useSearchParams\(/);
});
