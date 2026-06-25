// lib/ingest/canonical.mjs — the SINGLE SOURCE OF TRUTH for SigRank canonical JSON.
//
// Pure (no node:crypto, no 'server-only') so it is importable by BOTH the server
// (lib/ingest/signature.ts, which re-exports it) AND the node --test parity gate
// (__tests__/ingest/canon_parity.test.mjs). BYTE-CRITICAL: the server verifies
// ed25519 signatures over these exact bytes, and sigrank-mcp sign.mjs is a
// byte-for-byte port — a single divergent byte hard-rejects (422) every verified
// submission. The canon_parity fixture (committed in both repos) locks it. Do NOT
// "tidy" the algorithm: sorted keys (recursive), compact separators, UTF-8, with the
// derived agent.signature + agent.snapshot_hash stripped before serialization.

/** Agent fields excluded from the canonical (signed/hashed) body — they derive from it. */
const DERIVED_AGENT_FIELDS = ['signature', 'snapshot_hash']

/**
 * Recursively sort object keys (UTF-16 code-unit order — matches the sigrank-mcp port
 * and Python sort_keys for the ASCII keys this schema uses). Arrays keep order.
 * @param {unknown} v
 * @returns {unknown}
 */
export function sortDeep(v) {
  if (Array.isArray(v)) return v.map(sortDeep)
  if (v && typeof v === 'object') {
    /** @type {Record<string, unknown>} */
    const out = {}
    for (const k of Object.keys(v).sort()) out[k] = sortDeep(/** @type {Record<string, unknown>} */ (v)[k])
    return out
  }
  return v
}

/**
 * Canonical JSON string the agent signs/hashes (derived agent fields stripped).
 * @param {Record<string, unknown>} payload
 * @returns {string}
 */
export function canonicalJson(payload) {
  const clone = JSON.parse(JSON.stringify(payload))
  const agent = clone.agent
  if (agent && typeof agent === 'object') {
    for (const f of DERIVED_AGENT_FIELDS) delete agent[f]
  }
  return JSON.stringify(sortDeep(clone))
}

/**
 * UTF-8 bytes of the canonical JSON — the exact bytes that get signed.
 * @param {Record<string, unknown>} payload
 * @returns {Buffer}
 */
export function canonicalBytes(payload) {
  return Buffer.from(canonicalJson(payload), 'utf-8')
}
