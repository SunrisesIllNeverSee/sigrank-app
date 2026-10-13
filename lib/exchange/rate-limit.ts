/**
 * Exchange rate limiter — keyed by `${user_id}:${action}`.
 *
 * Uses the distributed limiter (lib/infra/distributed-rate-limit) for
 * consistent enforcement across all instances. Actions with failClosed deny
 * when the backing store is unreachable.
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
 * Check whether a user/action combination is within the rate limit
 * (distributed; honours each action's failClosed setting).
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
