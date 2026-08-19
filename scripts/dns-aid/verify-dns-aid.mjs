#!/usr/bin/env node
/**
 * scripts/dns-aid/verify-dns-aid.mjs — verify DNS-AID records via DNS-over-HTTPS,
 * mirroring the isitagentready.com scanner's queries.
 *
 * Queries the well-known entrypoints (_index / _a2a / _mcp under _agents) for
 * SVCB, HTTPS, and TXT records via Cloudflare DoH (with Google fallback), and
 * reports the AD (authenticated data / DNSSEC) flag.
 *
 * Usage:
 *   node scripts/dns-aid/verify-dns-aid.mjs                 # default: sigeconomy.com
 *   node scripts/dns-aid/verify-dns-aid.mjs signalaf.com
 */

import { DOMAINS, DOH_RESOLVERS } from "./records.mjs";

const DOMAIN = process.argv[2] || DOMAINS.cloudflare.domain;

const ENTRYPOINTS = ["_index", "_a2a", "_mcp"];
const QTYPES = ["SVCB", "HTTPS", "TXT"];

// DoH JSON type codes (RFC 8484 / IANA).
const TYPE_CODE = { SVCB: 64, HTTPS: 65, TXT: 16 };
const CODE_TYPE = { 64: "SVCB", 65: "HTTPS", 16: "TXT" };

async function dohQuery(name, type, resolverUrl) {
  const isGoogle = resolverUrl.includes("dns.google");
  const url = isGoogle
    ? `${resolverUrl}?name=${encodeURIComponent(name)}&type=${type}`
    : `${resolverUrl}?name=${encodeURIComponent(name)}&type=${TYPE_CODE[type]}&do=1`;
  const res = await fetch(url, {
    headers: { Accept: "application/dns-json" },
  });
  if (!res.ok) throw new Error(`DoH ${resolverUrl} returned HTTP ${res.status}`);
  return res.json();
}

async function queryAll(name, type) {
  for (const resolver of DOH_RESOLVERS) {
    try {
      const data = await dohQuery(name, type, resolver);
      return data;
    } catch (e) {
      // try next resolver
    }
  }
  throw new Error(`all DoH resolvers failed for ${name} ${type}`);
}

function extractAnswers(data) {
  const answers = data.Answer || [];
  return answers.map((a) => ({
    type: CODE_TYPE[a.type] || String(a.type),
    name: a.name,
    data: a.data,
    ttl: a.TTL,
  }));
}

async function main() {
  console.log(`\nDNS-AID verification for ${DOMAIN}\n`);
  let serviceCount = 0;
  let txtCount = 0;
  let dnssecValidated = true; // true until a query shows AD=false with answers

  for (const ep of ENTRYPOINTS) {
    const name = `${ep}._agents.${DOMAIN}`;
    for (const type of QTYPES) {
      let data;
      try {
        data = await queryAll(name, type);
      } catch (e) {
        console.log(`  ${type.padEnd(6)} ${name}: resolver error — ${e.message}`);
        continue;
      }
      const answers = extractAnswers(data).filter((a) => a.type === type);
      const ad = data.AD === true;
      if (answers.length === 0) {
        // NXDOMAIN / no answers — not necessarily a failure for every combo.
        console.log(`  ${type.padEnd(6)} ${name}: no answers (status=${data.Status})`);
        continue;
      }
      if (!ad) dnssecValidated = false;
      if (type === "TXT") txtCount += answers.length;
      else serviceCount += answers.length;
      for (const a of answers) {
        const adTag = ad ? "AD" : "  ";
        console.log(`  ${type.padEnd(6)} ${name} [${adTag}] ${a.data}`);
      }
    }
  }

  console.log(`\nSummary: serviceRecords=${serviceCount} txtIndexEntries=${txtCount} dnssecValidated=${dnssecValidated}`);
  const pass = serviceCount > 0;
  console.log(`dnsAid: ${pass ? "PASS" : "FAIL"} (${serviceCount} SVCB/HTTPS record(s) found at well-known entrypoints)`);
  if (!dnssecValidated) {
    console.log("NOTE: DNSSEC not validated (AD=false) — enable DNSSEC on the zone + publish DS at parent.");
  }
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(`\nFATAL: ${e.message}`);
  process.exit(1);
});
