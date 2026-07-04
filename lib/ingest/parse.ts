/**
 * lib/ingest/parse.ts — TypeScript port of moses-sigrank/ingest.py.
 *
 * Turns whatever the user pastes into four token integers (i, o, cw, cr) plus
 * metadata about the source and any estimation applied.
 *
 * Three strategies, tried in order (mirrors ingest.py ingest_meta()):
 *   1. Valid JSON (or fixable partial JSON) → ccusage path or Codex path
 *   2. Text with named fields (extracts by field name, not position)
 *   3. Four bare numbers: input output cache_create cache_read
 *
 * Codex payload detection: presence of cached_input_tokens /
 * cachedInputTokens / reasoning_output_tokens / reasoningOutputTokens.
 *
 * Codex estimation:
 *   Beta  (operator has verified Claude io_ratio):
 *     est_input = output × io_ratio
 *   Alpha (Codex alone):
 *     est_input = output × 2.0  (AA-backed baseline, wild-corpus validated)
 *
 * IMPORTANT: Estimated Codex values are ALWAYS flagged (meta.estimated = true,
 * meta.caveat non-null). Never treat them as measured values.
 */

import type { IngestResult, IngestMeta, RawPillars, OperatorProfile } from './types'

// ---------------------------------------------------------------------------
// Field aliases — mirrors _FIELD_ALIASES in ingest.py
// ---------------------------------------------------------------------------

const ALIASES = {
  input:        ['inputTokens', 'input_tokens'],
  output:       ['outputTokens', 'output_tokens'],
  cacheCreate:  ['cacheCreationTokens', 'cache_creation_input_tokens'],
  cacheRead:    ['cacheReadTokens', 'cache_read_input_tokens', 'cachedInputTokens', 'cached_input_tokens'],
  cost:         ['totalCost', 'costUSD', 'cost'],
  reasoning:    ['reasoningOutputTokens', 'reasoning_output_tokens'],
  // `total` is redundant with the 4 pillars (= input+output+cacheCreate+cacheRead)
  // and does NOT feed the cascade — but some readers (e.g. tokscale) emit a total
  // line, so we recognize it so those pastes parse cleanly. NOTE: no bare 'total'
  // alias — it would substring-collide with 'totalCost'/'totalTokens'.
  total:        ['totalTokens', 'total_tokens'],
} as const

/** Keys that indicate a Codex (not ccusage) payload. */
const CODEX_KEYS = new Set([
  'cached_input_tokens', 'cachedInputTokens',
  'reasoning_output_tokens', 'reasoningOutputTokens',
])

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function hasNamedFields(text: string): boolean {
  let hits = 0
  for (const aliases of Object.values(ALIASES)) {
    for (const alias of aliases) {
      if (text.includes(alias)) { hits++; break }
    }
  }
  return hits >= 2
}

function tryFixJson(text: string): string | null {
  const t = text.trim()
  if (t[0] === '{' || t[0] === '[') {
    try { JSON.parse(t); return t } catch { /* try repairs */ }
    try { JSON.parse(t + '}'); return t + '}' } catch { /* continue */ }
    try { JSON.parse(t + '}}'); return t + '}}' } catch { /* continue */ }
  }
  if (t.startsWith('"')) {
    const candidate = '{' + t
    for (const suffix of ['', '}', '}}']) {
      try { JSON.parse(candidate + suffix); return candidate + suffix } catch { /* next */ }
    }
  }
  return null
}

/** Collect all keys in a JSON-parsed value recursively. */
function collectKeys(obj: unknown, keys: Set<string>): void {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      obj.forEach((v) => collectKeys(v, keys))
    } else {
      Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
        keys.add(k)
        collectKeys(v, keys)
      })
    }
  }
}

function isCodexShape(d: unknown): boolean {
  const keys = new Set<string>()
  collectKeys(d, keys)
  for (const k of CODEX_KEYS) {
    if (keys.has(k)) return true
  }
  return false
}

function safeInt(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? Math.floor(n) : 0
}

// ---------------------------------------------------------------------------
// ccusage JSON parser — mirrors parse_ccusage() in ingest.py
// ---------------------------------------------------------------------------

function accumulateEntry(entry: unknown, acc: {
  input: number; output: number; cacheCreate: number; cacheRead: number; cost: number
}): void {
  if (!entry || typeof entry !== 'object') return
  const e = entry as Record<string, unknown>
  acc.input       += safeInt(e.inputTokens  ?? e.input_tokens  ?? e.input  ?? 0)
  acc.output      += safeInt(e.outputTokens ?? e.output_tokens ?? e.output ?? 0)
  acc.cacheCreate += safeInt(e.cacheCreationTokens ?? e.cache_creation_input_tokens ?? e.cache_create ?? 0)
  acc.cacheRead   += safeInt(e.cacheReadTokens ?? e.cache_read_input_tokens ?? e.cache_read ?? 0)
  acc.cost        += Number(e.costUSD ?? e.totalCost ?? e.cost ?? 0) || 0
}

