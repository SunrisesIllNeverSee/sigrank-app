import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../../", import.meta.url).pathname;
const read = (f) => readFileSync(join(root, f), "utf8");
const TEXT = /\.(ts|tsx|js|mjs|json|md|mdx|txt|xml|html|css|svg|yaml|yml)$/;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) yield* walk(p);
    else if (TEXT.test(name) && st.size < 5_000_000) yield p;
  }
}

test("no Smithery links or claims in app/, components/, lib/, public/ (hosted service shut down 2026-10-31)", () => {
  const hits = [];
  for (const d of ["app", "components", "lib", "public"]) {
    for (const f of walk(join(root, d))) if (/smithery/i.test(readFileSync(f, "utf8"))) hits.push(f.replace(root, ""));
  }
  assert.deepEqual(hits, []);
});

test("/live has exactly one h1 and the profile header is an h2", () => {
  assert.equal((read("components/live/SignalLiveDemo.tsx").match(/<h1[\s>]/g) ?? []).length, 1);
  const pw = read("components/profile-v2/ProfileWorkspace.tsx");
  assert.doesNotMatch(pw, /<h1/);
  assert.match(pw, /<h2>\{name\}<\/h2>/);
});
