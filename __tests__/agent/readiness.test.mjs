import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("homepage H1 is server-rendered, not owned by client wordmark", async () => {
  const hero = await source("components/draft/Draft2Hero.tsx");
  const wordmark = await source("components/home/RotatingWordmark.tsx");
  assert.match(hero, /<h1\b/);
  assert.doesNotMatch(wordmark, /<h1\b/);
});

test("homepage markdown negotiation exposes the required media type, Vary, q parsing and 406", async () => {
  const middleware = await source("middleware.ts");
  assert.match(middleware, /text\/markdown; charset=utf-8/);
  assert.match(middleware, /Accept, Accept-Encoding/);
  assert.match(middleware, /\^q=/);
  assert.match(middleware, /status: 406/);
  assert.match(middleware, /HOME_MARKDOWN/);
});

test("web 404 includes deterministic agent recovery links", async () => {
  const page = await source("app/not-found.tsx");
  assert.match(page, /sitemap\.xml/);
  assert.match(page, /llms\.txt/);
  assert.match(page, /openapi\.json/);
  assert.match(page, /developers/);
});

test("unknown REST routes use RFC 9457 problem responses", async () => {
  const helper = await source("lib/infra/problem.ts");
  const catchall = await source("app/api/v1/[...path]/route.ts");
  assert.match(helper, /application\/problem\+json/);
  assert.match(helper, /code/);
  assert.match(helper, /hint/);
  assert.match(catchall, /endpoint_not_found/);
  assert.match(catchall, /status: 404/);
});

test("public leaderboard advertises rate-limit state and 429 recovery", async () => {
  const gate = await source("lib/infra/api-gate.ts");
  const leaderboard = await source("app/api/v1/leaderboard/route.ts");
  assert.match(gate, /RateLimit-Policy/);
  assert.match(gate, /RateLimit-Remaining/);
  assert.match(gate, /Retry-After/);
  assert.match(leaderboard, /rateLimitHeaders\(rl\)/);
});

test("OpenAPI defines typed reusable Problem responses", async () => {
  const openapi = await source("app/openapi.json/route.ts");
  assert.match(openapi, /#\/components\/schemas\/Problem/);
  assert.match(openapi, /application\/problem\+json/);
  assert.match(openapi, /RateLimited/);
  assert.match(openapi, /x-deprecation-policy/);
  assert.match(openapi, /externalDocs/);
});

test("developer resources are discoverable from llms and homepage", async () => {
  const llms = await source("app/llms.txt/route.ts");
  const cta = await source("components/draft/Draft2CtaBand.tsx");
  assert.match(llms, /## When to use SignalAF/);
  assert.match(llms, /## Developer and agent resources/);
  assert.match(llms, /openapi\.json/);
  assert.match(llms, /\.well-known\/mcp\.json/);
  assert.match(cta, /href="\/developers"/);
  assert.match(cta, /href="\/openapi\.json"/);
});

test("developer portal documents auth, rate limits, errors and version lifecycle", async () => {
  const page = await source("app/developers/page.tsx");
  assert.match(page, /SignalAF Developer Portal/);
  assert.match(page, /id="authentication"/);
  assert.match(page, /id="errors"/);
  assert.match(page, /id="rate-limits"/);
  assert.match(page, /id="versioning"/);
  assert.match(page, /Deprecation/);
  assert.match(page, /Sunset/);
});

test("MCP manifest points to a Streamable HTTP endpoint with a valid lifecycle implementation", async () => {
  const manifest = await source("app/.well-known/mcp.json/route.ts");
  const mcp = await source("app/api/mcp/route.ts");
  assert.match(manifest, /streamable-http/);
  assert.match(manifest, /\/api\/mcp/);
  assert.match(mcp, /2025-06-18/);
  assert.match(mcp, /message\.method === "initialize"/);
  assert.match(mcp, /message\.method === "notifications\/initialized"/);
  assert.match(mcp, /message\.method === "tools\/list"/);
  assert.match(mcp, /message\.method === "tools\/call"/);
});
