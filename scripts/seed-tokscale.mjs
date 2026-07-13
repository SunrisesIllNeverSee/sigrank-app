#!/usr/bin/env node
/**
 * scripts/seed-tokscale.mjs — generate a Supabase seed migration from a tokscale scrape CSV.
 *
 * Supports TWO CSV formats:
 *
 * 1. SIMPLE (one row per user, single platform):
 *    handle,display_name,input_tokens,output_tokens,cache_creation_tokens,cache_read_tokens[,platform][,account_age_days][,total_messages_lifetime]
 *
 * 2. MULTI-PLATFORM (one row per user×provider, multiple rows per user):
 *    handle,display_name,provider,input_tokens,output_tokens,cache_creation_tokens,cache_read_tokens,reasoning_tokens,cost[,account_age_days][,total_messages_lifetime]
 *
 * The script auto-detects the format from the header:
 *   - If "provider" column exists → multi-platform mode
 *   - Otherwise → simple mode
 *
 * In multi-platform mode:
 *   - Groups rows by handle
 *   - Creates one operator row with operator_domains = [all providers], primary_domain = dominant or "multi"
 *   - Creates one metric_snapshots row per provider (with that provider's 4 pillars)
 *   - Creates one "multi" snapshot with summed pillars (the board prefers this)
 *   - Maps tokscale provider names to our platform enum (see PROVIDER_MAP below)
 *
 * Usage:
 *   node scripts/seed-tokscale.mjs <input.csv> [output.sql]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ── Tokscale provider/platform name → our platform enum ──
// Covers both the per-provider names (from profile pages: "Claude Code", "Codex CLI")
// and the platform_breakdown names (from leaderboard JSON: "anthropic", "openai", etc.)
const PROVIDER_MAP = {
  // Provider names (from profile pages)
  "claude code": "claude",
  "claude": "claude",
  "codex cli": "codex",
  "codex": "codex",
  "chatgpt": "chatgpt",
  "openai": "chatgpt",
  "gemini": "gemini",
  "google": "gemini",
  "pi": "pi",
  "grok build": "other",
  "grok": "other",
  "hermes agent": "other",
  "hermes": "other",
  "opencode": "other",
  "gajae code": "other",
  "antigravity cli": "other",
  "antigravity": "other",
  "unattributed": "other",
  // Platform names (from leaderboard JSON platform_breakdown)
  "anthropic": "claude",
  "xai": "other",
  "deepseek": "other",
  "zhipu": "other",
  "alibaba": "other",
  "moonshot": "other",
  "minimax": "other",
  "mistral": "other",
  "nvidia": "other",
  "xiaomi": "other",
  "bytedance": "other",
  "cohere": "other",
  "tencent": "other",
  "unknown": "other",
  "multi": "multi",
};

/** Map a tokscale provider name to our platform enum. */
function mapProvider(raw) {
  const key = raw.toLowerCase().trim();
  return PROVIDER_MAP[key] ?? "other";
}

// ── Cascade computation (mirrors lib/ingest/bridge.ts computeCascadeMetrics) ──
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

function placeholders(c) {
  const signa = Math.min(99, Math.max(1, Math.log10(c.efficiency + 1) * 30));
  const comp = Math.min(0.99, Math.max(0.01, c.snr));
  const pc = Math.min(100, Math.max(1, c.scaleV * 5));
  const ct = Math.min(100, Math.max(0, Math.round(c.leverage / 10)));
  const sd = Math.min(30, Math.max(1, c.dev10x * 5));
  const tt = Math.min(100000, Math.round(c.total / 1000));
  const sf = Math.min(100, Math.max(0.1, Math.log10(c.yield_ + 1) * 10));
  return { signa, comp, pc, ct, sd, tt, sf };
}

