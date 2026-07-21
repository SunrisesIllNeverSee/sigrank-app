import React from "react";
import Link from "next/link";
import type { LeaderboardRow, HallRecord } from "@/lib/board";
import { getHallOfSignal } from "@/lib/board";
import { sortValue } from "@/lib/analytics/sort-value";
import {
  DISPLAY_RAW,
  DISPLAY_METRICS,
} from "@/lib/identity/canon-ids";
import { recordValue } from "@/lib/analytics/record-value";

/**
 * OperatorRecords — the "Records" badge strip on an operator profile.
 *
 * Two record types, both rendered as compact badge-style chips in a horizontal
 * wrap:
 *
 *  a. **Static curated records** — from getHallOfSignal(), filtered to records
 *     where operator_codename matches this operator (checked against BOTH the
 *     codename and the display_name, since the Hall may store either).
 *  b. **Dynamic metric records** — computed from the leaderboard data already
 *     fetched on the profile page. For each metric board, if this operator is
 *     #1, #2, or #3, show a "Holds #1 on Υ Yield" style chip.
 *
 * Renders ABOVE the tab bar so prestige is visible immediately. Does NOT render
 * if the operator holds zero records (no empty state — just null).
 *
 * Medal colors: gold for #1, silver (#c0c0c0) for #2, bronze (#cd7f32) for #3.
 * Static records get a trophy emoji. SigRank gold/black aesthetic.
 */

/** One dynamic metric record held by this operator. */
interface DynamicRecord {
  canonId: string;
  name: string;
  ticker: string;
  rank: number;
  value: string;
}

const CASCADE_BOARDS = DISPLAY_METRICS.map((d) => ({
  canonId: d.id,
  sort: d.key,
  name: d.name,
  ticker: d.ticker,
}));
const RAW_BOARDS = DISPLAY_RAW.map((d) => ({
  canonId: d.id,
  sort: d.key,
  name: d.name,
  ticker: d.ticker,
}));

const ALL_BOARDS = [...CASCADE_BOARDS, ...RAW_BOARDS];

/** Compute this operator's dynamic metric records (top 3 only). Returns
 *  entries where they're #1, #2, or #3 on a board, sorted by rank. */
function computeDynamicRecords(
  codename: string,
  boardRows: LeaderboardRow[],
): DynamicRecord[] {
  const records: DynamicRecord[] = [];

  for (const board of ALL_BOARDS) {
    const sorted = [...boardRows]
      .sort((a, z) => sortValue(z, board.sort) - sortValue(a, board.sort))
      .slice(0, 3);

    const rank = sorted.findIndex(
      (r) => r.operator.codename === codename,
    );
    if (rank === -1) continue; // not in top 3

    const row = sorted[rank];
    const value = recordValue(row, board.canonId);
    if (value === "—") continue; // non-compounding on a compounding metric

    records.push({
      canonId: board.canonId,
      name: board.name,
      ticker: board.ticker,
      rank: rank + 1,
      value,
    });
  }

  return records.sort((a, b) => a.rank - b.rank);
}

/** Filter static Hall records to those belonging to this operator. Checks
 *  against BOTH codename and display_name — the Hall may store either. */
function filterStaticRecords(
  hallRecords: HallRecord[],
  codename: string,
  displayName?: string,
): HallRecord[] {
  const names = new Set<string>([codename]);
  if (displayName) names.add(displayName);
  return hallRecords.filter((r) => names.has(r.operator_codename));
}

/** Inline medal color for a rank (gold/silver/bronze). */
function medalColor(rank: number): string | undefined {
  if (rank === 1) return undefined; // gold uses the theme class
  if (rank === 2) return "#c0c0c0";
  if (rank === 3) return "#cd7f32";
  return undefined;
}

/** Rank prefix label. */
function rankLabel(rank: number): string {
  return `Holds #${rank}`;
}

interface Props {
  /** Operator codename — used to find this operator in the board rows + Hall. */
  codename: string;
  /** Operator display name — checked against Hall records too (optional). */
  display_name?: string;
  /** Full leaderboard rows (already fetched by the profile page for field
   *  averages). Reused — no extra DB call. Optional; if absent, dynamic
   *  records are skipped. */
  boardRows?: LeaderboardRow[];
}

export async function OperatorRecords({
  codename,
  display_name,
  boardRows,
}: Props) {
  // Static curated records from the Hall of Signal.
  const hallRecords = await getHallOfSignal();
  const staticRecords = filterStaticRecords(
    hallRecords,
    codename,
    display_name,
  );

  // Dynamic metric records (top 3 on each board).
  const dynamicRecords = boardRows
    ? computeDynamicRecords(codename, boardRows)
    : [];

  const total = staticRecords.length + dynamicRecords.length;
  if (total === 0) return null;

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm">🏆</span>
        <h2 className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-text-primary">
          Records
        </h2>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Static curated records — trophy chips. */}
        {staticRecords.map((r, i) => (
          <Link
            key={`static-${i}`}
            href="/hall"
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-mono text-xs text-text-primary transition-colors hover:border-gold hover:bg-gold/20"
            title={`${r.title} · ${r.date}`}
          >
            <span className="text-gold">🏆</span>
            <span className="font-semibold text-gold">{r.title}</span>
            {r.value && (
              <span className="text-text-secondary">{r.value}</span>
            )}
          </Link>
        ))}

        {/* Dynamic metric records — medal chips. */}
        {dynamicRecords.map((r) => {
          const color = medalColor(r.rank);
          const isGold = r.rank === 1;
          return (
            <Link
              key={`dyn-${r.canonId}`}
              href="/hall"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs transition-colors hover:bg-bg-hover ${
                isGold
                  ? "border-gold/40 bg-gold/10 text-text-primary hover:border-gold"
                  : "border-bg-border bg-bg-elevated text-text-primary"
              }`}
              title={`${rankLabel(r.rank)} on ${r.name} · ${r.value}`}
            >
              <span
                className="font-bold"
                style={color ? { color } : undefined}
              >
                #{r.rank}
              </span>
              <span className="text-text-secondary">{r.name}</span>
              <span
                className={`font-semibold ${isGold ? "text-gold" : ""}`}
                style={color && !isGold ? { color } : undefined}
              >
                {r.value}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
