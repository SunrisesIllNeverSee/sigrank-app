#!/usr/bin/env node
/**
 * scripts/gen-archetypes.mjs — Regenerate the operator archetypes from scratch.
 *
 * Reproducible, in-repo replacement for the original offline Python K-Means run
 * whose only surviving output was the aggregate medians in archetypes.json.
 *
 * Reads:
 *   - public/data/field-analysis.json (committed; raw token pillars + derived
 *     metrics + `classification` for the 17 flagged operators)
 *
 * Method (mirrors the documented two-stage hierarchy):
 *   Stage 1 — K-Means on log10(yield, leverage, velocity, snr) → yield tiers.
 *   Stage 2 — K-Means on token composition proportions (input%, output%,
 *             cache_read%, cache_write%) → shapes within each tier.
 *   Overlay — the Outliers archetype comes from the input/total ratio analysis
 *             plus the 17 flagged handles. It is an OVERLAY: an operator keeps
 *             its shape label AND carries the outlier label (dual membership).
 *
 * Populations (both are clustered, then compared):
 *   FULL — the whole scrape (canonical n = 1628, includes the owner's profile).
 *   HCM  — Human Center of Mass = FULL minus the 130 outliers (113 ratio
 *          outliers + 17 flagged), canonical n = 1498.
 *
 * Writes:
 *   - public/data/archetypes.json                  (canonical: FULL run)
 *   - public/data/archetype-labels-1628.json       (handle → archetype, FULL)
 *   - public/data/archetype-labels-1498.json       (handle → archetype, HCM)
 *   - public/data/archetype-centroids.json         (centroids + scalers, both runs)
 *   - methodology/archetype-comparison.md          (1628-vs-1498 report)
 *
 * Deterministic: seeded PRNG, fixed restart count. Re-running produces
 * byte-identical output for the same input file.
 *
 * Usage: node scripts/gen-archetypes.mjs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const FIELD_ANALYSIS_PATH = resolve(ROOT, "public/data/field-analysis.json");
const ARCHETYPES_PATH = resolve(ROOT, "public/data/archetypes.json");
const LABELS_FULL_PATH = resolve(ROOT, "public/data/archetype-labels-1628.json");
const LABELS_HCM_PATH = resolve(ROOT, "public/data/archetype-labels-1498.json");
const CENTROIDS_PATH = resolve(ROOT, "public/data/archetype-centroids.json");
const REPORT_PATH = resolve(ROOT, "methodology/archetype-comparison.md");

// Owner-confirmed canonical population sizes. The committed field-analysis.json
// snapshot carries one row fewer than the master scrape (the owner's own
// profile is not in the trimmed snapshot), so the clustering runs on what is in
// the repo while the published header reports the canonical counts.
const CANONICAL_N_FULL = 1628;
const CANONICAL_N_HCM = 1498;

const N_TIERS = 3; // Stage 1: yield tiers
const SHAPE_K_RANGE = [2, 3, 4]; // Stage 2: candidate shape counts per tier
const TARGET_SHAPES = 7; // total human shapes across tiers (the documented original)
const MIN_TIER_FOR_SPLIT = 20; // tiers smaller than this are not sub-clustered
const RESTARTS = 25;
const MAX_ITER = 300;
const SEED = 20260202;

// ── Deterministic PRNG (mulberry32) ──
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Small stats helpers ──
function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(arr) {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function round(value, digits) {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

function euclidean(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

/** Z-score standardisation. Returns the scaled matrix plus the scaler params. */
function standardize(rows) {
  const dims = rows[0].length;
  const means = [];
  const stds = [];
  for (let d = 0; d < dims; d++) {
    const col = rows.map((r) => r[d]);
    const m = mean(col);
    const variance = mean(col.map((v) => (v - m) ** 2));
    means.push(m);
    stds.push(Math.sqrt(variance) || 1);
  }
  const scaled = rows.map((r) => r.map((v, d) => (v - means[d]) / stds[d]));
  return { scaled, means, stds };
}

