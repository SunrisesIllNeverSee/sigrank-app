import "server-only";

/**
 * lib/api/gate.ts — CORPUS gate (Gate #3) for the public /api/v1 read endpoints.
 */

import { createHash, timingSafeEqual } from "node:crypto";
import { type NextRequest, type NextResponse } from "next/server";
import { problemResponse } from "@/lib/infra/problem";
import { checkDistributedRateLimit } from "@/lib/infra/distributed-rate-limit";

/**
 * Length-safe constant-time string comparison for API key validation.
 * Hashes both inputs to fixed-length digests before timingSafeEqual,
 * avoiding the early-exit timing leak on length mismatch.
 *
 * Note: SHA-256 is used here as a fixed-length digest for constant-time
 * comparison, NOT as a password hash. API keys are high-entropy secrets
 * that do not require slow KDF hashing. CodeQL's "insufficient computational
 * effort" warning is a false positive in this context.
 */
function safeEqualStrings(a: string, b: string): boolean {
  // SHA-256 used as a fixed-length digest for timingSafeEqual, not as a password hash.
  // lgtm[js/hashing-insufficient-computational-effort]
  const ha = createHash("sha256").update(a).digest();
  // lgtm[js/hashing-insufficient-computational-effort]
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Max entries an unauthenticated caller may read (the public "top N"). */
export const PUBLIC_TOP_N = 2000;

/** Max entries a valid-API-key caller may read in one request (bulk/full cap). */
export const API_KEY_CAP = 5000;

/** Per-IP request budget for list reads, per RATE_WINDOW_MS. */
export const LIST_RATE_LIMIT = 60;

/** Fixed-window length for the rate limiter, in milliseconds. */
export const RATE_WINDOW_MS = 60_000;

/**
 * Is the request authenticated for bulk/full reads?
 */
export function apiKeyValid(req: NextRequest): boolean {
  const expected = process.env.SIGRANK_API_KEY;
  if (!expected) return false;
  const provided = req.headers.get("x-api-key");
  return provided != null && safeEqualStrings(provided, expected);
}

export interface ListGate {
  limit: number;
  gated: boolean;
}

export function enforceListGate(
  req: NextRequest,
  requestedLimit: number,
): ListGate {
  if (apiKeyValid(req)) {
    return { limit: Math.min(requestedLimit, API_KEY_CAP), gated: false };
  }
  return {
    limit: Math.min(requestedLimit, PUBLIC_TOP_N),
    gated: requestedLimit > PUBLIC_TOP_N,
  };
}

/** Outcome of a rate-limit check. */
export interface RateResult {
  ok: boolean;
  /** Seconds until the current fixed window resets. */
  retryAfter: number;
  limit: number;
  remaining: number;
  reset: number;
}

const windowCounters = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function openRateResult(limit: number, windowMs: number): RateResult {
  return {
    ok: true,
    retryAfter: 0,
    limit,
    remaining: limit,
    reset: Math.ceil(windowMs / 1000),
  };
}

/** Best-effort per-IP fixed-window rate limit for read endpoints. */
export function rateLimit(req: NextRequest): RateResult {
  try {
    const now = Date.now();
    const ip = clientIp(req);
    const entry = windowCounters.get(ip);

    if (!entry || now >= entry.resetAt) {
      windowCounters.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
      return {
        ok: true,
        retryAfter: 0,
        limit: LIST_RATE_LIMIT,
        remaining: LIST_RATE_LIMIT - 1,
        reset: Math.ceil(RATE_WINDOW_MS / 1000),
      };
    }

    entry.count += 1;
    const reset = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    const remaining = Math.max(0, LIST_RATE_LIMIT - entry.count);
    if (entry.count > LIST_RATE_LIMIT) {
      return {
        ok: false,
        retryAfter: reset,
        limit: LIST_RATE_LIMIT,
        remaining: 0,
        reset,
      };
    }
    return {
      ok: true,
      retryAfter: 0,
      limit: LIST_RATE_LIMIT,
      remaining,
      reset,
    };
  } catch {
    return openRateResult(LIST_RATE_LIMIT, RATE_WINDOW_MS);
  }
}

/**
 * Distributed per-IP rate limit using Upstash Redis.
 * Falls back to the in-memory `rateLimit` when Redis is not configured.
 * Use this in async route handlers for consistent cross-instance enforcement.
 */
export async function rateLimitDistributed(req: NextRequest): Promise<RateResult> {
  const ip = clientIp(req);
  const result = await checkDistributedRateLimit(
    ["api-v1", ip],
    { windowMs: RATE_WINDOW_MS, max: LIST_RATE_LIMIT },
    false, // read paths: best-effort, not fail-closed
  );
  return {
    ok: result.ok,
    retryAfter: result.retryAfter,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * IETF HTTPAPI RateLimit structured fields (draft-ietf-httpapi-ratelimit-headers)
 * plus legacy field names used by existing clients and readiness probes.
 */
export function rateLimitHeaders(result: RateResult): Record<string, string> {
  const windowSeconds = Math.ceil(RATE_WINDOW_MS / 1000);
  return {
    "RateLimit-Policy": `"public-api";q=${result.limit};w=${windowSeconds}`,
    "RateLimit": `"public-api";r=${result.remaining};t=${result.reset}`,
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(result.reset),
  };
}

/** Build the standard 429 response. */
export function rateLimitedResponse(result: RateResult | number): NextResponse {
  const normalized =
    typeof result === "number"
      ? {
          ok: false,
          retryAfter: result,
          limit: LIST_RATE_LIMIT,
          remaining: 0,
          reset: result,
        }
      : result;

  return problemResponse({
    status: 429,
    title: "Too Many Requests",
    detail: "The public API request budget for this window has been exhausted.",
    code: "rate_limited",
    hint: `Retry after ${normalized.retryAfter} seconds and use the RateLimit headers to self-throttle.`,
    type: "https://signalaf.com/developers#errors",
    headers: {
      ...rateLimitHeaders(normalized),
      "Retry-After": String(normalized.retryAfter),
    },
  });
}

/** Build a 401 response for endpoints that require an API key. */
export function unauthorizedResponse(detail: string): NextResponse {
  return problemResponse({
    status: 401,
    title: "Unauthorized",
    detail,
    code: "unauthorized",
    hint: "See https://signalaf.com/auth.md for supported authentication methods.",
    type: "https://signalaf.com/developers#authentication",
  });
}

export function getClientIp(req: NextRequest): string {
  return clientIp(req);
}

const ENROLL_RATE_LIMIT = 10;
const ENROLL_WINDOW_MS = 600_000;

export function enrollRateLimit(req: NextRequest): RateResult {
  try {
    const now = Date.now();
    const key = `enroll:${clientIp(req)}`;
    const entry = windowCounters.get(key);
    if (!entry || now >= entry.resetAt) {
      windowCounters.set(key, { count: 1, resetAt: now + ENROLL_WINDOW_MS });
      return {
        ok: true,
        retryAfter: 0,
        limit: ENROLL_RATE_LIMIT,
        remaining: ENROLL_RATE_LIMIT - 1,
        reset: Math.ceil(ENROLL_WINDOW_MS / 1000),
      };
    }
    entry.count += 1;
    const reset = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    const remaining = Math.max(0, ENROLL_RATE_LIMIT - entry.count);
    return {
      ok: entry.count <= ENROLL_RATE_LIMIT,
      retryAfter: entry.count > ENROLL_RATE_LIMIT ? reset : 0,
      limit: ENROLL_RATE_LIMIT,
      remaining,
      reset,
    };
  } catch {
    return openRateResult(ENROLL_RATE_LIMIT, ENROLL_WINDOW_MS);
  }
}
