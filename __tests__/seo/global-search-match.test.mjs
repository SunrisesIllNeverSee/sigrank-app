/**
 * Global title-bar search matcher (owner 2026-10-21): token AND-matching,
 * ranking, and result caps.
 *   node --experimental-strip-types --test __tests__/seo/global-search-match.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { matchOperators, matchPages } from "../../lib/search/match.ts";

const ops = [
  { codename: "signal-aaa", name: "Ada Lovelace", handle: "@ada", klass: "POWER I" },
  { codename: "signal-bbb", name: "Grace Hopper", handle: "@grace", klass: "POWER II" },
  { codename: "signal-ccc", name: "Adam Smith", handle: "@smith", klass: "BUILDER" },
];
const pages = [
  { path: "/wiki/metrics/yield", title: "Yield (Υ)", section: "Wiki" },
  { path: "/blog/volume-isnt-yield", title: "Volume Isn't Yield", section: "Blog" },
  { path: "/about", title: "About", section: "Pages" },
];

test("operators match name, codename and handle", () => {
  assert.deepEqual(matchOperators(ops, "grace").map((o) => o.codename), ["signal-bbb"]);
  assert.deepEqual(matchOperators(ops, "signal-ccc").map((o) => o.codename), ["signal-ccc"]);
  assert.deepEqual(matchOperators(ops, "@ada").map((o) => o.codename), ["signal-aaa"]);
});

test("every token must match; empty query returns nothing", () => {
  assert.equal(matchOperators(ops, "ada grace").length, 0);
  assert.equal(matchOperators(ops, "   ").length, 0);
  assert.equal(matchPages(pages, "").length, 0);
});

test("ties keep board order; title hits outrank path-only hits", () => {
  assert.deepEqual(matchOperators(ops, "ad").map((o) => o.codename), ["signal-aaa", "signal-ccc"]);
  assert.equal(matchPages(pages, "yield")[0].path, "/wiki/metrics/yield");
  assert.equal(matchPages(pages, "blog")[0].path, "/blog/volume-isnt-yield");
});

test("limit caps results", () => {
  assert.equal(matchOperators(ops, "a", 1).length, 1);
});