// ── K-Means (k-means++ init, Lloyd iterations, best-of-N restarts) ──
function kmeansOnce(rows, k, rng) {
  // k-means++ seeding
  const centroids = [rows[Math.floor(rng() * rows.length)].slice()];
  while (centroids.length < k) {
    const d2 = rows.map((r) => Math.min(...centroids.map((c) => euclidean(r, c) ** 2)));
    const total = d2.reduce((s, v) => s + v, 0);
    if (total === 0) {
      centroids.push(rows[Math.floor(rng() * rows.length)].slice());
      continue;
    }
    let target = rng() * total;
    let idx = 0;
    for (; idx < rows.length; idx++) {
      target -= d2[idx];
      if (target <= 0) break;
    }
    centroids.push(rows[Math.min(idx, rows.length - 1)].slice());
  }

  const dims = rows[0].length;
  let labels = new Array(rows.length).fill(-1);
  for (let iter = 0; iter < MAX_ITER; iter++) {
    let moved = false;
    for (let i = 0; i < rows.length; i++) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < k; c++) {
        const dist = euclidean(rows[i], centroids[c]);
        if (dist < bestDist) {
          bestDist = dist;
          best = c;
        }
      }
      if (labels[i] !== best) {
        labels[i] = best;
        moved = true;
      }
    }
    const sums = Array.from({ length: k }, () => new Array(dims).fill(0));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < rows.length; i++) {
      counts[labels[i]]++;
      for (let d = 0; d < dims; d++) sums[labels[i]][d] += rows[i][d];
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) {
        // Re-seed an empty cluster on the point furthest from its centroid.
        let far = 0;
        let farDist = -1;
        for (let i = 0; i < rows.length; i++) {
          const dist = euclidean(rows[i], centroids[labels[i]]);
          if (dist > farDist) {
            farDist = dist;
            far = i;
          }
        }
        centroids[c] = rows[far].slice();
        continue;
      }
      centroids[c] = sums[c].map((v) => v / counts[c]);
    }
    if (!moved) break;
  }

  let inertia = 0;
  for (let i = 0; i < rows.length; i++) inertia += euclidean(rows[i], centroids[labels[i]]) ** 2;
  return { labels, centroids, inertia };
}

function kmeans(rows, k, rng) {
  let best = null;
  for (let attempt = 0; attempt < RESTARTS; attempt++) {
    const run = kmeansOnce(rows, k, rng);
    if (!best || run.inertia < best.inertia) best = run;
  }
  return best;
}

/** Mean silhouette coefficient over all points (O(n²), fine at this scale). */
function silhouette(rows, labels) {
  const k = new Set(labels).size;
  if (k < 2 || rows.length < 3) return 0;
  const byCluster = new Map();
  labels.forEach((l, i) => {
    if (!byCluster.has(l)) byCluster.set(l, []);
    byCluster.get(l).push(i);
  });
  let total = 0;
  for (let i = 0; i < rows.length; i++) {
    const own = byCluster.get(labels[i]);
    if (own.length <= 1) continue; // singleton clusters contribute 0
    let a = 0;
    for (const j of own) if (j !== i) a += euclidean(rows[i], rows[j]);
    a /= own.length - 1;
    let b = Infinity;
    for (const [label, members] of byCluster) {
      if (label === labels[i]) continue;
      let d = 0;
      for (const j of members) d += euclidean(rows[i], rows[j]);
      d /= members.length;
      if (d < b) b = d;
    }
    total += (b - a) / Math.max(a, b);
  }
  return total / rows.length;
}

// ── Feature construction ──
const EPS = 1e-6;

/** Stable key per operator — one scrubbed row in the snapshot has a null handle. */
function opKey(op) {
  return op.handle ?? `tokscale-rank-${op.tokscale_rank}`;
}

/** Stage 1 features: log10 of the four yield-shaping metrics. */
function yieldFeatures(op) {
  return [
    Math.log10(Math.max(op.yield, 0) + EPS),
    Math.log10(Math.max(op.leverage, 0) + EPS),
    Math.log10(Math.max(op.velocity, 0) + EPS),
    Math.log10(Math.max(op.snr, 0) + EPS),
  ];
}

/** Stage 2 features: token composition as proportions of the four pillars. */
function compositionFeatures(op) {
  const pillars = [
    op.input_tokens || 0,
    op.output_tokens || 0,
    op.cache_read_tokens || 0,
    op.cache_write_tokens || 0,
  ];
  const sum = pillars.reduce((s, v) => s + v, 0) || 1;
  return pillars.map((v) => v / sum);
}

