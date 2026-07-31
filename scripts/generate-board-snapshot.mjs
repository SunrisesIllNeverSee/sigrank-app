#!/usr/bin/env node
// generate-board-snapshot.mjs
// Generates a static JSON snapshot of the all_time leaderboard for CDN serving.
//
// This eliminates ~90% of Supabase egress — the all_time board (2,184 rows,
// ~2.5 MB per query) is fetched once and written to public/data/board-all_time.json.
// The /board/all, /research, and /methodology pages read this static file instead
// of querying Supabase on every ISR cycle.
//
// 7d/30d/90d boards stay LIVE (DB-side window-filtered queries, ~42 KB each).
//
// Usage:
//   node scripts/generate-board-snapshot.mjs           # writes to public/data/
//   node scripts/generate-board-snapshot.mjs --dry-run # prints size, doesn't write
//
// Environment:
//   NEXT_PUBLIC_SUPABASE_URL — the Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY — service role key (bypasses RLS for the full board)
//
// Run via GitHub Action daily, or manually before deploy.
// Uses plain fetch (not supabase-js) so it works on any Node version.

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUTPUT_PATH = join(ROOT, "public", "data", "board-all_time.json");

const DRY_RUN = process.argv.includes("--dry-run");

// Load .env.local if env vars aren't set (for local runs)
function loadEnv() {
  try {
    const envPath = join(ROOT, ".env.local");
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const match = line.match(/^([A-Z_]+)="?(.+?)"?$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {
    // .env.local not found — rely on existing env vars
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("  Set them in .env.local or as environment variables.");
  process.exit(1);
}

const REST_URL = `${SUPABASE_URL}/rest/v1`;
const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

const SNAPSHOT_COLUMNS = [
  "operator_id", "snapshot_date", "window_type", "platform", "compression_ratio",
  "prompt_complexity", "cross_thread", "session_depth", "token_throughput",
  "signa_rate", "sdot_score", "sdrm_score", "signal_force", "drift_ratio",
  "class_tier", "movement_24h", "movement_7d", "ruleset_version",
  "input_tokens", "output_tokens", "cache_creation_tokens", "cache_read_tokens",
].join(",");

const OPERATOR_COLUMNS = [
  "operator_id", "codename", "display_name", "claimed", "claimed_at",
  "current_supporter_tier", "verification_status", "primary_domain",
  "account_age_days", "total_messages_lifetime",
  "handle", "avatar_url", "bio", "links", "location",
  "profile_visibility", "status",
].join(",");

const PAGE_SIZE = 1000;

// Token pricing (mirrors lib/analytics/cascade.ts PRICE constant)
const PRICE = {
  input: 3 / 1e6,
  output: 15 / 1e6,
  cacheCreate: 3.75 / 1e6,
  cacheRead: 0.3 / 1e6,
};

// Compute cascade metrics (mirrors lib/analytics/cascade.ts computeCascadeMetrics)
function computeCascadeMetrics(input, output, cacheCreate, cacheRead) {
  const safeI = Math.max(input, 1);
  const snr = input + output > 0 ? output / (input + output) : 0;
  const velocity = output / safeI;
  const leverage = cacheRead / safeI;
  const yield_ = leverage * velocity;
  const total = input + output + cacheCreate + cacheRead;
  const scaleV = total > 0 ? Math.log10(total) : 0;
  const cost = input * PRICE.input + output * PRICE.output + cacheCreate * PRICE.cacheCreate + cacheRead * PRICE.cacheRead;
  const costPerMillion = total > 0 ? cost / (total / 1e6) : 0;
  const efficiency = (cacheRead + cacheCreate + output) / safeI / 4.0;
  const opRatio = `${Math.round(leverage)}:1:${velocity.toFixed(velocity < 1 ? 2 : 1)}`;

  let dev10x = null;
  if (cacheCreate > 0 && output > 0 && input > 0 && cacheRead > 0) {
    const transmission = output / input;
    const commitment = cacheCreate / output;
    const reuse = cacheRead / cacheCreate;
    dev10x = Math.log10(transmission * commitment * reuse);
  }

  // nonCompounding: cache_creation = 0 means no cascade (Codex gap)
  const nonCompounding = cacheCreate === 0;

  return { yield_, velocity, leverage, snr, dev10x, scaleV, costPerMillion, efficiency, opRatio, nonCompounding, totalTokens: total };
}

async function fetchPaginated(table, select, extraParams = "") {
  const all = [];
  let offset = 0;
  while (offset < 10000) {
    const params = new URLSearchParams({
      select,
      offset: String(offset),
      limit: String(PAGE_SIZE),
    });
    if (extraParams) {
      for (const [k, v] of extraParams.split("&").map(p => p.split("="))) {
        params.set(k, v);
      }
    }
    const url = `${REST_URL}/${table}?${params}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${table} fetch failed: ${res.status} ${text}`);
    }
    const data = await res.json();
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

async function main() {
  console.log("Fetching all_time snapshots from Supabase...");
  const snapshots = await fetchPaginated(
    "metric_snapshots",
    SNAPSHOT_COLUMNS,
    "window_type=eq.all_time&order=snapshot_date.desc",
  );
  console.log(`  → ${snapshots.length} all_time rows`);

  // Filter ghost rows (null/zero input or output) — mirrors queries.ts ghost-row guard
  const yieldable = snapshots.filter(
    (s) =>
      s.input_tokens != null &&
      s.input_tokens > 0 &&
      s.output_tokens != null &&
      s.output_tokens > 0,
  );

  // Collapse to operator-total: one row per operator (prefer 'multi' platform)
  const byOperator = new Map();
  const platformsByOperator = new Map();
  for (const snap of yieldable) {
    const oid = snap.operator_id;
    const existing = byOperator.get(oid);
    if (!existing) {
      byOperator.set(oid, snap);
    } else {
      // Prefer 'multi' platform over single-platform
      if (snap.platform === "multi" && existing.platform !== "multi") {
        byOperator.set(oid, snap);
      }
    }
    // Track distinct platforms
    if (!platformsByOperator.has(oid)) {
      platformsByOperator.set(oid, new Set());
    }
    platformsByOperator.get(oid).add(snap.platform);
  }

  const operatorIds = new Set(byOperator.keys());
  console.log(`  → ${operatorIds.size} unique operators after dedup`);

  console.log("Fetching operators...");
  const operators = await fetchPaginated(
    "operators_public",
    OPERATOR_COLUMNS,
    "order=operator_id.asc",
  );
  const opById = new Map(
    operators.filter((o) => operatorIds.has(o.operator_id)).map((o) => [o.operator_id, o]),
  );
  console.log(`  → ${opById.size} operators matched`);

  console.log("Fetching rank_history...");
  const rankHistory = await fetchPaginated(
    "rank_history",
    "operator_id,snapshot_date,global_rank,percentile",
    "order=snapshot_date.desc",
  );
  const pctById = new Map();
  for (const r of rankHistory) {
    if (!pctById.has(r.operator_id)) {
      pctById.set(r.operator_id, r.percentile ?? 0);
    }
  }

  // Build LeaderboardEntryWithPlatforms[] — same shape as toEntry() output
  // so the pages can read the JSON directly without calling getLeaderboard + toEntry.
  const entries = [];
  for (const [oid, snap] of byOperator) {
    const op = opById.get(oid);
    if (!op) continue;

    const input = snap.input_tokens ?? 0;
    const output = snap.output_tokens ?? 0;
    const cacheCreate = snap.cache_creation_tokens ?? 0;
    const cacheRead = snap.cache_read_tokens ?? 0;

    const c = computeCascadeMetrics(input, output, cacheCreate, cacheRead);
    const platforms = [...(platformsByOperator.get(oid) ?? [])].filter(Boolean);

    entries.push({
      rank: 0, // assigned after sort
      percentile: pctById.get(oid) ?? 0,
      isSeed: !op.claimed,
      anonId: op.display_name ? op.display_name : op.codename,
      codename: op.codename,
      subLabel: op.handle ? `@${op.handle}` : op.primary_domain,
      location: op.location ?? undefined,
      signalClass: snap.class_tier,
      // Cascade metrics — null for non-compounding (cache_creation=0, Codex gap)
      yield_: c.nonCompounding ? null : c.yield_,
      leverage: c.nonCompounding ? null : c.leverage,
      snr: c.snr,
      dev10x: c.nonCompounding ? null : c.dev10x,
      velocity: c.velocity,
      totalTokens: c.totalTokens,
      // Raw pillars — always present (independent of compounding)
      input,
      output,
      cacheWrite: cacheCreate,
      cacheRead,
      scaleV: c.scaleV,
      costPerMillion: c.costPerMillion,
      efficiency: c.efficiency,
      opRatio: c.opRatio,
      snRatio: snap.compression_ratio ?? 0,
      threadsRecalled: snap.cross_thread ?? 0,
      sessionDepth: snap.session_depth ?? 0,
      promptComplexity: snap.prompt_complexity ?? 0,
      messageVolume: op.total_messages_lifetime ?? 0,
      compositeScore: snap.signa_rate ?? 0,
      acctAge: `${op.account_age_days ?? 0}d`,
      lastSeen: snap.snapshot_date ?? null,
      platform: (snap.platform ?? op.primary_domain ?? "other").toLowerCase(),
      window: "all_time",
      status: op.status ?? null,
      // LeaderboardEntryWithPlatforms extras
      platforms: platforms.length > 0 ? platforms : undefined,
      primaryDomain: (op.primary_domain ?? "other").toLowerCase(),
    });
  }

  // Sort by yield descending (non-compounding rows go last via null yield = -Infinity)
  entries.sort((a, b) => {
    const ya = a.yield_ ?? -Infinity;
    const yb = b.yield_ ?? -Infinity;
    return yb - ya;
  });
  entries.forEach((e, i) => { e.rank = i + 1; });

  const output = {
    generated_at: new Date().toISOString(),
    window: "all_time",
    total_operators: entries.length,
    entries,
  };

  const json = JSON.stringify(output);
  const sizeKB = Math.round(json.length / 1024);

  if (DRY_RUN) {
    console.log(`\nDRY RUN: would write ${sizeKB} KB to ${OUTPUT_PATH}`);
    console.log(`  ${entries.length} operators, generated at ${output.generated_at}`);
  } else {
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
    writeFileSync(OUTPUT_PATH, json, "utf8");
    console.log(`\n✓ Written ${sizeKB} KB to ${OUTPUT_PATH}`);
    console.log(`  ${entries.length} operators, generated at ${output.generated_at}`);
  }
}

main().catch((err) => {
  console.error("✗ Failed:", err.message);
  process.exit(1);
});
