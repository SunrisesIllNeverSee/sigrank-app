import "server-only";

/**
 * lib/scoring/secret-config.ts — SERVER-ONLY active scoring parameters (IP boundary).
 *
 * The `'server-only'` import above hard-fails the build if any client component
 * tries to import this module. Like ./ruleset, the resolved RS.xx values are the
 * proprietary core of the scoring engine and MUST NOT reach the browser.
 *
 * THE IP-BOUNDARY GATE (#2): the public repo + client bundle ship only the
 * PLACEHOLDER values from ./ruleset. The REAL RS.xx parameters live exclusively
 * in the runtime environment variable `SIGRANK_RULESET` (a JSON blob set in
 * Vercel env, NEVER committed). At module load we read it once:
 *   - present + parses + each key validates → ACTIVE values come from env
 *   - absent / parse failure / per-key invalid → fall back to placeholders
 * Failure NEVER throws — a build/run with no env set must work unchanged on the
 * public placeholders. A partial env blob overrides only the keys it carries;
 * any key it omits (or that fails validation) keeps the placeholder.
 *
 * engine.ts imports the ACTIVE values from HERE under the SAME names the
 * placeholders use, so swapping the import source required no logic change.
 */

import {
  RS01_SIGNA_WEIGHTS as PLACEHOLDER_RS01_SIGNA_WEIGHTS,
  RS02_DEPTH_BUCKETS as PLACEHOLDER_RS02_DEPTH_BUCKETS,
  RS02_DEPTH_FALLBACK as PLACEHOLDER_RS02_DEPTH_FALLBACK,
  RS04_PC_WEIGHTS as PLACEHOLDER_RS04_PC_WEIGHTS,
  RS05_CLASS_THRESHOLDS as PLACEHOLDER_RS05_CLASS_THRESHOLDS,
  RS06_ANTI_GAMING as PLACEHOLDER_RS06_ANTI_GAMING,
  RS07_PROMOTION_CYCLES as PLACEHOLDER_RS07_PROMOTION_CYCLES,
} from "@/lib/analytics/ruleset";

// ─── Resolved-value types (structurally identical to the placeholders) ────────

type SignaWeights = {
  comp: number;
  sd: number;
  pc: number;
  ct: number;
  tt: number;
};
type DepthBucket = readonly [number, number];
type PcWeights = {
  instruction_layers: number;
  recursion: number;
  entities: number;
  constraints: number;
  symbolic: number;
  response_shaping: number;
};
type ClassThreshold = {
  class: string;
  compMin: number;
  signaMin: number | null;
};
type AntiGaming = { enabled: boolean };

// ─── Validation helpers (pure, total — never throw) ───────────────────────────

const isFiniteNumber = (x: unknown): x is number =>
  typeof x === "number" && Number.isFinite(x);

/** Weights are valid when every listed key is a finite number summing to ≈1. */
function validWeights<K extends string>(
  v: unknown,
  keys: readonly K[],
): v is Record<K, number> {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;
  let sum = 0;
  for (const k of keys) {
    if (!isFiniteNumber(obj[k])) return false;
    sum += obj[k] as number;
  }
  return Math.abs(sum - 1) < 1e-6;
}

/** Buckets are valid when non-empty and every entry is a [number, number] pair. */
function validBuckets(v: unknown): v is DepthBucket[] {
  if (!Array.isArray(v) || v.length === 0) return false;
  return v.every(
    (b) =>
      Array.isArray(b) &&
      b.length === 2 &&
      isFiniteNumber(b[0]) &&
      isFiniteNumber(b[1]),
  );
}

/** Thresholds are valid when non-empty and each has class/compMin/signaMin shape. */
function validThresholds(v: unknown): v is ClassThreshold[] {
  if (!Array.isArray(v) || v.length === 0) return false;
  return v.every((t) => {
    if (typeof t !== "object" || t === null) return false;
    const o = t as Record<string, unknown>;
    const okSigna = o.signaMin === null || isFiniteNumber(o.signaMin);
    return typeof o.class === "string" && isFiniteNumber(o.compMin) && okSigna;
  });
}

// ─── Env load (once, at module init) ─────────────────────────────────────────

/**
 * Parse `SIGRANK_RULESET` once. Returns a partial blob on success, or {} on
 * absence / parse failure (logging a single warn for malformed JSON). Never throws.
 */
function loadEnvBlob(): Record<string, unknown> {
  const raw = process.env.SIGRANK_RULESET;
  if (!raw || raw.trim() === "") return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      console.warn(
        "[scoring/secret-config] SIGRANK_RULESET is not a JSON object — using placeholders",
      );
      return {};
    }
    return parsed as Record<string, unknown>;
  } catch {
    console.warn(
      "[scoring/secret-config] SIGRANK_RULESET failed to parse — using placeholders",
    );
    return {};
  }
}

const ENV_BLOB = loadEnvBlob();

/** Pick a key from the env blob if it passes the validator, else the placeholder. */
function pick<T>(
  key: string,
  validate: (v: unknown) => v is T,
  fallback: T,
): T {
  if (Object.prototype.hasOwnProperty.call(ENV_BLOB, key)) {
    const candidate = ENV_BLOB[key];
    if (validate(candidate)) return candidate;
    console.warn(
      `[scoring/secret-config] SIGRANK_RULESET.${key} invalid — using placeholder`,
    );
  }
  return fallback;
}

// ─── ACTIVE values (env-overridden per-key, else placeholder) ─────────────────
// Exported under the SAME names as ./ruleset so engine.ts switches source freely.

export const RS01_SIGNA_WEIGHTS: SignaWeights = pick(
  "RS01_SIGNA_WEIGHTS",
  (v): v is SignaWeights => validWeights(v, ["comp", "sd", "pc", "ct", "tt"]),
  PLACEHOLDER_RS01_SIGNA_WEIGHTS,
);

export const RS02_DEPTH_BUCKETS: ReadonlyArray<DepthBucket> = pick(
  "RS02_DEPTH_BUCKETS",
  validBuckets,
  PLACEHOLDER_RS02_DEPTH_BUCKETS as DepthBucket[],
);

export const RS02_DEPTH_FALLBACK: number = pick(
  "RS02_DEPTH_FALLBACK",
  isFiniteNumber,
  PLACEHOLDER_RS02_DEPTH_FALLBACK,
);

export const RS04_PC_WEIGHTS: PcWeights = pick(
  "RS04_PC_WEIGHTS",
  (v): v is PcWeights =>
    validWeights(v, [
      "instruction_layers",
      "recursion",
      "entities",
      "constraints",
      "symbolic",
      "response_shaping",
    ]),
  PLACEHOLDER_RS04_PC_WEIGHTS,
);

export const RS05_CLASS_THRESHOLDS: ReadonlyArray<ClassThreshold> = pick(
  "RS05_CLASS_THRESHOLDS",
  validThresholds,
  PLACEHOLDER_RS05_CLASS_THRESHOLDS as ClassThreshold[],
);

export const RS06_ANTI_GAMING: AntiGaming = pick(
  "RS06_ANTI_GAMING",
  (v): v is AntiGaming =>
    typeof v === "object" &&
    v !== null &&
    typeof (v as Record<string, unknown>).enabled === "boolean",
  PLACEHOLDER_RS06_ANTI_GAMING,
);

export const RS07_PROMOTION_CYCLES: number = pick(
  "RS07_PROMOTION_CYCLES",
  isFiniteNumber,
  PLACEHOLDER_RS07_PROMOTION_CYCLES,
);
