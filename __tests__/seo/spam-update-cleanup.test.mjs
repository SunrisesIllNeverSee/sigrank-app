/**
 * __tests__/seo/spam-update-cleanup.test.mjs
 *
 * Contract tests for the 2026-11 spam-update cleanup:
 *   1. FAQPage JSON-LD is emitted on /faq only (visible FAQ text stays).
 *   2. Google Scholar citation meta (CitationMeta) is on /research only.
 *   3. Templated pages carry a Google-only noindex (googlebot), driven by one
 *      central policy (lib/seo/search-index-policy.ts via withOG), while
 *      staying in sitemap/llms and indexable for every other crawler.
 *   4. Duplicate pages are consolidated with permanent redirects and removed
 *      from the sitemap / route manifest / internal links.
 *
 *   node --experimental-strip-types --test __tests__/seo/spam-update-cleanup.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ROUTE_CLASSES,
  isSitemapPromoted,
  isGoogleOnlyNoindex,
  GOOGLE_INDEX_KEEP_VS,
  googleOnlyRobots,
  dropFaqPageSchema,
} from "../../lib/seo/search-index-policy.ts";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (p) => readFileSync(join(ROOT, p), "utf8");

function walk(dir, out = []) {
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${name}`;
    const st = statSync(join(ROOT, rel));
    if (st.isDirectory()) walk(rel, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(rel);
  }
  return out;
}
const APP_FILES = walk("app");
const ALL_SRC = [...APP_FILES, ...walk("components"), ...walk("lib")];

/** Child route dirs (those holding a page.tsx) directly under app/<hub>/. */
function childRoutes(hub) {
  return readdirSync(join(ROOT, "app", hub))
    .filter((n) => existsSync(join(ROOT, "app", hub, n, "page.tsx")))
    .map((n) => `/${hub}/${n}`)
    .sort();
}

// ── 1. FAQPage JSON-LD: /faq only ─────────────────────────────────────────

test("dropFaqPageSchema removes FAQPage objects and keeps the rest", () => {
  const items = [
    { "@type": "BreadcrumbList" },
    { "@type": "FAQPage", mainEntity: [] },
    { "@type": "Article" },
  ];
  assert.deepEqual(
    dropFaqPageSchema(items).map((o) => o["@type"]),
    ["BreadcrumbList", "Article"],
  );
});

test("dropFaqPageSchema handles @type arrays and @graph nodes", () => {
  const arr = [{ "@type": ["FAQPage", "WebPage"] }, { "@type": ["WebPage"] }];
  assert.deepEqual(dropFaqPageSchema(arr), [{ "@type": ["WebPage"] }]);
  const graph = {
    "@context": "https://schema.org",
    "@graph": [{ "@type": "Article" }, { "@type": "FAQPage" }, { "@type": ["Q", "FAQPage"] }],
  };
  assert.deepEqual(dropFaqPageSchema([graph]), [
    { "@context": "https://schema.org", "@graph": [{ "@type": "Article" }] },
  ]);
  assert.deepEqual(dropFaqPageSchema([{ "@graph": [{ "@type": "FAQPage" }] }]), []);
});

test("JsonLd drops FAQPage unless a caller opts in with allowFaqPage", () => {
  const src = read("components/seo/JsonLd.tsx");
  assert.match(src, /dropFaqPageSchema/);
  assert.match(src, /allowFaqPage/);
});

test("only app/faq/page.tsx opts in to FAQPage JSON-LD", () => {
  const optIns = APP_FILES.filter((f) => /\ballowFaqPage\b/.test(read(f)));
  assert.deepEqual(optIns, ["app/faq/page.tsx"]);
});

