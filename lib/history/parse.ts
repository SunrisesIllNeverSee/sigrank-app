/**
 * lib/history/parse.ts — validates the frozen July 31 board snapshot against
 * data/history/manifest.json and returns its rows untouched. Relative imports
 * only: node --test loads this file directly (no @/ alias).
 */

import type { HistoricalBoard, HistoricalEntry, HistoryManifest } from "./types.ts";

interface RawSnapshot {
  generated_at?: unknown;
  window?: unknown;
  total_operators?: unknown;
  entries?: unknown;
}

function mismatch(field: string): never {
  throw new Error(`history snapshot mismatch: ${field}`);
}

export function parseHistoricalBoard(raw: unknown, manifest: HistoryManifest): HistoricalBoard {
  const file = (raw ?? {}) as RawSnapshot;
  if (file.generated_at !== manifest.generated_at) mismatch("generated_at");
  if (file.window !== "all_time" || manifest.window !== "all_time") mismatch("window");
  if (file.total_operators !== manifest.total_operators) mismatch("total_operators");
  if (!Array.isArray(file.entries) || file.entries.length !== manifest.entries) mismatch("entries");

  const entries = file.entries as HistoricalEntry[];
  const seeded = entries.filter((e) => e.isSeed === true).length;
  if (seeded !== manifest.seeded || entries.length - seeded !== manifest.real) mismatch("seeded");

  return {
    meta: {
      generatedAt: manifest.generated_at,
      window: "all_time",
      totalOperators: manifest.total_operators,
      sourceCommit: manifest.source_commit,
      gitBlob: manifest.git_blob,
      seeded: manifest.seeded,
      real: manifest.real,
    },
    entries,
  };
}
