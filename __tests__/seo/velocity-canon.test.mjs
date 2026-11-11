/**
 * __tests__/seo/velocity-canon.test.mjs
 *
 * Canon guard for Velocity and Compression Ratio copy, repo-wide.
 * lib/identity/canon-ids.ts: Velocity (Y.04) = T.01 / T.02 — output per fresh
 * input, NOT a time rate. Compression Ratio (M.01) is a WORD-ERA metric.
 *
 * canon-ids.ts imports via the "@/" alias, which plain node cannot resolve, so the
 * canon entries are read from the whitespace-normalised source (not from its
 * exact formatting).
 *
 *   node --experimental-strip-types --test __tests__/seo/velocity-canon.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("../../", import.meta.url).pathname;

async function source(path) {
  return readFile(join(ROOT, path), "utf8");
}

const SKIP_DIRS = new Set(["node_modules", ".next", ".git"]);
const EXT = /\.(ts|tsx|mjs|md|txt)$/;

async function walk(dir, out = []) {
  for (const e of await readdir(join(ROOT, dir), { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) await walk(rel, out);
    else if (EXT.test(e.name)) out.push(rel);
  }
  return out;
}

// Whole-file scan of every page, route and lib source (incl. llms routes).
const FILES = [...(await walk("app")), ...(await walk("lib"))];

// Collapse JSX/string line wrapping so a phrase split across lines still matches.
const flat = (s) => s.replace(/\s+/g, " ").replace(/["'`]\s*\+\s*["'`]/g, "");

test("canon: Velocity is output per fresh input; Compression Ratio is word era", async () => {
  const canon = flat(await source("lib/identity/canon-ids.ts"));
  assert.match(
    canon,
    /name: "Velocity", formula: "T\.01 \/ T\.02 — output per fresh input", era: "token"/,
  );
  assert.match(canon, /name: "Compression Ratio",[^}]*era: "word"/);
});

test("velocity page defines Velocity as output per fresh input", async () => {
  const src = (await source("app/metrics/velocity/page.tsx")).toLowerCase();
  assert.ok(src.includes("output"));
  assert.ok(src.includes("input"));
  assert.ok(src.includes("output per fresh input"));
  for (const bad of ["per unit time", "per hour", "production rate", "unit of time", "wall-clock"]) {
    assert.ok(!src.includes(bad), `velocity page must not contain "${bad}"`);
  }
});

test("compression-ratio page is word-era and points to Velocity and methodology", async () => {
  const src = await source("app/metrics/compression-ratio/page.tsx");
  assert.match(src, /word-era/i);
  assert.ok(src.includes('href="/metrics/velocity"'));
  assert.ok(src.includes('href="/methodology"'));
});

// Velocity defined as a time rate: "velocity ... per unit time / tokens per hour /
// production rate / throughput per time", within one sentence.
const VELOCITY_TIME_RATE =
  /velocity[^.]{0,80}?(per unit (of )?(wall-clock |session )?time|(tokens|output) per (hour|minute|second)|production rate|throughput per|per hour)/i;
const VELOCITY_TIME_RATE_REVERSE =
  /(tokens per unit time|per unit time|token production rate)[^.]{0,60}velocity/i;

test("no app/ or lib/ source defines Velocity as a time rate", () => {
  const bad = [];
  return Promise.all(
    FILES.map(async (f) => {
      const src = flat(await source(f));
      if (VELOCITY_TIME_RATE.test(src) || VELOCITY_TIME_RATE_REVERSE.test(src)) bad.push(f);
    }),
  ).then(() => assert.deepEqual(bad.sort(), [], `Velocity time-rate wording in: ${bad}`));
});

// Compression Ratio defined as output per input (that ratio is Velocity).
const COMPRESSION_OUTPUT_PER_INPUT =
  /compression[ _-]ratio\s*(=|is|:|\()?\s*(\(?(more )?output (per|\/|over|divided by) (fresh )?input)/i;
const COMPRESSION_OUTPUT_PER_INPUT_2 =
  /compression[ _-]ratio[^.]{0,40}(measures|captures|=)[^.]{0,30}output (per|\/|over|divided by) (fresh )?input/i;
const COMPRESSION_CACHE_FORMULA = /compression ratio\s*=\s*cache_read/i;

test("no app/ or lib/ source defines Compression Ratio as output per input", () => {
  const bad = [];
  return Promise.all(
    FILES.map(async (f) => {
      const src = flat(await source(f));
      if (
        COMPRESSION_OUTPUT_PER_INPUT.test(src) ||
        COMPRESSION_OUTPUT_PER_INPUT_2.test(src) ||
        COMPRESSION_CACHE_FORMULA.test(src)
      ) {
        bad.push(f);
      }
    }),
  ).then(() => assert.deepEqual(bad.sort(), [], `Compression Ratio output/input wording in: ${bad}`));
});

test("Compression Ratio is not listed as a live metric in public copy", async () => {
  // Live-metric lists in public copy name Velocity; "compression ratio" may
  // appear only on its own word-era page, the llms word-era note, and nav labels.
  const allowed = new Set([
    "app/metrics/compression-ratio/page.tsx",
    "app/metrics/velocity/page.tsx", // cross-link label "(word era)"
    "app/metrics/page.tsx", // description + index card, both labelled word-era
    "app/llms-full.txt/route.ts", // explicit word-era note
  ]);
  const hits = [];
  for (const f of FILES) {
    if (!/^app\/.*\.(tsx|txt|ts)$/.test(f) || f.startsWith("app/api/")) continue;
    if (allowed.has(f)) continue;
    const src = await source(f);
    if (/compression ratio/i.test(src)) hits.push(f);
  }
  assert.deepEqual(hits, [], `unlabelled "compression ratio" copy in: ${hits}`);
});
