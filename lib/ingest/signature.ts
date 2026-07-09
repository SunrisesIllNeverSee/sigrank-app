import "server-only";

/**
 * lib/ingest/signature.ts — SERVER-ONLY canonicalization + ed25519 verification.
 *
 * The signature gate for /api/v1/snapshots. Byte-compatible with the local agent's
 * signer (Devins_Plans/sigrank-agent/src/sigrank/snapshots/canonicalize.py +
 * publish/signing.py):
 *   - canonical JSON = sorted keys (recursive), compact separators (",",":"),
 *     UTF-8, with the derived `agent.signature` + `agent.snapshot_hash` stripped.
 *   - snapshot_hash = "sha256:" + hex(sha256(canonical_bytes)).
 *   - public key = "ed25519:<base64>" of the 32 raw verify-key bytes (PyNaCl).
 *   - signature = base64 of the 64-byte ed25519 signature over canonical_bytes.
 *
 * CAVEAT (cross-language canonicalization): Python `json.dumps` and JS
 * `JSON.stringify` agree byte-for-byte on integers (all of raw_telemetry is int),
 * but float formatting CAN differ (e.g. compression_ratio). Treat a hash/signature
 * MISMATCH as a FLAG to investigate, not hard proof of tampering, until validated
 * against a real signed sample. A PASS (match) is decisive; a mismatch is a signal.
 */

import {
  createHash,
  createPublicKey,
  verify as edVerify,
  type KeyObject,
} from "node:crypto";
import { canonicalJson, canonicalBytes } from "./canonical.mjs";

// canonicalJson + canonicalBytes live in ./canonical.mjs (pure, no 'server-only') as the
// SINGLE SOURCE OF TRUTH, so the canon-parity gate (__tests__/ingest/canon_parity.test.mjs)
// imports the exact bytes the server verifies against. Re-exported here so existing server
// consumers (gates.ts etc.) keep importing the canon helpers from signature.ts.
export { canonicalJson, canonicalBytes };

/** Server-recomputed snapshot hash ("sha256:<hex>") over the canonical bytes. */
export function snapshotHash(payload: Record<string, unknown>): string {
  return `sha256:${createHash("sha256").update(canonicalBytes(payload)).digest("hex")}`;
}

/** SPKI DER prefix for a raw 32-byte ed25519 public key. */
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/** Build a node KeyObject from an "ed25519:<base64>" (or bare base64) public key. */
function publicKeyFromAgent(pk: string): KeyObject | null {
  try {
    const body = pk.startsWith("ed25519:") ? pk.slice("ed25519:".length) : pk;
    const raw = Buffer.from(body, "base64");
    if (raw.length !== 32) return null;
    return createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, raw]),
      format: "der",
      type: "spki",
    });
  } catch {
    return null;
  }
}

/** True when `pk` parses as a valid 32-byte ed25519 public key ("ed25519:<base64>"
 *  or bare base64). Used by the enroll endpoint to reject a malformed device key. */
export function isValidAgentPublicKey(pk: string): boolean {
  return publicKeyFromAgent(pk) !== null;
}

/**
 * Verify a base64 ed25519 signature over the payload's canonical bytes against the
 * agent's "ed25519:<base64>" public key. Returns false on any malformation
 * (never throws) so the caller can map it to a clean reject.
 */
export function verifySignature(
  payload: Record<string, unknown>,
  signatureB64: string,
  publicKey: string,
): boolean {
  const key = publicKeyFromAgent(publicKey);
  if (!key) return false;
  try {
    return edVerify(
      null,
      canonicalBytes(payload),
      key,
      Buffer.from(signatureB64, "base64"),
    );
  } catch {
    return false;
  }
}
