/**
 * lib/field/data.ts — server-side loader for the field-analysis.json dataset.
 *
 * Reads the static JSON from public/data/field-analysis.json at build/ISR
 * time and returns it typed. The page calls this once and passes slices to
 * the chart components (charts never fetch themselves).
 *
 * Also loads public/data/archetypes.json (7 operator archetypes from
 * K-Means clustering) for the OperatorArchetypes component.
 */

import { promises as fs } from "fs";
import path from "path";
import type { FieldAnalysis } from "@/lib/field/types";
import type { ArchetypeData } from "@/components/field/OperatorArchetypes";

const DATA_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "field-analysis.json",
);

const ARCHETYPES_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "archetypes.json",
);

let cached: FieldAnalysis | null = null;
let archetypesCached: ArchetypeData[] | null = null;

/** Load the field-analysis dataset (cached for the lifetime of the process). */
export async function getFieldAnalysis(): Promise<FieldAnalysis> {
  if (cached) return cached;
  const raw = await fs.readFile(DATA_PATH, "utf-8");
  cached = JSON.parse(raw) as FieldAnalysis;
  return cached;
}

/** Load the archetypes dataset (cached for the lifetime of the process). */
export async function getArchetypes(): Promise<ArchetypeData[]> {
  if (archetypesCached) return archetypesCached;
  const raw = await fs.readFile(ARCHETYPES_PATH, "utf-8");
  const parsed = JSON.parse(raw) as { archetypes: ArchetypeData[] };
  archetypesCached = parsed.archetypes;
  return archetypesCached;
}
