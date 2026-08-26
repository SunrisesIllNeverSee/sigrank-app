/**
 * __tests__/contract/execution-hardening-db.test.mjs
 *
 * DB-backed integration tests for execution-provider hardening.
 *
 * These tests exercise the actual remote Supabase database to verify:
 *   - RLS is enabled + enforced (anon key blocked, service role allowed)
 *   - CHECK constraints reject invalid modes, states, statuses
 *   - NOT NULL constraints reject missing source_commitment_hash
 *   - FK constraints reject receipts referencing missing executions
 *
 * Env-gated: runs ONLY when NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY are present. Skips gracefully otherwise
 * (no fail) so the standard `npm test` works in credential-free CI.
 *
 * Run standalone: node --test __tests__/contract/execution-hardening-db.test.mjs
 * Run with full suite: npm test (auto-skips if no creds)
 */
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

// ─── Load .env.local if present (node --test doesn't auto-load it) ───
const __dirname = dirname(fileURLToPath(import.meta.url))
const envLocal = resolve(__dirname, '..', '..', '.env.local')
if (existsSync(envLocal)) {
  for (const line of readFileSync(envLocal, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const hasServiceCreds = !!(SUPABASE_URL && SERVICE_KEY)
const hasAnonCreds = !!(SUPABASE_URL && ANON_KEY)

// ─── Helpers ───

/**
 * Create a service-role Supabase client (bypasses RLS).
 */
function serviceClient() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Create an anon-key Supabase client (subject to RLS).
 */
function anonClient() {
  return createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * A valid-looking execution row template with a non-existent exchange_id.
 * CHECK/NOT NULL constraints fire before FK in PostgreSQL, so the
 * exchange_id FK won't mask constraint violations we're testing.
 */
function validExecutionRow(overrides = {}) {
  return {
    exchange_id: '00000000-0000-0000-0000-000000000000', // non-existent UUID
    execution_id: `test_${randomUUID()}`,
    contribution_id: 'test_contrib',
    source_commitment_hash: 'sha256:abcdef0123456789',
    provider: 'internal',
    provider_reference: 'int_test123',
    mode: 'self_executed',
    state: 'created',
    task: { title: 'Test', description: 'Test execution' },
    authority: { inspect: false, test: false, modify: false, deploy: false, access_scope: [] },
    verification: { criteria: [], evidence_required: [] },
    provenance: { originator: 'test', contribution_lineage: [] },
    ...overrides,
  }
}

// ─── DB Integration Tests ───

describe('DB: execution-hardening RLS and constraints', { skip: !hasServiceCreds ? 'No Supabase service credentials in env' : undefined }, () => {

  // ─── RLS: service role can read ───

  test('RLS: service role can read exchange_executions', async () => {
    const admin = serviceClient()
    const { data, error } = await admin.from('exchange_executions').select('id').limit(1)
    assert.equal(error, null, `service role read failed: ${error?.message}`)
    assert.ok(Array.isArray(data), 'service role should return an array')
  })

  test('RLS: service role can read exchange_execution_receipts', async () => {
    const admin = serviceClient()
    const { data, error } = await admin.from('exchange_execution_receipts').select('id').limit(1)
    assert.equal(error, null, `service role read failed: ${error?.message}`)
    assert.ok(Array.isArray(data), 'service role should return an array')
  })

  // ─── RLS: anon key is blocked ───

  test('RLS: anon key cannot read exchange_executions', { skip: !hasAnonCreds ? 'No anon key in env' : undefined }, async () => {
    const anon = anonClient()
    const { data, error } = await anon.from('exchange_executions').select('id').limit(1)
    // RLS with no policy for anon → either error (permission denied) or empty array
    // Both are acceptable: the key is that NO rows are returned
    if (error) {
      // Permission denied is the strongest signal — RLS + no policy
      assert.match(error.message, /permission denied|rls|policy/i, `unexpected error: ${error.message}`)
    } else {
      assert.equal(data?.length, 0, 'anon key must not see any execution rows')
    }
  })

  test('RLS: anon key cannot read exchange_execution_receipts', { skip: !hasAnonCreds ? 'No anon key in env' : undefined }, async () => {
    const anon = anonClient()
    const { data, error } = await anon.from('exchange_execution_receipts').select('id').limit(1)
    if (error) {
      assert.match(error.message, /permission denied|rls|policy/i, `unexpected error: ${error.message}`)
    } else {
      assert.equal(data?.length, 0, 'anon key must not see any receipt rows')
    }
  })

  test('RLS: anon key cannot insert into exchange_executions', { skip: !hasAnonCreds ? 'No anon key in env' : undefined }, async () => {
    const anon = anonClient()
    const { error } = await anon.from('exchange_executions').insert(validExecutionRow())
    assert.ok(error, 'anon key must not be able to insert into exchange_executions')
  })

  test('RLS: anon key cannot insert into exchange_execution_receipts', { skip: !hasAnonCreds ? 'No anon key in env' : undefined }, async () => {
    const anon = anonClient()
    const { error } = await anon.from('exchange_execution_receipts').insert({
      execution_id: `nonexistent_${randomUUID()}`,
      exchange_id: '00000000-0000-0000-0000-000000000000',
      provider: 'internal',
      status: 'delivered',
      executor: { id: 'test', role: 'self' },
      timestamps: { created: new Date().toISOString() },
    })
    assert.ok(error, 'anon key must not be able to insert into exchange_execution_receipts')
  })

  // ─── CHECK constraints: invalid modes ───

  test('CHECK: invalid execution mode is rejected', async () => {
    const admin = serviceClient()
    const { error } = await admin.from('exchange_executions').insert(
      validExecutionRow({ mode: 'invalid_mode' })
    )
    assert.ok(error, 'invalid mode should be rejected')
    assert.equal(error.code, '23514', `expected CHECK_VIOLATION (23514), got ${error.code}: ${error.message}`)
  })

  test('CHECK: invalid execution state is rejected', async () => {
    const admin = serviceClient()
    const { error } = await admin.from('exchange_executions').insert(
      validExecutionRow({ state: 'invalid_state' })
    )
    assert.ok(error, 'invalid state should be rejected')
    assert.equal(error.code, '23514', `expected CHECK_VIOLATION (23514), got ${error.code}: ${error.message}`)
  })

  test('CHECK: empty provider is rejected', async () => {
    const admin = serviceClient()
    const { error } = await admin.from('exchange_executions').insert(
      validExecutionRow({ provider: '' })
    )
    assert.ok(error, 'empty provider should be rejected')
    assert.equal(error.code, '23514', `expected CHECK_VIOLATION (23514), got ${error.code}: ${error.message}`)
  })

  test('CHECK: external_provider mode requires non-empty provider_reference', async () => {
    const admin = serviceClient()
    const { error } = await admin.from('exchange_executions').insert(
      validExecutionRow({ mode: 'external_provider', provider_reference: null })
    )
    assert.ok(error, 'external_provider with null provider_reference should be rejected')
    assert.equal(error.code, '23514', `expected CHECK_VIOLATION (23514), got ${error.code}: ${error.message}`)
  })

  test('CHECK: invalid receipt status is rejected', async () => {
    const admin = serviceClient()
    const { error } = await admin.from('exchange_execution_receipts').insert({
      execution_id: `nonexistent_${randomUUID()}`,
      exchange_id: '00000000-0000-0000-0000-000000000000',
      provider: 'internal',
      status: 'invalid_status',
      executor: { id: 'test', role: 'self' },
      timestamps: { created: new Date().toISOString() },
    })
    assert.ok(error, 'invalid receipt status should be rejected')
    assert.equal(error.code, '23514', `expected CHECK_VIOLATION (23514), got ${error.code}: ${error.message}`)
  })

  // ─── NOT NULL constraints: source_commitment_hash ───

  test('NOT NULL: source_commitment_hash cannot be null', async () => {
    const admin = serviceClient()
    const { error } = await admin.from('exchange_executions').insert(
      validExecutionRow({ source_commitment_hash: null })
    )
    assert.ok(error, 'null source_commitment_hash should be rejected')
    assert.equal(error.code, '23502', `expected NOT_NULL_VIOLATION (23502), got ${error.code}: ${error.message}`)
  })

  test('CHECK: source_commitment_hash cannot be empty string', async () => {
    const admin = serviceClient()
    const { error } = await admin.from('exchange_executions').insert(
      validExecutionRow({ source_commitment_hash: '' })
    )
    assert.ok(error, 'empty source_commitment_hash should be rejected')
    assert.equal(error.code, '23514', `expected CHECK_VIOLATION (23514), got ${error.code}: ${error.message}`)
  })

  // ─── FK constraints ───

  test('FK: receipt cannot reference a missing execution', async () => {
    const admin = serviceClient()
    const { error } = await admin.from('exchange_execution_receipts').insert({
      execution_id: `nonexistent_${randomUUID()}`,
      exchange_id: '00000000-0000-0000-0000-000000000000',
      provider: 'internal',
      status: 'delivered',
      executor: { id: 'test', role: 'self' },
      timestamps: { created: new Date().toISOString() },
    })
    assert.ok(error, 'receipt referencing missing execution should be rejected')
    assert.equal(error.code, '23503', `expected FOREIGN_KEY_VIOLATION (23503), got ${error.code}: ${error.message}`)
  })

  test('FK: execution cannot reference a missing exchange record', async () => {
    const admin = serviceClient()
    const { error } = await admin.from('exchange_executions').insert(
      validExecutionRow() // uses non-existent exchange_id
    )
    assert.ok(error, 'execution referencing missing exchange should be rejected')
    assert.equal(error.code, '23503', `expected FOREIGN_KEY_VIOLATION (23503), got ${error.code}: ${error.message}`)
  })

  // ─── state_version constraint ───

  test('CHECK: negative state_version is rejected', async () => {
    const admin = serviceClient()
    const { error } = await admin.from('exchange_executions').insert(
      validExecutionRow({ state_version: -1 })
    )
    assert.ok(error, 'negative state_version should be rejected')
    assert.equal(error.code, '23514', `expected CHECK_VIOLATION (23514), got ${error.code}: ${error.message}`)
  })
})
