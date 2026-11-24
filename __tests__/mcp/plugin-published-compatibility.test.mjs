import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv/dist/2020.js';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const published = read('../fixtures/analyst/published-1.2.0.json');
const current = read('../../lib/mcp/plugin/contracts.json');

// This baseline represents clients which have already cached tools/list. Do
// not regenerate it when changing the server. A new version needs a distinct
// route/tool contract while this endpoint continues serving its existing one.
test('the published Analyst endpoint retains its wire contract version', () => {
  assert.equal(current.contract_version, published.contract_version,
    'Changing the unversioned endpoint breaks cached const-version schemas; publish a separate contract instead.');
});

test('every published tool retains its input/output schema and security annotations', () => {
  for (const before of published.tools) {
    const after = current.tools.find(t => t.name === before.name);
    assert.ok(after, `Published tool removed: ${before.name}`);
    for (const field of ['inputSchema', 'outputSchema', 'securitySchemes', 'annotations']) {
      assert.deepEqual(after[field], before[field],
        `${before.name}.${field} changed at the published endpoint. A descriptive copy edit is fine; a schema change needs an explicit versioned rollout.`);
    }
  }
});

test('published validators reject exactly the version/shape drift seen in cached clients', () => {
  const schema = published.tools.find(t => t.name === 'get_operator').outputSchema;
  const validate = new Ajv({ strict: false, validateFormats: false }).compile(schema);
  const error = { contract_version: published.contract_version, status: 'error', data: null, provenance: null,
    warnings: [], error: { code: 'NOT_FOUND', message: 'Synthetic operator is absent.', retryable: false } };
  assert.equal(validate(error), true, JSON.stringify(validate.errors));
  assert.equal(validate({ ...error, contract_version: '1.3.0' }), false);
  assert.ok(validate.errors.some(e => e.keyword === 'const'));
  assert.equal(validate({ ...error, unexpected_wire_property: true }), false);
  assert.ok(validate.errors.some(e => e.keyword === 'additionalProperties'));
});
