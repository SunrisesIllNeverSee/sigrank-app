/**
 * lib/ingest/index.ts — public surface of the ingest pipeline.
 *
 * Usage:
 *   import { ingestMeta, pillarsToCore5, computeCascadeMetrics } from '@/lib/ingest'
 */

export { ingestMeta } from './parse'
export { pillarsToCore5, computeCascadeMetrics } from './bridge'
export type {
  RawPillars,
  IngestMeta,
  IngestResult,
  IngestSource,
  OperatorProfile,
} from './types'
export type { BridgeInput, BridgeResult, CascadeMetrics } from './bridge'
