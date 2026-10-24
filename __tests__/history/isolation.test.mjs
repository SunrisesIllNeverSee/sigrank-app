/**
 * __tests__/history/isolation.test.mjs
 *
 * /board/history must never touch live board data. Static scan of every
 * import under the island's folders against the forbidden list (design §3).
 *
 *   node --test __tests__/history/isolation.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["lib/history", "components/history", "app/board/history"];
const FORBIDDEN = [
  /^@\/lib\/board(\/|$)/,
  /^@\/lib\/supabase(\/|$)/,
  /^@\/components\/board(\/|$)/,
  /^@\/lib\/infra\/posthog(\/|$)/,
  /medal-leaders/,
  /(^|\/)enrich$/,
  /\/api\//,
  /^next\/navigation$/,
];

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx|mjs|js)$/.test(p) ? [p] : [];
  });
}

function importsOf(src) {
  const out = [];
  for (const m of src.matchAll(/(?:import|export)\s[^"';]*?from\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g)) out.push(m[1] ?? m[2]);
  return out;
}

test("island folders exist", () => {
  for (const r of ROOTS) assert.ok(statSync(r).isDirectory(), r);
});

test("no island file imports live board, Supabase, analytics or API code", () => {
  const bad = [];
  for (const r of ROOTS) {
    for (const f of files(r)) {
      for (const spec of importsOf(readFileSync(f, "utf8"))) {
        if (FORBIDDEN.some((re) => re.test(spec))) bad.push(`${f} → ${spec}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

// The only code outside the island it may reach for: the site chrome, the
// claim email path and the OG helper. Anything else gets vendored into legacy/.
const OUTSIDE_ALLOWED = [
  /^@\/(lib|components)\/history(\/|$)/,
  /^@\/data\/history\//,
  /^@\/components\/live\/WorkspaceShell$/,
  /^@\/lib\/identity\/claim-contact$/,
  /^@\/lib\/seo$/,
];

test("island files import nothing from the app outside the allowlist", () => {
  const bad = [];
  for (const r of ROOTS) {
    for (const f of files(r)) {
      for (const spec of importsOf(readFileSync(f, "utf8"))) {
        if (spec.startsWith("@/") && !OUTSIDE_ALLOWED.some((re) => re.test(spec))) bad.push(`${f} → ${spec}`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

test("the scan sees imports (guards against a silently broken regex)", () => {
  const specs = importsOf(readFileSync("lib/history/board-2026-07-31.ts", "utf8"));
  assert.ok(specs.includes("./parse"));
});
