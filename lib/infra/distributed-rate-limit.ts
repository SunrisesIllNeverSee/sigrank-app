import "server-only";

/**
 * lib/infra/distributed-rate-limit.ts — Durable distributed rate limiter.
 *
 * Replaces the per-instance in-memory Map limiters with Upstash Redis
 * atomic operations. Provides consistent enforcement across all instances,
 * atomic increment-and-expire behavior, and fail-closed semantics on
 * sensitive write routes.
 *
 * Env vars:
 *   UPSTASH_REDIS_REST_URL  — Upstash Redis REST endpoint
 *   UPSTASH_REDIS_REST_TOKEN — Upstash Redis REST token
 *
 * Degraded mode: if Upstash is not configured (no env vars) or is
 * unreachable, the limiter falls back to a per-instance in-memory counter.
 * Sensitive write routes (failClosed=true) reject the request instead.
 */

import { Redis } from "@upstash/redis";

export interface DistributedRateLimitConfig {
  /** Time window in milliseconds. */
  windowMs: number;
  /** Maximum requests allowed within the window. */
  max: number;
}

export interface DistributedRateLimitResult {
  ok: boolean;
  retryAfter: number;
  limit: number;
  remaining: number;
  reset: number;
}

// ─── Upstash client (lazy singleton) ─────────────────────────────────────────

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisClient = null;
    return null;
  }
  redisClient = new Redis({ url, token });
  return redisClient;
}

// ─── In-memory fallback (per-instance) ───────────────────────────────────────

const memCounters = new Map<string, { count: number; resetAt: number }>();
let memLastGc = Date.now();

function memLimit(key: string, windowMs: number, max: number): DistributedRateLimitResult {
  const now = Date.now();
  if (now - memLastGc > 5 * 60 * 1000) {
    memLastGc = now;
    for (const [k, entry] of memCounters) {
      if (entry.resetAt < now) memCounters.delete(k);
    }
  }
  const entry = memCounters.get(key);
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowMs;
    memCounters.set(key, { count: 1, resetAt });
    return {
      ok: true,
      retryAfter: 0,
      limit: max,
      remaining: max - 1,
      reset: Math.ceil(windowMs / 1000),
    };
  }
  entry.count += 1;
  const reset = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  const remaining = Math.max(0, max - entry.count);
  if (entry.count > max) {
    return { ok: false, retryAfter: reset, limit: max, remaining: 0, reset };
  }
  return { ok: true, retryAfter: 0, limit: max, remaining, reset };
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Check a distributed rate limit.
 *
 * @param dimensions — one or more key dimensions (actor, route, signal, ip, etc.)
 * @param config — window size + max requests
 * @param failClosed — if true, reject when Redis is unreachable (sensitive writes).
 *                     if false, fall back to in-memory (read paths, best-effort).
 */
export async function checkDistributedRateLimit(
  dimensions: string[],
  config: DistributedRateLimitConfig,
  failClosed = false,
): Promise<DistributedRateLimitResult> {
  const key = `rl:${dimensions.join(":")}`;
  const redis = getRedis();

  // No Redis configured → in-memory fallback (or fail-closed)
  if (!redis) {
    if (failClosed) {
      return { ok: false, retryAfter: Math.ceil(config.windowMs / 1000), limit: config.max, remaining: 0, reset: Math.ceil(config.windowMs / 1000) };
    }
    return memLimit(key, config.windowMs, config.max);
  }

  try {
    // Atomic INCR + EXPIRE using Upstash pipeline.
    // The first request in a window sets the TTL; subsequent requests
    // just increment. This is the standard sliding-window-fixed approach.
    const now = Date.now();
    const windowKey = `${key}:${Math.floor(now / config.windowMs)}`;
    const ttlSeconds = Math.ceil(config.windowMs / 1000) + 1; // +1s grace

    const pipeline = redis.pipeline();
    pipeline.incr(windowKey);
    pipeline.expire(windowKey, ttlSeconds);
    const results = await pipeline.exec();

    const count = results[0] as number;
    const remaining = Math.max(0, config.max - count);
    const retryAfter = Math.max(1, Math.ceil(config.windowMs / 1000));
    const reset = retryAfter;

    if (count > config.max) {
      return { ok: false, retryAfter, limit: config.max, remaining: 0, reset };
    }
    return { ok: true, retryAfter: 0, limit: config.max, remaining, reset };
  } catch {
    // Redis unreachable
    if (failClosed) {
      return { ok: false, retryAfter: Math.ceil(config.windowMs / 1000), limit: config.max, remaining: 0, reset: Math.ceil(config.windowMs / 1000) };
    }
    return memLimit(key, config.windowMs, config.max);
  }
}

/**
 * IETF HTTPAPI RateLimit structured fields for distributed results.
 */
export function distributedRateLimitHeaders(result: DistributedRateLimitResult, policyName = "exchange"): Record<string, string> {
  return {
    "RateLimit-Policy": `"${policyName}";q=${result.limit};w=${result.reset}`,
    "RateLimit": `"${policyName}";r=${result.remaining};t=${result.reset}`,
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(result.reset),
  };
}
