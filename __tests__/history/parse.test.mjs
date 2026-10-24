/**
 * __tests__/history/parse.test.mjs
 *
 * parseHistoricalBoard: returns the frozen rows untouched and refuses a
 * snapshot that disagrees with data/history/manifest.json.
 *
 *   node --experimental-strip-types --test __tests__/history/parse.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseHistoricalBoard } from "../../lib/history/parse.ts";

const raw = () => JSON.parse(readFileSync("data/history/board-all_time-2026-07-31.json", "utf8"));
const manifest = JSON.parse(readFileSync("data/history/manifest.json", "utf8"));

test("entries are the file's rows, untouched (nulls and isSeed intact)", () => {
  const file = raw();
  const board = parseHistoricalBoard(file, manifest);
  assert.deepStrictEqual(board.entries, raw().entries);
  assert.equal(board.entries.filter((e) => e.yield_ === null).length, 133);
  assert.equal(board.entries.filter((e) => e.signalClass === null).length, 1);
});

test("meta carries the snapshot identity", () => {
  const { meta } = parseHistoricalBoard(raw(), manifest);
  assert.equal(meta.totalOperators, 1642);
  assert.equal(meta.seeded, 1626);
  assert.equal(meta.real, 16);
  assert.equal(meta.generatedAt, "2026-07-31T12:09:09.303Z");
  assert.equal(meta.window, "all_time");
  assert.equal(meta.gitBlob, "1a24939623ea0a8efeaaa68ba0e5818c684f7203");
  assert.equal(meta.sourceCommit, manifest.source_commit);
});

test("a changed header is refused", () => {
  const file = raw();
  file.generated_at = "2026-08-31T13:10:44.643Z";
  assert.throws(() => parseHistoricalBoard(file, manifest), /history snapshot mismatch: generated_at/);
});

test("a missing row is refused", () => {
  const file = raw();
  file.entries.pop();
  assert.throws(() => parseHistoricalBoard(file, manifest), /history snapshot mismatch: entries/);
});

test("a flipped seed flag is refused", () => {
  const file = raw();
  file.entries[0].isSeed = !file.entries[0].isSeed;
  assert.throws(() => parseHistoricalBoard(file, manifest), /history snapshot mismatch: seeded/);
});

test("rank 1 is Richard Fu (furic)", () => {
  const top = parseHistoricalBoard(raw(), manifest).entries.find((e) => e.rank === 1);
  assert.equal(top.anonId, "Richard Fu");
  assert.equal(top.codename, "furic");
});
