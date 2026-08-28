import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const read = (path) => readFileSync(join(root, path), "utf8");

test("public discovery surfaces advertise the live HTTP MCP endpoint", () => {
  for (const path of [
    "app/.well-known/mcp.json/route.ts",
    "app/.well-known/agent.json/route.ts",
    "app/.well-known/agent-card.json/route.ts",
  ]) {
    assert.match(read(path), /\/api\/mcp/);
  }
});

test("standard pages are distributed through sitemap and footer", () => {
  const sitemap = read("app/sitemap.ts");
  const footer = read("components/ui/Footer.tsx");
  for (const route of ["/upsilon", "/standard", "/standard/open-vs-proprietary"]) {
    assert.ok(sitemap.includes(route), `sitemap is missing ${route}`);
    assert.ok(footer.includes(route), `footer is missing ${route}`);
  }
});

test("locked product roles stay distinct without renaming the wire protocol", () => {
  const standard = read("lib/mcp/standard.ts");
  assert.match(standard, /brand:\s*"SignalAF"/);
  assert.match(standard, /governance:\s*"MO§ES™"/);
  assert.match(standard, /product:\s*"Upsilon"/);
  assert.match(standard, /leaderboard:\s*"SigRank"/);
  assert.match(standard, /SIGRANK_STANDARD_VERSION = "sigrank\/0\.1-draft"/);

  const page = read("app/upsilon/page.tsx");
  assert.match(page, /The EKG for AI processing/);
  assert.match(page, /does not, by itself, establish cognition/);
});

test("standard page explains the Upsilon and SigRank product boundary", () => {
  const page = read("app/standard/page.tsx");
  assert.match(page, /Upsilon is SignalAF/);
  assert.match(page, /SigRank is the public leaderboard and proof/);
  assert.match(page, /sigrank\/0\.1-draft/);
});

test("base compatibility exclusions remain explicit", () => {
  const standard = read("lib/mcp/standard.ts");
  assert.match(standard, /"construction"/);
  assert.match(standard, /"build_archetypes"/);
  assert.match(standard, /"rs05"/);

  const resources = read("lib/mcp/resources/index.ts");
  assert.match(resources, /10-type.*Build Archetypes/is);
  assert.match(resources, /24-stage.*RS05/is);
});
