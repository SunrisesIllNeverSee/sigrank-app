/**
 * lib/mcp/resources/index.ts — SigRank MCP resource definitions and reader.
 *
 * Extracted from app/api/mcp/route.ts as Phase 2 of the MCP structural
 * renovation. Contains the 6 static resource definitions and the readResource
 * handler that returns resource content by URI.
 */

import { getLeaderboard } from "@/lib/board";
import {
  SIGRANK_STANDARD_IDENTITY,
  SIGRANK_STANDARD_SCHEMA,
} from "@/lib/mcp/standard";

export const RESOURCES = [
  {
    uri: "sigrank://standard",
    name: "SigRank Standard Identity",
    description: "Version, scope, canonical URLs, portable core, and explicit compatibility exclusions for the SigRank Standard",
    mimeType: "application/json",
  },
  {
    uri: "sigrank://standard/schema",
    name: "SigRank Standard Record Schema",
    description: "Canonical JSON Schema for a portable sigrank/0.1-draft operator record",
    mimeType: "application/schema+json",
  },
  {
    uri: "sigrank://methodology",
    name: "Methodology",
    description: "How SignalAF implements the SigRank portable core alongside optional reference and product layers",
    mimeType: "text/plain",
  },
  {
    uri: "sigrank://metrics",
    name: "Metric Definitions",
    description: "Definitions of the five-metric SigRank portable core and the boundary around optional SignalAF extensions",
    mimeType: "text/plain",
  },
  {
    uri: "sigrank://platforms",
    name: "Supported Platforms",
    description: "AI platforms tracked by SigRank",
    mimeType: "application/json",
  },
  {
    uri: "sigrank://formulas",
    name: "Canonical Formulas",
    description: "The five SigRank portable-core formulas plus clearly separated SignalAF reference and product formulas",
    mimeType: "text/plain",
  },
  {
    uri: "sigrank://classes",
    name: "RS05 Class Taxonomy",
    description: "Optional 24-stage RS05 SignalAF reference extension; not required for base SigRank compatibility",
    mimeType: "application/json",
  },
  {
    uri: "sigrank://benchmarks",
    name: "Live Field Benchmarks",
    description: "Current field-wide benchmark statistics (median, top 10%, top 1%) from the live leaderboard",
    mimeType: "application/json",
  },
];

/**
 * Read a resource by URI. Returns the contents array for a valid URI, or null
 * if the URI is unknown (the caller should return an appropriate JSON-RPC error).
 */
