/**
 * Exchange rate limiter — keyed by `${user_id}:${action}`.
 *
 * Uses the distributed Upstash Redis limiter for consistent enforcement
 * across all instances. Falls back to per-instance in-memory when Upstash
 * is not configured. Sensitive write routes fail closed when Redis is
 * unreachable.
 */

import { checkDistributedRateLimit } from "@/lib/infra/distributed-rate-limit";

type LimitConfig = { windowMs: number; max: number; failClosed?: boolean }

const LIMITS: Record<string, LimitConfig> = {
  exchange_company_signup: { windowMs: 60 * 60 * 1000, max: 3, failClosed: true },
  exchange_company_verify: { windowMs: 60 * 60 * 1000, max: 10, failClosed: true },
  exchange_agent_signup: { windowMs: 60 * 60 * 1000, max: 10, failClosed: true },
  exchange_proposal: { windowMs: 60 * 60 * 1000, max: 20 },
  exchange_request: { windowMs: 60 * 60 * 1000, max: 20 },
  exchange_message: { windowMs: 60 * 60 * 1000, max: 120 },
  exchange_steward_preflight: { windowMs: 60 * 1000, max: 30 },
}

export type ExchangeRateLimitAction = keyof typeof LIMITS

/**
 * Check whether a user/action combination is within the rate limit.
 * Maintains the same synchronous boolean interface as the old in-memory
 * limiter for drop-in compatibility with existing callers.
 *
 * Note: this is now async internally (delegates to the distributed limiter),
 * but the call sites use `await` via the rate-limit-allow wrapper below.
 * The old `rateLimitAllow` was synchronous; the new `rateLimitAllowAsync`
 * is async. Both are exported for backward compatibility during migration.
 */
export async function rateLimitAllowAsync(userId: string, action: ExchangeRateLimitAction): Promise<boolean> {
  const cfg = LIMITS[action]
  const result = await checkDistributedRateLimit(
    [userId, action],
    { windowMs: cfg.windowMs, max: cfg.max },
    cfg.failClosed ?? false,
  )
  return result.ok
}

/**
 * Synchronous wrapper — uses the in-memory fallback only.
 * Deprecated: prefer `rateLimitAllowAsync` for distributed enforcement.
 * Kept for backward compatibility with call sites that haven't been
 * migrated to await yet.
 */
const memHits = new Map<string, number[]>()
let memLastGc = Date.now()
function memMaybeGc(now: number) {
  if (now - memLastGc < 5 * 60 * 1000) return
  memLastGc = now
  for (const [k, arr] of memHits) {
    if (arr.length === 0 || arr[arr.length - 1] < now - 60 * 60 * 1000) memHits.delete(k)
  }
}

export function rateLimitAllow(userId: string, action: ExchangeRateLimitAction): boolean {
  const cfg = LIMITS[action]
  const now = Date.now()
  memMaybeGc(now)
  const key = `${userId}:${action}`
  const arr = memHits.get(key) ?? []
  const cutoff = now - cfg.windowMs
  const fresh = arr.filter(t => t > cutoff)
  if (fresh.length >= cfg.max) { memHits.set(key, fresh); return false }
  fresh.push(now); memHits.set(key, fresh); return true
}
