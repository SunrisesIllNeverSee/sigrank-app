/*
 * ARCHIVAL COPY of lib/constants.ts (PLATFORM_UI, PLATFORM_DOMAIN_MAP, CLASS_FILTER only)@4c610df9 (2026-07-31) for /board/history.
 * Frozen: do not sync with live code. Not canon.
 */
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