function parseCcusage(d: unknown): { pillars: RawPillars; costUsd: number | null } {
  const acc = { input: 0, output: 0, cacheCreate: 0, cacheRead: 0, cost: 0 }

  if (Array.isArray(d)) {
    d.forEach((e) => accumulateEntry(e, acc))
  } else if (d && typeof d === 'object') {
    const obj = d as Record<string, unknown>
    if (obj.totals && typeof obj.totals === 'object') {
      accumulateEntry(obj.totals, acc)
    } else {
      let found = false
      for (const key of ['daily', 'session', 'sessions', 'data', 'entries', 'blocks']) {
        const v = obj[key]
        if (Array.isArray(v)) {
          v.forEach((e) => accumulateEntry(e, acc))
          found = true; break
        }
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          Object.values(v).forEach((e) => accumulateEntry(e, acc))
          found = true; break
        }
      }
      if (!found) accumulateEntry(d, acc)
    }
  }

  return {
    pillars: { input: acc.input, output: acc.output, cacheCreate: acc.cacheCreate, cacheRead: acc.cacheRead },
    costUsd: acc.cost > 0 ? acc.cost : null,
  }
}

// ---------------------------------------------------------------------------
// Codex parser — mirrors parse_codex_submission() + helpers in ingest.py
// ---------------------------------------------------------------------------

function extractCodexTotals(d: unknown): {
  input: number; cached: number; output: number; reasoning: number; cost: number
} {
  const acc = { input: 0, cached: 0, output: 0, reasoning: 0, cost: 0 }

  function addEntry(e: unknown): void {
    if (!e || typeof e !== 'object') return
    const obj = e as Record<string, unknown>
    acc.input     += safeInt(obj.input_tokens     ?? obj.inputTokens    ?? 0)
    acc.cached    += safeInt(obj.cached_input_tokens ?? obj.cachedInputTokens ?? 0)
    acc.output    += safeInt(obj.output_tokens    ?? obj.outputTokens   ?? 0)
    acc.reasoning += safeInt(obj.reasoning_output_tokens ?? obj.reasoningOutputTokens ?? 0)
    acc.cost      += Number(obj.costUSD ?? obj.cost ?? 0) || 0
  }

  if (Array.isArray(d)) {
    d.forEach(addEntry)
  } else if (d && typeof d === 'object') {
    const obj = d as Record<string, unknown>
    for (const key of ['totals', 'daily', 'session', 'sessions', 'data', 'entries', 'events']) {
      const v = obj[key]
      if (key === 'totals' && v && typeof v === 'object' && !Array.isArray(v)) {
        addEntry(v); return acc
      }
      if (Array.isArray(v)) { v.forEach(addEntry); return acc }
      if (v && typeof v === 'object') { Object.values(v).forEach(addEntry); return acc }
    }
    addEntry(d)
  }
  return acc
}

/**
 * Estimate Codex high-signal user input from output.
 * Single source of truth — mirrors _codex_input_estimate() in ingest.py.
 *
 * Beta  (operator has verified Claude io_ratio): est = output × io_ratio
 * Alpha (no profile):                            est = output × 2.0
 */
function codexInputEstimate(
  rawOut: number,
  profile?: OperatorProfile,
): { estInput: number; parsingMode: string } {
  if (profile?.modelType === 'claude' && profile.ioRatio) {
    const r = profile.ioRatio
    return {
      estInput: Math.floor(rawOut * r),
      parsingMode: `Claude operating-ratio ${r.toFixed(3)}:1 (input:output)`,
    }
  }
  return {
    estInput: Math.floor(rawOut * 2.0),
    parsingMode: 'AA 2:1 baseline (wild-corpus backed)',
  }
}

function parseCodexSubmission(
  d: unknown,
  profile?: OperatorProfile,
): IngestResult {
  const tot = extractCodexTotals(d)
  const rawOut   = tot.output + tot.reasoning
  const rawIn    = tot.input
  const rawCache = tot.cached
  const costUsd  = tot.cost > 0 ? tot.cost : null

  const { estInput, parsingMode } = codexInputEstimate(rawOut, profile)
  const contextDebt = Math.max(0, rawIn - estInput)

  const meta: IngestMeta = {
    source: 'codex',
    estimated: true,
    caveat: `* ${parsingMode}`,
    parsingMode,
    costUsd,
  }
  return {
    pillars: { input: estInput, output: rawOut, cacheCreate: contextDebt, cacheRead: rawCache },
    meta,
  }
}

// ---------------------------------------------------------------------------
// Named-field extractor — mirrors _extract_by_name() in ingest.py
// ---------------------------------------------------------------------------

function grabField(text: string, aliases: readonly string[]): number {
  for (const alias of aliases) {
    const m = text.match(new RegExp(`"${alias}"\\s*:\\s*([\\d,.]+)`))
    if (m) return Math.floor(parseFloat(m[1].replace(/,/g, '')))
  }
  return 0
}

