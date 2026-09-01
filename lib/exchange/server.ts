import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import type { ExchangeState } from '@/exchange-gateway/src/types'
import { captureServer } from '@/lib/infra/posthog/server'

/**
 * Length-safe constant-time string comparison.
 *
 * Compares two strings by hashing both to a fixed-length digest first,
 * then using `timingSafeEqual` on the digests. This avoids the early-exit
 * timing leak that `===` introduces on length mismatch, and avoids the
 * `timingSafeEqual` requirement that both Buffer inputs have the same byte
 * length (the hash normalizes them).
 *
 * Returns true iff the strings are byte-identical.
 */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

export function getExchangeAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Exchange gateway requires server-side Supabase credentials')
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export function normalizeDomain(input: string): string {
  return input.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase()
}

export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}

export function newSecret(prefix = 'cx'): string {
  return `${prefix}_${randomBytes(24).toString('base64url')}`
}

export function newPublicId(): string {
  return `CX-${new Date().getUTCFullYear()}-${randomBytes(4).toString('hex').toUpperCase()}`
}

export function newReferralCode(): string {
  return `AG-${randomBytes(4).toString('hex').toUpperCase()}`
}

export function requestIdentity(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || req.headers.get('x-real-ip') || 'unknown'
}

/**
 * Derive the actor identity from the validated credential, NOT from a
 * caller-supplied header. The x-exchange-actor-id header is treated as
 * metadata at most — it must NOT be used as the actor identity for
 * authorization decisions. Anyone can set that header to any value.
 *
 * If no valid credential is present, the actor falls back to the IP-based
 * anonymous identity (used for anonymous-attempt signals).
 *
 * This is the SSRF/IDOR boundary for attempt ownership: using the raw
 * header would allow any caller to impersonate any actor and read/submit/
 * withdraw their attempts.
 */
export function resolveActorId(req: NextRequest, validatedKey: string | null): string {
  const ip = requestIdentity(req)
  if (!validatedKey) return `anonymous:${ip}`
  return `actor:${hashSecret(validatedKey).slice(0, 16)}`
}

export function ipHash(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

export async function findCompany(domain: string) {
  const admin = getExchangeAdmin()
  const { data, error } = await admin.from('exchange_companies').select('*').eq('domain', normalizeDomain(domain)).maybeSingle()
  if (error) throw error
  return data
}

export async function authenticateCompany(domain: string, key: string | null): Promise<boolean> {
  if (!key) return false
  const normalized = normalizeDomain(domain)
  const referenceKey = process.env.EXCHANGE_REFERENCE_ADMIN_KEY
  if (normalized === normalizeDomain(process.env.EXCHANGE_REFERENCE_DOMAIN ?? 'signalaf.com') && referenceKey && safeEqual(key, referenceKey)) return true
  const company = await findCompany(normalized)
  return !!company?.admin_key_hash && safeEqual(hashSecret(key), company.admin_key_hash)
}

export async function authenticateDomainAgent(domain: string, key: string | null): Promise<boolean> {
  if (!key) return false
  const company = await findCompany(domain)
  return !!company?.domain_agent_key_hash && safeEqual(hashSecret(key), company.domain_agent_key_hash)
}

export function authenticateProposer(record: { proposer_key_hash?: string | null }, key: string | null): boolean {
  return !!key && !!record.proposer_key_hash && safeEqual(hashSecret(key), record.proposer_key_hash)
}

export async function appendExchangeEvent(input: {
  exchangeId: string
  eventType: string
  actor: Record<string, unknown>
  fromState?: ExchangeState | null
  toState?: ExchangeState | null
  payload?: Record<string, unknown>
}) {
  const admin = getExchangeAdmin()
  const { error } = await admin.from('exchange_events').insert({
    exchange_id: input.exchangeId,
    event_type: input.eventType,
    actor: input.actor,
    from_state: input.fromState ?? null,
    to_state: input.toState ?? null,
    payload: input.payload ?? {},
  })
  if (error) throw error
  // Best-effort PostHog telemetry
  await captureServer('exchange-system', 'exchange_event', {
    event_type: input.eventType,
    from_state: input.fromState ?? null,
    to_state: input.toState ?? null,
  })
}

// ─── Encounter tracking ─────────────────────────────────────────────────────
// Logs every agent encounter with an exchange surface. This is the top-of-funnel
// observability layer — every profile read, steward hit, preflight, and proposal
// attempt (even failed ones) gets recorded here.
export async function logEncounter(input: {
  targetDomain: string
  endpoint: string
  method?: string
  req: NextRequest
  result?: 'ok' | 'not_found' | 'rate_limited' | 'validation_error' | 'auth_error' | 'server_error'
  agentIdentity?: Record<string, unknown>
  metadata?: Record<string, unknown>
}) {
  try {
    const admin = getExchangeAdmin()
    const ip = requestIdentity(input.req)
    await admin.from('exchange_encounters').insert({
      target_domain: normalizeDomain(input.targetDomain),
      endpoint: input.endpoint,
      method: input.method ?? input.req.method ?? 'GET',
      user_agent: input.req.headers.get('user-agent')?.slice(0, 500) ?? null,
      ip_hash: ipHash(ip),
      agent_identity: input.agentIdentity ?? {},
      result: input.result ?? 'ok',
      metadata: input.metadata ?? {},
    })
    // Best-effort PostHog
    await captureServer('exchange-system', 'exchange_encounter', {
      target_domain: input.targetDomain,
      endpoint: input.endpoint,
      method: input.method ?? 'GET',
      result: input.result ?? 'ok',
    })
  } catch {
    // Encounter logging must never break the request
  }
}
