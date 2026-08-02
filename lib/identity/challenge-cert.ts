import "server-only";

/**
 * lib/identity/challenge-cert.ts — SERVER-ONLY challenge certificate verification.
 *
 * The challenge scoring layer must NOT trust client-supplied pillar scores for
 * ranking (F1 security fix). Instead, a scoring worker (or signal-Areana service)
 * signs a certificate containing the authoritative scores with an ed25519 key.
 * The server verifies the signature before accepting the composite.
 *
 * Trust model mirrors /api/v1/snapshots (lib/ingest/signature.ts):
 *   - canonical JSON = sorted keys (recursive), compact separators (",",":")
 *   - signature = base64 of the 64-byte ed25519 signature over canonical bytes
 *   - public key = "ed25519:<base64>" of the scoring worker's verify key
 *
 * The scoring worker's public key is set via SCORING_WORKER_PUBKEY env var.
 * If not set, ALL certificates are rejected (scoring worker not configured).
 */

import { verifySignature } from "@/lib/ingest/signature";

/** The shape of a signed challenge scoring certificate. */
export interface ChallengeScoreCert {
  challenge_id: string;
  operator_id: string;
  scores: {
    density: number;
    clarity: number;
    fidelity: number;
    brevity: number;
    impact: number;
  };
  composite: number;
  engine: string;
  timestamp: string;
  signature: string;
}

/** Fields that are stripped before canonicalization (not part of the signed payload). */
const SIGNATURE_FIELD = "signature";

/**
 * Verify a challenge scoring certificate's ed25519 signature.
 *
 * @param cert  The parsed certificate JSON from the request body.
 * @param pubkey  The scoring worker's public key ("ed25519:<base64>").
 * @returns true if the signature is valid, false otherwise.
 */
export function verifyChallengeCert(
  cert: Record<string, unknown>,
  pubkey: string,
): boolean {
  const signature = typeof cert[SIGNATURE_FIELD] === "string"
    ? (cert[SIGNATURE_FIELD] as string)
    : null;
  if (!signature) return false;

  // Strip the signature field before canonicalization
  const payload: Record<string, unknown> = { ...cert };
  delete payload[SIGNATURE_FIELD];

  return verifySignature(payload, signature, pubkey);
}

/**
 * Extract + verify a challenge score certificate from a request body's
 * `certificate_json` field. Returns the verified cert (with typed scores)
 * or null if no cert / invalid cert / no scoring key configured.
 *
 * @param certJson  The raw certificate_json value from the request body.
 * @returns The verified certificate, or null if not verified.
 */
export function extractVerifiedCert(
  certJson: unknown,
): ChallengeScoreCert | null {
  if (!certJson || typeof certJson !== "object") return null;

  const pubkey = process.env.SCORING_WORKER_PUBKEY;
  if (!pubkey) {
    // No scoring worker configured — cannot verify any cert.
    return null;
  }

  const cert = certJson as Record<string, unknown>;
  if (!verifyChallengeCert(cert, pubkey)) return null;

  // Validate the cert has the required fields with correct types
  const scores = cert.scores as Record<string, unknown> | undefined;
  if (!scores || typeof scores !== "object") return null;

  const density = Number(scores.density);
  const clarity = Number(scores.clarity);
  const fidelity = Number(scores.fidelity);
  const brevity = Number(scores.brevity);
  const impact = Number(scores.impact);
  const composite = Number(cert.composite);
  const engine = typeof cert.engine === "string" ? cert.engine : "claude";
  const timestamp = typeof cert.timestamp === "string" ? cert.timestamp : "";
  const challengeId = typeof cert.challenge_id === "string" ? cert.challenge_id : "";
  const operatorId = typeof cert.operator_id === "string" ? cert.operator_id : "";

  // Range validation (secondary guard — primary is the signature)
  if ([density, clarity, fidelity, brevity, impact].some((v) => Number.isNaN(v) || v < 0 || v > 100)) {
    return null;
  }
  if (Number.isNaN(composite) || composite < 0 || composite > 100) {
    return null;
  }

  return {
    challenge_id: challengeId,
    operator_id: operatorId,
    scores: { density, clarity, fidelity, brevity, impact },
    composite,
    engine,
    timestamp,
    signature: cert.signature as string,
  };
}
