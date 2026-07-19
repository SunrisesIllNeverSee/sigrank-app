/**
 * lib/data/memo.ts — in-memory TTL cache with request deduplication.
 *
 * Why this exists: `unstable_cache` (Next.js Data Cache) has a 2MB per-entry
 * limit on Vercel. `getLeaderboard` returns ~2.5MB (1,640 operators × full
 * nested objects), so the Data Cache silently fails to set — every request
 * re-queries Supabase. This module replaces `unstable_cache` for payloads
 * that exceed the 2MB cap.
 *
 * How it works:
 * - Module-level `Map<string, { promise, expires }>` lives in the serverless
 *   function's memory. No size limit.
 * - Stores the PROMISE, not the value — concurrent requests for the same key
 *   share a single in-flight DB call (deduplication). A 100-request burst
 *   results in 1 DB hit, not 100.
 * - TTL-based expiry. On expiry, the next request triggers a fresh fetch.
 * - Persists across warm invocations on Vercel. Cold starts miss the cache
 *   (one DB hit), then warm up for subsequent requests.
 *
 * Limitations:
 * - Per-instance: each warm serverless function has its own cache. Vercel
 *   may run multiple instances, so the DB hit count = number of warm
 *   instances × 1 per TTL window. Still vastly better than 1 per request.
 * - No persistence across cold starts. But cold starts are rare under
 *   sustained traffic (the exact scenario where the 2MB issue hurts most).
 */

interface CacheEntry<T> {
  promise: Promise<T>;
  expires: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Memoize an async function with a TTL. Concurrent calls for the same key
 * share a single in-flight promise (deduplication). After the TTL expires,
 * the next call triggers a fresh fetch.
 *
 * @param key    Cache key (string). Include any params that affect the result.
 * @param ttl    Time-to-live in seconds.
 * @param fn     The async function to memoize.
 * @returns      The cached or freshly-fetched result.
 */
export function memoize<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key);

  // Cache hit: return the existing promise if it hasn't expired.
  if (entry && entry.expires > now) {
    return entry.promise as Promise<T>;
  }

  // Cache miss or expired: start a fresh fetch.
  // We store the promise immediately so concurrent calls deduplicate.
  const promise = fn().catch((err) => {
    // On error, evict the entry so the next request retries.
    cache.delete(key);
    throw err;
  });

  cache.set(key, {
    promise,
    expires: now + ttl * 1000,
  });

  return promise;
}

/**
 * Invalidate a specific cache entry (e.g. on data change).
 * Call this when `revalidateTag("board")` would normally fire.
 */
export function memoInvalidate(key: string): void {
  cache.delete(key);
}

/**
 * Invalidate all cache entries matching a prefix.
 * Useful for tag-based invalidation (e.g. all "board:" entries).
 */
export function memoInvalidatePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear the entire cache. Mainly for tests.
 */
export function memoClear(): void {
  cache.clear();
}