function extractByName(
  text: string,
  profile?: OperatorProfile,
): IngestResult | null {
  const i  = grabField(text, ALIASES.input)
  const o  = grabField(text, ALIASES.output)
  const cw = grabField(text, ALIASES.cacheCreate)
  const cr = grabField(text, ALIASES.cacheRead)

  let costUsd: number | null = null
  for (const alias of ALIASES.cost) {
    const m = text.match(new RegExp(`"${alias}"\\s*:\\s*([\\d,.]+)`))
    if (m) {
      const v = parseFloat(m[1].replace(/,/g, ''))
      if (v > 0) { costUsd = v; break }
    }
  }

  const reasoning = grabField(text, ALIASES.reasoning)
  const totalO = o + reasoning

  if (i + totalO + cw + cr === 0) return null

  // Check if this looks like a Codex payload
  const hasCodexFields = [...CODEX_KEYS].some((k) => text.includes(k))

  if (hasCodexFields) {
    const rawOut = totalO
    const { estInput, parsingMode } = codexInputEstimate(rawOut, profile)
    const contextDebt = Math.max(0, i - estInput)
    return {
      pillars: { input: estInput, output: rawOut, cacheCreate: contextDebt, cacheRead: cr },
      meta: { source: 'codex', estimated: true, caveat: `* ${parsingMode}`, parsingMode, costUsd },
    }
  }

  return {
    pillars: { input: i, output: totalO, cacheCreate: cw, cacheRead: cr },
    meta: { source: 'ccusage', estimated: false, caveat: null, parsingMode: null, costUsd },
  }
}

// ---------------------------------------------------------------------------
// Four-number extractor — mirrors parse_four() in ingest.py
// ---------------------------------------------------------------------------

function parseFourNumbers(text: string): RawPillars | null {
  const nums = [...text.replace(/,/g, '').matchAll(/[\d.]+/g)]
    .map((m) => Math.floor(parseFloat(m[0])))
    .filter((n) => Number.isFinite(n))
  if (nums.length < 4) return null
  // Accept "input output cacheCreate cacheRead [total]" — a 5th number is the
  // (redundant) total and is ignored for the cascade. We don't need it; the 4
  // pillars are the spine. Extra numbers beyond 4 are tolerated, not required.
  return { input: nums[0], output: nums[1], cacheCreate: nums[2], cacheRead: nums[3] }
}

/**
 * Sanity-check a provided total against the sum of the 4 pillars. Returns a
 * caveat string when they disagree by >1% (likely wrong-order or wrong-field
 * paste), else null. Advisory only — never blocks ingest.
 */
export function totalMismatchCaveat(p: RawPillars, providedTotal: number | null): string | null {
  if (!providedTotal || providedTotal <= 0) return null
  const sum = p.input + p.output + p.cacheCreate + p.cacheRead
  if (sum <= 0) return null
  const drift = Math.abs(sum - providedTotal) / providedTotal
  return drift > 0.01
    ? `Provided total (${providedTotal.toLocaleString()}) ≠ sum of pillars (${sum.toLocaleString()}) — check field order.`
    : null
}

// ---------------------------------------------------------------------------
// Main entry point — mirrors ingest_meta() in ingest.py
// ---------------------------------------------------------------------------

/**
 * ingestMeta — parse any supported ccusage/Codex/manual input into four token
 * pillars and metadata. Mirrors moses-sigrank/ingest.py `ingest_meta()`.
 *
 * Throws a descriptive error if parsing fails at all three strategies.
 */
export function ingestMeta(
  text: string,
  profile?: OperatorProfile,
): IngestResult {
  let t = text.trim()
  if (!t) throw new Error('The sequence input buffer is empty.')

  // Strip markdown code block wrappers
  if (t.startsWith('```')) {
    t = t.replace(/^```[a-z]*\n/i, '').replace(/\n```$/, '').trim()
  }

  // Find the first JSON-like start character (handles leading prose)
  const jsonStartMatch = t.match(/[{["']/)
  const candidate = jsonStartMatch ? t.slice(t.indexOf(jsonStartMatch[0])) : null
  const fixed = (candidate ? tryFixJson(candidate) : null) ?? (t[0] in ['{', '[', '"'] ? tryFixJson(t) : null)

  // Strategy 1: JSON (ccusage or Codex)
  if (fixed) {
    try {
      const d = JSON.parse(fixed)
      if (isCodexShape(d)) return parseCodexSubmission(d, profile)
      const { pillars, costUsd } = parseCcusage(d)
      return {
        pillars,
        meta: { source: 'ccusage', estimated: false, caveat: null, parsingMode: null, costUsd },
      }
    } catch { /* fall through */ }
  }

  // Strategy 2: Named fields in plain text
  if (hasNamedFields(t)) {
    const result = extractByName(t, profile)
    if (result) return result
  }

  // Strategy 3: Four bare numbers
  const pillars = parseFourNumbers(t)
  if (pillars) {
    return {
      pillars,
      meta: { source: 'manual', estimated: false, caveat: null, parsingMode: null, costUsd: null },
    }
  }

  throw new Error(
    'Telemetry format unrecognized. Paste ccusage --json output, Codex JSON, or four numbers: input output cache_create cache_read',
  )
}
