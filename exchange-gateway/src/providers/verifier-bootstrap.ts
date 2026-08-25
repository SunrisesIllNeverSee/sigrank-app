import { createHmacVerifier, registerVerifier, hasVerifier } from './callback-verifier'
import type { HmacCredential } from './callback-verifier'

// ─── Verifier Bootstrap ───
//
// Wires HMAC callback verifiers from environment variables so external
// provider callbacks can be cryptographically authenticated at runtime.
//
// Credential env format (per provider, per environment):
//
//   EXECUTION_PROVIDER_<PROVIDER_ID_UPPER>_CREDENTIALS
//
// Value is a semicolon-separated list of `keyId:secret` pairs. The first
// pair is the current credential; subsequent pairs are previous keys kept
// alive during rotation. Example:
//
//   EXECUTION_PROVIDER_TEST_PROVIDER_CREDENTIALS="e2e_key:e2e_secret;old_key:old_secret"
//
// A provider with no env credentials simply has no registered verifier,
// and its callbacks are rejected at the receipt route (fail closed).
//
// This module is idempotent: calling it more than once will not double-
// register a verifier for the same provider.

let bootstrapped = false

/**
 * Register HMAC verifiers for every provider that has credentials in env.
 * Safe to call at module load and from route handlers. Subsequent calls
 * are no-ops once the initial bootstrap has run.
 */
export function bootstrapVerifiers(providerIds?: string[]): void {
  if (bootstrapped) return

  // Default provider list comes from env or a known set. Callers may pass
  // an explicit list (e.g. the test provider id) to register additional
  // verifiers not present in env.
  const fromEnv = (process.env.EXECUTION_PROVIDER_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const ids = new Set<string>([...fromEnv, ...(providerIds ?? [])])

  for (const providerId of ids) {
    if (hasVerifier(providerId)) continue
    const credentials = loadCredentials(providerId)
    if (credentials.length === 0) continue
    registerVerifier(createHmacVerifier(providerId, credentials))
  }

  bootstrapped = true
}

/**
 * Load HMAC credentials for a provider from env. Returns an empty array
 * if no credentials are configured (caller should skip registration).
 */
function loadCredentials(providerId: string): HmacCredential[] {
  const envKey = `EXECUTION_PROVIDER_${providerId.toUpperCase()}_CREDENTIALS`
  const raw = process.env[envKey]
  if (!raw) return []

  const credentials: HmacCredential[] = []
  for (const pair of raw.split(';')) {
    const trimmed = pair.trim()
    if (!trimmed) continue
    const colon = trimmed.indexOf(':')
    if (colon <= 0) continue // malformed — skip
    const keyId = trimmed.slice(0, colon).trim()
    const secret = trimmed.slice(colon + 1).trim()
    if (!keyId || !secret) continue
    credentials.push({ keyId, secret })
  }
  return credentials
}

/**
 * Register a single provider's verifier programmatically (used by tests
 * and the runtime test provider harness). Bypasses env loading.
 */
export function registerProviderVerifier(
  providerId: string,
  credentials: HmacCredential[],
): void {
  if (hasVerifier(providerId)) return
  registerVerifier(createHmacVerifier(providerId, credentials))
}

/**
 * Reset the bootstrap flag. Test-only — lets the test suite re-run
 * bootstrap after mutating env. Not exported on the public surface
 * outside of tests.
 */
export function _resetVerifierBootstrapForTests(): void {
  bootstrapped = false
}