test("no page writes a raw FAQPage or its own ld+json script around JsonLd", () => {
  for (const f of ALL_SRC) {
    if (f === "lib/jsonld.ts" || f === "components/seo/JsonLd.tsx") continue;
    if (f === "lib/seo/search-index-policy.ts") continue;
    const s = read(f);
    assert.equal(/["']@type["']\s*:\s*["']FAQPage["']/.test(s), false, `${f} builds FAQPage directly`);
    assert.equal(s.includes("application/ld+json"), false, `${f} emits its own ld+json`);
  }
});

// ── 2. CitationMeta: /research only ───────────────────────────────────────

test("CitationMeta is rendered on app/research/page.tsx only", () => {
  const users = APP_FILES.filter((f) => /<CitationMeta\b/.test(read(f)));
  assert.deepEqual(users, ["app/research/page.tsx"]);
});

test("no blog post or /field imports CitationMeta", () => {
  for (const f of APP_FILES) {
    if (f === "app/research/page.tsx") continue;
    assert.equal(read(f).includes("CitationMeta"), false, `${f} still references CitationMeta`);
  }
});

// ── 3. Google-only noindex ────────────────────────────────────────────────

const KEEP_ALTERNATIVES = [
  "/alternatives/ccusage-alternatives",
  "/alternatives/token-tracking-tools",
];
const KEEP_GUIDES = ["/guides/how-to-measure-ai-coding-efficiency"];
const BLOG_NOINDEX = [
  "/blog/best-ai-coding-benchmarking-for-agencies",
  "/blog/best-ai-coding-efficiency-tools-for-solo-developers",
  "/blog/best-ai-coding-metrics-for-engineering-managers",
  "/blog/best-ai-coding-tools-2026",
  "/blog/best-ai-operator-scoring-for-teams",
  "/blog/best-token-tracking-for-claude-code-power-users",
  "/blog/how-to-answer-best-ai-user",
].sort();

const KEEP_VS = ["/vs/ccusage", "/vs/langfuse", "/vs/viberank", "/vs/ccgather"];

test("googlebot noindex covers every /vs/[x] page except the rebuilt ones, and not the /vs hub", () => {
  const vs = childRoutes("vs");
  assert.ok(vs.length > 40);
  for (const k of KEEP_VS) assert.ok(vs.includes(k), `${k} should exist`);
  for (const p of vs) assert.equal(isGoogleOnlyNoindex(p), !KEEP_VS.includes(p), p);
  assert.equal(isGoogleOnlyNoindex("/vs"), false);
});

test("rebuilt /vs/viberank and /vs/ccgather are Google-indexable and sitemap-promoted; other /vs pages stay googlebot-noindex", () => {
  for (const p of ["/vs/viberank", "/vs/ccgather"]) {
    assert.equal(googleOnlyRobots(p), undefined, p);
    assert.equal(isSitemapPromoted(p), true, p);
  }
  assert.deepEqual(googleOnlyRobots("/vs/tokenmaxxer"), {
    index: true,
    follow: true,
    googleBot: { index: false, follow: true },
  });
});

test("every GOOGLE_INDEX_KEEP_VS path is sitemap-promoted, and every Google-indexable /vs child is in the keep set", () => {
  for (const p of GOOGLE_INDEX_KEEP_VS) assert.equal(isSitemapPromoted(p), true, p);
  for (const p of childRoutes("vs")) {
    if (!isGoogleOnlyNoindex(p)) assert.ok(GOOGLE_INDEX_KEEP_VS.has(p), p);
  }
});

test("googlebot noindex covers /alternatives/[x] except the two kept pages", () => {
  const alts = childRoutes("alternatives");
  for (const k of KEEP_ALTERNATIVES) assert.ok(alts.includes(k), `${k} should exist`);
  for (const p of alts) {
    assert.equal(isGoogleOnlyNoindex(p), !KEEP_ALTERNATIVES.includes(p), p);
  }
  assert.equal(isGoogleOnlyNoindex("/alternatives"), false);
});

test("googlebot noindex covers /guides/[x] except the measurement guide", () => {
  const guides = childRoutes("guides");
  for (const k of KEEP_GUIDES) assert.ok(guides.includes(k), `${k} should exist`);
  for (const p of guides) {
    assert.equal(isGoogleOnlyNoindex(p), !KEEP_GUIDES.includes(p), p);
  }
  assert.equal(isGoogleOnlyNoindex("/guides"), false);
});

test("googlebot noindex covers exactly the best-* and AI-answer blog posts", () => {
  const blog = childRoutes("blog").filter((p) => !p.endsWith("/[slug]"));
  const flagged = blog.filter(isGoogleOnlyNoindex).sort();
  assert.deepEqual(flagged, BLOG_NOINDEX);
  assert.equal(isGoogleOnlyNoindex("/blog"), false);
  assert.equal(isGoogleOnlyNoindex("/blog/volume-isnt-yield"), false);
  assert.equal(isGoogleOnlyNoindex("/blog/the-tool-is-the-person"), false);
});

test("googlebot noindex never applies to core pages, /user profiles or utility paths", () => {
  const core = [
    "/", "/faq", "/methodology", "/science", "/research", "/wiki", "/score", "/hall",
    "/compare", "/field", "/fieldhub", "/token-cascade", "/ai-operator-scoring",
    "/metrics/yield-cascade", "/wiki/metrics/yield", "/user/the-field", "/user/claimedop",
    "/board/all", "/tools/yield-calculator", "/sigrank", "/about",
  ];
  for (const p of core) assert.equal(isGoogleOnlyNoindex(p), false, p);
  assert.equal(googleOnlyRobots("/user/the-field"), undefined);
  assert.equal(googleOnlyRobots(undefined), undefined);
});

test("googleOnlyRobots keeps the generic robots indexable and noindexes googlebot only", () => {
  // The two rebuilt /vs pages are Google-indexable: no googlebot override at all.
  assert.equal(googleOnlyRobots("/vs/ccusage"), undefined);
  assert.equal(googleOnlyRobots("/vs/langfuse"), undefined);
  assert.deepEqual(googleOnlyRobots("/vs/cursor"), {
    index: true,
    follow: true,
    googleBot: { index: false, follow: true },
  });
});

test("withOG wires the central policy and every flagged page passes its path to withOG", () => {
  assert.match(read("lib/seo.ts"), /googleOnlyRobots\(path\)/);
  const flagged = [
    ...childRoutes("vs"),
    ...childRoutes("alternatives"),
    ...childRoutes("guides"),
    ...childRoutes("blog"),
  ].filter(isGoogleOnlyNoindex);
  assert.ok(flagged.length > 60);
  for (const route of flagged) {
    const src = read(`app${route}/page.tsx`);
    assert.match(src, /withOG\(/, `${route} must build metadata with withOG`);
    const literal = src.includes(`path: "${route}"`);
    const constant =
      /const PATH = "([^"]+)"/.test(src) && src.match(/const PATH = "([^"]+)"/)[1] === route && /path: PATH/.test(src);
    assert.ok(literal || constant, `${route} must pass its own path to withOG`);
  }
});

test("no page overrides the googlebot policy with its own robots metadata", () => {
  for (const route of [...childRoutes("vs"), ...childRoutes("alternatives"), ...childRoutes("guides")]) {
    assert.equal(/\brobots\s*:/.test(read(`app${route}/page.tsx`)), false, `${route} sets robots directly`);
  }
});

test("noindex-for-Google pages stay in the sitemap/llms manifest classes unchanged", () => {
  // Established comparisons and kept pages remain promoted (sitemap + llms.txt).
  for (const p of [
    "/vs/ccusage",
    "/vs/langfuse",
    "/alternatives/ccusage-alternatives",
    "/alternatives/token-tracking-tools",
    "/guides/how-to-measure-ai-coding-efficiency",
    "/alternatives/ai-coding-roi-tools",
    "/guides/how-to-track-token-cascade",
  ]) {
    assert.equal(isSitemapPromoted(p), true, p);
  }
});

test("robots.txt and the X-Robots-Tag header policy are untouched", () => {
  assert.equal(/X-Robots-Tag/i.test(read("next.config.ts")), false);
  assert.equal(/X-Robots-Tag/i.test(read("vercel.json")), false);
});

// ── 4. Consolidation redirects ────────────────────────────────────────────

function redirectsFromConfig() {
  const src = read("next.config.ts");
  const out = {};
  const re = /source:\s*"([^"]+)",\s*destination:\s*"([^"]+)",\s*permanent:\s*(true|false)/g;
  let m;
  while ((m = re.exec(src))) out[m[1]] = { destination: m[2], permanent: m[3] === "true" };
  return out;
}

const RETIRED = {
  "/cascade-analysis": "/token-cascade",
  "/ai-benchmarking": "/ai-operator-scoring",
  "/ai-coding-metrics": "/ai-operator-scoring",
  "/operator-performance": "/ai-operator-scoring",
};

test("retired duplicate pages 308 to the winner", () => {
  const redirects = redirectsFromConfig();
  for (const [from, to] of Object.entries(RETIRED)) {
    assert.deepEqual(redirects[from], { destination: to, permanent: true }, from);
  }
});

test("existing redirects do not chain through a retired page", () => {
  const redirects = redirectsFromConfig();
  for (const [from, r] of Object.entries(redirects)) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(RETIRED, r.destination),
      false,
      `${from} -> ${r.destination} chains through a retired URL`,
    );
  }
});

