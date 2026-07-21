// lib/supabase/service-config.mjs — pure service-role key selection (no 'server-only',
// so the node --test loud-fail gate can import it). The service-role WRITE client MUST
// NOT fall back to the anon key: an anon-key write to an RLS-protected table silently
// no-ops while the request still 2xx's (a phantom write). This returns the service key
// ONLY when both url + serviceKey are present, else null — and STRUCTURALLY cannot return
// an anon key (it never receives one). getSupabaseService() returns null on a null here,
// and the write routes 503 instead of phantom-writing.

/**
 * @param {string|undefined|null} url
 * @param {string|undefined|null} serviceKey
 * @returns {string|null}
 */
export function serviceKeyOrNull(url, serviceKey) {
  return url && serviceKey ? serviceKey : null;
}
