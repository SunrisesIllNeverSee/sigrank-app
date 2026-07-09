/**
 * Theme module — the canonical theme list + apply/get helpers. Shared by the
 * segmented ThemeToggle (account menu + /settings) and the Shift+T cycle
 * shortcut so both stay in sync. Client-only: touches document + localStorage.
 */

export const THEMES = [
  { id: "carbon", label: "Carbon" },
  { id: "paper", label: "Paper" },
  { id: "railway", label: "Railway" },
  { id: "terminal", label: "Terminal" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

const STORAGE_KEY = "sigrank-theme";

function isThemeId(v: string | null): v is ThemeId {
  return v === "carbon" || v === "paper" || v === "railway" || v === "terminal";
}

/** Read the theme currently applied to <html> (set by the no-flash init script). */
export function getCurrentTheme(): ThemeId {
  const attr = document.documentElement.getAttribute("data-theme");
  return isThemeId(attr) ? attr : "terminal";
}

/** Apply a theme to <html> and persist to localStorage. Reactive components
 *  (e.g. TerminalWordmark) pick this up via their MutationObserver on
 *  data-theme — no explicit signal needed. */
export function applyTheme(id: ThemeId): void {
  document.documentElement.setAttribute("data-theme", id);
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* private mode / storage disabled — theme still applies for the session */
  }
}

/** Next theme in the THEMES order, wrapping around. */
export function nextTheme(current: ThemeId): ThemeId {
  const i = THEMES.findIndex((t) => t.id === current);
  return THEMES[(i + 1) % THEMES.length].id;
}
