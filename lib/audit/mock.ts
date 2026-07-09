/**
 * lib/audit/mock.ts — deterministic MockAuditProvider.
 *
 * Stand-in for the precision-tier (sig_army) audit engine until it is wired in.
 * Every value is derived deterministically from the operatorId — no RNG, no
 * wall-clock — so builds and snapshots are reproducible. Every getProMetric()
 * read returns { finalized:false } so the UI renders the placeholder treatment.
 *
 * TODO(NOT_FINALIZED:E.02) OPERATOR_OVERRIDE — Drift Ratio placeholder.
 * TODO(NOT_FINALIZED:M.02) OPERATOR_OVERRIDE — exact Prompt Complexity placeholder.
 * TODO(NOT_FINALIZED:M.01) OPERATOR_OVERRIDE — refined Compression placeholder.
 * TODO(NOT_FINALIZED:PRO.*) OPERATOR_OVERRIDE — generic Pro metric placeholders.
 */

import type { AuditProvider, ProMetricResult } from "@/lib/audit/provider";
// NOTE: this MUST stay `import type` — a runtime import would create an
// initialization cycle with provider.ts (which value-imports MockAuditProvider).

/** Deterministic, stable 32-bit hash of a string (FNV-1a style). */
function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Force unsigned.
  return h >>> 0;
}

/** Map a hash into [min, max] with `decimals` precision — fully deterministic. */
function span(seed: number, min: number, max: number, decimals = 2): number {
  const unit = (seed % 10_000) / 10_000; // [0,1)
  const value = min + unit * (max - min);
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export class MockAuditProvider implements AuditProvider {
  async getDriftRatio(operatorId: string): Promise<number | null> {
    // TODO(NOT_FINALIZED:E.02) OPERATOR_OVERRIDE — deterministic placeholder.
    return span(hash(`drift:${operatorId}`), 70, 99, 1);
  }

  async getRefinedCompression(operatorId: string): Promise<number | null> {
    // TODO(NOT_FINALIZED:M.01) OPERATOR_OVERRIDE — deterministic placeholder.
    return span(hash(`comp:${operatorId}`), 0.6, 0.97, 4);
  }

  async getExactPromptComplexity(
    operatorId: string,
  ): Promise<{ value: number; confidence: "exact" } | null> {
    // TODO(NOT_FINALIZED:M.02) OPERATOR_OVERRIDE — deterministic placeholder.
    return {
      value: span(hash(`pc:${operatorId}`), 40, 98, 0),
      confidence: "exact",
    };
  }

  async getProMetric(
    key: string,
    operatorId: string,
  ): Promise<ProMetricResult> {
    // TODO(NOT_FINALIZED:PRO.*) OPERATOR_OVERRIDE — every generic Pro metric is a
    // placeholder until the precision engine finalizes it; finalized stays false.
    return {
      value: span(hash(`${key}:${operatorId}`), 0, 100, 1),
      finalized: false,
    };
  }
}
