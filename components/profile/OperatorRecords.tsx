import React from "react";
import Link from "next/link";
import type { LeaderboardRow } from "@/lib/data";
import { sortValue } from "@/lib/data/sort-value";
import {
  DISPLAY_RAW,
  DISPLAY_METRICS,
} from "@/lib/canon/ids";
import { recordValue } from "@/lib/hall/record-value";

/**
 * OperatorRecords — the "Hall of Signal" section on an operator profile.
 *
 * Shows where this operator ranks on every Hall board (cascade metrics + raw
 * token pillars). Computed from the same getLeaderboard() data the profile page
 * already fetches — no extra DB call. Renders ABOVE the tab bar (not a tab) so
 * prestige is visible immediately. Does NOT render if the operator isn't in
 * the top 10 on any board.
 *
 * Medal tracker: gold/silver/bronze counts for #1/#2/#3 finishes.
 * Each row: rank trophy · metric name + canonical id · value · snapshot date.
 */

/** One board entry for this operator. */
interface BoardEntry {
  canonId: string;
  name: string;
  ticker: string;
  rank: number;
  value: string;
  date: string;
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

/** Compute this operator's rank on every board. Returns entries where they're
 *  in the top 10, sorted by rank (best first). */
function computeBoardEntries(
  codename: string,
  boardRows: LeaderboardRow[],
): BoardEntry[] {
  const entries: BoardEntry[] = [];

  for (const board of ALL_BOARDS) {
    const sorted = [...boardRows]
      .sort((a, z) => sortValue(z, board.sort) - sortValue(a, board.sort))
      .slice(0, 10);

    const rank = sorted.findIndex(
      (r) => r.operator.codename === codename,
    );
    if (rank === -1) continue; // not in top 10

    const row = sorted[rank];
    const value = recordValue(row, board.canonId);
    if (value === "—") continue; // non-compounding on a compounding metric

    entries.push({
      canonId: board.canonId,
      name: board.name,
      ticker: board.ticker,
      rank: rank + 1,
      value,
      date: row.snapshot.snapshot_date?.slice(0, 10) ?? "—",
    });
  }

  // Sort by rank (best first), then by metric name for stable ordering.
  return entries.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
}

/** Trophy node for ranks 1-3, plain number for 4-10. */
function RankNode({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="text-gold" aria-label="rank 1">
        🥇
      </span>
    );
  if (rank === 2)
    return (
      <span className="text-text-secondary" aria-label="rank 2">
        🥈
      </span>
    );
  if (rank === 3)
    return (
      <span className="text-rank-low" aria-label="rank 3">
        🥉
      </span>
    );
  return (
    <span className="text-text-muted" aria-label={`rank ${rank}`}>
      #{rank}
    </span>
  );
}

/** Value color by medal tier. */
function valueClass(rank: number): string {
  if (rank === 1) return "text-gold";
  if (rank === 2) return "text-text-secondary";
  if (rank === 3) return "text-rank-low";
  return "text-text-secondary";
}

interface Props {
  /** Operator codename — used to find this operator in the board rows. */
  codename: string;
  /** Full leaderboard rows (already fetched by the profile page for field
   *  averages). Reused — no extra DB call. */
  boardRows: LeaderboardRow[];
}

export function OperatorRecords({ codename, boardRows }: Props) {
  const entries = computeBoardEntries(codename, boardRows);

  // Don't render if the operator isn't in the top 10 on any board.
  if (entries.length === 0) return null;

  const gold = entries.filter((e) => e.rank === 1).length;
  const silver = entries.filter((e) => e.rank === 2).length;
  const bronze = entries.filter((e) => e.rank === 3).length;

  const cascadeEntries = entries.filter((e) =>
    CASCADE_BOARDS.some((b) => b.canonId === e.canonId),
  );
  const rawEntries = entries.filter((e) =>
    RAW_BOARDS.some((b) => b.canonId === e.canonId),
  );

  // Latest snapshot date across all entries.
  const latestDate = entries
    .map((e) => e.date)
    .filter((d) => d !== "—")
    .sort()
    .pop();

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-5">
      <div className="flex items-center gap-2">
        <span className="text-base">🏆</span>
        <h2 className="font-mono text-sm font-bold tracking-wide text-text-primary">
          Hall of Signal
        </h2>
      </div>
      <p className="max-w-lg font-sans text-xs leading-relaxed text-text-muted">
        Where this operator ranks on the all-time record boards — every cascade
        metric and raw token pillar.
      </p>

      {/* Medal tracker */}
      <div className="flex items-center gap-3 rounded-md border border-bg-border bg-bg-elevated px-3 py-2">
        <div className="flex items-center gap-1.5 font-mono text-sm font-semibold">
          <span>🥇</span>
          <span className="tabular-nums text-gold">{gold}</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-sm font-semibold">
          <span>🥈</span>
          <span className="tabular-nums text-text-secondary">{silver}</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-sm font-semibold">
          <span>🥉</span>
          <span className="tabular-nums text-rank-low">{bronze}</span>
        </div>
        <div className="mx-1 h-4 w-px bg-bg-border" />
        <span className="ml-auto font-mono text-xs text-text-secondary">
          {entries.length} top-10 finishes
          {latestDate ? ` · last updated ${latestDate}` : ""}
        </span>
      </div>

      {/* Cascade metrics */}
      {cascadeEntries.length > 0 && (
        <>
          <h3 className="mt-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-text-dim">
            Cascade Metrics
          </h3>
          <div className="flex flex-col gap-1.5">
            {cascadeEntries.map((e) => (
              <Link
                key={e.canonId}
                href="/hall"
                className="grid grid-cols-[28px_1fr_auto_auto] items-center gap-3 rounded-md border border-bg-border bg-bg-elevated px-3 py-2 transition-colors hover:border-gold hover:bg-bg-hover"
              >
                <span className="flex w-7 items-center justify-center font-mono text-xs font-bold">
                  <RankNode rank={e.rank} />
                </span>
                <span className="font-sans text-sm font-medium text-text-primary">
                  {e.name}
                  <span className="ml-1 font-mono text-[10px] text-text-dim">
                    {e.ticker}
                  </span>
                </span>
                <span
                  className={`font-mono text-sm font-bold tabular-nums ${valueClass(e.rank)}`}
                >
                  {e.value}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-text-dim">
                  {e.date}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Raw token pillars */}
      {rawEntries.length > 0 && (
        <>
          <h3 className="mt-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-text-dim">
            Raw Token Pillars
          </h3>
          <div className="flex flex-col gap-1.5">
            {rawEntries.map((e) => (
              <Link
                key={e.canonId}
                href="/hall"
                className="grid grid-cols-[28px_1fr_auto_auto] items-center gap-3 rounded-md border border-bg-border bg-bg-elevated px-3 py-2 transition-colors hover:border-gold hover:bg-bg-hover"
              >
                <span className="flex w-7 items-center justify-center font-mono text-xs font-bold">
                  <RankNode rank={e.rank} />
                </span>
                <span className="font-sans text-sm font-medium text-text-primary">
                  {e.name}
                  <span className="ml-1 font-mono text-[10px] text-text-dim">
                    {e.ticker}
                  </span>
                </span>
                <span
                  className={`font-mono text-sm font-bold tabular-nums ${valueClass(e.rank)}`}
                >
                  {e.value}
                </span>
                <span className="font-mono text-[10px] tabular-nums text-text-dim">
                  {e.date}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Footer link */}
      <div className="mt-2 border-t border-bg-border pt-2 text-right">
        <Link
          href="/hall"
          className="font-mono text-xs text-accent transition-colors hover:text-gold"
        >
          View all boards on the Hall of Signal →
        </Link>
      </div>
    </section>
  );
}
