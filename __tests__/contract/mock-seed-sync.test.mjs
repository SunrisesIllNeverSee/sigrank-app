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
 * Tokenize a SQL `VALUES` body into tuples → columns.
 *
 * Unlike a naive "collect every quoted string" scan, this respects:
 *   - single-quoted strings, with '' as an escaped apostrophe (so a comma or
 *     paren INSIDE a string never splits a column),
 *   - nested parens (function calls like gen_random_uuid(), casts),
 *   - SQL line comments (`-- …`) and block comments (slash-star … star-slash).
 *
 * Returns an array of tuples; each tuple is an array of raw column expressions
 * in column order. This lets the caller index by the REAL column position
 * instead of assuming every value is a quoted literal (which silently mis-reads
 * the moment any unquoted column — gen_random_uuid(), a number, NULL — precedes
 * the codename, or a codename contains an escaped apostrophe).
 */
function tokenizeValues(valuesBody) {
  const tuples = []
  let cur = []
  let buf = ''
  let depth = 0
  let inTuple = false
  let inStr = false
  const n = valuesBody.length
  for (let i = 0; i < n; i++) {
    const ch = valuesBody[i]
    if (inStr) {
      buf += ch
      if (ch === "'") {
        if (valuesBody[i + 1] === "'") {
          buf += "'"
          i++ // consume the escaped second quote
        } else {
          inStr = false
        }
      }
      continue
    }
    // Line comment: `-- …` to end of line (outside strings).
    if (ch === '-' && valuesBody[i + 1] === '-') {
      while (i < n && valuesBody[i] !== '\n') i++
      continue
    }
    // Block comment: `/* … */` (outside strings).
    if (ch === '/' && valuesBody[i + 1] === '*') {
      i += 2
      while (i < n && !(valuesBody[i] === '*' && valuesBody[i + 1] === '/')) i++
      i += 1 // land on the closing '/'; the for-loop's i++ steps past it
      continue
    }
    if (ch === "'") {
      inStr = true
      buf += ch
      continue
    }
    if (!inTuple) {
      // Between tuples: ignore commas/whitespace until the next '('.
      if (ch === '(') {
        inTuple = true
        depth = 0
        cur = []
        buf = ''
      }
      continue
    }
    if (ch === '(') {
      depth++
      buf += ch
      continue
    }
    if (ch === ')') {
      if (depth === 0) {
        cur.push(buf.trim())
        tuples.push(cur)
        inTuple = false
        buf = ''
        continue
      }
      depth--
      buf += ch
      continue
    }
    if (ch === ',' && depth === 0) {
      cur.push(buf.trim())
      buf = ''
      continue
    }
    buf += ch
  }
  return tuples
}

/**
 * If a column expression is a single-quoted string literal (optionally with a
 * `::cast`), return its value with `''` unescaped to `'`. Otherwise null — i.e.
 * an unquoted value (NULL, a number, true/false, or a call like
 * gen_random_uuid()). Codenames are always quoted text, so null = "not a
 * codename literal".
 */
function quotedValue(colExpr) {
  const m = colExpr.match(/^'((?:[^']|'')*)'(?:\s*::\s*"?[A-Za-z0-9_ ]+"?(?:\[\])?)?$/)
  if (!m) return null
  return m[1].replace(/''/g, "'")
}

/**
 * Extract operator codenames from raw seed SQL. Finds every
 * `INSERT INTO operators (cols…) VALUES …` block, locates the codename COLUMN by
 * name, then reads that column's value from each tuple BY ITS REAL POSITION
 * (robust to unquoted leading columns + escaped apostrophes). The non-operators
 * metric_snapshots block is ignored (the regex is anchored to `INTO operators`).
 */
function extractSeedCodenamesFromSql(src) {
  const codenames = new Set()
  const insertBlocks = [
    ...src.matchAll(
      /INSERT\s+INTO\s+operators\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?)(?:ON\s+CONFLICT|;)/gis,
    ),
  ]
  for (const block of insertBlocks) {
    const cols = block[1].split(',').map((c) => c.trim().toLowerCase())
    const codenameIdx = cols.indexOf('codename')
    if (codenameIdx < 0) continue
    for (const tupleCols of tokenizeValues(block[2])) {
      const raw = tupleCols[codenameIdx]
      const value = raw == null ? null : quotedValue(raw)
      if (value) codenames.add(value.trim())
    }
  }
  return codenames
}

/**
 * Extract operator codenames from supabase/seed.sql (reads the file, then
 * delegates to extractSeedCodenamesFromSql).
 */
function extractSeedCodenames(filePath) {
  return extractSeedCodenamesFromSql(readFileSync(filePath, 'utf8'))
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

test('seed parser reads codenames by real column position (unquoted leading cols + escaped apostrophes)', () => {
  // Synthetic seed exercising exactly the cases the old "index the quoted-strings
  // array" approach got wrong:
  //   - an unquoted leading column (gen_random_uuid()) before codename,
  //   - a `--` comment containing parens,
  //   - an apostrophe escaped as '' inside a codename,
  //   - a comma inside a quoted string (display_name).
  // The old parser returned 'Brien' for row 1 (split 'O''Brien' into 'O' + 'Brien'
  // and mis-indexed). This asserts the column-position parser returns real values.
  const synthetic = `
INSERT INTO operators (
  operator_id, codename, display_name, account_age_days, claimed, claim_contact
) VALUES (
  gen_random_uuid(),  -- unquoted leading column (op-test-0001 parity)
  'O''Brien',
  'Pat, the Tester',
  42,
  true,
  NULL
)
ON CONFLICT (codename) DO NOTHING;

INSERT INTO operators (codename, display_name, claimed) VALUES
  ('Clean·Name', NULL, false),
  ('Has''Quote', 'x', true)
ON CONFLICT (codename) DO NOTHING;
`
  const got = [...extractSeedCodenamesFromSql(synthetic)].sort()
  assert.deepEqual(
    got,
    ["O'Brien", 'Clean·Name', "Has'Quote"].sort(),
    'codenames must be read from the real codename column and SQL-unescaped',
  )
})
