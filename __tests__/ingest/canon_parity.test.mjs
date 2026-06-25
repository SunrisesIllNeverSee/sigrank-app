/**
 * __tests__/ingest/canon_parity.test.mjs — THE canon-parity pre-flip gate (D7 §8.8).
 *
 * Proves the sigrank-app canonicalizer agrees BYTE-FOR-BYTE with the sigrank-mcp signer.
 * Imports the REAL app canonical code (lib/ingest/canonical.mjs — the same module
 * signature.ts uses on the verify path) and asserts it against the committed
 * canon-parity fixture, which sigrank-mcp's sign.test.mjs independently asserts it
 * reproduces. If the two ever diverge by a single byte, the server would hard-reject
 * (422) every verified submission — this gate fails first.
 *
 * Run: node --test __tests__/ingest/canon_parity.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash, createPublicKey, verify as edVerify } from 'node:crypto'
import { canonicalJson, canonicalBytes } from '../../lib/ingest/canonical.mjs'

const fx = JSON.parse(
  readFileSync(new URL('../fixtures/canon_parity.json', import.meta.url), 'utf-8'),
)

/** Replicates signature.ts publicKeyFromAgent (standard node:crypto + the 12-byte SPKI prefix). */
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')
function verify(payload, signatureB64, publicKey) {
  const body = publicKey.startsWith('ed25519:') ? publicKey.slice('ed25519:'.length) : publicKey
  const raw = Buffer.from(body, 'base64')
  if (raw.length !== 32) return false
  const key = createPublicKey({
    key: Buffer.concat([ED25519_SPKI_PREFIX, raw]),
    format: 'der',
    type: 'spki',
  })
  return edVerify(null, canonicalBytes(payload), key, Buffer.from(signatureB64, 'base64'))
}

test('app canonicalJson byte-matches the MCP-produced fixture', () => {
  assert.equal(canonicalJson(fx.payload), fx.expected_canonical)
})

test('app snapshot_hash matches the fixture', () => {
  const h = `sha256:${createHash('sha256').update(canonicalBytes(fx.payload)).digest('hex')}`
  assert.equal(h, fx.expected_snapshot_hash)
})

test('app verifies the MCP-produced ed25519 signature', () => {
  assert.equal(verify(fx.payload, fx.expected_signature, fx.public_key), true)
})

test('a tampered payload fails verification (gate has teeth)', () => {
  const t = JSON.parse(JSON.stringify(fx.payload))
  t.raw_telemetry.tokens_output += 1
  assert.equal(verify(t, fx.expected_signature, fx.public_key), false)
})

test('canonical ignores the derived agent fields (signature/snapshot_hash)', () => {
  const stripped = JSON.parse(JSON.stringify(fx.payload))
  delete stripped.agent.snapshot_hash
  delete stripped.agent.signature
  assert.equal(canonicalJson(stripped), fx.expected_canonical)
})
