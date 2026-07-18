#!/usr/bin/env node
/**
 * scripts/gen-field-analysis.mjs — Generate the field-analysis JSON for /field page.
 *
 * Reads:
 *   - tokscale-leaderboard.json (1,628 operators, the master scrape)
 *   - tokscale-bot-analysis.json (500 operators with outlier/suspect/human classification)
 *
 * Writes:
 *   - public/data/field-analysis.json (trimmed, with medians + IQR + ghost-ranks)
 *
 * Outlier handling: the 17 former bots/suspects are kept IN the operators array
 * with a `classification` field. They're not removed — they're part of the 130
 * outliers (113 from ratio analysis + 17 flagged). The 113 ratio outliers split
 * into 89 extreme-human (real output, near-zero input) and 24 replay/input-dump
 * (near-zero output, no cache reuse). Medians are computed on the 1,498 Human
 * Center of Mass (non-flagged minus ratio outliers). The `bots` array is kept
 * empty for backward compat.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Paths ──
// Research data lives in RNS (~/Desktop/SigRank), not in sigrank-app.
// The script runs from sigrank-app but reads from RNS.
const RNS_RESEARCH = resolve(process.env.HOME, "Desktop/SigRank/Devins_Plans/gtm/launch/research");
const LEADERBOARD_PATH = resolve(RNS_RESEARCH, "tokscale-leaderboard.json");
const BOT_ANALYSIS_PATH = resolve(RNS_RESEARCH, "tokscale-bot-analysis.json");
const OUTPUT_PATH = resolve(__dirname, "../public/data/field-analysis.json");

// ── Read source data ──
const leaderboard = JSON.parse(readFileSync(LEADERBOARD_PATH, "utf-8"));
const botAnalysis = JSON.parse(readFileSync(BOT_ANALYSIS_PATH, "utf-8"));

const allUsers = leaderboard.users;
const botUsers = botAnalysis.users;

// ── Build outlier handle sets ──
const botHandles = new Set(
  botUsers.filter((u) => u.classification === "bot").map((u) => u.handle)
);
const suspectHandles = new Set(
  botUsers.filter((u) => u.classification === "suspect").map((u) => u.handle)
);
const flaggedHandles = new Set([...botHandles, ...suspectHandles]);

console.log(`Total scraped: ${allUsers.length}`);
console.log(`Flagged outliers (former bots): ${botHandles.size} — ${[...botHandles].join(", ")}`);
console.log(`Flagged outliers (former suspects): ${suspectHandles.size}`);
console.log(`Human Center of Mass: ${allUsers.length - flaggedHandles.size}`);

// ── Compute derived metrics per operator ──
function computeMetrics(u) {
  const s = u.stats;
  const input = s.inputTokens || 0;
  const output = s.outputTokens || 0;
  const cacheRead = s.cacheReadTokens || 0;
  const cacheWrite = s.cacheWriteTokens || 0;
  const totalTokens = u.total_tokens || s.totalTokens || 0;
  const activeDays = s.activeDays || 1;
  const yield_ = u.seed_sigrank || (cacheRead * output) / (input * input || 1);
  const snr = input + output > 0 ? output / (input + output) : 0;
  const leverage = input > 0 ? cacheRead / input : 0;
  const velocity = input > 0 ? output / input : 0;
  const tokensPerDay = activeDays > 0 ? totalTokens / activeDays : 0;
  const compression = totalTokens > 0 ? (cacheRead + cacheWrite) / totalTokens : 0;
  const topPlatform = u.top_platforms?.[0] || u.platform_breakdown?.[0]?.platform || "unknown";

  return {
    handle: u.handle,
    display_name: u.display_name || u.handle,
    tokscale_rank: u.rank,
    total_tokens: totalTokens,
    input_tokens: input,
    output_tokens: output,
    cache_read_tokens: cacheRead,
    cache_write_tokens: cacheWrite,
    yield: Math.round(yield_ * 100) / 100,
    snr: Math.round(snr * 10000) / 10000,
    leverage: Math.round(leverage * 100) / 100,
    velocity: Math.round(velocity * 100) / 100,
    tokens_per_day: Math.round(tokensPerDay),
    compression: Math.round(compression * 10000) / 10000,
    active_days: activeDays,
    session_count: s.sessionCount || 0,
    platform: topPlatform,
    op_ratio: u.operating_ratio || "",
    sigrank_yield: yield_,
  };
}

// ── Build operators array (all 1,628, flagged outliers get classification) ──
const operators = [];
const nonFlagged = []; // 1,611 operators (excludes 17 flagged)

for (const u of allUsers) {
  const metrics = computeMetrics(u);
  if (flaggedHandles.has(u.handle)) {
    const flaggedData = botUsers.find((b) => b.handle === u.handle);
    operators.push({
      ...metrics,
      classification: botHandles.has(u.handle) ? "bot" : "suspect",
      bot_score: flaggedData?.bot_score || 0,
      signals: flaggedData?.signals || [],
    });
  } else {
    operators.push(metrics);
    nonFlagged.push(metrics);
  }
}

// ── Classify ratio-based outliers (113 from input/total ratio analysis) ──
// Zone 0: input/total < 0.1% — near-zero input
// Zone 1: input/total > 80% — input dumpers
// Gray zone: 0.1–1% input — split by MOSES-like filter
//   Pass: velocity ≤ 2, yield ≤ 1000, output > 1M, cache_write > 1M → stays in HCM
//   Fail: joins outliers
// Total ratio outliers: zone0 + zone1 + gray_fail = 64 + 11 + 38 = 113
const RATIO_OUTLIER_COUNT = 113;
const ratioOutlierHandles = new Set();

for (const o of nonFlagged) {
  const inputRatio = o.total_tokens > 0 ? o.input_tokens / o.total_tokens : 0;
  if (inputRatio < 0.001) {
    // Zone 0: all 64 are ratio outliers (split into extreme/replay, but all excluded from HCM)
    ratioOutlierHandles.add(o.handle);
  } else if (inputRatio > 0.8) {
    // Zone 1: input dumpers
    ratioOutlierHandles.add(o.handle);
  } else if (inputRatio >= 0.001 && inputRatio < 0.01) {
    // Gray zone: apply MOSES-like filter
    const passesMoses =
      o.velocity <= 2 &&
      o.yield <= 1000 &&
      o.output_tokens > 1_000_000 &&
      o.cache_write_tokens > 1_000_000;
    if (!passesMoses) {
      ratioOutlierHandles.add(o.handle);
    }
  }
}

console.log(`Ratio outliers (from input/total analysis): ${ratioOutlierHandles.size}`);

// Human Center of Mass: non-flagged minus ratio outliers = 1611 - 113 = 1498
const humans = nonFlagged.filter((o) => !ratioOutlierHandles.has(o.handle));
console.log(`Human Center of Mass (for medians): ${humans.length}`);

// ── Compute medians ──
function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function quartiles(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  // Linear interpolation (Type 7 — R/default, numpy default, Excel PERCENTILE)
  // pos = p * (n - 1), interpolate between floor and ceil
  const interp = (p) => {
    const pos = p * (n - 1);
    const lo = Math.floor(pos);
    const hi = Math.min(lo + 1, n - 1);
    const frac = pos - lo;
    return sorted[lo] + frac * (sorted[hi] - sorted[lo]);
  };
  const q1 = interp(0.25);
  const q3 = interp(0.75);
  const iqr = q3 - q1;
  return {
    q1,
    q3,
    iqr,
    lower: q1 - 1.5 * iqr,
    upper: q3 + 1.5 * iqr,
  };
}

// Compute medians from ROUNDED per-operator values, then floor to deployed precision.
// (The deployed JSON computes medians from the rounded per-operator fields, not raw values,
//  and uses Math.floor for the final rounding — e.g. yield median 1.685 → 1.68, not 1.69.)
const r = (v, d) => Math.floor(v * 10 ** d) / 10 ** d;
const medians = {
  yield: r(median(humans.map((h) => h.yield)), 2),
  // SNR median computed from raw input/output tokens (per-operator snr is only 4 decimals,
  // but the deployed median has 6 — so compute from raw integer token values)
  snr: r(median(humans.map((h) => (h.input_tokens + h.output_tokens > 0 ? h.output_tokens / (h.input_tokens + h.output_tokens) : 0))), 6),
  leverage: r(median(humans.map((h) => h.leverage)), 2),
  velocity: r(median(humans.map((h) => h.velocity)), 2),
  tokens_per_day: r(median(humans.map((h) => h.tokens_per_day)), 0),
  total_tokens: r(median(humans.map((h) => h.total_tokens)), 0),
  // cache_read_pct: median(CR/total) — the share of total tokens that are cache reads.
  // NOTE: This is DIFFERENT from the per-operator `compression` field, which is (CR+CW)/total.
  // The old deployed JSON labeled this "compression" but it was actually CR/total. Renamed
  // for clarity. See blog [22a] for context.
  cache_read_pct: r(median(humans.map((h) => (h.total_tokens > 0 ? h.cache_read_tokens / h.total_tokens : 0))), 4),
};

const iqrFences = {
  yield: quartiles(humans.map((h) => h.yield)),
  snr: quartiles(humans.map((h) => h.snr)),
  leverage: quartiles(humans.map((h) => h.leverage)),
  velocity: quartiles(humans.map((h) => h.velocity)),
  tokens_per_day: quartiles(humans.map((h) => h.tokens_per_day)),
  total_tokens: quartiles(humans.map((h) => h.total_tokens)),
};

console.log("\nMedians (humans only):");
console.log(`  Yield Υ: ${medians.yield}`);
console.log(`  SNR: ${(medians.snr * 100).toFixed(1)}%`);
console.log(`  Leverage: ${medians.leverage}×`);
console.log(`  Velocity: ${medians.velocity}×`);
console.log(`  Tokens/day: ${(medians.tokens_per_day / 1e6).toFixed(1)}M`);
console.log(`  Total tokens: ${(medians.total_tokens / 1e9).toFixed(2)}B`);

// ── Compute ghost-ranks (Q2: below-median volume, above-median yield) ──
const ghostRanks = humans
  .filter((h) => h.total_tokens < medians.total_tokens && h.yield > medians.yield)
  .sort((a, b) => b.yield - a.yield)
  .slice(0, 50)
  .map((h) => ({
    handle: h.handle,
    display_name: h.display_name,
    tokscale_rank: h.tokscale_rank,
    yield: h.yield,
    total_tokens: h.total_tokens,
    platform: h.platform,
  }));

console.log(`\nGhost-ranks (Q2): ${ghostRanks.length} operators`);
console.log(`  Top ghost: ${ghostRanks[0]?.handle} (tokscale #${ghostRanks[0]?.tokscale_rank}, yield ${ghostRanks[0]?.yield})`);

// ── Compute yield quartiles for box plot ──
const sortedByYield = [...humans].sort((a, b) => a.yield - b.yield);
const q1End = Math.floor(sortedByYield.length * 0.25);
const q2End = Math.floor(sortedByYield.length * 0.5);
const q3End = Math.floor(sortedByYield.length * 0.75);
const yieldQuartiles = [
  { label: "Q1 (low)", data: sortedByYield.slice(0, q1End) },
  { label: "Q2", data: sortedByYield.slice(q1End, q2End) },
  { label: "Q3", data: sortedByYield.slice(q2End, q3End) },
  { label: "Q4 (high)", data: sortedByYield.slice(q3End) },
].map((q) => ({
  label: q.label,
  yield: quartiles(q.data.map((d) => d.yield)),
  leverage: quartiles(q.data.map((d) => d.leverage)),
  velocity: quartiles(q.data.map((d) => d.velocity)),
  snr: quartiles(q.data.map((d) => d.snr)),
  tokens_per_day: quartiles(q.data.map((d) => d.tokens_per_day)),
}));

// ── Platform adoption ──
const platformCounts = {};
for (const h of humans) {
  for (const p of h.platform ? [h.platform] : []) {
    platformCounts[p] = (platformCounts[p] || 0) + 1;
  }
}
// Also count from top_platforms
for (const u of allUsers) {
  if (flaggedHandles.has(u.handle)) continue;
  for (const p of u.top_platforms || []) {
    platformCounts[p] = (platformCounts[p] || 0) + 1;
  }
}
const platformAdoption = Object.entries(platformCounts)
  .map(([platform, count]) => ({ platform, count }))
  .sort((a, b) => b.count - a.count);

// ── Notable operators for cascade composition chart ──
const notableHandles = ["sadw1q", "mbeato", "DHxWhy", "grenadeoftacoss"];
const notable = allUsers
  .filter((u) => notableHandles.includes(u.handle))
  .map((u) => computeMetrics(u));

// ── Build output ──
const FLAGGED_COUNT = flaggedHandles.size; // 17 former bots/suspects
const EXTREME_OUTLIER_COUNT = 113; // from input/total ratio analysis
const OUTLIER_COUNT = EXTREME_OUTLIER_COUNT + FLAGGED_COUNT; // 130 total
const output = {
  meta: {
    scraped_at: leaderboard.scraped_at,
    source: leaderboard.source,
    total_scraped: allUsers.length,
    humans_included: allUsers.length - OUTLIER_COUNT, // 1628 - 130 = 1498
    outliers: OUTLIER_COUNT,
    medians,
    iqr_fences: iqrFences,
  },
  operators,
  bots: [], // deprecated — kept for backward compat
  ghost_ranks: ghostRanks,
  yield_quartiles: yieldQuartiles,
  platform_adoption: platformAdoption,
  notable_operators: notable,
};

// ── Write ──
mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
const json = JSON.stringify(output);
writeFileSync(OUTPUT_PATH, json);
const sizeMB = (Buffer.byteLength(json) / 1e6).toFixed(2);
console.log(`\nWritten: ${OUTPUT_PATH} (${sizeMB} MB)`);
