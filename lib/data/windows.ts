/**
 * lib/data/windows.ts — the 730 window layer's membership core.
 *
 * Pure + dependency-free so the live path (lib/data/index.ts), the mock path
 * (lib/data/mock.ts via the facade), the board route, and the window switcher
 * all share ONE definition — and __tests__/data/windows.test.mjs can mirror the
 * math exactly (the same discipline canonical.test.mjs uses for the cascade).
 *
 * Model (token-dashboard source + Devins_Plans/WINDOW_TRAJECTORY_DESIGN.md):
 * each board window W shows snapshots whose `window_type === enum(W)` — NON-
 * cumulative, so each window is its own cohort (an operator can hold up to four
 * snapshots, one per window, each with that window's pillar totals). For the
 * time-bounded windows a snapshot must also not be stale:
 *
 *     age(snapshot_date, ref) ≤ days(W) + buffer(W)
 *
 * `all_time` has no recency filter. `ref` ("now") is DATA-RELATIVE — the latest
 * snapshot_date present in that window's candidate set — NOT the wall clock. That
 * keeps static seed data (all dated 2026-05-14) from emptying a board, makes the
 * board self-clean relative to the freshest pull, and makes the buffer math
 * deterministic (no Date.now()) so it's unit-testable.
 */

/** A board window: route slug → DB `window_type` enum + recency policy. */
export interface BoardWindow {
  /** URL slug: '7d' | '30d' | '90d' | 'all'. */
  slug: string;
  /** metric_snapshots.window_type value this window reads. */
  enum: string;
  /** Display label, e.g. "30 day". */
  label: string;
  /** Compact label for the switcher / window pill, e.g. "30d". */
  short: string;
  /** Recency horizon in days; null = no recency filter (all-time, the lifetime board). */
  days: number | null;
  /** Grace days added to the horizon so an operator isn't dropped at the edge. */
  buffer: number;
}

/**
 * BOARD_WINDOWS — the four 730 windows (owner spec / BRIEF_730_ULTRACODE.md).
 * Buffers: 7d=1, 30d=3, 90d=3, all=none. The board owns this vocabulary; it is
 * deliberately separate from the legacy WINDOW_UI labels in lib/constants.ts so
 * reconciling those (and their consumers in metrics/submit) can land later.
 */
export const BOARD_WINDOWS: readonly BoardWindow[] = [
  { slug: "7d", enum: "7d", label: "7 day", short: "7d", days: 7, buffer: 1 },
  {
    slug: "30d",
    enum: "30d",
    label: "30 day",
    short: "30d",
    days: 30,
    buffer: 3,
  },
  {
    slug: "90d",
    enum: "90d",
    label: "90 day",
    short: "90d",
    days: 90,
    buffer: 3,
  },
  {
    slug: "all",
    enum: "all_time",
    label: "All time",
    short: "All",
    days: null,
    buffer: 0,
  },
];

/** Default board window (slug) — 30d is the most populated window. */
export const BOARD_WINDOW_DEFAULT = "30d";

const BY_SLUG = new Map(BOARD_WINDOWS.map((w) => [w.slug, w]));
const BY_ENUM = new Map(BOARD_WINDOWS.map((w) => [w.enum, w]));

/** Resolve a board window by its URL slug (undefined → unknown slug). */
export function boardWindowBySlug(slug: string): BoardWindow | undefined {
  return BY_SLUG.get(slug);
}

/** Resolve a board window by its DB window_type enum (undefined → unknown). */
export function boardWindowByEnum(enumValue: string): BoardWindow | undefined {
  return BY_ENUM.get(enumValue);
}

const MS_PER_DAY = 86_400_000;

/**
 * Parse a 'YYYY-MM-DD' DATE to epoch ms at UTC midnight. Returns NaN when the
 * value is missing/unparseable (callers treat NaN as "can't judge → keep").
 */
export function parseSnapshotDate(d: string | null | undefined): number {
  if (!d) return NaN;
  return Date.parse(`${d.slice(0, 10)}T00:00:00Z`);
}

/** The windowing fields a row must expose to be filtered (DB snap or mock row). */
export interface Windowable {
  window_type?: string | null;
  snapshot_date?: string | null;
}

/**
 * windowReference — the data-relative "now" for a window group: the latest
 * snapshot_date among the candidates. NaN when none carry a date (→ no drops).
 */
export function windowReference(candidates: readonly Windowable[]): number {
  let ref = NaN;
  for (const c of candidates) {
    const t = parseSnapshotDate(c.snapshot_date);
    if (!Number.isNaN(t) && (Number.isNaN(ref) || t > ref)) ref = t;
  }
  return ref;
}

/**
 * inWindow — is `snap` a member of board window `win`? window_type must match
 * exactly; time-bounded windows additionally require the snapshot to be within
 * (days + buffer) of `ref`. NaN dates/ref are kept (non-empty-safe).
 */
export function inWindow(
  win: BoardWindow,
  snap: Windowable,
  ref: number,
): boolean {
  if (snap.window_type !== win.enum) return false;
  if (win.days == null) return true; // all-time: lifetime board, no recency
  const t = parseSnapshotDate(snap.snapshot_date);
  if (Number.isNaN(t) || Number.isNaN(ref)) return true;
  const ageDays = (ref - t) / MS_PER_DAY;
  return ageDays <= win.days + win.buffer;
}

/**
 * filterToWindow — narrow `rows` to those in the board window identified by
 * `windowEnum` (exact window_type + recency vs the group's own latest date).
 * Generic over T so it serves both DbMetricSnapshot[] (live) and LeaderboardRow[]
 * (mock). An unknown enum falls back to exact window_type match, no recency.
 */
export function filterToWindow<T extends Windowable>(
  rows: readonly T[],
  windowEnum: string,
): T[] {
  const win = BY_ENUM.get(windowEnum);
  if (!win) return rows.filter((r) => r.window_type === windowEnum);
  const candidates = rows.filter((r) => r.window_type === win.enum);
  if (win.days == null) return candidates;
  const ref = windowReference(candidates);
  return candidates.filter((r) => inWindow(win, r, ref));
}
