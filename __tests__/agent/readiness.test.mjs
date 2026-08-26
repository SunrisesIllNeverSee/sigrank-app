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
  const vercel = JSON.parse(await source("vercel.json"));
  assert.match(middleware, /text\/markdown; charset=utf-8/);
  assert.match(middleware, /Accept, Accept-Encoding/);
  assert.match(middleware, /\^q=/);
  assert.match(middleware, /status: 406/);
  assert.match(middleware, /HOME_MARKDOWN/);
  // Markdown response must not be CDN-cached — prevents Vary: Accept
  // from fragmenting the HTML cache.
  assert.match(middleware, /private, no-store/);
  // Bot-gated Vary: middleware sets Vary for AI bots only (no CDN
  // fragmentation for browser visitors).
  assert.match(middleware, /bot\.isBot/);
  assert.match(middleware, /isHomepage && bot\.isBot/);
  // vercel.json must NOT append Vary to the homepage — that fragments
  // the CDN cache across browser Accept variations.
  const rootRoute = vercel.routes?.find((route) => route.src === "^/$");
  assert.equal(rootRoute, undefined, "vercel.json must not have a homepage Vary route");
});

test("web 404 includes deterministic agent recovery links and markdown negotiation", async () => {
  const page = await source("app/not-found.tsx");
  const middleware = await source("middleware.ts");
  assert.match(page, /sitemap\.xml/);
  assert.match(page, /llms\.txt/);
  assert.match(page, /openapi\.json/);
  assert.match(page, /developers/);
  // Middleware must serve a markdown 404 body to agents asking for markdown
  assert.match(middleware, /NOT_FOUND_MARKDOWN/);
  assert.match(middleware, /negotiatedNotFound/);
  assert.match(middleware, /status: 404/);
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

test("public REST reads advertise rate-limit state and typed errors", async () => {
  const gate = await source("lib/infra/api-gate.ts");
  const leaderboard = await source("app/api/v1/leaderboard/route.ts");
  const operator = await source("app/api/v1/operators/[codename]/route.ts");
  const hall = await source("app/api/v1/hall-of-signal/route.ts");
  const leaders = await source("app/api/v1/metrics/leaders/route.ts");
  const challenges = await source("app/api/v1/challenges/route.ts");
  assert.match(gate, /RateLimit-Policy/);
  assert.match(gate, /RateLimit-Remaining/);
  assert.match(gate, /Retry-After/);
  assert.match(leaderboard, /rateLimitHeaders\(rl\)/);
  assert.match(operator, /rateLimitHeaders\(rl\)/);
  assert.match(hall, /rateLimitHeaders\(rl\)/);
  assert.match(leaders, /rateLimitHeaders\(rl\)/);
  assert.match(challenges, /rateLimit\(req\)/);
  assert.match(challenges, /rateLimitHeaders\(rl\)/);
  assert.match(operator, /operator_not_found/);
});

test("API responses advertise deprecation policy via Link header", async () => {
  const middleware = await source("middleware.ts");
  assert.match(middleware, /deprecation-policy/);
  assert.match(middleware, /\/developers#versioning/);
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
  const protocol = await source("lib/mcp/protocol.ts");
  assert.match(manifest, /streamable-http/);
  assert.match(manifest, /\/api\/mcp/);
  // Protocol version is defined in the shared protocol module
  assert.match(protocol, /2025-06-18/);
  assert.match(mcp, /PROTOCOL_VERSION/);
  assert.match(mcp, /method === "initialize"/);
  assert.match(mcp, /method === "notifications\/initialized"/);
  assert.match(mcp, /method === "tools\/list"/);
  assert.match(mcp, /method === "tools\/call"/);
  // MCP tool metadata (agent-ready.dev M2/M4/M5/M6)
  assert.match(mcp, /websiteUrl/);
  assert.match(mcp, /readOnlyHint/);
  assert.match(mcp, /outputSchema/);
  // Every parameter must have a description
  const paramDescCount = (mcp.match(/description: ".*"/g) || []).length;
  assert.ok(paramDescCount >= 10, `expected >=10 description fields (params + outputs), got ${paramDescCount}`);
});

test("organization JSON-LD exposes the published SignalAF support contact and postal address", async () => {
  const layout = await source("app/layout.tsx");
  assert.match(layout, /"@type": "ContactPoint"/);
  assert.match(layout, /contactType: "customer support"/);
  assert.match(layout, /hello@signalaf\.com/);
  assert.match(layout, /SITE_ORIGIN.*contact/);
  assert.match(layout, /"@type": "PostalAddress"/);
  assert.match(layout, /84 W Utica St/);
  assert.match(layout, /addressLocality: "Buffalo"/);
  assert.match(layout, /addressRegion: "NY"/);
  assert.match(layout, /postalCode: "14209"/);
  assert.match(layout, /addressCountry: "US"/);
});
