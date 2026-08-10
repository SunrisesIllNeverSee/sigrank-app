#!/usr/bin/env node
/**
 * scripts/gen-build-archetypes.mjs — Regenerate the 10 build archetypes.
 *
 * Replaces the K-Means population clusters (gen-archetypes.mjs) with a
 * deterministic 10-type classifier where each type is defined by a different
 * primary dimension of the token cascade.
 *
 * Classification order (priority — first match wins):
 *   1. CONVERGENT         — P80 on all 3: leverage + velocity + construction
 *   2. KINETIC PRODUCER    — velocity >= 0.8
 *   3. RAW INJECTOR        — leverage < 5
 *   4. CACHE WARMING       — leverage 5-10
 *   5. SHALLOW READER      — leverage 10-15, passive (construction < 0.02)
 *   6. READER              — leverage 15-23, passive
 *   7. ARCHIVAL            — leverage 23+, passive
 *   8. BUILDER             — construction >= 0.02, leverage < 30
 *   9. RECURSIVE MOMENTUM  — construction >= 0.02, leverage 30-50
 *  10. COMPOUND AMPLIFIER  — construction >= 0.02, leverage 50+
 *
 * Reads:
 *   - public/data/field-analysis.json (committed; raw token pillars + derived
 *     metrics + classification for flagged operators)
 *   - public/data/board-all_time.json (for sample_handles filtering — only
 *     include handles that have live /user/* profiles)
 *
 * Population:
 *   HCM — Human Center of Mass = FULL minus flagged + ratio outliers
 *   (input/total >= 0.5 are ratio outliers, same cut as gen-archetypes.mjs)
 *
 * Writes:
 *   - public/data/archetypes.json (canonical: 10 build archetypes)
 *   - public/data/archetype-labels-hcm.json (handle → archetype, HCM)
 *
 * Deterministic: same input → same output. No randomness, no K-Means.
 *
 * Usage: node scripts/gen-build-archetypes.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const FIELD_ANALYSIS_PATH = resolve(ROOT, "public/data/field-analysis.json");
const BOARD_SNAPSHOT_PATH = resolve(ROOT, "public/data/board-all_time.json");
const ARCHETYPES_PATH = resolve(ROOT, "public/data/archetypes.json");
const LABELS_PATH = resolve(ROOT, "public/data/archetype-labels-hcm.json");

// ── Classification thresholds ──────────────────────────────────────────────

// P80 thresholds calibrated from HCM cut (1,586 operators).
const CONVERGENT_T = { levP80: 74.6, velP80: 0.34, constrP80: 0.0431 };

const VEL_OUTPUT = 0.8;
const LEV_INPUT_LOW = 5;
const LEV_INPUT_HIGH = 10;
const LEV_READ_LOW = 15;
const LEV_READ_HIGH = 23;
const CONSTR_ACTIVE = 0.02;
const LEV_COMPOUND_LOW = 30;
const LEV_COMPOUND_HIGH = 50;

// ── Archetype metadata ─────────────────────────────────────────────────────

const ARCHETYPE_META = [
  {
    archetype_id: 0,
    key: "convergent",
    name: "CONVERGENT",
    description:
      "Elite on all three axes — deep reuse, active construction, and high generation. The rare operator who breaks the tradeoffs.",
    defined_by: "multi-axis (P80 on leverage + velocity + construction)",
  },
  {
    archetype_id: 1,
    key: "kinetic-producer",
    name: "KINETIC PRODUCER",
    description:
      "Output exceeds input — generating more than consumed. High velocity, the engine of the field.",
    defined_by: "output (velocity >= 0.8)",
  },
  {
    archetype_id: 2,
    key: "raw-injector",
    name: "RAW INJECTOR",
    description:
      "High input proportion, barely any cache reuse. Tokens going in, not much coming back.",
    defined_by: "input (leverage < 5)",
  },
  {
    archetype_id: 3,
    key: "cache-warming",
    name: "CACHE WARMING",
    description:
      "Reuse is forming but shallow. Cache is starting to build, still finding its rhythm.",
    defined_by: "input (leverage 5-10)",
  },
  {
    archetype_id: 4,
    key: "shallow-reader",
    name: "SHALLOW READER",
    description:
      "Moderate cache reads, passive consumption. Reading context but not building new context.",
    defined_by: "cache_read (leverage 10-15, passive)",
  },
  {
    archetype_id: 5,
    key: "reader",
    name: "READER",
    description:
      "Solid cache reuse, still passive. Holds context well, executes little with it.",
    defined_by: "cache_read (leverage 15-23, passive)",
  },
  {
    archetype_id: 6,
    key: "archival",
    name: "ARCHIVAL",
    description:
      "Extreme cache reuse — near-total reads, deep context library. Holds everything, generates little.",
    defined_by: "cache_read (leverage 23+, passive)",
  },
  {
    archetype_id: 7,
    key: "builder",
    name: "BUILDER",
    description:
      "Actively writing cache, building new context. Construction is happening, reuse is moderate.",
    defined_by: "cache_write (construction >= 0.02, leverage < 30)",
  },
  {
    archetype_id: 8,
    key: "recursive-momentum",
    name: "RECURSIVE MOMENTUM",
    description:
      "Building on built — the feedback loop. Deep reuse plus active construction, compounding forward.",
    defined_by: "compound (construction >= 0.02, leverage 30-50)",
  },
  {
    archetype_id: 9,
    key: "compound-amplifier",
    name: "COMPOUND AMPLIFIER",
    description:
      "The loop at scale — massive context library, still growing. Returns amplifying on returns.",
    defined_by: "compound (construction >= 0.02, leverage 50+)",
  },
];

// ── Classifier ─────────────────────────────────────────────────────────────

function classify(o) {
  const i = o.input_tokens || 0;
  const out = o.output_tokens || 0;
  const cr = o.cache_read_tokens || 0;
  const cw = o.cache_write_tokens || 0;

  const leverage = cr / i || 0;
  const velocity = out / i || 0;
  const construction = cw / cr || 0;

  // 1. CONVERGENT — P80 on all 3
  if (
    leverage > CONVERGENT_T.levP80 &&
    velocity > CONVERGENT_T.velP80 &&
    construction > CONVERGENT_T.constrP80
  ) {
    return "convergent";
  }

  // 2. KINETIC PRODUCER — output
  if (velocity >= VEL_OUTPUT) {
    return "kinetic-producer";
  }

  // 3-4. Input types
  if (leverage < LEV_INPUT_LOW) return "raw-injector";
  if (leverage < LEV_INPUT_HIGH) return "cache-warming";

  // 5-7. Cache read types (passive)
  if (construction < CONSTR_ACTIVE) {
    if (leverage < LEV_READ_LOW) return "shallow-reader";
    if (leverage < LEV_READ_HIGH) return "reader";
    return "archival";
  }

  // 8. Builder
  if (leverage < LEV_COMPOUND_LOW) return "builder";

  // 9-10. Compounder
  if (leverage < LEV_COMPOUND_HIGH) return "recursive-momentum";
  return "compound-amplifier";
}

// ── Helpers ────────────────────────────────────────────────────────────────

const median = (arr) => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const pct = (part, whole) => (whole > 0 ? (part / whole) * 100 : 0);

function topPlatform(ops) {
  const counts = {};
  for (const o of ops) {
    const p = o.platform || "unknown";
    counts[p] = (counts[p] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "unknown";
}

function clusterStats(ops, meta, boardCodenames) {
  const n = ops.length;
  if (n === 0) return null;

  const totalTokens = ops.map((o) => o.total_tokens || 0);
  const tokensPerDay = ops.map((o) => o.tokens_per_day || 0);
  const yields = ops.map((o) => o.yield || 0);
  const leverages = ops.map((o) => (o.cache_read_tokens || 0) / (o.input_tokens || 1));
  const velocities = ops.map((o) => (o.output_tokens || 0) / (o.input_tokens || 1));
  const snrs = ops.map((o) => o.snr || 0);

  const inputPcts = ops.map((o) => pct(o.input_tokens || 0, o.total_tokens || 1));
  const outputPcts = ops.map((o) => pct(o.output_tokens || 0, o.total_tokens || 1));
  const cacheReadPcts = ops.map((o) => pct(o.cache_read_tokens || 0, o.total_tokens || 1));
  const cacheWritePcts = ops.map((o) => pct(o.cache_write_tokens || 0, o.total_tokens || 1));

  // Sample handles: pick up to 5 that exist on the board
  const sampleHandles = ops
    .map((o) => o.handle)
    .filter((h) => boardCodenames.has(h))
    .slice(0, 5);

  return {
    archetype_id: meta.archetype_id,
    key: meta.key,
    name: meta.name,
    description: meta.description,
    defined_by: meta.defined_by,
    n,
    yield_median: Math.round(median(yields) * 100) / 100,
    leverage_median: Math.round(median(leverages) * 100) / 100,
    velocity_median: Math.round(median(velocities) * 1000) / 1000,
    snr_median: Math.round(median(snrs) * 10000) / 10000,
    input_pct: Math.round(median(inputPcts) * 100) / 100,
    output_pct: Math.round(median(outputPcts) * 100) / 100,
    cache_read_pct: Math.round(median(cacheReadPcts) * 100) / 100,
    cache_write_pct: Math.round(median(cacheWritePcts) * 100) / 100,
    total_tokens_median: Math.round(median(totalTokens)),
    tokens_per_day_median: Math.round(median(tokensPerDay)),
    top_platform: topPlatform(ops),
    sample_handles: sampleHandles,
  };
}

// ── Main ───────────────────────────────────────────────────────────────────

const field = JSON.parse(readFileSync(FIELD_ANALYSIS_PATH, "utf8"));
const board = JSON.parse(readFileSync(BOARD_SNAPSHOT_PATH, "utf8"));

// Board codenames for sample_handles filtering
const boardCodenames = new Set(
  (board.operators || []).map((o) => o.codename || o.handle).filter(Boolean),
);

// HCM cut: drop flagged + ratio outliers (input/total >= 0.5)
const allOps = field.operators || [];
const hcmOps = allOps.filter((o) => {
  if (o.classification === "flagged") return false;
  const total = o.total_tokens || 1;
  const inputRatio = (o.input_tokens || 0) / total;
  return inputRatio < 0.5;
});

console.error(`Field analysis: ${allOps.length} operators`);
console.error(`HCM cut: ${hcmOps.length} operators`);

// Classify all HCM operators
const byArchetype = {};
const labels = {};
for (const o of hcmOps) {
  const key = classify(o);
  if (!byArchetype[key]) byArchetype[key] = [];
  byArchetype[key].push(o);
  labels[o.handle] = key;
}

// Build archetype stats in order
const archetypes = [];
for (const meta of ARCHETYPE_META) {
  const ops = byArchetype[meta.key] || [];
  const stats = clusterStats(ops, meta, boardCodenames);
  if (stats) {
    archetypes.push(stats);
    console.error(`  ${meta.name.padEnd(20)} ${String(ops.length).padStart(5)}  ${pct(ops.length, hcmOps.length).toFixed(1)}%`);
  } else {
    console.error(`  ${meta.name.padEnd(20)}     0  (empty)`);
  }
}

// Write archetypes.json
const output = {
  method: "deterministic_build_archetypes",
  description:
    "10 build archetypes classified by token cascade dimensions. Each type is defined by a different primary dimension. Replaces the K-Means population clusters.",
  population: "human_center_of_mass",
  n_operators: allOps.length,
  n_clustered: hcmOps.length,
  n_human_center_of_mass: hcmOps.length,
  n_archetypes: archetypes.length,
  thresholds: {
    convergent: CONVERGENT_T,
    velocity_output: VEL_OUTPUT,
    leverage_input_low: LEV_INPUT_LOW,
    leverage_read_low: LEV_READ_LOW,
    leverage_read_high: LEV_READ_HIGH,
    construction_active: CONSTR_ACTIVE,
    leverage_compound_low: LEV_COMPOUND_LOW,
    leverage_compound_high: LEV_COMPOUND_HIGH,
  },
  silhouette: null, // Not applicable — deterministic classifier, not clustering
  archetypes,
};

writeFileSync(ARCHETYPES_PATH, JSON.stringify(output, null, 2) + "\n");
console.error(`\nWrote ${ARCHETYPES_PATH}`);

// Write labels
writeFileSync(LABELS_PATH, JSON.stringify(labels, null, 2) + "\n");
console.error(`Wrote ${LABELS_PATH}`);
