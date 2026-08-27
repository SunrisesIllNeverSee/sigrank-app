/**
 * __tests__/mcp/observability-summary-rpc.test.mjs
 *
 * Verifies that the MCP observability summary uses SQL-side aggregation
 * (the mcp_observability_summary RPC) instead of fetching raw rows and
 * aggregating in JavaScript. This is the regression test for issue #75.
 *
 * Run:
 *   node --test __tests__/mcp/observability-summary-rpc.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const observabilityPath = join(__dirname, "..", "..", "lib", "exchange", "mcp-observability.ts");
const migrationPath = join(__dirname, "..", "..", "supabase", "migrations", "20260827120000_0043_mcp_observability_summary_rpc.sql");

const observabilitySource = readFileSync(observabilityPath, "utf-8");
const migrationSource = readFileSync(migrationPath, "utf-8");

test("migration 0043 exists and defines the RPC function", () => {
  assert.ok(existsSync(migrationPath), "migration 0043 file must exist");
  assert.ok(
    migrationSource.includes("CREATE OR REPLACE FUNCTION mcp_observability_summary"),
    "migration must define mcp_observability_summary function",
  );
  assert.ok(
    migrationSource.includes("RETURNS JSONB"),
    "function must return JSONB",
  );
  assert.ok(
    migrationSource.includes("GRANT EXECUTE ON FUNCTION mcp_observability_summary TO service_role"),
    "function must be granted to service_role",
  );
});

test("getObservabilitySummary calls the RPC, not a raw row fetch", () => {
  assert.ok(
    observabilitySource.includes('client.rpc("mcp_observability_summary"'),
    "getObservabilitySummary must call the mcp_observability_summary RPC",
  );
  assert.ok(
    !observabilitySource.includes('.limit(10000)'),
    "getObservabilitySummary must NOT fetch raw rows with .limit(10000)",
  );
  assert.ok(
    !observabilitySource.includes('from("exchange_mcp_calls").select("*")'),
    "getObservabilitySummary must NOT select * from exchange_mcp_calls",
  );
});

test("RPC migration aggregates all dimensions that the JS version did", () => {
  const dimensions = [
    "by_server",
    "by_transport",
    "by_operation",
    "by_tool",
    "by_domain",
    "by_result",
    "by_auth_tier",
    "avg_duration_ms",
    "idempotent_replays",
    "total_calls",
    "funnel",
  ];
  for (const dim of dimensions) {
    assert.ok(
      migrationSource.includes(dim),
      `migration must aggregate dimension: ${dim}`,
    );
  }
});

test("RPC migration includes all funnel steps", () => {
  const funnelSteps = [
    "initializations",
    "tool_list_requests",
    "tool_calls",
    "signals_viewed",
    "attempts_created",
    "submissions_received",
    "proposals_created",
  ];
  for (const step of funnelSteps) {
    assert.ok(
      migrationSource.includes(step),
      `migration must include funnel step: ${step}`,
    );
  }
});

test("RPC migration applies the same filters the JS version did", () => {
  const filters = ["p_since", "p_domain", "p_transport", "p_tool", "p_result"];
  for (const f of filters) {
    assert.ok(
      migrationSource.includes(f),
      `migration must accept filter parameter: ${f}`,
    );
  }
});

test("RPC handles empty result set gracefully (COALESCE to empty jsonb)", () => {
  assert.ok(
    migrationSource.includes("COALESCE(jsonb_object_agg") || migrationSource.includes("'{}'::jsonb"),
    "migration must use COALESCE to return empty objects when no rows match",
  );
});
