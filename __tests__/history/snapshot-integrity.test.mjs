/**
 * __tests__/history/snapshot-integrity.test.mjs
 *
 * Locks the frozen July 31, 2026 board snapshot behind /board/history. The
 * file must stay byte-identical to public/data/board-all_time.json@4c610df9;
 * any edit, reformat or regeneration fails here.
 *
 *   node --test __tests__/history/snapshot-integrity.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const FILE = "data/history/board-all_time-2026-07-31.json";
const manifest = JSON.parse(readFileSync("data/history/manifest.json", "utf8"));
const bytes = readFileSync(FILE);
const board = JSON.parse(bytes.toString("utf8"));

test("git blob matches the 4c610df9 export", () => {
  const blob = execFileSync("git", ["hash-object", FILE], { encoding: "utf8" }).trim();
  assert.equal(blob, "1a24939623ea0a8efeaaa68ba0e5818c684f7203");
  assert.equal(manifest.git_blob, blob);
});

test("byte size and sha256 match the manifest", () => {
  assert.equal(bytes.length, 1237309);
  assert.equal(manifest.bytes, 1237309);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), manifest.sha256);
});

test("header fields match the source and the manifest", () => {
  assert.equal(board.generated_at, "2026-07-31T12:09:09.303Z");
  assert.equal(board.window, "all_time");
  assert.equal(board.total_operators, 1642);
  assert.equal(manifest.generated_at, board.generated_at);
  assert.equal(manifest.window, board.window);
  assert.equal(manifest.total_operators, board.total_operators);
});

test("1,642 rows: 1,626 seeded, 16 real, ranks exactly 1..1642", () => {
  assert.equal(board.entries.length, 1642);
  assert.equal(board.entries.filter((e) => e.isSeed === true).length, 1626);
  assert.equal(board.entries.filter((e) => e.isSeed === false).length, 16);
  assert.equal(manifest.entries, 1642);
  assert.equal(manifest.seeded, 1626);
  assert.equal(manifest.real, 16);
  const ranks = board.entries.map((e) => e.rank).sort((a, b) => a - b);
  assert.deepEqual(ranks, Array.from({ length: 1642 }, (_, i) => i + 1));
});

test(".gitattributes keeps line endings off the snapshot", () => {
  const attrs = readFileSync(".gitattributes", "utf8").split("\n").map((l) => l.trim());
  assert.ok(attrs.includes("data/history/*.json -text"));
});
