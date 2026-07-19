/**
 * lib/field/data.ts — server-side loader for the field-analysis.json dataset.
 *
 * Reads the static JSON from public/data/field-analysis.json at build/ISR
 * time and returns it typed. The page calls this once and passes slices to
 * the chart components (charts never fetch themselves).
 *
 * Also loads public/data/archetypes.json (8 operator archetypes from
 * K-Means clustering) for the OperatorArchetypes component.
 *
 * Uses JSON imports instead of fs.readFile() for serverless compatibility.
 * JSON imports are bundled at build time and work without filesystem access.
 */

import fieldAnalysisRaw from "@/public/data/field-analysis.json";
import archetypesRaw from "@/public/data/archetypes.json";
import type { FieldAnalysis } from "@/lib/field/types";
import type { ArchetypeData } from "@/components/field/OperatorArchetypes";

let cached: FieldAnalysis | null = null;
let archetypesCached: ArchetypeData[] | null = null;

/** Load the field-analysis dataset (cached for the lifetime of the process). */
export async function getFieldAnalysis(): Promise<FieldAnalysis> {
  if (cached) return cached;
  cached = fieldAnalysisRaw as FieldAnalysis;
  return cached;
}

/** Load the archetypes dataset (cached for the lifetime of the process). */
export async function getArchetypes(): Promise<ArchetypeData[]> {
  if (archetypesCached) return archetypesCached;
  const parsed = archetypesRaw as { archetypes: ArchetypeData[] };
  archetypesCached = parsed.archetypes;
  return archetypesCached;
}
