/**
 * lib/constants.ts — UI-facing enums, defaults, and copy.
 *
 * Dependency-free; safe to import from server or client. These are the
 * controlled vocabularies the feature builders use to render filters, sort
 * controls, and window pickers, plus the mapping from UI labels to the API /
 * DB window_type enum.
 */

/** Window labels shown in the UI (CANON T.12). The "730" set: 7/30/90/all-time.
 * 60 was dropped 2026-06-19 (owner) — token-dashboard + canon use 7/30/90/all,
 * no 60d aggregation.
 *
 * NOTE (730 conversion, TERM 2026-06-19): the leaderboard now owns its own clean
 * window vocabulary in `lib/data/windows.ts` (BOARD_WINDOWS: 7d/30d/90d/all). These
 * legacy WINDOW_UI labels stay AS-IS to avoid churning their consumers (the metrics
 * pages + submit forms) mid-flight. The only fix here is the dead Daily mapping:
 * 'Daily' (the 7-day window) now maps to window_type '7d' (was the orphan 'today'),
 * so a 7-day submission buckets into the 7d board. Full WINDOW_UI→slug reconciliation
 * is deferred — see SCRATCHPAD TERM 730 flag #3. */
export const WINDOW_UI = ["Daily", "30", "90", "All time"] as const;
export type WindowUI = (typeof WINDOW_UI)[number];

/** Default selected window. */
export const WINDOW_DEFAULT: WindowUI = "30";

/** Maps each UI window label to the API / DB `window_type` enum value. */
export const WINDOW_API_MAP: Record<WindowUI, string> = {
  Daily: "7d",
  "30": "30d",
  "90": "90d",
  "All time": "all_time",
};

/** Platform filter labels shown in the UI (CANON T.15). */
export const PLATFORM_UI = [
  "All",
  "Claude",
  "ChatGPT",
  "Gemini",
  "Pi",
  "Codex",
  "Multi",
] as const;
export type PlatformUI = (typeof PLATFORM_UI)[number];

/** Default selected platform filter. */
export const PLATFORM_DEFAULT: PlatformUI = "All";

/**
 * Maps a UI platform label to the `primary_domain` filter value.
 * 'All' clears the filter (null).
 */
export const PLATFORM_DOMAIN_MAP: Record<PlatformUI, string | null> = {
  All: null,
  Claude: "claude",
  ChatGPT: "chatgpt",
  Gemini: "gemini",
  Pi: "pi",
  Codex: "codex",
  Multi: "multi",
};

export interface ClassFilterOption {
  /** Lowercase tier id used as the scope_value filter (e.g. "transmitter"). */
  id: string;
  /** Display label. */
  label: string;
}

/**
 * CLASS_FILTER — class scope filter options (lowercase tier ids).
 * 'all' clears the class scope.
 */
export const CLASS_FILTER: ClassFilterOption[] = [
  { id: "all", label: "All Classes" },
  { id: "transmitter", label: "Transmitter" },
  { id: "arch+", label: "Architect+" },
  { id: "arch", label: "Architect" },
  { id: "power", label: "Power" },
  { id: "base", label: "Base" },
  { id: "seeker", label: "Seeker" },
  { id: "refiner", label: "Refiner" },
  { id: "bearer", label: "Bearer" },
  { id: "igniter", label: "Igniter" },
];

export interface SortMetricOption {
  /** Sort key used as the `metric` board param. */
  key: string;
  /** Canonical metric id this sort maps to. */
  canonId: string;
  /** Display label. */
  label: string;
}

/**
 * SORT_METRICS — the metrics a leaderboard can be sorted by. `yield_` is
 * the default global sort key (SORT_DEFAULT). Keys match `metric_snapshots`
 * columns or derived cascade fields (yield_ → cascade.yield_).
 */
export const SORT_METRICS: SortMetricOption[] = [
  { key: "yield_", canonId: "Y.01", label: "Yield" },
  { key: "signa_rate", canonId: "C.01", label: "SIGNA RATE" },
  { key: "compression_ratio", canonId: "M.01", label: "Compression" },
  { key: "prompt_complexity", canonId: "M.02", label: "Prompt Complexity" },
  { key: "cross_thread", canonId: "M.03", label: "Cross-Thread" },
  { key: "session_depth", canonId: "M.04", label: "Session Depth" },
  // M.05 Token Throughput removed 2026-06-26 — word-era metric, muted from §IGNA + dropped
  // from sort options (was fed the raw total, distorting the value). Pending §IGNA recal.
  { key: "message_volume", canonId: "B.01", label: "Turn Volume" },
  { key: "signal_force", canonId: "E.01", label: "Signal Force" },
];

/** Default leaderboard sort key. */
export const SORT_DEFAULT = "yield_";

/** Demo banner copy shown whenever the app is running on mock/fallback data. */
export const DEMO_BANNER =
  "Demo mode — showing sample data. Connect Supabase to see live operator telemetry.";

/**
 * MCP_VERSION — the live sigrank-mcp npm package version. Centralized here so
 * every web reference tracks ONE source (was hardcoded in ≥2 places, went stale
 * at 0.9.5 once). Bump this when the MCP package is published.
 */
export const MCP_VERSION = "0.0.178" as const;

/**
 * PLATFORM_COUNT — how many platforms the MCP's adapter registry reads. Mirrors
 * sigrank-mcp `adapters.mjs` ALL_PLATFORMS.length. Centralized so the landing/wiki/
 * marketing copy never drifts (it was hardcoded as "14+" while the registry had 15).
 * Bump when the MCP ships a new adapter.
 */
export const PLATFORM_COUNT = 16 as const;
