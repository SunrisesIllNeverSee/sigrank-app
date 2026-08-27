import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { cascade } from "@sigrank/cascade";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const VECTOR = JSON.parse(
  readFileSync(
    path.join(ROOT, "standard/examples/canonical-reference.json"),
    "utf8",
  ),
);
const SCHEMA = JSON.parse(
  readFileSync(
    path.join(
      ROOT,
      "standard/schema/sigrank-operator-record-v0.1.schema.json",
    ),
    "utf8",
  ),
);

test("v0.1 canonical vector matches @sigrank/cascade", () => {
  const t = VECTOR.telemetry;
  const result = cascade(t.input, t.output, t.cache_write, t.cache_read);

  assert.equal(VECTOR.spec, "sigrank/0.1-draft");
  assert.equal(result.yield, VECTOR.metrics.yield);
  assert.equal(result.leverage, VECTOR.metrics.leverage);
  assert.equal(result.velocity, VECTOR.metrics.velocity);
  assert.equal(result.snr, VECTOR.metrics.snr);
  assert.equal(result.dev10x, VECTOR.metrics.dev10x);
});

test("v0.1 schema declares the standard wire primitives", () => {
  assert.equal(SCHEMA.properties.spec.const, "sigrank/0.1-draft");
  assert.deepEqual(SCHEMA.required, ["spec", "timestamp", "source", "telemetry"]);
  assert.ok(SCHEMA.properties.telemetry.properties.input);
  assert.ok(SCHEMA.properties.telemetry.properties.output);
  assert.ok(SCHEMA.properties.telemetry.properties.cache_write);
  assert.ok(SCHEMA.properties.telemetry.properties.cache_read);
  assert.equal(SCHEMA.properties.warnings.type, "array");
  assert.equal(SCHEMA.properties.warnings.items.type, "string");
});

test("reference math preserves null semantics", () => {
  const zeroInput = cascade(0, 10, 5, 100);
  assert.equal(zeroInput.yield, null);
  assert.equal(zeroInput.leverage, null);
  assert.equal(zeroInput.velocity, null);
  assert.equal(zeroInput.dev10x, null);

  const empty = cascade(0, 0, 0, 0);
  assert.equal(empty.snr, null);
});
