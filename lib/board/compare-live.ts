import type { LeaderboardRow } from "@/lib/board/types";

/** The only Compare candidates: claimed, active and qualified live operators.
 * Input is the strict-live operator-total all-time leaderboard result.
 * Do not append UR, seeded, synthetic field or unclaimed operator records. */
export function liveCompareCandidates(rows: LeaderboardRow[]): LeaderboardRow[] {
  const used = new Set<string>();
  return rows.filter((row) => {
    const code = row.operator.codename?.toLowerCase();
    if (!code || used.has(code) || code === "the-field" ||
        !row.operator.claimed || row.pending || row.global_rank < 1 ||
        !(row.telemetry?.fresh_input > 0) || !(row.telemetry?.output > 0)) {
      return false;
    }
    used.add(code);
    return true;
  });
}

/** User-provided ?a=&b= may not escape the live ranked candidate set.
 * Default to a rotating qualified operator, matched against a distinct live
 * operator — never fallback to seeded or synthetic profiles. */
export function resolveLiveComparePair(
  rows: LeaderboardRow[],
  a?: string | null,
  b?: string | null,
  daySeed = 0,
): [LeaderboardRow, LeaderboardRow] | null {
  if (rows.length < 2) return null;
  const find = (code: string | null | undefined) =>
    rows.find(row => row.operator.codename.toLowerCase() === code?.toLowerCase());
  const fallbackA = rows[((daySeed % rows.length) + rows.length) % rows.length];
  const left = find(a) ?? fallbackA;
  const right = find(b)?.operator.codename === left.operator.codename
    ? undefined : find(b);
  return [left, right ?? rows.find(row =>
    row.operator.codename !== left.operator.codename)!];
}
