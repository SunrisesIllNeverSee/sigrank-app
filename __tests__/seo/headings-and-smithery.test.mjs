import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (f) => readFileSync(new URL(`../../${f}`, import.meta.url), "utf8");

test("no Smithery links or claims remain (hosted service shut down 2026-10-31)", () => {
  for (const f of ["lib/jsonld.ts", "app/mcp/page.tsx", "components/marketing/SignalIntegrity.tsx",
    "app/alternatives/page.tsx", "app/alternatives/mcp-ai-developer-tools/page.tsx"]) {
    assert.doesNotMatch(read(f), /smithery/i, f);
  }
});

test("/live has exactly one h1 and the profile header is an h2", () => {
  assert.equal((read("components/live/SignalLiveDemo.tsx").match(/<h1[\s>]/g) ?? []).length, 1);
  const pw = read("components/profile-v2/ProfileWorkspace.tsx");
  assert.doesNotMatch(pw, /<h1/);
  assert.match(pw, /<h2>\{name\}<\/h2>/);
});