export async function readResource(
  uri: string,
): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> } | null> {
  if (uri === "sigrank://standard") {
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify(SIGRANK_STANDARD_IDENTITY, null, 2),
      }],
    };
  }

  if (uri === "sigrank://standard/schema") {
    return {
      contents: [{
        uri,
        mimeType: "application/schema+json",
        text: JSON.stringify(SIGRANK_STANDARD_SCHEMA, null, 2),
      }],
    };
  }

  if (uri === "sigrank://methodology") {
    return {
      contents: [{
        uri,
        mimeType: "text/plain",
        text: `SigRank Methodology

SigRank measures AI operator token-cascade relationships from privacy-preserving
numeric telemetry. It evaluates operators, not models, and does not establish
correctness, work quality, employee productivity, or business value.

SigRank v0.1 portable core — required for base compatibility:
  Υ = (cache_read × output) / input²
  Leverage = cache_read / input
  Velocity = output / input
  SNR = output / (input + output)
  10xDEV = log10(cache_read / input) under the reference null policy

Optional SignalAF reference extensions — not required for base compatibility:
  Scale V — a leaderboard scale dimension
  RS05 — a 24-stage reference classification
  Build Archetypes — a 10-type operating-shape classification

Rank and the SignalAF Reference Field are product/context layers, not portable
record requirements. Archetype = shape. Class = scale or qualification. Rank =
field position. These concepts must remain separate.`,
      }],
    };
  }

  if (uri === "sigrank://metrics") {
    return {
      contents: [{
        uri,
        mimeType: "text/plain",
        text: `SigRank Metric Definitions

Portable core — required for sigrank/0.1-draft base compatibility

Yield (Υ): (cache_read × output) / input²
  Compound token-flow relationship between context reuse and output relative to fresh input.

Leverage: cache_read / input
  How many cache-read tokens per input token.

Velocity: output / input
  How many output tokens per input token.

SNR: output / (input + output)
  What fraction of total flow is output.

10xDEV: log10(cache_read / input)
  Log-scale cascade summary under the reference null policy.

Optional SignalAF reference extensions — not required for base compatibility

Scale V: log10(total_tokens)
  A leaderboard scale dimension outside the portable core.

RS05:
  A 24-stage SignalAF reference classification outside the portable core.

Build Archetypes:
  A separately versioned 10-type SignalAF operating-shape reference extension.
  Legacy signature labels are not Build Archetypes.`,
      }],
    };
  }

  if (uri === "sigrank://platforms") {
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify({
          platforms: ["claude", "cursor", "cline", "windsurf", "codex", "gemini", "chatgpt", "other"],
          description: "SigRank tracks AI operators across these platforms.",
        }, null, 2),
      }],
    };
  }

  if (uri === "sigrank://formulas") {
    return {
      contents: [{
        uri,
        mimeType: "text/plain",
        text: `SigRank v0.1 Portable-Core Formulas

Yield (Υ):        (cache_read × output) / input²
Leverage:         cache_read / input
Velocity:         output / input
SNR:              output / (input + output)
10xDEV:           log10(cache_read / input)

Required portable telemetry: input, output, cache_write, cache_read.
Unavailable cache telemetry remains null and must not be fabricated as zero.

SignalAF reference/product formulas — excluded from base compatibility:
Scale V:          log10(total_tokens)
Construction:     cache_write / cache_read

Construction may support the optional Build Archetypes reference extension.
It is not a sixth SigRank portable-core metric.`,
      }],
    };
  }

  if (uri === "sigrank://classes") {
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify({
          extension: "RS05",
          status: "reference_extension",
          required_for_base_compatibility: false,
          concept_boundary: "Class = scale or qualification; Class is not Archetype or Rank.",
          stages: 24,
          thresholds: [
            { class: "ARCH+ I", totalMin: 7068201104627 },
            { class: "ARCH+ II", totalMin: 3000000000000 },
            { class: "ARCH+ III", totalMin: 1000000000000 },
            { class: "ARCH I", totalMin: 186207267611 },
            { class: "ARCH II", totalMin: 98543134083 },
            { class: "ARCH III", totalMin: 68766193943 },
            { class: "POWER I", totalMin: 39958782379 },
            { class: "POWER II", totalMin: 26955905621 },
            { class: "POWER III", totalMin: 19141226889 },
            { class: "BASE I", totalMin: 13960345961 },
            { class: "BASE II", totalMin: 10189224970 },
            { class: "BASE III", totalMin: 7747041813 },
            { class: "SEEKER I", totalMin: 5446673659 },
            { class: "SEEKER II", totalMin: 4014577247 },
            { class: "SEEKER III", totalMin: 2961798768 },
            { class: "REFINER I", totalMin: 2358346840 },
            { class: "REFINER II", totalMin: 1845750357 },
            { class: "REFINER III", totalMin: 1334876308 },
            { class: "BEARER I", totalMin: 984078167 },
            { class: "BEARER II", totalMin: 714619043 },
            { class: "BEARER III", totalMin: 431702990 },
            { class: "IGNITER I", totalMin: 216393332 },
            { class: "IGNITER II", totalMin: 88999166 },
            { class: "IGNITER III", totalMin: 0 },
          ],
        }, null, 2),
      }],
    };
  }

  if (uri === "sigrank://benchmarks") {
    const board = await getLeaderboard({ window: "30d", windowFilter: true, limit: 1000 });
    const yields: number[] = [], leverages: number[] = [], velocities: number[] = [], snrs: number[] = [];
    for (const row of board) {
      const c = row.snapshot.cascade;
      if (!c || c.nonCompounding) continue;
      if (typeof c.yield_ === "number") yields.push(c.yield_);
      if (typeof c.leverage === "number") leverages.push(c.leverage);
      if (typeof c.velocity === "number") velocities.push(c.velocity);
      if (typeof c.snr === "number") snrs.push(c.snr);
    }
    const bands = (arr: number[]) => {
      const s = [...arr].sort((a, b) => a - b);
      return {
        median: s[Math.floor(s.length / 2)],
        top_10: s[Math.floor(s.length * 0.9)] ?? s[s.length - 1],
        top_1: s[Math.floor(s.length * 0.99)] ?? s[s.length - 1],
      };
    };
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify({
          window: "30d",
          generated_at: new Date().toISOString(),
          total_operators: board.length,
          compounding_operators: yields.length,
          yield: bands(yields),
          leverage: bands(leverages),
          velocity: bands(velocities),
          snr: bands(snrs),
        }, null, 2),
      }],
    };
  }

  return null;
}