// ── Outlier derivation (identical rules to scripts/gen-field-analysis.mjs) ──
function splitPopulations(operators) {
  const flagged = new Set(
    operators.filter((o) => o.classification === "bot" || o.classification === "suspect").map(opKey)
  );
  const ratioOutliers = new Set();
  for (const o of operators) {
    if (flagged.has(opKey(o))) continue;
    const inputRatio = o.total_tokens > 0 ? o.input_tokens / o.total_tokens : 0;
    if (inputRatio < 0.001) {
      ratioOutliers.add(opKey(o)); // Zone 0: near-zero input
    } else if (inputRatio > 0.8) {
      ratioOutliers.add(opKey(o)); // Zone 1: input dumpers
    } else if (inputRatio < 0.01) {
      // Gray zone: MOSES-like filter decides
      const passesMoses =
        o.velocity <= 2 && o.yield <= 1000 && o.output_tokens > 1_000_000 && o.cache_write_tokens > 1_000_000;
      if (!passesMoses) ratioOutliers.add(opKey(o));
    }
  }
  const outliers = new Set([...flagged, ...ratioOutliers]);
  return { flagged, ratioOutliers, outliers };
}

// ── Naming: derive a stable, descriptive family name from a cluster's shape ──
function nameCluster(stats) {
  const { input_pct, output_pct, cache_read_pct, cache_write_pct, yield_median } = stats;
  if (input_pct >= 0.4) return "Input-Heavy Operators";
  if (output_pct >= 0.1) return "Steady Cascaders";
  if (cache_write_pct >= 0.05) return "Cache Builders";
  if (cache_read_pct >= 0.95) return "Cache Architects";
  if (cache_write_pct >= 0.025) return "Context Builders";
  if (yield_median >= 20) return "Cascade Operators";
  return "The Field";
}

const DESCRIPTIONS = {
  "Input-Heavy Operators":
    "High input proportion, low cache reuse — tokens going in, not much coming out",
  "Steady Cascaders": "Output-dense composition with moderate cache reuse, the upper mid-field",
  "Cache Builders": "High yield + active cache construction (building new context, not just reading it)",
  "Cache Architects": "Extreme cache reuse (near-total cache reads, near-zero fresh input)",
  "Cascade Operators": "High yield through balanced cache leverage and velocity",
  "Context Builders": "Moderate yield, actively building cache (elevated cache writes)",
  "The Field": "The human center of mass — moderate cache reuse, finding their rhythm",
};

// Base noun used when a family name has to be qualified by yield tier.
const BASE_LABEL = { "The Field": "Field" };
const TIER_QUALIFIER = ["Low-Yield", "Mid-Yield", "High-Yield"];

/**
 * Two clusters can share a composition family (e.g. two field-shaped clusters in
 * different yield tiers). The largest keeps the canonical family name; the rest
 * are qualified by their yield tier.
 */
function disambiguate(clusters) {
  const families = clusters.map((c) => nameCluster(c.stats));
  const counts = new Map();
  families.forEach((f) => counts.set(f, (counts.get(f) || 0) + 1));
  const canonicalIndex = new Map();
  families.forEach((f, i) => {
    const current = canonicalIndex.get(f);
    if (current === undefined || clusters[i].stats.n > clusters[current].stats.n) canonicalIndex.set(f, i);
  });
  return families.map((f, i) => {
    if (counts.get(f) === 1 || canonicalIndex.get(f) === i) return f;
    const qualifier = TIER_QUALIFIER[clusters[i].tier] ?? `Tier ${clusters[i].tier}`;
    return `${qualifier} ${BASE_LABEL[f] ?? f}`;
  });
}

