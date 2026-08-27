import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const MCP_ROOT = path.resolve(
  process.argv[2] || process.env.OTHER_REPO_ROOT || path.join(ROOT, "../sigrank-mcp"),
);
const HANDLER = path.join(MCP_ROOT, "tools/standard-record.mjs");

test(
  "sigrank-mcp generated records validate against the public Standard schema",
  { skip: !existsSync(HANDLER) && "sigrank-mcp checkout not available" },
  async () => {
    const schema = JSON.parse(
      readFileSync(
        path.join(ROOT, "standard/schema/sigrank-operator-record-v0.1.schema.json"),
        "utf8",
      ),
    );
    const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
    ajv.addFormat(
      "date-time",
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
    );
    const validate = ajv.compile(schema);
    const { handleGetSigRankStandardRecord } = await import(pathToFileURL(HANDLER));

    const complete = await handleGetSigRankStandardRecord({
      input: 1_251_211,
      output: 11_296_121,
      cache_write: 128_196_310,
      cache_read: 2_555_179_769,
      timestamp: "2026-08-27T00:00:00.000Z",
    });
    assert.equal(validate(complete), true, JSON.stringify(validate.errors));

    const partial = await handleGetSigRankStandardRecord({
      input: 100,
      output: 50,
      cache_write: null,
      cache_read: null,
      timestamp: "2026-08-27T00:00:00.000Z",
    });
    assert.equal(validate(partial), true, JSON.stringify(validate.errors));

    const withoutMetrics = { ...complete };
    delete withoutMetrics.metrics;
    assert.equal(validate(withoutMetrics), false);
  },
);
