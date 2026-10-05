/**
 * exchange-gateway/src/signal-revision.ts — Signal revision canonicalization + hashing.
 *
 * Spec §3.3: Published terms are revision-bound. An attempt must bind to the
 * exact signal revision encountered by the agent. Material changes require a
 * new immutable revision.
 *
 * Spec §6.3: Material edits to a published signal create a new revision.
 * They do not overwrite the published revision.
 */

import { createHash } from "node:crypto";
import type { ExchangeSignalInput } from "./signal-schema";

/**
 * Canonicalize a signal document for hashing.
 *
 * The canonical form is a JSON string with:
 * - sorted object keys (top-level and nested)
 * - no whitespace between tokens
 * - UTF-8 encoding
 *
 * This ensures that the same signal content always produces the same hash,
 * regardless of key ordering or whitespace in the input.
 */
export function canonicalizeSignal(signal: ExchangeSignalInput & { signal_id: string; revision: number }): string {
  return JSON.stringify(sortKeysDeep(signal));
}

/**
 * Compute the revision hash for a signal document.
 *
 * The hash covers the complete canonical signal content (excluding the
 * hash itself and the canonical_url, which are derived from the content).
 */
export function computeRevisionHash(signal: ExchangeSignalInput & { signal_id: string; revision: number }): string {
  // Exclude revision_hash and canonical_url from the hash input — they are
  // derived from the content, not part of it.
  const { revision_hash: _rh, canonical_url: _cu, ...content } = signal as any;
  const canonical = canonicalizeSignal(content);
  return `sha256:${createHash("sha256").update(canonical).digest("hex")}`;
}

/**
 * Generate a new signal ID using ULID-like format (timestamp + random).
 */
export function generateSignalId(): string {
  const timestamp = Date.now().toString(36).toUpperCase().padStart(10, "0");
  const random = Math.random().toString(36).substring(2, 14).toUpperCase().padStart(8, "0");
  return `sig_${timestamp}${random}`;
}

/**
 * Generate a new attempt ID.
 */
export function generateAttemptId(): string {
  const timestamp = Date.now().toString(36).toUpperCase().padStart(10, "0");
  const random = Math.random().toString(36).substring(2, 14).toUpperCase().padStart(8, "0");
  return `att_${timestamp}${random}`;
}

/**
 * Generate a new verification ID.
 */
export function generateVerificationId(): string {
  const timestamp = Date.now().toString(36).toUpperCase().padStart(10, "0");
  const random = Math.random().toString(36).substring(2, 14).toUpperCase().padStart(8, "0");
  return `ver_${timestamp}${random}`;
}

/**
 * Generate a new qualification ID.
 */
export function generateQualificationId(): string {
  const timestamp = Date.now().toString(36).toUpperCase().padStart(10, "0");
  const random = Math.random().toString(36).substring(2, 14).toUpperCase().padStart(8, "0");
  return `qual_${timestamp}${random}`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sortKeysDeep<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortKeysDeep) as T;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
    sorted[key] = sortKeysDeep((obj as Record<string, unknown>)[key]);
  }
  return sorted as T;
}