function slugify(handle) {
  return handle
    .replace(/^@+/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

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
  console.error("Usage: node scripts/seed-tokscale.mjs <input.csv|input.json> [output.sql]");
  console.error("");
  console.error("JSON:        tokscale leaderboard JSON (users[] with stats + platform_breakdown)");
  console.error("Simple CSV:  handle,display_name,input_tokens,output_tokens,cache_creation_tokens,cache_read_tokens[,platform][,account_age_days][,total_messages_lifetime]");
  console.error("Multi CSV:   handle,display_name,provider,input_tokens,output_tokens,cache_creation_tokens,cache_read_tokens[,reasoning_tokens][,cost][,account_age_days][,total_messages_lifetime]");
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

const raw = readFileSync(inputPath, "utf-8");
const isJson = inputPath.endsWith(".json") || raw.trimStart().startsWith("{");

// ── Parse input: JSON (tokscale leaderboard) or CSV ──
let parsedRows; // normalized to { handle, display_name, provider?, input, output, cacheCreate, cacheRead, platform?, ageDays, totalMessages, domains? }
let isMultiPlatform;

if (isJson) {
  const data = JSON.parse(raw);
  const users = data.users ?? (Array.isArray(data) ? data : []);
  if (users.length === 0) {
    console.error("No users found in JSON.");
    process.exit(1);
  }
  isMultiPlatform = false; // JSON data is already aggregated — one snapshot per user
  parsedRows = users.map((u) => {
    const s = u.stats ?? {};
    const platforms = (u.platform_breakdown ?? []).map((p) => mapProvider(p.platform));
    const distinctPlatforms = [...new Set(platforms)].filter((p) => p && p !== "other");
    // If only "other" platforms, use that; if mix of named + other, keep named
    const domains = distinctPlatforms.length > 0 ? distinctPlatforms : (platforms.length > 0 ? [...new Set(platforms)] : ["other"]);
    return {
      handle: u.handle,
      display_name: u.display_name || null,
      avatar_url: u.avatar_url || null,
      input: String(s.inputTokens ?? 0),
      output: String(s.outputTokens ?? 0),
      cacheCreate: String(s.cacheWriteTokens ?? 0),
      cacheRead: String(s.cacheReadTokens ?? 0),
      ageDays: String(s.activeDays ?? 30),
      totalMessages: String(s.sessionCount ?? 0),
      domains,
    };
  });
  console.log(`Parsed JSON: ${parsedRows.length} users`);
} else {
  const { header, rows } = parseCSV(raw);
  isMultiPlatform = header.includes("provider");
  // ... CSV path continues below
  parsedRows = rows;
}

// ── For CSV path: validate columns + track what's present ──
let header = null;
let hasInput, hasOutput, hasCacheCreate, hasCacheRead, hasPlatform, hasProvider, hasAge, hasMessages;
if (!isJson) {
  const parsed = parseCSV(raw);
  header = parsed.header;
  const csvRows = parsed.rows;
  isMultiPlatform = header.includes("provider");
  parsedRows = csvRows;

  const mustHave = isMultiPlatform ? ["handle", "provider"] : ["handle"];
  const missing = mustHave.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    console.error(`Missing required columns: ${missing.join(", ")}`);
    process.exit(1);
  }

  hasInput = header.includes("input_tokens");
  hasOutput = header.includes("output_tokens");
  hasCacheCreate = header.includes("cache_creation_tokens");
  hasCacheRead = header.includes("cache_read_tokens");
  hasPlatform = header.includes("platform");
  hasProvider = header.includes("provider");
  hasAge = header.includes("account_age_days");
  hasMessages = header.includes("total_messages_lifetime");

  if (!hasInput && !hasOutput && !hasCacheCreate && !hasCacheRead) {
    console.error("Warning: no token columns found. All operators will have 0 tokens.");
  }
}

const snapshotDate = new Date().toISOString().slice(0, 10);

// ── BigInt parser (handles commas, $, whitespace, empty cells) ──
const parseBigInt = (val) => {
  if (!val) return 0n;
  const cleaned = String(val).replace(/[,\s$]/g, "");
  try { return BigInt(cleaned || 0); } catch { return 0n; }
};

// ── Group rows by handle ──
const operators = new Map();
const seenSlugs = new Set();

for (const row of parsedRows) {
  const handle = row.handle;
  if (!handle) continue;

  const displayName = row.display_name || null;
  const avatarUrl = row.avatar_url || null;

  let slug = slugify(handle);
  if (seenSlugs.has(slug)) slug = `${slug}-${operators.size}`;
  seenSlugs.add(slug);

  if (isJson) {
    // JSON path: already aggregated, domains pre-computed from platform_breakdown
    const input = parseBigInt(row.input);
    const output = parseBigInt(row.output);
    const cacheCreate = parseBigInt(row.cacheCreate);
    const cacheRead = parseBigInt(row.cacheRead);
    const domains = row.domains ?? ["other"];
    const primaryDomain = domains.length > 1 ? "multi" : domains[0] ?? "other";

    operators.set(slug, {
      displayName,
      handle: handle.replace(/^@+/, ""),
      avatarUrl,
      domains,
      primaryDomain,
      ageDays: parseInt(row.ageDays || "30", 10),
      totalMessages: parseBigInt(row.totalMessages).toString(),
      providers: [{
        platform: primaryDomain,
        input: input.toString(),
        output: output.toString(),
        cacheCreate: cacheCreate.toString(),
        cacheRead: cacheRead.toString(),
      }],
    });
  } else if (isMultiPlatform) {
    // CSV multi-platform: group by handle, one snapshot per provider
    const input = parseBigInt(hasInput ? row.input_tokens : 0);
    const output = parseBigInt(hasOutput ? row.output_tokens : 0);
    const cacheCreate = parseBigInt(hasCacheCreate ? row.cache_creation_tokens : 0);
    const cacheRead = parseBigInt(hasCacheRead ? row.cache_read_tokens : 0);
    const provider = mapProvider(row.provider);

    if (!operators.has(slug)) {
      operators.set(slug, {
        displayName,
        handle: handle.replace(/^@+/, ""),
        avatarUrl: null,
        domains: [],
        ageDays: parseInt((hasAge ? row.account_age_days : null) || "30", 10),
        totalMessages: parseBigInt(hasMessages ? row.total_messages_lifetime : 0).toString(),
        providers: [],
      });
    }
    const op = operators.get(slug);
    if (!op.domains.includes(provider)) op.domains.push(provider);
    op.providers.push({
      platform: provider,
      input: input.toString(),
      output: output.toString(),
      cacheCreate: cacheCreate.toString(),
      cacheRead: cacheRead.toString(),
    });
  } else {
    // CSV simple: one row = one operator, single platform
    const input = parseBigInt(hasInput ? row.input_tokens : 0);
    const output = parseBigInt(hasOutput ? row.output_tokens : 0);
    const cacheCreate = parseBigInt(hasCacheCreate ? row.cache_creation_tokens : 0);
    const cacheRead = parseBigInt(hasCacheRead ? row.cache_read_tokens : 0);
    const platform = (hasPlatform ? row.platform : null) || "claude";

    operators.set(slug, {
      displayName,
      handle: handle.replace(/^@+/, ""),
      avatarUrl: null,
      domains: [platform],
      ageDays: parseInt((hasAge ? row.account_age_days : null) || "30", 10),
      totalMessages: parseBigInt(hasMessages ? row.total_messages_lifetime : 0).toString(),
      providers: [{
        platform,
        input: input.toString(),
        output: output.toString(),
        cacheCreate: cacheCreate.toString(),
        cacheRead: cacheRead.toString(),
      }],
    });
  }
}

// ── Build SQL entries ──
const opEntries = [];
const snapEntries = [];

for (const [codename, op] of operators) {
  // Determine primary_domain: use pre-computed (JSON) or derive from providers (CSV)
  const distinctPlatforms = [...new Set(op.providers.map((p) => p.platform))];
  const primaryDomain = op.primaryDomain ?? (distinctPlatforms.length > 1 ? "multi" : distinctPlatforms[0] || "claude");

  // Sort domains for deterministic output
  const domainsSorted = [...new Set(op.domains)].sort();

  opEntries.push({
    codename,
    display_name: op.displayName,
    handle: op.handle,
    avatar_url: op.avatarUrl,
    primary_domain: primaryDomain,
    operator_domains: domainsSorted,
    ageDays: op.ageDays,
    totalMessages: op.totalMessages,
  });

  // One snapshot per provider
  for (const p of op.providers) {
    const c = computeCascade(
      Number(p.input),
      Number(p.output),
      Number(p.cacheCreate),
      Number(p.cacheRead),
    );
    const cls = classFromYield(c.yield_, c.nonCompounding);
    const ph = placeholders(c);

    snapEntries.push({
      codename,
      handle: op.handle,
      platform: p.platform,
      input: p.input,
      output: p.output,
      cacheCreate: p.cacheCreate,
      cacheRead: p.cacheRead,
      signa: ph.signa.toFixed(1),
      comp: ph.comp.toFixed(3),
      pc: ph.pc.toFixed(0),
      ct: ph.ct.toString(),
      sd: ph.sd.toFixed(1),
      tt: ph.tt.toString(),
      sf: ph.sf.toFixed(1),
      cls,
    });
  }

  // If multi-platform: create a "multi" aggregated snapshot (summed pillars)
  if (distinctPlatforms.length > 1) {
    const sumInput = op.providers.reduce((a, p) => a + BigInt(p.input), 0n);
    const sumOutput = op.providers.reduce((a, p) => a + BigInt(p.output), 0n);
    const sumCC = op.providers.reduce((a, p) => a + BigInt(p.cacheCreate), 0n);
    const sumCR = op.providers.reduce((a, p) => a + BigInt(p.cacheRead), 0n);

    const c = computeCascade(Number(sumInput), Number(sumOutput), Number(sumCC), Number(sumCR));
    const cls = classFromYield(c.yield_, c.nonCompounding);
    const ph = placeholders(c);

    snapEntries.push({
      codename,
      handle: op.handle,
      platform: "multi",
      input: sumInput.toString(),
      output: sumOutput.toString(),
      cacheCreate: sumCC.toString(),
      cacheRead: sumCR.toString(),
      signa: ph.signa.toFixed(1),
      comp: ph.comp.toFixed(3),
      pc: ph.pc.toFixed(0),
      ct: ph.ct.toString(),
      sd: ph.sd.toFixed(1),
      tt: ph.tt.toString(),
      sf: ph.sf.toFixed(1),
      cls,
    });
  }
}

// ── Generate SQL ──
// Handle collisions: the existing 10 seeds already use some real handles
// (IvGolovach, MapleEve, etc.) with fake codenames (IronLattice, EmberCoil).
// Strategy: insert new operators by codename, but if the handle already exists
// (ON CONFLICT (handle)), UPDATE the existing operator's real data instead.
// This upserts by handle — the existing seed operators get real token data,
// new operators get inserted fresh.

const opValues = opEntries
  .map(
    (e) =>
      `  ('${e.codename}', ${e.display_name ? `'${e.display_name.replace(/'/g, "''")}'` : "NULL"}, '${e.handle}', 'free', 'unverified', '${e.primary_domain}', ${e.ageDays}, ${e.totalMessages}, false, ARRAY['${e.operator_domains.join("','")}']::text[])`,
  )
  .join(",\n");

