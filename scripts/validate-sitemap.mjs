#!/usr/bin/env node
/**
 * scripts/validate-sitemap.mjs — sitemap authority validator (SEARCH-RECOVERY §E).
 *
 * The sitemap represents URLs SignalAF actively proposes for search inclusion.
 * Every emitted URL must satisfy:
 *
 *   unique URL · HTTPS · host === signalaf.com · HTTP 200 · not redirected
 *   · not noindex · self-canonical (canonical resolves to the submitted URL)
 *   · not a utility/auth/internal route · no query-string duplicates
 *
 * Modes:
 *   # structural invariants on a built/saved sitemap — no network needed
 *   node scripts/validate-sitemap.mjs --file .next/server/app/sitemap.xml.body
 *
 *   # structural + live fetch of every URL on production
 *   node scripts/validate-sitemap.mjs --live
 *
 *   # structural + live fetch of each path against a preview deploy.
 *   # Declared <loc> hosts are still asserted as signalaf.com; the canonical
 *   # tag is compared to the declared URL (previews canonicalize to prod).
 *   node scripts/validate-sitemap.mjs --live --base https://<preview>.vercel.app
 *
 * Exit 1 on any violation. CI gate: __tests__/seo/indexing-policy.test.mjs
 * asserts the same structural invariants on the real emitted entries via
 * lib/seo/sitemap-entries.ts — it runs under `npm test` in every CI job.
 * This script is the post-deploy/preview complement for live invariants
 * (HTTP 200, redirects, robots, canonical) that cannot be checked offline.
 */

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const LIVE = flag("--live");
const FILE = opt("--file");
const BASE = opt("--base") ?? "https://signalaf.com";

// Spec invariant: host = signalaf.com — asserted on the declared <loc>,
// independent of which deployment the sitemap was fetched from.
const SITE_HOST = "signalaf.com";
const CONCURRENCY = 8;

const UTILITY_PREFIXES = [
  "/auth", "/login", "/logout", "/settings", "/account", "/me",
  "/api/", "/admin", "/onboarding", "/claim",
];

function fail(msg, violations) {
  if (violations.length === 0) return 0;
  console.error(`✗ ${msg} (${violations.length})`);
  for (const v of violations.slice(0, 20)) console.error(`    ${v}`);
  return violations.length;
}

async function readSitemapXml() {
  if (FILE) {
    const { readFile } = await import("node:fs/promises");
    return readFile(FILE, "utf8");
  }
  const res = await fetch(`${BASE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap fetch ${res.status} from ${BASE}`);
  return res.text();
}

async function main() {
  const xml = await readSitemapXml();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const source = FILE ?? `${BASE}/sitemap.xml`;

  let failures = 0;

  // ── Structural invariants ───────────────────────────────────────────────
  failures += fail(
    "duplicate URLs",
    urls.filter((u, i) => urls.indexOf(u) !== i),
  );

  failures += fail(
    "non-HTTPS URLs",
    urls.filter((u) => !u.startsWith("https://")),
  );

  // Malformed <loc> values are reported once, under the host invariant —
  // the remaining checks skip them instead of throwing an opaque error.
  const malformed = new Set();
  const badHost = urls.filter((u) => {
    try {
      return new URL(u).host !== SITE_HOST;
    } catch {
      malformed.add(u);
      return true;
    }
  });
  failures += fail(
    `URLs not on host ${SITE_HOST} (or unparseable)`,
    badHost,
  );

  const utility = urls.filter((u) => {
    if (malformed.has(u)) return false;
    const path = new URL(u).pathname;
    return UTILITY_PREFIXES.some(
      (p) => path === p || path.startsWith(p + "/"),
    );
  });
  failures += fail("utility/auth/internal routes in sitemap", utility);

  const queryUrls = urls.filter(
    (u) => !malformed.has(u) && new URL(u).search.length > 0,
  );
  failures += fail("query-string URLs (possible duplicates)", queryUrls);

  // ── Live invariants (fetch each URL) ────────────────────────────────────
  // With --base, the declared URLs are fetched on the given deployment by
  // swapping in its origin; robots/canonical are still asserted against the
  // declared signalaf.com URL, since previews canonicalize to prod.
  if (LIVE) {
    const baseOrigin = new URL(BASE).origin;
    const results = { badStatus: [], redirected: [], noindex: [], badCanonical: [] };
    let done = 0;
    for (let i = 0; i < urls.length; i += CONCURRENCY) {
      await Promise.all(
        urls.slice(i, i + CONCURRENCY).map(async (u) => {
          const fetchUrl = baseOrigin + new URL(u).pathname;
          try {
            const r = await fetch(fetchUrl, { redirect: "manual" });
            if (r.status >= 300 && r.status < 400) {
              results.redirected.push(`${u} → ${r.headers.get("location")}`);
              return;
            }
            if (r.status !== 200) {
              results.badStatus.push(`${u} → HTTP ${r.status}`);
              return;
            }
            const html = await r.text();
            // Match <meta name="robots" content="..."> in either attribute order.
            const robots =
              html.match(/<meta name="robots" content="([^"]*)"/i)?.[1] ??
              html.match(/<meta content="([^"]*)" name="robots"/i)?.[1];
            if (robots && /noindex/i.test(robots)) {
              results.noindex.push(`${u} → robots: ${robots}`);
            }
            const canonical = html.match(
              /<link rel="canonical" href="([^"]*)"/i,
            )?.[1];
            // Empty path and "/" are the same URL — normalize before compare.
            if (canonical && canonical.replace(/\/$/, "") !== u.replace(/\/$/, "")) {
              results.badCanonical.push(`${u} → canonical: ${canonical}`);
            }
          } catch (e) {
            results.badStatus.push(`${u} → fetch error ${e.message}`);
          } finally {
            done++;
            if (done % 40 === 0) console.error(`  … ${done}/${urls.length}`);
          }
        }),
      );
    }
    failures += fail("non-200 URLs", results.badStatus);
    failures += fail("redirecting URLs", results.redirected);
    failures += fail("noindex URLs in sitemap", results.noindex);
    failures += fail("canonical mismatch URLs", results.badCanonical);
  }

  console.log(
    `${failures === 0 ? "✓" : "✗"} sitemap (${source}): ${urls.length} URLs checked (${LIVE ? "structural+live" : "structural"}) — ${failures} violation(s)`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(`validator error: ${e.message}`);
  process.exit(1);
});
