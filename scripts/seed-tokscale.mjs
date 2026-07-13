#!/usr/bin/env node
/**
 * scripts/seed-tokscale.mjs — generate a Supabase seed migration from a tokscale scrape CSV.
 *
 * Usage:
 *   node scripts/seed-tokscale.mjs <input.csv> [output.sql]
 *
 * CSV format (header row required):
 *   handle,display_name,input_tokens,output_tokens,cache_creation_tokens,cache_read_tokens[,platform][,account_age_days][,total_messages_lifetime]
 *
 * - handle:          the tokscale/social @username (e.g. "olafurns7"). Becomes the
 *                    codename (slugified) + the `handle` column.
 * - display_name:    real name (e.g. "Ólafur Nils Sigurðsson"). Becomes display_name.
 * - input_tokens:    BIGINT — raw input token count
 * - output_tokens:   BIGINT — raw output token count
 * - cache_creation:  BIGINT — cache creation tokens
 * - cache_read:      BIGINT — cache read tokens
 * - platform:        optional — claude / chatgpt / gemini / pi / multi (default: claude)
 * - account_age_days: optional — operator account age (default: 30)
 * - total_messages:  optional — lifetime message count (default: 0)
 *
 * The script:
 *   1. Parses the CSV
 *   2. Slugifies each handle → codename
 *   3. Runs computeCascadeMetrics() on the 4 pillars to derive cascade values
 *   4. Derives a class tier from yield (using ruleset thresholds)
 *   5. Generates placeholder signa/comp/etc. from the cascade
 *   6. Emits two INSERT blocks (operators + metric_snapshots) as a .sql migration
 *
 * The output migration is idempotent (ON CONFLICT DO NOTHING) and mirrors the
 * pattern in supabase/seed.sql.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ── Cascade computation (mirrors lib/ingest/bridge.ts computeCascadeMetrics) ──
// Υ Yield = (cache_read × output) / input²
// Leverage = cache_read / input
// 10xDEV = log10(leverage)
// SNR = compression_ratio (placeholder — derived from cache_read / total)
// Velocity = output / input
// Scale V = log10(total)
// Efficiency = yield × leverage (simplified)
// Cost/1M = (input × $3 + output × $15 + cacheCreate × $3.75 + cacheRead × $0.30) / 1M
// Op Ratio = `${leverage}:1:${velocity}`

function computeCascade(input, output, cacheCreate, cacheRead) {
  const total = input + output + cacheCreate + cacheRead;
  const nonCompounding = cacheCreate === 0 && cacheRead === 0;

  if (nonCompounding || input === 0) {
    return {
      yield_: 0,
      leverage: 0,
      dev10x: 0,
      snr: total > 0 ? cacheRead / total : 0,
      velocity: input > 0 ? output / input : 0,
      scaleV: total > 0 ? Math.log10(total) : 0,
      efficiency: 0,
      costPerMillion: 0,
      opRatio: "0:1:0",
      nonCompounding: true,
      total,
    };
  }

  const yield_ = (cacheRead * output) / (input * input);
  const leverage = cacheRead / input;
  const dev10x = Math.log10(leverage);
  const snr = cacheRead / total;
  const velocity = output / input;
  const scaleV = Math.log10(total);
  const efficiency = yield_ * leverage;
  // Claude pricing (simplified): $3/M input, $15/M output, $3.75/M cache write, $0.30/M cache read
  const costPerMillion =
    (input * 3 + output * 15 + cacheCreate * 3.75 + cacheRead * 0.3) / total;
  const opRatio = `${leverage.toFixed(0)}:1:${velocity.toFixed(1)}`;

  return {
    yield_,
    leverage,
    dev10x,
    snr,
    velocity,
    scaleV,
    efficiency,
    costPerMillion,
    opRatio,
    nonCompounding: false,
    total,
  };
}

// ── Class tier from yield (mirrors ruleset thresholds) ──
function classFromYield(yield_, nonCompounding) {
  if (nonCompounding || yield_ <= 0) return "IGNITER";
  if (yield_ >= 100) return "TRANSMITTER";
  if (yield_ >= 10) return "ARCH+";
  if (yield_ >= 1) return "ARCH";
  if (yield_ >= 0.1) return "POWER";
  if (yield_ >= 0.01) return "BASE";
  if (yield_ >= 0.001) return "SEEKER";
  if (yield_ >= 0.0001) return "REFINER";
  if (yield_ >= 0.00001) return "BEARER";
  return "IGNITER";
}

// ── Placeholder signa/comp/etc. derived from cascade ──
function placeholders(c) {
  // signa_rate: rough proxy from efficiency (clamped 0-100)
  const signa = Math.min(99, Math.max(1, Math.log10(c.efficiency + 1) * 30));
  // compression_ratio: proxy from snr
  const comp = Math.min(0.99, Math.max(0.01, c.snr));
  // prompt_complexity: proxy from scaleV
  const pc = Math.min(100, Math.max(1, c.scaleV * 5));
  // cross_thread: proxy from leverage (clamped)
  const ct = Math.min(100, Math.max(0, Math.round(c.leverage / 10)));
  // session_depth: proxy from dev10x
  const sd = Math.min(30, Math.max(1, c.dev10x * 5));
  // token_throughput: proxy from total
  const tt = Math.min(100000, Math.round(c.total / 1000));
  // signal_force: proxy from yield
  const sf = Math.min(100, Math.max(0.1, Math.log10(c.yield_ + 1) * 10));
  return { signa, comp, pc, ct, sd, tt, sf };
}

// ── Slugify handle → codename ──
function slugify(handle) {
  return handle
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// ── CSV parser (minimal, handles quoted fields) ──
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error("CSV needs a header + at least 1 row");

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = [];
    let cur = "";
    let inQuote = false;
    for (const ch of lines[i]) {
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cells.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur);

    const row = {};
    header.forEach((h, idx) => {
      row[h] = (cells[idx] ?? "").trim();
    });
    rows.push(row);
  }
  return { header, rows };
}

// ── Main ──
const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error("Usage: node scripts/seed-tokscale.mjs <input.csv> [output.sql]");
  process.exit(1);
}

const inputPath = resolve(args[0]);
const outputPath = args[1]
  ? resolve(args[1])
  : resolve(
      __dirname,
      "..",
      "supabase",
      "migrations",
      `tokscale_seed_${new Date().toISOString().slice(0, 10)}.sql`,
    );

const csv = readFileSync(inputPath, "utf-8");
const { header, rows } = parseCSV(csv);

// Validate required columns
const required = [
  "handle",
  "display_name",
  "input_tokens",
  "output_tokens",
  "cache_creation_tokens",
  "cache_read_tokens",
];
const missing = required.filter((c) => !header.includes(c));
if (missing.length > 0) {
  console.error(`Missing required columns: ${missing.join(", ")}`);
  console.error(`Required: ${required.join(", ")}`);
  console.error(`Optional: platform, account_age_days, total_messages_lifetime`);
  process.exit(1);
}

const snapshotDate = new Date().toISOString().slice(0, 10);
const entries = [];
const seenSlugs = new Set();

for (const row of rows) {
  const handle = row.handle;
  const displayName = row.display_name || null;
  const input = BigInt(row.input_tokens || 0);
  const output = BigInt(row.output_tokens || 0);
  const cacheCreate = BigInt(row.cache_creation_tokens || 0);
  const cacheRead = BigInt(row.cache_read_tokens || 0);
  const platform = row.platform || "claude";
  const ageDays = parseInt(row.account_age_days || "30", 10);
  const totalMessages = BigInt(row.total_messages_lifetime || "0");

  let slug = slugify(handle);
  // Deduplicate slugs
  if (seenSlugs.has(slug)) {
    slug = `${slug}-${entries.length}`;
  }
  seenSlugs.add(slug);

  const c = computeCascade(
    Number(input),
    Number(output),
    Number(cacheCreate),
    Number(cacheRead),
  );
  const cls = classFromYield(c.yield_, c.nonCompounding);
  const p = placeholders(c);

  entries.push({
    codename: slug,
    display_name: displayName,
    handle: handle.replace(/^@+/, ""),
    platform,
    ageDays,
    totalMessages: totalMessages.toString(),
    input: input.toString(),
    output: output.toString(),
    cacheCreate: cacheCreate.toString(),
    cacheRead: cacheRead.toString(),
    signa: p.signa.toFixed(1),
    comp: p.comp.toFixed(3),
    pc: p.pc.toFixed(0),
    ct: p.ct.toString(),
    sd: p.sd.toFixed(1),
    tt: p.tt.toString(),
    sf: p.sf.toFixed(1),
    cls,
  });
}

// ── Generate SQL ──
const opValues = entries
  .map(
    (e) =>
      `  ('${e.codename}', ${e.display_name ? `'${e.display_name.replace(/'/g, "''")}'` : "NULL"}, '${e.handle}', 'free', 'unverified', '${e.platform}', ${e.ageDays}, ${e.totalMessages}, false)`,
  )
  .join(",\n");

const snapValues = entries
  .map(
    (e) =>
      `  ('${e.codename}', ${e.input}::bigint, ${e.output}::bigint, ${e.cacheCreate}::bigint, ${e.cacheRead}::bigint, ${e.signa}, ${e.comp}, ${e.pc}, ${e.ct}, ${e.sd}, ${e.tt}, ${e.sf}, '${e.cls}')`,
  )
  .join(",\n");

const sql = `-- ============================================================================
-- tokscale_seed_${snapshotDate}.sql — ${entries.length} tokscale operators seeded from scrape.
--
-- Generated by scripts/seed-tokscale.mjs from ${args[0]}.
-- Idempotent (ON CONFLICT DO NOTHING). Each operator carries their REAL 4 token
-- pillars (input, output, cache_creation, cache_read); cascade/Υ is computed ON
-- READ via computeCascadeMetrics() — same path as the existing seeds.
--
-- Identity: real handles (slugified → codename, real name → display_name).
-- Claim model: unclaimed (claimed=false). Users claim via GitHub OAuth +
-- token-count verification at /api/v1/claim. Opt-out anonymizes via
-- delete_account() RPC (migration 0020).
--
-- Snapshot date: ${snapshotDate}. Window: 30d. Ruleset: 1.0.
-- ============================================================================

-- ── operators ──
INSERT INTO operators (codename, display_name, handle, current_supporter_tier, verification_status, primary_domain, account_age_days, total_messages_lifetime, claimed)
VALUES
${opValues}
ON CONFLICT (codename) DO NOTHING;

-- ── metric_snapshots ──
INSERT INTO metric_snapshots (operator_id, snapshot_date, window_type, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, signa_rate, compression_ratio, prompt_complexity, cross_thread, session_depth, token_throughput, signal_force, class_tier, last_seen, recency_modifier, live_signa_rate, movement_24h, movement_7d, ruleset_version)
SELECT o.operator_id, DATE '${snapshotDate}', '30d', v.input, v.output, v.cc, v.cr, v.signa, v.comp, v.pc, v.ct, v.sd, v.tt, v.sf, v.cls, TIMESTAMPTZ '${snapshotDate}T00:00:00Z', 1.00, v.signa, 0, 0, '1.0'
FROM (VALUES
${snapValues}
) AS v(codename, input, output, cc, cr, signa, comp, pc, ct, sd, tt, sf, cls)
JOIN operators o ON o.codename = v.codename
ON CONFLICT (operator_id, snapshot_date, window_type) DO NOTHING;

-- End of tokscale seed (${entries.length} operators).
`;

writeFileSync(outputPath, sql, "utf-8");
console.log(`✓ Generated ${outputPath}`);
console.log(`  ${entries.length} operators`);
console.log(`  Snapshot date: ${snapshotDate}`);
console.log(`  Class distribution:`);
const dist = {};
entries.forEach((e) => (dist[e.cls] = (dist[e.cls] || 0) + 1));
Object.entries(dist)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cls, n]) => console.log(`    ${cls}: ${n}`));
