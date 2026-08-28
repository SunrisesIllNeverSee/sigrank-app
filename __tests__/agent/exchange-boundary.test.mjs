import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("Contribution Exchange structured data is scoped to explicit Exchange routes", async () => {
  const rootLayout = await source("app/layout.tsx");
  const exchangeLayout = await source("app/exchange/layout.tsx");

  assert.doesNotMatch(
    rootLayout,
    /contributionExchangeService\(\)/,
    "root pages must not emit Contribution Exchange as a site-wide entity",
  );
  assert.match(exchangeLayout, /contributionExchangeService\(\)/);
});

test("main SignalAF agent card does not advertise Exchange as a primary skill", async () => {
  const agentCard = await source("app/.well-known/agent-card.json/route.ts");

  assert.doesNotMatch(agentCard, /id: "contribution-exchange"/);
  assert.match(agentCard, /Optional SignalAF economic-interaction capability/);
  assert.match(agentCard, /required: false/);
  assert.match(agentCard, /activation: "explicit_exchange_endpoint_only"/);
});

test("Exchange manifest declares its SignalAF parent and explicit activation boundary", async () => {
  const manifest = await source("exchange-gateway/src/manifest.ts");
  const profileRoute = await source("app/.well-known/exchange.json/route.ts");

  assert.match(manifest, /capability:'contribution_exchange'/);
  assert.match(manifest, /name:'SignalAF \/ SigRank'/);
  assert.match(manifest, /mode:'explicit_request'/);
  assert.match(manifest, /user_agent_detection_does_not_activate:true/);
  assert.match(manifest, /default_site_representation:'host_content'/);
  assert.match(profileRoute, /rel=\"up\"/);
  assert.match(profileRoute, /x-signalaf-activation/);
});

test("being an AI bot cannot activate or route into Contribution Exchange", async () => {
  const middleware = await source("middleware.ts");

  assert.doesNotMatch(middleware, /exchange/i);
  assert.match(middleware, /detectBot/);
  assert.match(middleware, /request\.nextUrl\.pathname !== "\/"/);
  assert.match(middleware, /HOME_MARKDOWN/);
});

test("dedicated Exchange MCP points back to the primary SignalAF MCP", async () => {
  const exchangeMcp = await source("app/.well-known/exchange-mcp.json/route.ts");
  const primaryMcp = await source("app/.well-known/mcp.json/route.ts");

  assert.match(exchangeMcp, /Optional Capability/);
  assert.match(exchangeMcp, /primaryMcp/);
  assert.match(exchangeMcp, /activation: "explicit_exchange_endpoint_only"/);
  assert.match(exchangeMcp, /homepage: `\$\{SITE_ORIGIN\}\/exchange`/);
  assert.match(primaryMcp, /name: "sigrank"/);
  assert.match(primaryMcp, /endpoint: `\$\{SITE_ORIGIN\}\/api\/mcp`/);
  assert.match(primaryMcp, /homepage: SITE_ORIGIN/);
});

test("llms index establishes SignalAF before the optional Exchange section", async () => {
  const llms = await source("app/llms.txt/route.ts");
  const signalaf = llms.indexOf("SigRank is an AI operator benchmark");
  const exchange = llms.indexOf("## Contribution Exchange");

  assert.ok(signalaf >= 0, "llms.txt must establish the SigRank identity");
  assert.ok(exchange > signalaf, "Exchange must be subordinate to the SigRank identity");
});
