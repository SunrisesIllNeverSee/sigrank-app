#!/usr/bin/env node
/**
 * scripts/dns-aid/porkbun-dns-aid.mjs — publish DNS-AID records on a
 * Porkbun-managed zone (signalaf.com) and enable DNSSEC.
 *
 * Idempotent: retrieves existing records, creates missing ones, updates records
 * whose content/TTL drifts, and leaves matching records untouched. Safe to
 * re-run. Checks DNSSEC DS records at the registry and, if none exist, prints
 * instructions to enable Porkbun-managed DNSSEC (zone signing + DS publication)
 * so validating resolvers return authenticated data.
 *
 * Usage:
 *   PORKBUN_API_KEY=pk1_... PORKBUN_SECRET_API_KEY=sk1_... \
 *   node scripts/dns-aid/porkbun-dns-aid.mjs                  # default: signalaf.com
 *   PORKBUN_API_KEY=pk1_... PORKBUN_SECRET_API_KEY=sk1_... DOMAIN=<zone> \
 *   node scripts/dns-aid/porkbun-dns-aid.mjs
 *
 * Create keys at https://porkbun.com/account/api (scope to signalaf.com for least privilege).
 *
 * Env:
 *   PORKBUN_API_KEY        - Porkbun API key
 *   PORKBUN_SECRET_API_KEY - Porkbun secret API key
 *   DOMAIN                 - optional override (default: signalaf.com)
 *   DRY_RUN=1              - print planned changes without applying
 */

import { buildRecords, DOMAINS } from "./records.mjs";

const API_KEY = process.env.PORKBUN_API_KEY;
const SECRET = process.env.PORKBUN_SECRET_API_KEY;
const DOMAIN = process.env.DOMAIN || DOMAINS.porkbun.domain;
const DRY_RUN = process.env.DRY_RUN === "1";
const API = "https://api.porkbun.com/api/json/v3";

if (!API_KEY || !SECRET) {
  console.error("ERROR: PORKBUN_API_KEY and PORKBUN_SECRET_API_KEY are required.");
  console.error("Create keys at https://porkbun.com/account/api (scope to " + DOMAIN + ").");
  process.exit(1);
}

/** Porkbun auth body — merged into every POST body. */
function authBody(extra = {}) {
  return { apikey: API_KEY, secretapikey: SECRET, ...extra };
}

async function pb(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(authBody(body)),
  });
  const data = await res.json();
  if (data.status !== "SUCCESS") {
    const code = data.code ? ` [${data.code}]` : "";
    throw new Error(`Porkbun ${path} failed: ${data.status}${code} ${data.message || ""}`);
  }
  return data;
}

/** Convert a fully-qualified record name to the Porkbun subdomain form (strip the apex). */
function toSubdomain(fqdn, domain) {
  const sub = fqdn.replace(new RegExp(`\\.?${domain.replace(/\./g, "\\.")}$`), "");
  return sub; // "" for apex, "_index._agents" for _index._agents.<domain>
}

/** Normalize SVCB/HTTPS content for comparison. */
function normalizeContent(content) {
  return String(content).replace(/\s+/g, " ").trim();
}

async function listRecords() {
  const data = await pb(`/dns/retrieve/${DOMAIN}`);
  return data.records || [];
}

async function createRecord(rec) {
  const subdomain = toSubdomain(rec.name, DOMAIN);
  if (DRY_RUN) {
    console.log(`  [dry-run] would CREATE ${rec.type} ${rec.name} = ${rec.content}`);
    return;
  }
  const data = await pb(`/dns/create/${DOMAIN}`, {
    name: subdomain,
    type: rec.type,
    content: rec.content,
    ttl: rec.ttl,
  });
  console.log(`  created  ${rec.type} ${rec.name} (id=${data.id})`);
}

async function updateRecord(existing, rec) {
  if (DRY_RUN) {
    console.log(`  [dry-run] would UPDATE ${rec.type} ${rec.name}\n      from: ${existing.content}\n      to:   ${rec.content}`);
    return;
  }
  await pb(`/dns/edit/${DOMAIN}/${existing.id}`, {
    type: rec.type,
    content: rec.content,
    ttl: rec.ttl,
  });
  console.log(`  updated  ${rec.type} ${rec.name} (id=${existing.id})`);
}

async function checkDnssec() {
  let data;
  try {
    data = await pb(`/dns/getDnssecRecords/${DOMAIN}`);
  } catch (e) {
    console.warn(`  WARN: could not read DNSSEC records (${e.message}).`);
    console.warn("  Enable DNSSEC via Porkbun dashboard → Domain → DNSSEC.");
    return;
  }
  const records = data.records || {};
  const tags = Object.keys(records);
  if (tags.length > 0) {
    console.log(`  DNSSEC enabled (${tags.length} DS record(s) at registry).`);
    for (const tag of tags) {
      const ds = records[tag];
      console.log(`    DS ${tag} ${ds.algorithm ?? ds.alg} ${ds.digestType ?? ds["digest type"]} ${ds.digest}`);
    }
  } else {
    console.log("  No DNSSEC DS records at registry.");
    console.log("  To enable Porkbun-managed DNSSEC (zone signing + DS at registry):");
    console.log("    1. Porkbun dashboard → " + DOMAIN + " → DNSSEC → Enable");
    console.log("    2. Porkbun signs the zone (Cloudflare-backed) and publishes the DS at the .com registry.");
    console.log("  Or add a DS record via the API if you manage your own KSK.");
  }
}

async function main() {
  const desired = buildRecords(DOMAIN);
  console.log(`\nDNS-AID publish → Porkbun zone ${DOMAIN}${DRY_RUN ? " [DRY RUN]" : ""}`);

  console.log("\n[1/3] Fetching existing DNS records...");
  const existing = await listRecords();
  const existingBy = new Map();
  for (const r of existing) existingBy.set(`${r.type}|${r.name}`, r);

  console.log("[2/3] Reconciling DNS-AID records...");
  for (const rec of desired) {
    const key = `${rec.type}|${rec.name}`;
    const match = existingBy.get(key);
    if (!match) {
      try {
        await createRecord(rec);
      } catch (e) {
        if (rec.numericKey && /invalid|unknown|key|param|unsupported|type/i.test(e.message)) {
          console.log(`  numeric key rejected for ${rec.name}; retrying with standard params.`);
          await createRecord({ ...rec, content: rec.contentFallback });
        } else {
          throw e;
        }
      }
      continue;
    }
    const wantNorm = normalizeContent(rec.content);
    const haveNorm = normalizeContent(match.content);
    const wantFallback = normalizeContent(rec.contentFallback);
    if (wantNorm === haveNorm || wantFallback === haveNorm) {
      if (Number(match.ttl) === rec.ttl) {
        console.log(`  ok       ${rec.type} ${rec.name}`);
      } else {
        await updateRecord(match, rec);
      }
    } else {
      try {
        await updateRecord(match, rec);
      } catch (e) {
        if (rec.numericKey && /invalid|unknown|key|param|unsupported|type/i.test(e.message)) {
          console.log(`  numeric key rejected for ${rec.name}; retrying with standard params.`);
          await updateRecord(match, { ...rec, content: rec.contentFallback });
        } else {
          throw e;
        }
      }
    }
  }

  console.log("[3/3] DNSSEC...");
  await checkDnssec();

  console.log(`\nDone. Verify with:`);
  console.log(`  node scripts/dns-aid/verify-dns-aid.mjs ${DOMAIN}`);
}

main().catch((e) => {
  console.error(`\nFATAL: ${e.message}`);
  process.exit(1);
});
