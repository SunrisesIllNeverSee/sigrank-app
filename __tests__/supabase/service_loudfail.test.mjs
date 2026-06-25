/**
 * __tests__/supabase/service_loudfail.test.mjs — pre-flip gate 2/3 (D7 §6.2).
 *
 * The service-role WRITE client must NEVER fall back to the anon key. serviceKeyOrNull
 * (used by getSupabaseService) returns the service key only when present, else null;
 * structurally it cannot return an anon key (it never receives one). A null result →
 * the write routes 503 instead of phantom-writing under RLS. This gate locks both the
 * decision logic AND that getSupabaseService actually uses it (no anon reference).
 *
 * Run: node --test __tests__/supabase/service_loudfail.test.mjs
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { serviceKeyOrNull } from '../../lib/supabase/service-config.mjs'

test('returns the service key when url + serviceKey are present', () => {
  assert.equal(serviceKeyOrNull('https://x.supabase.co', 'svc-key'), 'svc-key')
})

test('returns null when the service key is missing/blank (loud-fail, no fallback)', () => {
  assert.equal(serviceKeyOrNull('https://x.supabase.co', undefined), null)
  assert.equal(serviceKeyOrNull('https://x.supabase.co', ''), null)
  assert.equal(serviceKeyOrNull('https://x.supabase.co', null), null)
})

test('returns null when the url is missing', () => {
  assert.equal(serviceKeyOrNull(undefined, 'svc-key'), null)
})

test('getSupabaseService uses serviceKeyOrNull and never the anon/active key', () => {
  const src = readFileSync(new URL('../../lib/supabase/server.ts', import.meta.url), 'utf-8')
  const i = src.indexOf('export function getSupabaseService')
  assert.ok(i !== -1, 'getSupabaseService is present')
  const body = src.slice(i)
  assert.match(body, /serviceKeyOrNull\(/, 'getSupabaseService delegates the key decision to serviceKeyOrNull')
  assert.ok(!/activeKey|anonKey/.test(body), 'getSupabaseService never references the anon/active key (no fallback)')
})
