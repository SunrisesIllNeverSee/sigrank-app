/**
 * lib/ingest/types.ts — raw telemetry contracts for the ingest pipeline.
 *
 * Mirrors the four-pillar model in moses-sigrank/ingest.py:
 *   i  = fresh input tokens (non-cached)
 *   o  = output tokens (includes reasoning)
 *   cw = cache_create tokens
 *   cr = cache_read tokens
 *
 * Source tag tells downstream callers whether Codex estimation was used.
 */

/** The four token pillars extracted from any supported input format. */
export interface RawPillars {
  /** Fresh input tokens (non-cached). */
  input: number
  /** Output tokens (reasoning included). */
  output: number
  /** Cache creation tokens. */
  cacheCreate: number
  /** Cache read tokens. */
  cacheRead: number
}

/** Source of the parsed data and whether estimation was applied. */
export type IngestSource = 'ccusage' | 'codex' | 'manual'

/** Metadata returned alongside the raw pillars. */
export interface IngestMeta {
  source: IngestSource
  /** True if any values were estimated (Codex pathway). */
  estimated: boolean
  /** Human-readable caveat to display if estimated is true. */
  caveat: string | null
  /** Parsing mode description (Codex: which pathway was used). */
  parsingMode: string | null
  /** Real cost in USD if provided by ccusage, null otherwise. */
  costUsd: number | null
}

/** Full result of ingestMeta(). */
export interface IngestResult {
  pillars: RawPillars
  meta: IngestMeta
}

/**
 * Optional operator profile for Codex Beta pathway.
 * When present with model_type='claude', the Codex parser uses the operator's
 * own Claude io_ratio instead of the AA 2:1 baseline.
 */
export interface OperatorProfile {
  modelType: 'claude' | 'other'
  /** claude_input / claude_output ratio from verified Claude sessions. */
  ioRatio?: number
}