// ── Cluster statistics ──
function clusterStats(members) {
  const comps = members.map(compositionFeatures);
  const platforms = new Map();
  for (const m of members) platforms.set(m.platform, (platforms.get(m.platform) || 0) + 1);
  const topPlatform = [...platforms.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "unknown";
  const sampleHandles = [...members]
    .filter((m) => m.handle)
    .sort((a, b) => b.total_tokens - a.total_tokens)
    .slice(0, 3)
    .map((m) => m.handle);

  return {
    n: members.length,
    yield_median: round(median(members.map((m) => m.yield)), 4),
    leverage_median: round(median(members.map((m) => m.leverage)), 4),
    velocity_median: round(median(members.map((m) => m.velocity)), 4),
    snr_median: round(median(members.map((m) => m.snr)), 6),
    input_pct: mean(comps.map((c) => c[0])),
    output_pct: mean(comps.map((c) => c[1])),
    cache_read_pct: mean(comps.map((c) => c[2])),
    cache_write_pct: mean(comps.map((c) => c[3])),
    total_tokens_median: median(members.map((m) => m.total_tokens)),
    tokens_per_day_median: median(members.map((m) => m.tokens_per_day)),
    top_platform: topPlatform,
    sample_handles: sampleHandles,
  };
}

// ── The two-stage run ──
function runClustering(operators, label) {
  const rng = makeRng(SEED);

  // Stage 1 — yield tiers
  const yieldRaw = operators.map(yieldFeatures);
  const yieldScaler = standardize(yieldRaw);
  const stage1 = kmeans(yieldScaler.scaled, N_TIERS, rng);
  const stage1Silhouette = silhouette(yieldScaler.scaled, stage1.labels);

  // Order tiers by median yield so tier indices are meaningful and stable.
  const tierOrder = Array.from({ length: N_TIERS }, (_, t) => t).sort((a, b) => {
    const ya = median(operators.filter((_, i) => stage1.labels[i] === a).map((o) => o.yield));
    const yb = median(operators.filter((_, i) => stage1.labels[i] === b).map((o) => o.yield));
    return ya - yb;
  });
  const tierRank = new Map(tierOrder.map((t, rank) => [t, rank]));

  // Stage 2 — composition shapes inside each tier.
  // Candidate sub-clusterings are computed for every k, then the allocation of
  // shapes across tiers that sums to TARGET_SHAPES and maximises the
  // size-weighted mean silhouette is selected (the documented original ended up
  // with 7 human shapes across 3 tiers).
  const tierData = tierOrder.map((rawTier) => {
    const rank = tierRank.get(rawTier);
    const members = operators.filter((_, i) => stage1.labels[i] === rawTier);
    const compScaler = standardize(members.map(compositionFeatures));
    const candidates = new Map();
    if (members.length >= MIN_TIER_FOR_SPLIT) {
      for (const k of SHAPE_K_RANGE) {
        if (k >= members.length) continue;
        const run = kmeans(compScaler.scaled, k, rng);
        candidates.set(k, { k, run, score: silhouette(compScaler.scaled, run.labels) });
      }
    }
    if (candidates.size === 0) {
      const centroid = compScaler.scaled[0].map((_, d) => mean(compScaler.scaled.map((r) => r[d])));
      candidates.set(1, { k: 1, run: { labels: new Array(members.length).fill(0), centroids: [centroid] }, score: 0 });
    }
    return { rank, members, compScaler, candidates };
  });

  const allocations = [];
  const walk = (i, acc) => {
    if (i === tierData.length) {
      if (acc.reduce((s, k) => s + k, 0) === TARGET_SHAPES) allocations.push([...acc]);
      return;
    }
    for (const k of tierData[i].candidates.keys()) walk(i + 1, [...acc, k]);
  };
  walk(0, []);
  const scoreAllocation = (alloc) =>
    alloc.reduce((s, k, i) => s + tierData[i].members.length * tierData[i].candidates.get(k).score, 0);
  const allocation = allocations.length
    ? allocations.sort((a, b) => scoreAllocation(b) - scoreAllocation(a))[0]
    : tierData.map((t) => [...t.candidates.values()].sort((a, b) => b.score - a.score)[0].k);

  const clusters = [];
  const tiers = [];
  tierData.forEach((tier, tierIndex) => {
    const { rank, members, compScaler } = tier;
    const best = tier.candidates.get(allocation[tierIndex]);

    tiers.push({
      tier: rank,
      n: members.length,
      yield_median: round(median(members.map((m) => m.yield)), 4),
      shapes: best.k,
      stage2_silhouette: round(best.score, 4),
      composition_scaler: { means: compScaler.means, stds: compScaler.stds },
    });

    for (let c = 0; c < best.k; c++) {
      const shapeMembers = members.filter((_, i) => best.run.labels[i] === c);
      if (shapeMembers.length === 0) continue;
      clusters.push({
        tier: rank,
        shape: c,
        members: shapeMembers,
        stats: clusterStats(shapeMembers),
        composition_centroid_scaled: best.run.centroids[c],
        composition_centroid: best.run.centroids[c].map((v, d) => v * compScaler.stds[d] + compScaler.means[d]),
        yield_centroid: (() => {
          const rows = shapeMembers.map(yieldFeatures);
          return rows[0].map((_, d) => mean(rows.map((r) => r[d])));
        })(),
      });
    }
  });

  // Stable ordering: tier ascending, then yield median ascending within the tier.
  clusters.sort((a, b) => a.tier - b.tier || a.stats.yield_median - b.stats.yield_median);

  const names = disambiguate(clusters);
  clusters.forEach((c, i) => {
    const family = nameCluster(c.stats);
    c.archetype_id = i;
    c.name = names[i];
    c.description =
      names[i] === family
        ? DESCRIPTIONS[family]
        : `${DESCRIPTIONS[family]} — the ${(TIER_QUALIFIER[c.tier] ?? `tier ${c.tier}`).toLowerCase()} branch of this shape`;
  });

  // Flat-labelling quality across the joint feature space (metrics + composition).
  const jointRaw = operators.map((o) => [...yieldFeatures(o), ...compositionFeatures(o)]);
  const jointScaled = standardize(jointRaw).scaled;
  const flatLabelByKey = new Map();
  for (const c of clusters) for (const m of c.members) flatLabelByKey.set(opKey(m), c.archetype_id);
  const flatLabels = operators.map((o) => flatLabelByKey.get(opKey(o)));
  const flatSilhouette = silhouette(jointScaled, flatLabels);

  console.log(`\n[${label}] n=${operators.length}`);
  console.log(`  Stage 1 silhouette (log yield space, k=${N_TIERS}): ${round(stage1Silhouette, 4)}`);
  for (const t of tiers) {
    console.log(
      `  Tier ${t.tier}: n=${t.n}, yield median ${t.yield_median}, shapes ${t.shapes}, stage-2 silhouette ${t.stage2_silhouette}`
    );
  }
  console.log(`  Flat silhouette (8-dim joint space, k=${clusters.length}): ${round(flatSilhouette, 4)}`);
  for (const c of clusters) {
    const s = c.stats;
    console.log(
      `    #${c.archetype_id} ${c.name}: n=${s.n}, yield median ${s.yield_median}, ` +
        `in ${(s.input_pct * 100).toFixed(2)}% out ${(s.output_pct * 100).toFixed(2)}% ` +
        `cr ${(s.cache_read_pct * 100).toFixed(2)}% cw ${(s.cache_write_pct * 100).toFixed(2)}%`
    );
  }

  return {
    label,
    operators,
    clusters,
    tiers,
    yield_scaler: { means: yieldScaler.means, stds: yieldScaler.stds },
    tier_centroids: tierOrder.map((rawTier, rank) => ({
      tier: rank,
      centroid_scaled: stage1.centroids[rawTier],
      centroid: stage1.centroids[rawTier].map((v, d) => v * yieldScaler.stds[d] + yieldScaler.means[d]),
    })),
    silhouette: {
      stage1: round(stage1Silhouette, 4),
      stage2_by_tier: tiers.map((t) => t.stage2_silhouette),
      flat: round(flatSilhouette, 4),
    },
  };
}

// ── Artifact builders ──
function toArchetypeCards(run, outlierSet, allOperators) {
  const cards = run.clusters.map((c) => ({
    archetype_id: c.archetype_id,
    name: c.name,
    description: c.description,
    n: c.stats.n,
    yield_median: c.stats.yield_median,
    leverage_median: c.stats.leverage_median,
    velocity_median: c.stats.velocity_median,
    snr_median: c.stats.snr_median,
    input_pct: c.stats.input_pct,
    output_pct: c.stats.output_pct,
    cache_read_pct: c.stats.cache_read_pct,
    cache_write_pct: c.stats.cache_write_pct,
    total_tokens_median: c.stats.total_tokens_median,
    tokens_per_day_median: c.stats.tokens_per_day_median,
    top_platform: c.stats.top_platform,
    sample_handles: c.stats.sample_handles,
  }));

  const outlierMembers = allOperators.filter((o) => outlierSet.has(opKey(o)));
  const outlierStats = clusterStats(outlierMembers);
  cards.push({
    archetype_id: cards.length,
    name: "Outliers",
    description:
      "Too extreme to set the median for everyone else. Derived from the input/total ratio analysis plus the 6-signal flagged handles. Categorized, not deleted — an overlay label, so these operators also carry their shape archetype.",
    n: outlierStats.n,
    overlay: true,
    yield_median: outlierStats.yield_median,
    leverage_median: outlierStats.leverage_median,
    velocity_median: outlierStats.velocity_median,
    snr_median: outlierStats.snr_median,
    input_pct: outlierStats.input_pct,
    output_pct: outlierStats.output_pct,
    cache_read_pct: outlierStats.cache_read_pct,
    cache_write_pct: outlierStats.cache_write_pct,
    total_tokens_median: outlierStats.total_tokens_median,
    tokens_per_day_median: outlierStats.tokens_per_day_median,
    top_platform: outlierStats.top_platform,
    sample_handles: outlierStats.sample_handles,
  });

  return cards;
}

function toLabels(run, outlierSet, canonicalN, generatedAt) {
  const byKey = new Map();
  for (const c of run.clusters) {
    for (const m of c.members) {
      byKey.set(opKey(m), {
        handle: m.handle,
        operator_ref: opKey(m),
        archetype_id: c.archetype_id,
        archetype: c.name,
        tier: c.tier,
        shape: c.shape,
        outlier: outlierSet.has(opKey(m)),
      });
    }
  }
  const labels = [...byKey.values()].sort((a, b) => a.operator_ref.localeCompare(b.operator_ref));
  return {
    generated_at: generatedAt,
    generator: "scripts/gen-archetypes.mjs",
    population: run.label,
    canonical_n: canonicalN,
    n_labeled: labels.length,
    n_outlier_overlay: labels.filter((l) => l.outlier).length,
    n_rows_clustered: run.operators.length,
    note:
      "Archetype labels are shape labels; `outlier: true` is an independent overlay flag (dual membership is preserved).",
    silhouette: run.silhouette,
    labels,
  };
}

function toCentroids(runs, generatedAt) {
  return {
    generated_at: generatedAt,
    generator: "scripts/gen-archetypes.mjs",
    note:
      "Nearest-centroid assignment: standardize log10(yield, leverage, velocity, snr) with `yield_scaler` and pick the nearest `tier_centroids.centroid_scaled`; then standardize the four composition proportions with that tier's `composition_scaler` and pick the nearest `shape_centroid_scaled`.",
    feature_spaces: {
      stage1: ["log10(yield+1e-6)", "log10(leverage+1e-6)", "log10(velocity+1e-6)", "log10(snr+1e-6)"],
      stage2: ["input_pct", "output_pct", "cache_read_pct", "cache_write_pct"],
    },
    runs: Object.fromEntries(
      Object.entries(runs).map(([key, run]) => [
        key,
        {
          population: run.label,
          n_clustered: run.operators.length,
          silhouette: run.silhouette,
          yield_scaler: run.yield_scaler,
          tier_centroids: run.tier_centroids,
          tiers: run.tiers.map((t) => ({
            tier: t.tier,
            n: t.n,
            shapes: t.shapes,
            composition_scaler: t.composition_scaler,
          })),
          archetypes: run.clusters.map((c) => ({
            archetype_id: c.archetype_id,
            name: c.name,
            tier: c.tier,
            shape: c.shape,
            n: c.stats.n,
            yield_centroid: c.yield_centroid,
            shape_centroid: c.composition_centroid,
            shape_centroid_scaled: c.composition_centroid_scaled,
          })),
        },
      ])
    ),
  };
}

// ── Comparison report ──
function pct(v) {
  return `${(v * 100).toFixed(2)}%`;
}

function buildReport(full, hcm, fullLabels, hcmLabels, counts, generatedAt) {
  const fullByHandle = new Map(fullLabels.labels.map((l) => [l.operator_ref, l]));
  const hcmByHandle = new Map(hcmLabels.labels.map((l) => [l.operator_ref, l]));

  // Membership shift: for HCM operators present in both runs, how often does the
  // archetype NAME change when outliers are included?
  let stable = 0;
  let moved = 0;
  const flow = new Map();
  for (const [handle, h] of hcmByHandle) {
    const f = fullByHandle.get(handle);
    if (!f) continue;
    if (f.archetype === h.archetype) stable++;
    else {
      moved++;
      const key = `${h.archetype} → ${f.archetype}`;
      flow.set(key, (flow.get(key) || 0) + 1);
    }
  }
  const topFlows = [...flow.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  const clusterTable = (run) =>
    [
      "| # | Archetype | n | Yield median | Leverage median | Velocity median | SNR median | Input% | Output% | CacheR% | CacheW% |",
      "|---|-----------|---|--------------|-----------------|-----------------|------------|--------|---------|---------|---------|",
      ...run.clusters.map(
        (c) =>
          `| ${c.archetype_id} | ${c.name} | ${c.stats.n} | ${c.stats.yield_median} | ${c.stats.leverage_median} | ${c.stats.velocity_median} | ${c.stats.snr_median} | ${pct(c.stats.input_pct)} | ${pct(c.stats.output_pct)} | ${pct(c.stats.cache_read_pct)} | ${pct(c.stats.cache_write_pct)} |`
      ),
    ].join("\n");

  const tierTable = (run) =>
    [
      "| Tier | n | Yield median | Shapes | Stage-2 silhouette |",
      "|------|---|--------------|--------|--------------------|",
      ...run.tiers.map((t) => `| ${t.tier} | ${t.n} | ${t.yield_median} | ${t.shapes} | ${t.stage2_silhouette} |`),
    ].join("\n");

  return `# Archetype regeneration — 1,628 vs 1,498

<!-- Generated by scripts/gen-archetypes.mjs. Do not edit by hand. -->

Generated: ${generatedAt}
Source: \`public/data/field-analysis.json\` (committed snapshot; no RNS dependency)

## Populations

| Population | Canonical n | Rows in committed snapshot | Notes |
|------------|-------------|----------------------------|-------|
| FULL | ${CANONICAL_N_FULL} | ${counts.full} | Whole scrape, includes the owner's profile and all outliers |
| HCM | ${CANONICAL_N_HCM} | ${counts.hcm} | FULL minus ${counts.outliers} outliers (${counts.ratio} input/total ratio + ${counts.flagged} flagged) |

The committed \`field-analysis.json\` snapshot carries ${CANONICAL_N_FULL - counts.full} row fewer than the master
scrape (the owner's own profile is not in the trimmed snapshot). The clustering runs on
the rows that exist in the repo; the published \`archetypes.json\` header reports the
owner-confirmed canonical \`n_operators = ${CANONICAL_N_FULL}\` (the previous header said 1611, which
counted only non-flagged operators).

Two snapshot quirks are carried through as-is: one row has a scrubbed (\`null\`) handle and is
referenced by its tokscale rank, and one operator (\`sachin1245\`) appears as two identical rows, so
the per-operator label artifacts contain one entry fewer than the number of clustered rows.

## Method

1. **Stage 1** — K-Means (k=${N_TIERS}) on standardized \`log10(yield, leverage, velocity, snr)\` → yield tiers.
2. **Stage 2** — K-Means on standardized token-composition proportions (input%, output%, cache_read%, cache_write%) inside each tier; k chosen from {${SHAPE_K_RANGE.join(", ")}} by silhouette.
3. **Overlay** — the Outliers archetype comes from the input/total ratio analysis + the flagged handles. It does not remove an operator from its shape cluster: dual membership is preserved via the \`outlier\` flag in the label artifacts.

Deterministic: seeded PRNG (\`${SEED}\`), ${RESTARTS} restarts per K-Means, k-means++ init.

## Cluster quality

| Run | Stage-1 silhouette | Stage-2 silhouettes (by tier) | Flat silhouette (8-dim joint space) |
|-----|--------------------|-------------------------------|-------------------------------------|
| FULL (${counts.full}) | ${full.silhouette.stage1} | ${full.silhouette.stage2_by_tier.join(", ")} | ${full.silhouette.flat} |
| HCM (${counts.hcm}) | ${hcm.silhouette.stage1} | ${hcm.silhouette.stage2_by_tier.join(", ")} | ${hcm.silhouette.flat} |

The original offline run reported a single silhouette of 0.625. That figure is not
directly comparable to the flat score here: it was reported for the stage-1 tiering,
and this run reports stage-1, per-tier stage-2, and the flat joint-space score
separately so each is independently verifiable.

## FULL run (published as \`public/data/archetypes.json\`)

${tierTable(full)}

${clusterTable(full)}

Outlier overlay: n=${counts.outliers} (${counts.ratio} ratio outliers + ${counts.flagged} flagged), carried as an 8th archetype card with \`overlay: true\`.

## HCM run

${tierTable(hcm)}

${clusterTable(hcm)}

## What shifts when outliers are included

- **Tier boundaries.** Outliers sit at the top of the log-yield space, so including them
  stretches stage 1: compare the tier yield medians in the two tier tables above.
- **Membership.** Of the ${stable + moved} operators present in both runs, ${stable} keep the same archetype
  name (${((stable / Math.max(stable + moved, 1)) * 100).toFixed(1)}%) and ${moved} move (${((moved / Math.max(stable + moved, 1)) * 100).toFixed(1)}%).
- **Largest movements** (HCM archetype → FULL archetype):

${topFlows.length ? topFlows.map(([k, v]) => `  - ${k}: ${v}`).join("\n") : "  - none"}

- **Medians.** The per-cluster medians in the FULL tables are pulled upward wherever an
  outlier-heavy shape lands; the HCM tables are the honest "what a human looks like"
  reference and remain the basis for the field-wide medians in \`field-analysis.json\`.

## Artifacts

| File | Contents |
|------|----------|
| \`public/data/archetypes.json\` | Published archetype cards (FULL run, \`n_operators = ${CANONICAL_N_FULL}\`) |
| \`public/data/archetype-labels-1628.json\` | Per-operator labels, FULL run |
| \`public/data/archetype-labels-1498.json\` | Per-operator labels, HCM run |
| \`public/data/archetype-centroids.json\` | Centroids + scalers for a future runtime nearest-centroid classifier |

Regenerate with \`node scripts/gen-archetypes.mjs\` from the repo root.
`;
}

// ── Main ──
const field = JSON.parse(readFileSync(FIELD_ANALYSIS_PATH, "utf-8"));
const allOperators = field.operators;
const { flagged, ratioOutliers, outliers } = splitPopulations(allOperators);
const hcmOperators = allOperators.filter((o) => !outliers.has(opKey(o)));

console.log(`Operators in committed snapshot: ${allOperators.length}`);
console.log(`Flagged (bot/suspect): ${flagged.size}`);
console.log(`Ratio outliers: ${ratioOutliers.size}`);
console.log(`Outliers total: ${outliers.size}`);
console.log(`Human Center of Mass: ${hcmOperators.length}`);

const fullRun = runClustering(allOperators, "full_scrape");
const hcmRun = runClustering(hcmOperators, "human_center_of_mass");

const generatedAt = field.meta?.scraped_at ?? new Date().toISOString();

const archetypes = {
  method: "hybrid_yield_tiers + composition_shapes",
  description:
    "K-Means on log(yield, leverage, velocity, snr) for 3 yield tiers, then K-Means on token composition proportions for sub-shapes",
  generator: "scripts/gen-archetypes.mjs",
  source: "public/data/field-analysis.json",
  population: "full_scrape",
  n_operators: CANONICAL_N_FULL,
  n_clustered: allOperators.length,
  n_human_center_of_mass: CANONICAL_N_HCM,
  n_outliers: outliers.size,
  silhouette: fullRun.silhouette,
  n_archetypes: fullRun.clusters.length + 1,
  archetypes: toArchetypeCards(fullRun, outliers, allOperators),
};

const counts = {
  full: allOperators.length,
  hcm: hcmOperators.length,
  outliers: outliers.size,
  ratio: ratioOutliers.size,
  flagged: flagged.size,
};

const fullLabels = toLabels(fullRun, outliers, CANONICAL_N_FULL, generatedAt);
const hcmLabels = toLabels(hcmRun, outliers, CANONICAL_N_HCM, generatedAt);
const centroids = toCentroids({ full_scrape: fullRun, human_center_of_mass: hcmRun }, generatedAt);
const report = buildReport(fullRun, hcmRun, fullLabels, hcmLabels, counts, generatedAt);

writeFileSync(ARCHETYPES_PATH, `${JSON.stringify(archetypes, null, 2)}\n`);
writeFileSync(LABELS_FULL_PATH, `${JSON.stringify(fullLabels, null, 2)}\n`);
writeFileSync(LABELS_HCM_PATH, `${JSON.stringify(hcmLabels, null, 2)}\n`);
writeFileSync(CENTROIDS_PATH, `${JSON.stringify(centroids, null, 2)}\n`);
writeFileSync(REPORT_PATH, report);

console.log("\nWritten:");
for (const p of [ARCHETYPES_PATH, LABELS_FULL_PATH, LABELS_HCM_PATH, CENTROIDS_PATH, REPORT_PATH]) {
  console.log(`  ${p.replace(`${ROOT}/`, "")}`);
}
