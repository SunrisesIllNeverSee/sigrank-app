/**
 * __tests__/contract/mock-seed-sync.test.mjs
 *
 * MOCK/SEED SYNC TEST — the dev-vs-prod drift guard.
 *
 * lib/data/mock.ts is the fallback data source (used when Supabase is not
 * configured). supabase/seed.sql is the live DB seed. Both are supposed to
 * define the SAME set of base operators. If they drift, dev behavior (mock)
 * diverges from prod behavior (seed) silently.
 *
 * This test extracts the codename set from each source and diffs them. It
 * does NOT compare full row data (that would be brittle) — just the operator
 * identity set. If a codename appears in one but not the other, that's a drift.
 *
 *   node --test __tests__/contract/mock-seed-sync.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..', '..')

/**
 * Extract operator codenames from lib/data/mock.ts.
 * Matches: codename: 'SomeCodename' or { codename: 'SomeCodename', ... }
 * Skips: function params (codename: string), type defs, and non-operator
 * fields like top_operator_codename / operator_codename (those are references,
 * not definitions).
 *
 * KNOWN MOCK-ONLY: the "static seed · *" and "app seed" operators are OWNER's
 * personal test variants (✱mem vs CLEAN cache configurations) that exist only
 * in the fallback mock, not in the live DB seed. They are intentionally
 * mock-only. We filter them out so the sync test compares only the operators
 * that should appear in BOTH sources.
 */
function extractMockCodenames(filePath) {
  const src = readFileSync(filePath, 'utf8')
  const matches = [...src.matchAll(/[{,]\s*codename:\s*['"]([^'"]+)['"]/g)]
  const all = matches.map((m) => m[1].trim()).filter(Boolean)
  // Filter out known mock-only operators (OWNER test variants)
  const mockOnly = new Set(all.filter((c) => c.startsWith('static seed ·') || c === 'app seed'))
  const shared = new Set(all.filter((c) => !mockOnly.has(c)))
  return { shared, mockOnly }
}

/**
 * Extract operator codenames from supabase/seed.sql.
 * Finds all INSERT INTO operators ... VALUES ... blocks and extracts the
 * codename column value from each tuple.
 */
function extractSeedCodenames(filePath) {
  const src = readFileSync(filePath, 'utf8')
  const codenames = new Set()

  // Find all INSERT INTO operators (...) VALUES ...; blocks
  // Use a non-greedy match up to the terminating ; or ON CONFLICT
  const insertBlocks = [...src.matchAll(/INSERT\s+INTO\s+operators\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?)(?:ON\s+CONFLICT|;)/gis)]

  for (const block of insertBlocks) {
    const cols = block[1].split(',').map((c) => c.trim().toLowerCase())
    const codenameIdx = cols.indexOf('codename')
    if (codenameIdx < 0) continue

    const valuesBlock = block[2]
    // Extract each tuple: (...), (...), or a single (...)
    // Handle multi-line tuples (the single-row insert spans multiple lines)
    const tuples = [...valuesBlock.matchAll(/\(([^)]*?(?:\([^)]*\)[^)]*?)*?)\)/gs)]
    for (const tuple of tuples) {
      // Extract quoted strings, skipping SQL casts (::bigint, ::uuid) and comments
      const strings = [...tuple[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
      if (strings[codenameIdx]) {
        codenames.add(strings[codenameIdx].trim())
      }
    }
  }

  return codenames
}

// ── Tests ─────────────────────────────────────────────────────────────────

const mockPath = join(repoRoot, 'lib/data/mock.ts')
const seedPath = join(repoRoot, 'supabase/seed.sql')

const { shared: mockCodenames, mockOnly: knownMockOnly } = extractMockCodenames(mockPath)
const seedCodenames = extractSeedCodenames(seedPath)

test('mock.ts and seed.sql both define operators', () => {
  assert.ok(mockCodenames.size > 0, 'mock.ts should define at least one shared operator')
  assert.ok(seedCodenames.size > 0, 'seed.sql should define at least one operator')
})

test('mock.ts and seed.sql define the same operator codename set (excluding known mock-only)', () => {
  const mockOnly = [...mockCodenames].filter((c) => !seedCodenames.has(c))
  const seedOnly = [...seedCodenames].filter((c) => !mockCodenames.has(c))

  if (mockOnly.length > 0 || seedOnly.length > 0) {
    const msg =
      `mock/seed codename drift detected!\n` +
      `  mock.ts (shared): ${mockCodenames.size} operators\n` +
      `  mock.ts (known mock-only, excluded): ${knownMockOnly.size} operators\n` +
      `  seed.sql: ${seedCodenames.size} operators\n` +
      (mockOnly.length > 0 ? `  Only in mock.ts: [${mockOnly.join(', ')}]\n` : '') +
      (seedOnly.length > 0 ? `  Only in seed.sql: [${seedOnly.join(', ')}]\n` : '') +
      `  FIX: add the missing operator(s) to BOTH lib/data/mock.ts and supabase/seed.sql`
    assert.fail(msg)
  }

  console.log(
    `✓ mock/seed sync: ${mockCodenames.size} operators match between mock.ts and seed.sql` +
      ` (${knownMockOnly.size} known mock-only operators excluded)`,
  )
})
