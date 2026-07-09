import type { LeaderboardRow } from "@/lib/data";

/**
 * operatorDisplayName — the ONE canonical "what name do we show for this operator"
 * rule, shared by every compare surface (the page, matchup, radars, table, bars,
 * ledger) + the share card so they never disagree.
 *
 * Rule:
 *   1. Prefer the real display_name whenever present — INCLUDING unclaimed seeds whose
 *      names are public (e.g. Vincent Koc). The old per-component `claimed &&` gate hid
 *      those and surfaced the raw codename ("DriftPilgrim"); this is the fix.
 *   2. Owner's own 730 window-pulls are staged as mock rows with placeholder codenames
 *      ("static seed · 7d ✱mem") and no display_name → render a clean window label.
 *   3. Otherwise the codename.
 *
 * Mirrors the long-standing logic in app/compare/page.tsx (now a re-export of this).
 */
export function operatorDisplayName(row: LeaderboardRow): string {
  if (row.operator.display_name) return row.operator.display_name;
  const code = row.operator.codename;
  const m = code.match(/^static seed · (7d|30d|90d|all)( ✱mem)?/);
  if (m) {
    const win = m[1] === "all" ? "all-time" : m[1];
    return m[2] ? `Owner · ${win} (with claude-mem)` : `Owner · ${win}`;
  }
  return code;
}
