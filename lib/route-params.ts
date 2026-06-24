/**
 * lib/route-params.ts — helpers for dynamic route-segment params.
 */

/**
 * Decode a dynamic route segment used as a DB lookup key (e.g. an operator codename).
 *
 * Next.js hands a PAGE component its `[param]` segment still URL-encoded (e.g. "%C2%B7"
 * for "·"), whereas a ROUTE HANDLER receives it already decoded. When that value is then
 * used in a Supabase `.ilike(value)` lookup, an un-decoded "%" is read as a SQL LIKE
 * wildcard — so keys containing "·"/spaces never match → 404. Decode in PAGES before lookup
 * so they resolve exactly like the data API does.
 *
 * Defensive: malformed input (e.g. a lone "%") falls back to the raw value, so the caller
 * gets a clean not-found (404) rather than a thrown decode error (500).
 */
export function decodeCodename(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}
