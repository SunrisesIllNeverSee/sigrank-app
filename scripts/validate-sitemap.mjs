#!/usr/bin/env node
/**
 * scripts/validate-sitemap.mjs — sitemap authority validator (SEARCH-RECOVERY §E).
 *
 * The sitemap represents URLs SignalAF actively proposes for search inclusion.
 * Every emitted URL must satisfy:
 *
 *   unique URL · HTTPS · host === signalaf.com host · HTTP 200 · not redirected
 *   · not noindex · self-canonical (or canonical == the submitted URL)
 *   · not a utility/auth/internal route · no query-string duplicates
 *
 * Modes:
 *   node scripts/validate-sitemap.mjs                # structural only (offline)
 *   node scripts/validate-sitemap.mjs --live         # + fetch each URL (slow)
 *   node scripts/validate-sitemap.mjs --live --base https://<preview>.vercel.app
 *
 * Exit 1 on any violation — safe to wire into CI or a preview-deploy gate.
 */

const BASE = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "https://signalaf.com";
const LIVE = process.argv.includes("--live");
const CONCURRENCY = 8;

const UTILITY_PREFIXES = [
  "/auth", "/login", "/logout", "/settings", "/account", "/me",
  "/api/", "/admin", "/onboarding", "/claim",
];

function fail(msg, violations) {
  console.error(`✗ ${msg} (${violations.length})`);
  for (const v of violations.slice(0, 20)) console.error(`    ${v}`);
  return violations.length;
}

async function main() {
  const res = await fetch(`${BASE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap fetch ${res.status} from ${BASE}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  let failures = 0;

  // ── Structural invariants (no network) ──────────────────────────────────
  failures += fail(
    "duplicate URLs",
    urls.filter((u, i) => urls.indexOf(u) !== i),
  );

  const siteHost = new URL(BASE).host;
  const badScheme = urls.filter((u) => !u.startsWith("https://"));
  failures += fail("non-HTTPS URLs", badScheme);

  const badHost = urls.filter((u) => {
    try {
      return new URL(u).host !== siteHost;
    } catch {
      return true;
    }
  });
  failures += fail(`URLs not on host ${siteHost}`, badHost);

  const utility = urls.filter((u) => {
    const path = new URL(u).pathname;
    return UTILITY_PREFIXES.some(
      (p) => path === p || path.startsWith(p + "/"),
    );
  });
  failures += fail("utility/auth/internal routes in sitemap", utility);

  const queryUrls = urls.filter((u) => new URL(u).search.length > 0);
  failures += fail("query-string URLs (possible duplicates)", queryUrls);

  // ── Live invariants (fetch each URL) ────────────────────────────────────
  if (LIVE) {
    const results = { badStatus: [], redirected: [], noindex: [], badCanonical: [] };
    let done = 0;
    for (let i = 0; i < urls.length; i += CONCURRENCY) {
      await Promise.all(
        urls.slice(i, i + CONCURRENCY).map(async (u) => {
          try {
            const r = await fetch(u, { redirect: "manual" });
            if (r.status >= 300 && r.status < 400) {
              results.redirected.push(`${u} → ${r.headers.get("location")}`);
              return;
            }
            if (r.status !== 200) {
              results.badStatus.push(`${u} → HTTP ${r.status}`);
              return;
            }
            const html = await r.text();
            const robots = html.match(
              /<meta name="robots" content="([^"]*)"/i,
            )?.[1];
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
    `${failures === 0 ? "✓" : "✗"} sitemap: ${urls.length} URLs checked (${LIVE ? "structural+live" : "structural"}) — ${failures} violation(s)`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(`validator error: ${e.message}`);
  process.exit(1);
});