const snapValues = snapEntries
  .map(
    (e) =>
      `  ('${e.handle}', '${e.platform}', ${e.input}::bigint, ${e.output}::bigint, ${e.cacheCreate}::bigint, ${e.cacheRead}::bigint, '${e.cls}')`,
  )
  .join(",\n");

const sql = `-- ============================================================================
-- tokscale_seed_${snapshotDate}.sql — ${opEntries.length} tokscale operators seeded from scrape.
-- ${isMultiPlatform ? "Multi-platform: per-provider snapshots + aggregated 'multi' snapshot." : "Single-platform."}
--
-- Generated by scripts/seed-tokscale.mjs from ${args[0]}.
-- Idempotent. Each operator carries their REAL 4 token pillars (input, output,
-- cache_creation, cache_read); cascade/Υ is computed ON READ via
-- computeCascadeMetrics() — same path as the existing seeds.
--
-- Two-step upsert: the handle unique index is partial (WHERE handle IS NOT NULL),
-- so ON CONFLICT (handle) doesn't work. Instead:
--   Step 1: UPDATE existing operators (matching by handle) with real tokscale data
--   Step 2: INSERT new operators (handles not already in the DB)
--
-- Identity: real handles (slugified → codename, real name → display_name).
-- Claim model: unclaimed (claimed=false). Users claim via GitHub OAuth +
-- token-count verification at /api/v1/claim. Opt-out anonymizes via
-- delete_account() RPC (migration 0020).
--
-- Snapshot date: ${snapshotDate}. Window: 30d. Ruleset: 1.0.
-- ============================================================================

-- ── Step 1: UPDATE existing operators (handle match) with real tokscale data ──
-- The original 10 seeds used real handles with fake codenames (IronLattice, etc.).
-- This updates their display_name, primary_domain, operator_domains, account_age,
-- and total_messages with the real tokscale values. codename is NOT overwritten.
UPDATE operators o
SET
  display_name            = COALESCE(src.display_name, o.display_name),
  primary_domain          = src.primary_domain,
  operator_domains        = src.operator_domains,
  account_age_days        = src.account_age_days,
  total_messages_lifetime = src.total_messages_lifetime
FROM (VALUES
${opEntries.map((e) => `  ('${e.handle}', ${e.display_name ? `'${e.display_name.replace(/'/g, "''")}'` : "NULL"}, '${e.primary_domain}', ${e.ageDays}, ${e.totalMessages}, ARRAY['${e.operator_domains.join("','")}']::text[])`).join(",\n")}
) AS src(handle, display_name, primary_domain, account_age_days, total_messages_lifetime, operator_domains)
WHERE o.handle = src.handle;

-- ── Step 2: INSERT new operators (handles not already in the DB) ──
INSERT INTO operators (codename, display_name, handle, current_supporter_tier, verification_status, primary_domain, account_age_days, total_messages_lifetime, claimed, operator_domains)
SELECT v.codename, v.display_name, v.handle, 'free', 'unverified', v.primary_domain, v.account_age_days, v.total_messages_lifetime, false, v.operator_domains
FROM (VALUES
${opEntries.map((e) => `  ('${e.codename}', ${e.display_name ? `'${e.display_name.replace(/'/g, "''")}'` : "NULL"}, '${e.handle}', '${e.primary_domain}', ${e.ageDays}, ${e.totalMessages}, ARRAY['${e.operator_domains.join("','")}']::text[])`).join(",\n")}
) AS v(codename, display_name, handle, primary_domain, account_age_days, total_messages_lifetime, operator_domains)
WHERE v.handle NOT IN (SELECT handle FROM operators WHERE handle IS NOT NULL)
ON CONFLICT (codename) DO NOTHING;

-- ── metric_snapshots (keyed by handle → operator_id lookup) ──
-- Only the 4 raw token pillars + class_tier. No placeholder fields — the board
-- computes cascade (Υ, leverage, 10xDEV, etc.) on read from the 4 pillars.
INSERT INTO metric_snapshots (operator_id, snapshot_date, window_type, platform, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, class_tier, last_seen, recency_modifier, movement_24h, movement_7d, ruleset_version)
SELECT o.operator_id, DATE '${snapshotDate}', 'all', v.platform, v.input, v.output, v.cc, v.cr, v.cls, TIMESTAMPTZ '${snapshotDate}T00:00:00Z', 1.00, 0, 0, '1.0'
FROM (VALUES
${snapValues}
) AS v(handle, platform, input, output, cc, cr, cls)
JOIN operators o ON o.handle = v.handle
ON CONFLICT (operator_id, snapshot_date, window_type, platform) DO UPDATE SET
  input_tokens           = EXCLUDED.input_tokens,
  output_tokens          = EXCLUDED.output_tokens,
  cache_creation_tokens  = EXCLUDED.cache_creation_tokens,
  cache_read_tokens      = EXCLUDED.cache_read_tokens,
  class_tier             = EXCLUDED.class_tier,
  last_seen              = EXCLUDED.last_seen;

-- End of tokscale seed (${opEntries.length} operators, ${snapEntries.length} snapshots).
`;

writeFileSync(outputPath, sql, "utf-8");
console.log(`✓ Generated ${outputPath}`);
console.log(`  ${opEntries.length} operators, ${snapEntries.length} snapshots`);
console.log(`  Mode: ${isMultiPlatform ? "multi-platform" : "single-platform"}`);
console.log(`  Snapshot date: ${snapshotDate}`);
console.log(`  Class distribution:`);
const dist = {};
snapEntries.forEach((e) => (dist[e.cls] = (dist[e.cls] || 0) + 1));
Object.entries(dist)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cls, n]) => console.log(`    ${cls}: ${n}`));
console.log(`  Platform distribution:`);
const pdist = {};
snapEntries.forEach((e) => (pdist[e.platform] = (pdist[e.platform] || 0) + 1));
Object.entries(pdist)
  .sort((a, b) => b[1] - a[1])
  .forEach(([p, n]) => console.log(`    ${p}: ${n}`));
