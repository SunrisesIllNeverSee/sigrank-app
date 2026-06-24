import 'server-only'

/**
 * lib/api/gate.ts — CORPUS gate (Gate #3) for the public /api/v1 read endpoints.
 *
 * Problem (SIGRANK_EXPOSURE_AUDIT_RESULTS.md §5): the public API has no auth and
 * no rate-limit, so the verified corpus is bulk-scrapable via large `limit`
 * values and per-operator sweeps.
 *
 * Policy:
 *   - Unauthenticated reads get TOP-N only (PUBLIC_TOP_N). Asking for more is
 *     silently clamped and the response carries a small `gated:true` note.
 *   - A valid `x-api-key` (matching SIGRANK_API_KEY) lifts the cap to API_KEY_CAP
 *     for bulk/full corpus reads.
 *   - Best-effort per-IP fixed-window rate-limit (defense-in-depth).
 *
 * Lives outside `app/` on purpose: Next.js `route.ts` files may ONLY export HTTP
 * handlers + route-segment config, so shared gate logic lives in a normal module
 * the three read routes import.
 *
 * NOTE on the normal path: the site's own board does NOT call these endpoints —
 * it reads server-side through the @/lib/data facade. These endpoints are for
 * EXTERNAL consumers, so gating them does not touch the site's own rendering.
 *
 * Every helper is total (never throws): a gate that can crash a read path is a
 * worse outage than the scraping it prevents.
 */

import { NextResponse, type NextRequest } from 'next/server'

/** Max entries an unauthenticated caller may read (the public "top N"). */
export const PUBLIC_TOP_N = 25

/** Max entries a valid-API-key caller may read in one request (bulk/full cap). */
export const API_KEY_CAP = 1000

/** Per-IP request budget for list reads, per RATE_WINDOW_MS. */
const LIST_RATE_LIMIT = 60

/** Fixed-window length for the rate limiter, in milliseconds. */
const RATE_WINDOW_MS = 60_000

/**
 * Is the request authenticated for bulk/full reads?
 *
 * True only when SIGRANK_API_KEY is set AND the `x-api-key` header matches it.
 * If the env is unset the API stays public-only — there is no implicit bypass.
 * No secret is stored here; the key is read from the environment at call time.
 */
export function apiKeyValid(req: NextRequest): boolean {
  const expected = process.env.SIGRANK_API_KEY
  if (!expected) return false
  const provided = req.headers.get('x-api-key')
  return provided != null && provided === expected
}

/** Outcome of the list-size gate. */
export interface ListGate {
  /** The effective (possibly clamped) limit the caller is allowed to read. */
  limit: number
  /** True when the caller's request was clamped below what they asked for. */
  gated: boolean
}

/**
 * Clamp a requested list size to what the caller is entitled to.
 *
 * Authenticated (valid key) → allow up to API_KEY_CAP.
 * Unauthenticated           → clamp to PUBLIC_TOP_N; `gated` is true only when
 *                             the caller actually asked for more than PUBLIC_TOP_N
 *                             (so a normal small request reports gated:false).
 *
 * `requestedLimit` is the caller's already-sanitized limit (finite, >= 1).
 */
export function enforceListGate(req: NextRequest, requestedLimit: number): ListGate {
  if (apiKeyValid(req)) {
    return { limit: Math.min(requestedLimit, API_KEY_CAP), gated: false }
  }
  return {
    limit: Math.min(requestedLimit, PUBLIC_TOP_N),
    gated: requestedLimit > PUBLIC_TOP_N,
  }
}

/** Outcome of a rate-limit check. */
export interface RateResult {
  /** False when the caller has exceeded their window budget. */
  ok: boolean
  /** Seconds until the current window resets (for the Retry-After header). */
  retryAfter: number
}

/**
 * In-memory fixed-window counters, keyed by client IP.
 *
 * TODO(RATELIMIT.DURABLE): this Map is per-serverless-instance, so it is
 * DEFENSE-IN-DEPTH only — it does not coordinate across instances and resets on
 * cold start. A real cross-instance limit needs a durable store; wire
 * @upstash/ratelimit (sliding window on Upstash Redis) for production-grade
 * enforcement. Until then this raises the cost of casual bulk scraping without
 * any external dependency.
 */
const windowCounters = new Map<string, { count: number; resetAt: number }>()

/** Best-effort client IP from the proxy chain (first x-forwarded-for hop). */
function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) {
    const first = fwd.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

/**
 * Best-effort per-IP fixed-window rate limit for read endpoints.
 *
 * Never throws — any failure degrades open ({ ok:true }) so the gate can never
 * take down a read path. See windowCounters note re: per-instance scope.
 */
export function rateLimit(req: NextRequest): RateResult {
  try {
    const now = Date.now()
    const ip = clientIp(req)
    const entry = windowCounters.get(ip)

    if (!entry || now >= entry.resetAt) {
      windowCounters.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
      return { ok: true, retryAfter: 0 }
    }

    entry.count += 1
    if (entry.count > LIST_RATE_LIMIT) {
      return { ok: false, retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) }
    }
    return { ok: true, retryAfter: 0 }
  } catch {
    // Degrade open: a broken limiter must not break reads.
    return { ok: true, retryAfter: 0 }
  }
}

/** Build the standard 429 (rate-limited) response with a Retry-After header. */
export function rateLimitedResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    {
      status: 'rate_limited',
      detail: 'Too many requests. Slow down and retry after the indicated delay.',
      retry_after: retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'Cache-Control': 'no-store',
      },
    },
  )
}

/** Build a 401 (unauthorized) response for endpoints that require an API key. */
export function unauthorizedResponse(detail: string): NextResponse {
  return NextResponse.json(
    { status: 'unauthorized', detail },
    { status: 401, headers: { 'Cache-Control': 'no-store' } },
  )
}
