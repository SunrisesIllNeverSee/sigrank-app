import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { anonymousAnalystRoute, anonymousAnalystChallenge } from "../../lib/mcp/plugin/anonymous-origin.ts";

test("anonymous hostname exposes the Analyst and ownership challenge", () => {
  for (const path of ["/api/plugins/sigrank/mcp", "/.well-known/openai-apps-challenge"]) {
    assert.equal(anonymousAnalystRoute("analyst.signalaf.com", path), "public");
  }
});

test("anonymous hostname has no OAuth discovery or sign-in routes", () => {
  for (const path of [
    "/.well-known/oauth-protected-resource",
    "/.well-known/oauth-protected-resource/api/plugins/sigrank/mcp",
    "/.well-known/oauth-authorization-server",
    "/.well-known/openid-configuration",
    "/api/plugins/sigrank/mcp/.well-known/oauth-protected-resource",
    "/login", "/auth/callback", "/me", "/settings",
  ]) assert.equal(anonymousAnalystRoute("analyst.signalaf.com", path), "blocked", path);
});

test("anonymous hostname does not expose submission MCP or unrelated routes", () => {
  for (const path of [
    "/api/mcp", "/api/ingest", "/api/v1/snapshots", "/api/search",
    "/ingest/static/a.js", "/", "/.well-known/mcp.json", "/auth.md",
    "/api/plugins/sigrank/mcp/submit", "/api/plugins/sigrank/mcp/",
  ]) assert.equal(anonymousAnalystRoute("analyst.signalaf.com", path), "blocked", path);
});

test("website, submission MCP and preview host routing stay unchanged", () => {
  for (const host of ["signalaf.com", "www.signalaf.com", "sigrank-app.vercel.app", "localhost"]) {
    for (const path of ["/", "/login", "/api/mcp", "/.well-known/oauth-protected-resource", "/api/plugins/sigrank/mcp"]) {
      assert.equal(anonymousAnalystRoute(host, path), null);
    }
  }
});

test("hostname handling does not match unrelated suffixes", () => {
  assert.equal(anonymousAnalystRoute("ANALYST.SIGNALAF.COM", "/api/mcp"), "blocked");
  assert.equal(anonymousAnalystRoute("analyst.signalaf.com.example.org", "/api/mcp"), null);
});

test("proxy isolates the hostname before session refresh and matches all its paths", () => {
  const proxy = readFileSync(new URL("../../proxy.ts", import.meta.url), "utf8");
  assert.ok(proxy.indexOf("const analystRoute = anonymousAnalystRoute") < proxy.indexOf("const bot = detectBot"));
  assert.ok(proxy.indexOf('if (analystRoute === "blocked")') < proxy.indexOf("await supabase.auth.getUser()"));
  assert.match(proxy, /source: "\/:path\*", has: \[\{ type: "host", value: "analyst\.signalaf\.com" \}\]/);
});

test("anonymous ownership challenge matches the review draft and respects HTTP methods", async () => {
  const response = anonymousAnalystChallenge("GET");
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "BcUWbu8C0IdvuJ0MtTnzQzMcajWl2xL7hHqN8XQy6To\n");
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(await anonymousAnalystChallenge("HEAD").text(), "");
  const denied = anonymousAnalystChallenge("POST");
  assert.equal(denied.status, 405);
  assert.equal(denied.headers.get("allow"), "GET, HEAD");
});