test("retired pages have no route files", () => {
  for (const from of Object.keys(RETIRED)) {
    assert.equal(existsSync(join(ROOT, "app", from, "page.tsx")), false, from);
  }
});

test("retired URLs are REDIRECT-class and absent from the sitemap and llms", () => {
  const entries = read("lib/seo/sitemap-entries.ts");
  const llms = read("app/llms.txt/route.ts");
  for (const from of Object.keys(RETIRED)) {
    assert.equal(ROUTE_CLASSES[from], "REDIRECT", from);
    assert.equal(isSitemapPromoted(from), false, from);
    assert.equal(entries.includes(`path: "${from}"`), false, `sitemap-entries lists ${from}`);
    assert.equal(llms.includes(`${from})`), false, `llms.txt lists ${from}`);
  }
  assert.equal(isSitemapPromoted("/ai-operator-scoring"), true);
  assert.equal(isSitemapPromoted("/token-cascade"), true);
});

test("no internal link points at a retired URL", () => {
  const files = ALL_SRC.filter(
    (f) => f !== "lib/seo/search-index-policy.ts" && f !== "lib/seo/sitemap-entries.ts",
  );
  for (const f of files) {
    const s = read(f);
    for (const from of Object.keys(RETIRED)) {
      const re = new RegExp(`(href[=:]\\s*\\{?["'\`]|\\]\\(\\$\\{SITE_ORIGIN\\})${from}["'\`)#?]`);
      assert.equal(re.test(s), false, `${f} links to retired ${from}`);
    }
  }
});

test("hard constraints: /user profiles, home title and crawl delay are untouched", () => {
  assert.equal(isGoogleOnlyNoindex("/user/anyone"), false);
  const robots = read("app/robots.ts");
  assert.match(robots, /crawlDelay:\s*10/);
});
