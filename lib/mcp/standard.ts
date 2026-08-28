import { cascade } from "@sigrank/cascade";
import standardSchema from "@/standard/schema/sigrank-operator-record-v0.1.schema.json";

export const SIGRANK_STANDARD_VERSION = "sigrank/0.1-draft" as const;
export const SIGRANK_STANDARD_URL = "https://signalaf.com/standard" as const;
export const SIGRANK_STANDARD_SCHEMA_URL =
  "https://signalaf.com/standard/sigrank-operator-record-v0.1.schema.json" as const;
export const SIGRANK_STANDARD_SCHEMA = standardSchema;

export const SIGRANK_CORE_TELEMETRY = [
  "input",
  "output",
  "cache_write",
  "cache_read",
] as const;

export const SIGRANK_CORE_METRICS = [
  "yield",
  "leverage",
  "velocity",
  "snr",
  "dev10x",
] as const;

const ISO_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function tokenCount(
  value: unknown,
  name: string,
  required: boolean,
): number | null {
  if (value === null || value === undefined) {
    if (required) throw new Error(`${name} is required.`);
    return null;
  }
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new Error(`${name} must be a non-negative integer token count.`);
  }
  return value;
}

function sourceValue(value: unknown, name: string, fallback: string): string {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string.`);
  }
  return value;
}

function recordTimestamp(value: unknown): string {
  if (value === undefined) return new Date().toISOString();
  if (
    typeof value !== "string" ||
    !ISO_DATE_TIME.test(value) ||
    !Number.isFinite(Date.parse(value))
  ) {
    throw new Error("timestamp must be a valid ISO-8601 date-time.");
  }
  return value;
}

export function buildSigRankStandardRecord(args: Record<string, unknown>) {
  const input = tokenCount(args.input, "input", true) as number;
  const output = tokenCount(args.output, "output", true) as number;
  const cacheWrite = tokenCount(args.cache_write, "cache_write", false);
  const cacheRead = tokenCount(args.cache_read, "cache_read", false);
  const computed = cascade(
    input,
    output,
    cacheWrite ?? 0,
    cacheRead ?? 0,
  );
  const warnings = [...(computed.warnings ?? [])];

  if (cacheWrite === null) {
    warnings.push("cache_write is unavailable; 10xDEV is undefined.");
  }
  if (cacheRead === null) {
    warnings.push(
      "cache_read is unavailable; Yield, Leverage, and 10xDEV are undefined.",
    );
  }

  return {
    spec: SIGRANK_STANDARD_VERSION,
    timestamp: recordTimestamp(args.timestamp),
    source: {
      provider: sourceValue(args.provider, "provider", "unknown"),
      model: sourceValue(args.model, "model", "unknown"),
      tool: sourceValue(args.tool, "tool", "signalaf-http-mcp"),
    },
    telemetry: {
      input,
      output,
      cache_write: cacheWrite,
      cache_read: cacheRead,
    },
    metrics: {
      yield: cacheRead === null ? null : computed.yield,
      leverage: cacheRead === null ? null : computed.leverage,
      velocity: computed.velocity,
      snr: computed.snr,
      dev10x:
        cacheWrite === null || cacheRead === null ? null : computed.dev10x,
    },
    warnings,
  };
}

export const SIGRANK_STANDARD_IDENTITY = {
  spec: SIGRANK_STANDARD_VERSION,
  status: "proposed_open_standard",
  standard_url: SIGRANK_STANDARD_URL,
  schema_url: SIGRANK_STANDARD_SCHEMA_URL,
  reference_math: "@sigrank/cascade",
  reference_platform: "SignalAF",
  reference_field: "SignalAF Reference Field",
  instrument: "sigrank-mcp",
  core_telemetry: SIGRANK_CORE_TELEMETRY,
  core_metrics: SIGRANK_CORE_METRICS,
  compatibility_excludes: [
    "construction",
    "scale_v",
    "build_archetypes",
    "rs05",
    "rank",
    "percentile",
  ],
  privacy:
    "Core SigRank measurements do not require prompt text, response text, source code, or repository contents.",
} as const;
