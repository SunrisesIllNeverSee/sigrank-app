/**
 * __tests__/seo/velocity-canon.test.mjs
 *
 * Canon guard for the Velocity and Compression Ratio metric pages.
 * lib/identity/canon-ids.ts Y.04: Velocity = T.01 / T.02 — output per fresh input
 * (NOT a time rate). M.01 Compression Ratio is a word-era metric (era "word").
 *
 *   node --experimental-strip-types --test __tests__/seo/velocity-canon.test.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("velocity page defines Velocity as output per fresh input", async () => {
  const src = (await source("app/metrics/velocity/page.tsx")).toLowerCase();
  assert.ok(src.includes("output"));
  assert.ok(src.includes("input"));
  assert.ok(src.includes("output per fresh input"));
});

test("velocity page has no time-rate definition", async () => {
  const src = (await source("app/metrics/velocity/page.tsx")).toLowerCase();
  for (const bad of ["per unit time", "per hour", "production rate", "unit of time"]) {
    assert.ok(!src.includes(bad), `velocity page must not contain "${bad}"`);
  }
});

test("compression-ratio page is word-era and points to Velocity", async () => {
  const src = await source("app/metrics/compression-ratio/page.tsx");
  assert.match(src, /word-era/i);
  assert.ok(src.includes('href="/metrics/velocity"'));
  assert.ok(!/Compression Ratio = output \/ input/.test(src));
});

test("canon: Velocity is output per fresh input; Compression Ratio is word era", async () => {
  const canon = await source("lib/identity/canon-ids.ts");
  assert.match(canon, /name: "Velocity",\s*formula: "T\.01 \/ T\.02 — output per fresh input"/);
  assert.match(canon, /name: "Compression Ratio",[\s\S]*?era: "word"/);
});

test("metrics index and vs pages do not define Velocity as a time rate", async () => {
  const files = [
    "app/metrics/page.tsx",
    "app/ai-coding-metrics/page.tsx",
    "app/operator-performance/page.tsx",
    "app/vs/wakatime/page.tsx",
    "app/vs/ccburn/page.tsx",
    "lib/seo/page-faqs.ts",
  ];
  for (const f of files) {
    const src = await source(f);
    assert.ok(
      !/velocity[^.]{0,80}(per unit (of )?(wall-clock |session )?time|tokens per hour|production rate)/i.test(src),
      `${f} defines Velocity as a time rate`,
    );
  }
});
