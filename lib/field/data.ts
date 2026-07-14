/**
 * lib/field/data.ts — server-side loader for the field-analysis.json dataset.
 *
 * Reads the static JSON from public/data/field-analysis.json at build/ISR
 * time and returns it typed. The page calls this once and passes slices to
 * the chart components (charts never fetch themselves).
 */

import { promises as fs } from "fs";
import path from "path";
import type { FieldAnalysis } from "@/lib/field/types";

const DATA_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "field-analysis.json",
);

let cached: FieldAnalysis | null = null;

/** Load the field-analysis dataset (cached for the lifetime of the process). */
export async function getFieldAnalysis(): Promise<FieldAnalysis> {
  if (cached) return cached;
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  cached = JSON.parse(raw) as FieldAnalysis;
  return cached;
}
