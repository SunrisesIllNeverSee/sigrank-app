/**
 * scripts/dns-aid/records.mjs — DNS for AI Discovery (DNS-AID) record definitions.
 *
 * Single source of truth for the DNS-AID records published under each domain's
 * `_agents` namespace. Consumed by both `cloudflare-dns-aid.mjs` (sigeconomy.com)
 * and `porkbun-dns-aid.mjs` (signalaf.com).
 *
 * Spec: DNS-AID publishes ServiceMode SVCB / HTTPS records at well-known
 * entrypoints under `_agents` so agents can discover agent endpoints via DNS.
 * The isitagentready.com scanner queries these entrypoints:
 *   SVCB / HTTPS / TXT  _index._agents.<domain>
 *   SVCB / HTTPS        _a2a._agents.<domain>
 *   SVCB / HTTPS        _mcp._agents.<domain>
 *
 * Record design:
 *   - _index  → HTTPS record (HTTPS endpoint, the well-known directory index)
 *   - _a2a    → SVCB record with alpn="a2a" (A2A agent-card endpoint)
 *   - _mcp    → SVCB record with alpn="h2"  (MCP streamable-http over HTTP/2)
 *   - _index  → TXT record carrying the DNS-AID index manifest (well-known URIs)
 *
 * Experimental numeric SvcParamKeys (keyNNNNN) carry the well-known path for each
 * service until DNS-AID custom parameters are formally registered. The publisher
 * scripts attempt the content WITH the numeric key first and fall back to the
 * standard-params-only `contentFallback` if the provider API rejects unknown keys.
 *
 * Each domain points its SVCB/HTTPS target at its own apex (which has A/AAAA
 * records). The actual transport endpoints are advertised in the well-known JSON
 * documents (agent.json / mcp.json) that the apex serves.
 */

/**
 * @typedef {Object} DnsAidRecord
 * @property {string} type        - DNS record type ("SVCB" | "HTTPS" | "TXT")
 * @property {string} name        - fully-qualified record name (under _agents)
 * @property {string} content     - presentation-format rdata (with numeric key)
 * @property {string} contentFallback - rdata without experimental numeric keys
 * @property {number} ttl         - TTL in seconds
 * @property {boolean} numericKey - whether content carries an experimental keyNNNNN
 */

/**
 * Build the DNS-AID record set for a domain.
 *
 * @param {string} domain  - apex domain (e.g. "sigeconomy.com")
 * @returns {DnsAidRecord[]}
 */
export function buildRecords(domain) {
  const apex = `${domain}.`;
  const ttl = 3600;

  // TXT index manifest — carries the well-known URIs the scanner reads as
  // txtIndexEntries. Universally supported; the primary machine-readable index.
  const txtManifest =
    `dnsaid=v1` +
    ` a2a=https://${domain}/.well-known/agent.json` +
    ` mcp=https://${domain}/.well-known/mcp.json` +
    ` oauth=https://${domain}/.well-known/oauth-authorization-server` +
    ` prm=https://${domain}/.well-known/oauth-protected-resource` +
    ` wba=https://${domain}/.well-known/http-message-signatures-directory`;

  return [
    {
      type: "HTTPS",
      name: `_index._agents.${domain}`,
      // HTTPS record: default alpn is h2 (RFC 9460). port=443 for the HTTPS endpoint.
      content: `1 ${apex} alpn="h2" port=443 key00001="/.well-known/"`,
      contentFallback: `1 ${apex} alpn="h2" port=443`,
      ttl,
      numericKey: true,
    },
    {
      type: "SVCB",
      name: `_a2a._agents.${domain}`,
      // A2A service: alpn="a2a", mandatory alpn+port per DNS-AID example.
      content: `1 ${apex} alpn="a2a" port=443 mandatory=alpn,port key00001="/.well-known/agent.json"`,
      contentFallback: `1 ${apex} alpn="a2a" port=443 mandatory=alpn,port`,
      ttl,
      numericKey: true,
    },
    {
      type: "SVCB",
      name: `_mcp._agents.${domain}`,
      // MCP streamable-http over HTTP/2.
      content: `1 ${apex} alpn="h2" port=443 mandatory=alpn,port key00001="/.well-known/mcp.json"`,
      contentFallback: `1 ${apex} alpn="h2" port=443 mandatory=alpn,port`,
      ttl,
      numericKey: true,
    },
    {
      type: "TXT",
      name: `_index._agents.${domain}`,
      content: txtManifest,
      contentFallback: txtManifest,
      ttl,
      numericKey: false,
    },
  ];
}

/** Domains to publish DNS-AID records for, keyed by publisher. */
export const DOMAINS = {
  // Cloudflare-managed zone → cloudflare-dns-aid.mjs
  cloudflare: {
    domain: "sigeconomy.com",
    zoneId: "451ccf3ac9ae20feb61820442a6233b8",
  },
  // Porkbun-managed zone → porkbun-dns-aid.mjs
  porkbun: {
    domain: "signalaf.com",
  },
};

/** DoH resolvers used by the scanner (for verification). */
export const DOH_RESOLVERS = [
  "https://cloudflare-dns.com/dns-query",
  "https://dns.google/resolve",
];
