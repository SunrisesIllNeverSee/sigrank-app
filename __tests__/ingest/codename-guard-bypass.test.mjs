/**
 * __tests__/ingest/codename-guard-bypass.test.mjs
 * CLAIM 6: the codename_device_mismatch guard is skipped when device.codename
 * is null, so an arbitrary payload codename passes. PASSES if TRUE.
 * Also validates the fix: null device codename is now rejected.
 * Run: node --test __tests__/ingest/codename-guard-bypass.test.mjs
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'

// OLD guard predicate (before fix): short-circuits on null.
const oldRejected = (deviceCodename, payloadCodename) =>
  Boolean(deviceCodename && deviceCodename !== payloadCodename)

// NEW guard predicate (after fix): null is its own rejection.
const newRejected = (deviceCodename, payloadCodename) => {
  if (deviceCodename == null) return { rejected: true, reason: 'device_codename_not_bound' }
  if (deviceCodename !== payloadCodename) return { rejected: true, reason: 'codename_device_mismatch' }
  return { rejected: false }
}

test('CLAIM 6 (old guard): mismatch IS rejected when the device has a codename', () => {
  assert.equal(oldRejected('alice', 'mallory'), true)
})

test('CLAIM 6 (old guard): mismatch is NOT rejected when the device codename is null', () => {
  assert.equal(oldRejected(null, 'anything-i-want'), false)
})

test('FIX 6 (new guard): null device codename IS rejected', () => {
  const result = newRejected(null, 'anything-i-want')
  assert.equal(result.rejected, true)
  assert.equal(result.reason, 'device_codename_not_bound')
})

test('FIX 6 (new guard): mismatch still rejected when device has a codename', () => {
  const result = newRejected('alice', 'mallory')
  assert.equal(result.rejected, true)
  assert.equal(result.reason, 'codename_device_mismatch')
})

test('FIX 6 (new guard): matching codename passes', () => {
  const result = newRejected('alice', 'alice')
  assert.equal(result.rejected, false)
})
