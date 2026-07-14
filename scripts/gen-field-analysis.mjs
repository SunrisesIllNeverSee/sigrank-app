#!/usr/bin/env node
/**
 * scripts/gen-field-analysis.mjs — Generate the bot-filtered field-analysis JSON for /field page.
 *
 * Reads:
 *   - tokscale-leaderboard.json (1,628 operators, the master scrape)
 *   - tokscale-bot-analysis.json (500 operators with bot/suspect/human classification)
 *
 * Writes:
 *   - public/data/field-analysis.json (trimmed, bot-filtered, with medians + IQR + ghost-ranks)
 *
 * Bot filtering: removes 2 confirmed bots + 15 suspects from the distribution data.
 * They're kept in a separate `bots` array for the bot detection callout.
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

// ── Build bot/suspect handle sets ──
const botHandles = new Set(
  botUsers.filter((u) => u.classification === "bot").map((u) => u.handle)
);
const suspectHandles = new Set(
  botUsers.filter((u) => u.classification === "suspect").map((u) => u.handle)
);
const excludeHandles = new Set([...botHandles, ...suspectHandles]);

console.log(`Total scraped: ${allUsers.length}`);
console.log(`Bots excluded: ${botHandles.size} — ${[...botHandles].join(", ")}`);
console.log(`Suspects excluded: ${suspectHandles.size}`);
console.log(`Humans included: ${allUsers.length - excludeHandles.size}`);

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
  const snr = totalTokens > 0 ? output / totalTokens : 0;
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

// ── Split into humans + bots ──
const humans = [];
const bots = [];

for (const u of allUsers) {
  const metrics = computeMetrics(u);
  if (botHandles.has(u.handle)) {
    const botData = botUsers.find((b) => b.handle === u.handle);
    bots.push({
      ...metrics,
      classification: "bot",
      bot_score: botData?.bot_score || 0,
      signals: botData?.signals || [],
    });
  } else if (suspectHandles.has(u.handle)) {
    const suspectData = botUsers.find((b) => b.handle === u.handle);
    bots.push({
      ...metrics,
      classification: "suspect",
      bot_score: suspectData?.bot_score || 0,
      signals: suspectData?.signals || [],
    });
  } else {
    humans.push(metrics);
  }
}

// ── Compute medians ──
function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function quartiles(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  return {
    q1,
    q3,
    iqr,
    lower: q1 - 1.5 * iqr,
    upper: q3 + 1.5 * iqr,
  };
}

const medians = {
  yield: median(humans.map((h) => h.yield)),
  snr: median(humans.map((h) => h.snr)),
  leverage: median(humans.map((h) => h.leverage)),
  velocity: median(humans.map((h) => h.velocity)),
  tokens_per_day: median(humans.map((h) => h.tokens_per_day)),
  total_tokens: median(humans.map((h) => h.total_tokens)),
  compression: median(humans.map((h) => h.compression)),
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
  if (excludeHandles.has(u.handle)) continue;
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
const output = {
  meta: {
    scraped_at: leaderboard.scraped_at,
    source: leaderboard.source,
    total_scraped: allUsers.length,
    bots_removed: botHandles.size,
    suspects_removed: suspectHandles.size,
    humans_included: humans.length,
    medians,
    iqr_fences: iqrFences,
  },
  operators: humans,
  bots,
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
