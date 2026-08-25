import { createHmac, timingSafeEqual } from 'node:crypto'

// ─── Provider Callback Authentication ───
//
// External provider callbacks must be cryptographically authenticated
// before they can update execution state. The verifier abstraction
// keeps provider-specific signature formats behind the interface so
// canonical execution types stay clean.
//
// HMAC-SHA-256 is the temporary minimum for providers without a native
// asymmetric webhook-signature scheme.

export interface VerifiedProviderEvent {
  providerId: string
  providerEventId: string
  timestamp: Date
  nonce?: string
  payloadHash: string
}

export interface ProviderCallbackVerifier {
  providerId: string
  verify(input: {
    rawBody: Uint8Array
    headers: Headers
    receivedAt: Date
  }): Promise<VerifiedProviderEvent>
}

// ─── HMAC-SHA-256 Verifier ───

export interface HmacCredential {
  keyId: string
  secret: string
}

const TIMESTAMP_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Compute the HMAC-SHA-256 signature over the exact raw body.
 *
 * The signed material is:
 *   provider_event_id.timestamp.rawBody
 *
 * This binds the event ID, timestamp, and body together so that
 * replaying the same signature with a different body, event ID,
 * or timestamp fails.
 */
function computeSignature(secret: string, providerEventId: string, timestamp: string, rawBody: Uint8Array): Buffer {
  const signedMaterial = Buffer.concat([
    Buffer.from(`${providerEventId}.${timestamp}.`, 'utf8'),
    Buffer.from(rawBody),
  ])
  return createHmac('sha256', secret).update(signedMaterial).digest()
}

/**
 * Constant-time comparison of two buffers.
 * Returns true if they are equal in length and content.
 */
function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * Parse a signature header in the format:
 *   t=<unix_ms>,v1=<hex_sig>,key_id=<keyId>
 */
function parseSignatureHeader(header: string | null): {
  timestamp: string | null
  signature: string | null
  keyId: string | null
} {
  if (!header) return { timestamp: null, signature: null, keyId: null }
  const parts = header.split(',')
  const map: Record<string, string> = {}
  for (const part of parts) {
    const eq = part.indexOf('=')
    if (eq > 0) map[part.slice(0, eq).trim()] = part.slice(eq + 1).trim()
  }
  return {
    timestamp: map['t'] ?? null,
    signature: map['v1'] ?? null,
    keyId: map['key_id'] ?? null,
  }
}

/**
 * Create an HMAC-SHA-256 callback verifier for a specific provider.
 *
 * Credentials are scoped to one provider and one environment.
 * Supports key rotation by accepting both current and previous credentials.
 */
export function createHmacVerifier(
  providerId: string,
  credentials: HmacCredential[],
): ProviderCallbackVerifier {
  if (credentials.length === 0) {
    throw new Error(`HMAC verifier for provider '${providerId}' requires at least one credential`)
  }

  return {
    providerId,

    async verify(input: {
      rawBody: Uint8Array
      headers: Headers
      receivedAt: Date
    }): Promise<VerifiedProviderEvent> {
      const { rawBody, headers, receivedAt } = input

      const sigHeader = headers.get('x-provider-signature')
      const { timestamp, signature, keyId } = parseSignatureHeader(sigHeader)

      if (!timestamp || !signature || !keyId) {
        throw new VerificationError('missing_signature', 'Signature header is missing or malformed')
      }

      // Find the credential by key ID
      const credential = credentials.find((c) => c.keyId === keyId)
      if (!credential) {
        throw new VerificationError('unknown_key', `Unknown key ID: ${keyId}`)
      }

      // Check timestamp window
      const eventTime = new Date(Number(timestamp))
      if (isNaN(eventTime.getTime())) {
        throw new VerificationError('invalid_timestamp', 'Timestamp is not a valid number')
      }
      const ageMs = Math.abs(receivedAt.getTime() - eventTime.getTime())
      if (ageMs > TIMESTAMP_WINDOW_MS) {
        throw new VerificationError('expired', `Callback timestamp is outside the ${TIMESTAMP_WINDOW_MS}ms window`)
      }

      // Get provider event ID from header
      const providerEventId = headers.get('x-provider-event-id')
      if (!providerEventId) {
        throw new VerificationError('missing_event_id', 'Provider event ID header is missing')
      }

      // Compute expected signature over exact raw body
      const expectedSig = computeSignature(credential.secret, providerEventId, timestamp, rawBody)
      const providedSig = Buffer.from(signature, 'hex')

      if (!safeEqual(expectedSig, providedSig)) {
        throw new VerificationError('invalid_signature', 'Signature does not match the raw body')
      }

      // Get optional nonce
      const nonce = headers.get('x-provider-nonce') ?? undefined

      // Compute payload hash for idempotency
      const payloadHash = createHashSha256(rawBody)

      return {
        providerId,
        providerEventId,
        timestamp: eventTime,
        nonce,
        payloadHash,
      }
    },
  }
}

/**
 * Custom error class for verification failures.
 * Contains a safe code that can be logged without exposing secrets.
 */
export class VerificationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'VerificationError'
  }
}

/**
 * Compute SHA-256 hash of a buffer, return hex string.
 */
function createHashSha256(data: Uint8Array): string {
  const { createHash } = require('node:crypto')
  return createHash('sha256').update(Buffer.from(data)).digest('hex')
}

// ─── Verifier Registry ───

const verifiers = new Map<string, ProviderCallbackVerifier>()

/**
 * Register a callback verifier for a provider.
 */
export function registerVerifier(verifier: ProviderCallbackVerifier): void {
  verifiers.set(verifier.providerId, verifier)
}

/**
 * Get a registered verifier by provider ID.
 */
export function getVerifier(providerId: string): ProviderCallbackVerifier | undefined {
  return verifiers.get(providerId)
}

/**
 * Check if a verifier is registered for a provider.
 */
export function hasVerifier(providerId: string): boolean {
  return verifiers.has(providerId)
}
