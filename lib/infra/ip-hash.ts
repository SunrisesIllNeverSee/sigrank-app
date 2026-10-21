import { createHmac } from "node:crypto";

/**
 * Keyed hash of a client IP for storage and actor ids.
 *
 * A plain sha256 of an IPv4 address can be reversed by hashing all 2^32
 * addresses, so the hash is an HMAC under a server-only secret. The key is
 * IP_HASH_SECRET when set, else the Supabase service-role key (always present
 * where these rows are written). Rotating the key changes every hash, which
 * only resets per-IP rate/abuse history.
 *
 * Returns undefined when there is no IP or no key, so callers store null
 * instead of a reversible value.
 */
export function hashIp(ip: string | null | undefined): string | undefined {
  if (!ip || ip === "unknown") return undefined;
  const key = process.env.IP_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return undefined;
  return createHmac("sha256", key).update(`ip:${ip}`).digest("hex").slice(0, 16);
}

/** Actor id for a caller with no credential: never the raw IP. */
export function anonymousActorId(ip: string | null | undefined): string {
  return `anonymous:${hashIp(ip) ?? "unknown"}`;
}
