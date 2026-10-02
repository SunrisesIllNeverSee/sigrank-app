import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const contracts = JSON.parse(readFileSync(new URL("../../lib/mcp/plugin/contracts.json", import.meta.url), "utf8"));

test("plugin success schemas use the same data shape in both validation branches", () => {
  for (const tool of contracts.tools) {
    const schema = tool.outputSchema;
    const outer = schema.properties.data.anyOf[0];
    const conditional = schema.allOf[0].then.properties.data;
    assert.deepEqual(conditional, outer, `${tool.name} has mismatched success data schemas`);
  }
});
