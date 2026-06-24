/**
 * lib/audit/provider.ts — AuditProvider contract for Pro / precision metrics.
 *
 * Pro-only and not-yet-finalized metrics (M.02 exact Prompt Complexity,
 * C.02 SDOT, C.03 SDRM, E.02 Drift Ratio, and any extra Pro metrics) are NEVER
 * computed inline in the web app — every such read goes through an AuditProvider
 * so the real precision-tier engine (sig_army) can be wired in later without
 * touching feature code. This is a leaf "stub-now, finalize-later" seam.
 */

import { MockAuditProvider } from '@/lib/audit/mock'

/** A single Pro metric read result. `finalized:false` => still a placeholder. */
export interface ProMetricResult {
  /** The metric value, or null when not yet computed for this operator. */
  value: number | null
  /** True only when a real precision-tier engine has finalized this value. */
  finalized: boolean
}

/**
 * AuditProvider — the seam for all Pro / precision metric reads. The mock
 * implementation returns deterministic placeholders; a real provider (wired by
 * getAuditProvider) replaces it once sig_army is online.
 */
export interface AuditProvider {
  /** E.02 Drift Ratio, [0,100] — precision tier only. Null when uncomputed. */
  getDriftRatio(operatorId: string): Promise<number | null>
  /** M.01 refined (precision) compression ratio, [0,1]. Null when uncomputed. */
  getRefinedCompression(operatorId: string): Promise<number | null>
  /** M.02 exact Prompt Complexity (confidence always 'exact'). Null when uncomputed. */
  getExactPromptComplexity(
    operatorId: string,
  ): Promise<{ value: number; confidence: 'exact' } | null>
  /**
   * Generic Pro metric read by key — the extension point for not-yet-finalized
   * Pro metrics that have no dedicated method yet. Returns a finalized flag so
   * the UI can render a "Coming to Pro · not finalized" slot.
   */
  getProMetric(key: string, operatorId: string): Promise<ProMetricResult>
}

/**
 * Holder for an injected real provider. Left null until a real precision-tier
 * provider is wired (e.g. via a server bootstrap). Kept module-local so the
 * factory can swap implementations without callers changing.
 */
let injected: AuditProvider | null = null

/** Wire a real AuditProvider (called once at server bootstrap when available). */
export function setAuditProvider(provider: AuditProvider | null): void {
  injected = provider
}

/**
 * getAuditProvider — returns the active provider. Falls back to the deterministic
 * MockAuditProvider until a real one is injected via setAuditProvider().
 *
 * The mock import is type-only-cycle-safe: lib/audit/mock.ts imports ONLY types
 * from this module (`import type`), so there is no runtime initialization cycle.
 */
export function getAuditProvider(): AuditProvider {
  if (injected) return injected
  return new MockAuditProvider()
}
