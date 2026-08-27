/**
 * lib/mcp/resources/index.ts — SigRank MCP resource definitions and reader.
 *
 * Extracted from app/api/mcp/route.ts as Phase 2 of the MCP structural
 * renovation. Contains the 6 static resource definitions and the readResource
 * handler that returns resource content by URI.
 */

import { getLeaderboard } from "@/lib/board";

export const RESOURCES = [
  {
    uri: "sigrank://methodology",
    name: "Methodology",
    description: "How SigRank measures AI operators — the cascade metric system, formulas, and class taxonomy",
    mimeType: "text/plain",
  },
  {
    uri: "sigrank://metrics",
    name: "Metric Definitions",
    description: "Definitions of Yield (Υ), Leverage, Velocity, SNR, 10xDEV, Scale V, and class tiers",
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
    description: "The frozen canonical formulas — Υ, Leverage, Velocity, SNR, 10xDEV, Scale V",
    mimeType: "text/plain",
  },
  {
    uri: "sigrank://classes",
    name: "RS05 Class Taxonomy",
    description: "The 24-stage class taxonomy from IGNITER III to ARCH+ I with token thresholds",
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
  if (uri === "sigrank://methodology") {
    return {
      contents: [{
        uri,
        mimeType: "text/plain",
        text: `SigRank Methodology

SigRank measures AI operator efficiency from privacy-preserving token telemetry.
No prompts, no code, no content — only token counts.

Core metric: Yield (Υ)
  Υ = (cache_read × output) / input²

Yield captures how efficiently an operator converts input tokens into output
through context reuse. Higher Yield = more efficient operator.

Supporting metrics:
  Leverage = cache_read / input
  Velocity = output / input
  SNR = output / (input + output)
  10xDEV = log10(cache_read / input)
  Scale V = log10(total_tokens)

Class taxonomy (24 stages, RS05): IGNITER III → ARCH+ I
Class is determined by total token volume. Rank is field position by Yield.
Archetype is operating shape (leverage/velocity/SNR ratios).

SigRank evaluates AI operators, not models. The harness measures authority
but cannot manufacture authority.`,
      }],
    };
  }

  if (uri === "sigrank://metrics") {
    return {
      contents: [{
        uri,
        mimeType: "text/plain",
        text: `SigRank Metric Definitions

Yield (Υ): (cache_read × output) / input²
  The canonical efficiency metric.

Leverage: cache_read / input
  How many cache-read tokens per input token.

Velocity: output / input
  How many output tokens per input token.

SNR: output / (input + output)
  What fraction of total flow is output.

10xDEV: log10(cache_read / input)
  Log-scale leverage. Requires all four pillars > 0.

Scale V: log10(total_tokens)
  Total volume on a log scale. Used for class tier assignment.

Class Tier: 24-stage taxonomy from IGNITER III to ARCH+ I.
  Determined by total token volume thresholds (RS05).

Archetype: Operating shape.
  CONTEXTUAL: high leverage, low velocity
  GENERATOR: low leverage, high velocity
  BALANCED_ELITE: high leverage AND high velocity
  READER: very low velocity
  COMMITTER: high cache creation
  STANDARD: moderate all-around`,
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
        text: `Canonical SigRank Formulas (frozen)

Yield (Υ):        (cache_read × output) / input²
Leverage:         cache_read / input
Velocity:         output / input
SNR:              output / (input + output)
10xDEV:           log10(cache_read / input)
Scale V:          log10(total_tokens)
Construction:     cache_write / cache_read

Canonical seed values:
  input       = 1,251,211
  output      = 11,296,121
  cache_read  = 128,196,310
  cache_write = 2,555,179,769
  Υ           = 18,436.98

These formulas are frozen. Do not modify without owner approval.`,
      }],
    };
  }

  if (uri === "sigrank://classes") {
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: JSON.stringify({
          taxonomy: "RS05",
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
