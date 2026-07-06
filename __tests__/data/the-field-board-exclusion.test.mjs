/**
 * __tests__/data/the-field-board-exclusion.test.mjs
 * CLAIM 9: The Field (operator_id = f1e1d000-...) is NOT excluded from the
 * ranked board in getLeaderboard, so it appears in the ranked field and
 * inflates operatorCount/percentiles. PASSES if the claim is TRUE (before fix)
 * and FALSE (after fix).
 *
 * This test verifies the fix: The Field is excluded from the board.
 * Run: node --test __tests__/data/the-field-board-exclusion.test.mjs
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const read = (p) => readFileSync(join(root, p), 'utf8')

const FIELD_OPERATOR_ID = 'f1e1d000-0000-4000-8000-000000000001'

test('FIX 9: getLeaderboard excludes The Field from the ranked board', () => {
  const src = read('lib/data/queries.ts')
  // The fix adds a filter for FIELD_OPERATOR_ID after the collapse step.
  assert.ok(
    src.includes(FIELD_OPERATOR_ID),
    'queries.ts must reference the Field operator_id for exclusion',
  )
  assert.ok(
    src.includes('s.operator_id !== FIELD_OPERATOR_ID') || src.includes("s.operator_id !== 'f1e1d000"),
    'queries.ts must filter out The Field from snapRows',
  )
})

test('FIX 9: filterMockBoard (fallback path) also excludes The Field', () => {
  const src = read('lib/data/fallback.ts')
  assert.ok(
    src.includes(FIELD_OPERATOR_ID),
    'fallback.ts must reference the Field operator_id for exclusion',
  )
  assert.ok(
    src.includes("r.operator.operator_id !== 'f1e1d000") || src.includes('r.operator.operator_id !== FIELD_OPERATOR_ID'),
    'fallback.ts must filter out The Field from the mock/cold-store board',
  )
})

test('FIX 9: The Field exists in snapshot.json (confirming the fallback risk is real)', () => {
  const src = read('lib/data/snapshot.json')
  assert.ok(
    src.includes(FIELD_OPERATOR_ID),
    'snapshot.json contains The Field — the fallback path MUST filter it',
  )
})

test('FIX 9: /compare already excluded The Field (parity check)', () => {
  const src = read('app/compare/page.tsx')
  assert.ok(
    src.includes("'the-field'"),
    '/compare page filters the-field from the side-A pool',
  )
})

test('FIX 9: The Field operator_id is the known constant', () => {
  // Verify the operator_id matches what the SQL migration uses.
  const migrationSrc = read('supabase/migrations/0019_the_field_autoupdate.sql')
  assert.ok(
    migrationSrc.includes(FIELD_OPERATOR_ID),
    'migration 0019 must reference the same Field operator_id',
  )
})
