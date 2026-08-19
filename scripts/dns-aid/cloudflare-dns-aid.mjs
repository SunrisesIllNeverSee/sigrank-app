#!/usr/bin/env node
/**
 * scripts/dns-aid/cloudflare-dns-aid.mjs — publish DNS-AID records on a
 * Cloudflare-managed zone (sigeconomy.com) and enable DNSSEC.
 *
 * Idempotent: lists existing records, creates missing ones, updates records
 * whose content/TTL drifts, and leaves matching records untouched. Safe to
 * re-run. Enables DNSSEC signing on the zone and prints the DS record that
 * must be published at the parent registry (via the registrar) so validating
 * resolvers return authenticated data.
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=<dns-write token> \
 *   node scripts/dns-aid/cloudflare-dns-aid.mjs                    # default: sigeconomy.com
 *   CLOUDFLARE_API_TOKEN=<token> ZONE_ID=<id> DOMAIN=<zone> \
 *   node scripts/dns-aid/cloudflare-dns-aid.mjs
 *
 * Required token permissions (Cloudflare):
 *   Zone → DNS → Edit  AND  Zone → DNS → Read  (DNS Write)
 *   Zone → Zone Settings → Edit  (for DNSSEC enablement)
 *
 * Env:
 *   CLOUDFLARE_API_TOKEN  - API token with DNS edit + zone settings edit
 *   ZONE_ID               - optional override (default: sigeconomy.com zone)
 *   DOMAIN                - optional override (default: sigeconomy.com)
 *   DRY_RUN=1             - print planned changes without applying
 */

import { buildRecords, DOMAINS } from "./records.mjs";

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const DOMAIN = process.env.DOMAIN || DOMAINS.cloudflare.domain;
const ZONE_ID = process.env.ZONE_ID || DOMAINS.cloudflare.zoneId;
const DRY_RUN = process.env.DRY_RUN === "1";
const API = "https://api.cloudflare.com/client/v4";

