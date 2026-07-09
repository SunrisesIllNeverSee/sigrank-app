/**
 * lib/features.ts — feature flag registry.
 *
 * Single source of truth for what is live vs. gated. Set flags via
 * environment variables (NEXT_PUBLIC_ prefix for client-readable flags).
 * Default = false means the feature is OFF unless explicitly enabled.
 *
 * Convention:
 *   FEAT_* = shipped, on by default
 *   GATE_* = built but gated — requires env var or explicit enable
 *
 * To enable a gated feature in production:
 *   NEXT_PUBLIC_GATE_ARENA=true in .env.local / Vercel env
 */

function envBool(key: string, defaultVal = false): boolean {
  const v = process.env[key];
  if (v === undefined || v === "") return defaultVal;
  return v === "1" || v.toLowerCase() === "true";
}

// ---------------------------------------------------------------------------
// SHIPPED — live for all users
// ---------------------------------------------------------------------------

export const FEAT_SUBMIT_PASTE = true; // ccusage JSON paste on /submit
export const FEAT_TRANSMITTERS = true; // /transmitters discovery page
export const FEAT_CASCADE_PANEL = true; // Υ cascade panel on operator profiles
export const FEAT_COMPARE_TABLE = true; // /compare metric table + radar

// ---------------------------------------------------------------------------
// GATED — built, not yet live
// ---------------------------------------------------------------------------

/** /arena — signal-Areana challenge submission interface (Phase 4) */
export const GATE_ARENA = envBool("NEXT_PUBLIC_GATE_ARENA", false);

/** Throw-down initiation from /transmitters + /compare (depends on GATE_ARENA) */
export const GATE_CHALLENGES = envBool("NEXT_PUBLIC_GATE_CHALLENGES", false);

/** Weekly signal drop (cron + signal_prompts seeder) */
export const GATE_SIGNAL_DROP = envBool("NEXT_PUBLIC_GATE_SIGNAL_DROP", false);

/** Blind bracket / Circle Wars */
export const GATE_BRACKETS = envBool("NEXT_PUBLIC_GATE_BRACKETS", false);

/** Species badge on trading card / wrapped view */
export const GATE_TRADING_CARD_SPECIES = envBool(
  "NEXT_PUBLIC_GATE_TRADING_CARD_SPECIES",
  false,
);

// ---------------------------------------------------------------------------
// Helpers for UI components
// ---------------------------------------------------------------------------

/** Returns true if challenge features (arena + throw-down) are live. */
export function challengesEnabled(): boolean {
  return GATE_CHALLENGES && GATE_ARENA;
}
