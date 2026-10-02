import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const contracts = JSON.parse(readFileSync(new URL("../../lib/mcp/plugin/contracts.json", import.meta.url), "utf8"));

test("public plugin exposes only the five V1 tools without OAuth", () => {
  assert.deepEqual(contracts.tools.map(tool => tool.name), [
    "get_leaderboard", "get_operator", "compare_operators", "get_field_stats", "report_beta_bug",
  ]);
  for (const tool of contracts.tools) {
    assert.deepEqual(tool.securitySchemes, [{ type: "noauth" }]);
  }
});

test("plugin success schemas use the same data shape in both validation branches", () => {
  for (const tool of contracts.tools) {
    const schema = tool.outputSchema;
    const outer = schema.properties.data.anyOf[0];
    const conditional = schema.allOf[0].then.properties.data;
    assert.deepEqual(conditional, outer, `${tool.name} has mismatched success data schemas`);
  }
});

test("measurement class may be unknown in every plugin response branch", () => {
  let checked = 0;
  function visit(value) {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (key === "measurement_class" && child && typeof child === "object") {
        assert.ok(child.anyOf?.some(option => option.type === "null"), "unknown measurement class must be permitted");
        checked++;
      } else visit(child);
    }
  }
  visit(contracts);
  assert.ok(checked > 0);
});

test("board provenance may be unknown and field stats count unclassified rows", () => {
  let statuses = 0;
  let classCounts = 0;
  function visit(value) {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (key === "verification_status" && child && typeof child === "object") {
        assert.ok(child.anyOf?.some(option => option.type === "null"));
        statuses++;
      } else if (key === "measurement_class_counts" && child && typeof child === "object") {
        assert.ok(child.required?.includes("Unknown"));
        classCounts++;
      } else visit(child);
    }
  }
  visit(contracts);
  assert.ok(statuses > 0);
  assert.ok(classCounts > 0);
});