if (!TOKEN) {
  console.error("ERROR: CLOUDFLARE_API_TOKEN is required (DNS Write + Zone Settings Edit).");
  process.exit(1);
}
if (!ZONE_ID) {
  console.error("ERROR: ZONE_ID is required (could not resolve default for " + DOMAIN + ").");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

async function cf(path, opts = {}) {
  const res = await fetch(`${API}${path}`, { ...opts, headers: { ...headers, ...(opts.headers || {}) } });
  const body = await res.json();
  if (!body.success) {
    const errs = (body.errors || []).map((e) => `${e.code}: ${e.message}`).join("; ");
    throw new Error(`Cloudflare API ${path} failed: ${errs}`);
  }
  return body.result;
}

/** Normalize SVCB/HTTPS content for comparison (collapse whitespace, trim trailing dot on target). */
function normalizeContent(type, content) {
  return String(content).replace(/\s+/g, " ").trim();
}

/** Strip experimental numeric keyNNNNN params from SVCB/HTTPS content. */
function stripNumericKeys(content) {
  // Remove keyNNNNN="..." tokens (and any trailing space they leave).
  return content.replace(/\s*key\d+="[^"]*"/g, "").replace(/\s{2,}/g, " ").trim();
}

async function listRecords() {
  const out = [];
  let page = 1;
  while (true) {
    const batch = await cf(`/zones/${ZONE_ID}/dns_records?per_page=100&page=${page}`);
    out.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }
  return out;
}

async function createRecord(rec) {
  const payload = {
    type: rec.type,
    name: rec.name,
    content: rec.content,
    ttl: rec.ttl,
    proxied: false, // DNS-only: manual SVCB/HTTPS records are only served on DNS-only names
  };
  if (DRY_RUN) {
    console.log(`  [dry-run] would CREATE ${rec.type} ${rec.name} = ${rec.content}`);
    return null;
  }
  const result = await cf(`/zones/${ZONE_ID}/dns_records`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  console.log(`  created  ${rec.type} ${rec.name} (id=${result.id})`);
  return result;
}

async function updateRecord(existing, rec) {
  if (DRY_RUN) {
    console.log(`  [dry-run] would UPDATE ${rec.type} ${rec.name}\n      from: ${existing.content}\n      to:   ${rec.content}`);
    return;
  }
  await cf(`/zones/${ZONE_ID}/dns_records/${existing.id}`, {
    method: "PATCH",
    body: JSON.stringify({ content: rec.content, ttl: rec.ttl, proxied: false }),
  });
  console.log(`  updated  ${rec.type} ${rec.name} (id=${existing.id})`);
}

async function enableDnssec() {
  // Get current DNSSEC status.
  let status;
  try {
    status = await cf(`/zones/${ZONE_ID}/dnssec`);
  } catch (e) {
    console.warn(`  WARN: could not read DNSSEC status (${e.message}). Skipping DNSSEC enablement.`);
    return;
  }
  if (status && status.status === "enabled") {
    console.log(`  DNSSEC already enabled (status=${status.status}).`);
    if (status.ds) {
      printDs(status.ds, DOMAIN);
    }
    return;
  }
  if (DRY_RUN) {
    console.log("  [dry-run] would enable DNSSEC signing on the zone");
    return;
  }
  try {
    const result = await cf(`/zones/${ZONE_ID}/dnssec`, {
      method: "POST",
      body: JSON.stringify({ status: "enabled" }),
    });
    console.log("  DNSSEC signing enabled.");
    if (result && result.ds) printDs(result.ds, DOMAIN);
    else console.log("  NOTE: DS record not returned yet — re-run to fetch the DS for the parent registry.");
  } catch (e) {
    console.warn(`  WARN: DNSSEC enablement failed (${e.message}). Enable via dashboard: ` +
      `https://dash.cloudflare.com/?to=/:account/${ZONE_ID}/dns/dnssec`);
  }
}

function printDs(ds, domain) {
  // ds: { key_tag, algorithm, digest_type, digest } (Cloudflare field names vary)
  const keyTag = ds.key_tag ?? ds.keyTag ?? ds.keytag;
  const alg = ds.algorithm ?? ds.alg;
  const digestType = ds.digest_type ?? ds.digestType;
  const digest = ds.digest;
  if (keyTag != null && digest) {
    console.log(`  DS record (publish at parent registry for ${domain}):`);
    console.log(`    ${domain}. 3600 IN DS ${keyTag} ${alg} ${digestType} ${digest}`);
  }
}

async function main() {
  const desired = buildRecords(DOMAIN);
  console.log(`\nDNS-AID publish → Cloudflare zone ${DOMAIN} (${ZONE_ID})${DRY_RUN ? " [DRY RUN]" : ""}`);

  console.log("\n[1/3] Fetching existing DNS records...");
  const existing = await listRecords();
  const existingBy = new Map();
  for (const r of existing) existingBy.set(`${r.type}|${r.name}`, r);

  console.log("[2/3] Reconciling DNS-AID records...");
  for (const rec of desired) {
    const key = `${rec.type}|${rec.name}`;
    const match = existingBy.get(key);
    if (!match) {
      // Try with numeric key first; on rejection, fall back to standard params.
      try {
        await createRecord(rec);
      } catch (e) {
        if (rec.numericKey && /invalid|unknown|key|param|unsupported/i.test(e.message)) {
          console.log(`  numeric key rejected for ${rec.name}; retrying with standard params.`);
          await createRecord({ ...rec, content: rec.contentFallback });
        } else {
          throw e;
        }
      }
      continue;
    }
    // Compare content (prefer the numeric-key content; compare normalized).
    const wantNorm = normalizeContent(rec.type, rec.content);
    const haveNorm = normalizeContent(rec.type, match.content);
    const wantFallback = normalizeContent(rec.type, rec.contentFallback);
    if (wantNorm === haveNorm || wantFallback === haveNorm) {
      if (match.ttl === rec.ttl) {
        console.log(`  ok       ${rec.type} ${rec.name}`);
      } else {
        await updateRecord(match, rec);
      }
    } else {
      // Drift — update. Try numeric-key content first, fall back on rejection.
      try {
        await updateRecord(match, rec);
      } catch (e) {
        if (rec.numericKey && /invalid|unknown|key|param|unsupported/i.test(e.message)) {
          console.log(`  numeric key rejected for ${rec.name}; retrying with standard params.`);
          await updateRecord(match, { ...rec, content: rec.contentFallback });
        } else {
          throw e;
        }
      }
    }
  }

  console.log("[3/3] DNSSEC...");
  await enableDnssec();

  console.log(`\nDone. Verify with:`);
  console.log(`  node scripts/dns-aid/verify-dns-aid.mjs ${DOMAIN}`);
}

main().catch((e) => {
  console.error(`\nFATAL: ${e.message}`);
  process.exit(1);
});
