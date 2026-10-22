// Builds lib/radar/seed-league-100.json: 100 seed operators from
// public/data/field-analysis.json, spread evenly by total volume. Token
// pillars only (no handles). Run: node scripts/radar/build-seed-league.mjs
import { readFileSync, writeFileSync } from "node:fs";

const N = 100;
const src = JSON.parse(readFileSync(new URL("../../public/data/field-analysis.json", import.meta.url), "utf8"));
const rows = src.operators
  .filter((s) => s.input_tokens > 0 && s.output_tokens > 0 && s.cache_write_tokens > 0 && s.cache_read_tokens > 0)
  .map((s) => [s.input_tokens, s.output_tokens, s.cache_write_tokens, s.cache_read_tokens]);
const total = (p) => p[0] + p[1] + p[2] + p[3];
rows.sort((a, b) => total(a) - total(b));
const league = Array.from({ length: N }, (_, k) => rows[Math.round((k * (rows.length - 1)) / (N - 1))]);
const out = { source: "public/data/field-analysis.json", scraped: src.meta?.scraped_at ?? src.meta?.generated_at ?? null, complete: rows.length, size: N, pillars: ["input", "output", "cacheWrite", "cacheRead"], rows: league };
writeFileSync(new URL("../../lib/radar/seed-league-100.json", import.meta.url), JSON.stringify(out) + "\n");
console.log(`seed league: ${N} of ${rows.length} complete rows`);
