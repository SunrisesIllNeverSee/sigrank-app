"use client";

import React from "react";
import type { LeaderboardRow } from "@/lib/data";
import {
  METRICS,
  TOKEN_METRICS,
  DISPLAY_RAW,
  DISPLAY_METRICS,
} from "@/lib/canon/ids";
import { recordValue } from "@/lib/hall/record-value";
import { HallSubmissionRow } from "./HallSubmissionRow";

interface Props {
  /** Canonical metric id — token-era 'Y.xx' / raw 'T.xx' (live) or legacy 'M/C/E.xx'. */
  canonId: string;
  /** Rows already sorted by this metric (descending), top of the board first. */
  rows: LeaderboardRow[];
  /** Max rows to render (default 10 — the "top ten"). */
  limit?: number;
}

/** Canonical display lookup so RAW (T.xx) headings resolve name/ticker too. */
const DISPLAY_BY_ID = Object.fromEntries(
  [...DISPLAY_RAW, ...DISPLAY_METRICS].map((d) => [d.id, d]),
);

/**
 * MetricTopTen — a single-metric leaderboard card for the Hall page. Server
 * component. Heading shows the metric name + canonical id; rows are rendered via
 * HallSubmissionRow (which carries the operator `claimed` flag).
 *
 * All values are treated as placeholders (mock fallback) unless an operator is a
 * verified, real row (isPlaceholder === false), in which case the value gets a
 * real canonical-id superscript.
 */
export function MetricTopTen({ canonId, rows, limit = 10 }: Props) {
  // Token-era (Y.xx) resolves from TOKEN_METRICS; legacy ids from METRICS.
  const def = TOKEN_METRICS[canonId] ?? METRICS[canonId];
  // Heading name/ticker prefer the canonical display set (covers RAW T.xx too),
  // falling back to the TOKEN_METRICS/METRICS def, then the raw id.
  const name = DISPLAY_BY_ID[canonId]?.name ?? def?.name ?? canonId;
  const ticker = DISPLAY_BY_ID[canonId]?.ticker ?? def?.ticker ?? canonId;
  const top = rows.slice(0, limit);

  return (
    <section className="rounded-md border border-bg-border bg-bg-surface p-4">
      <div className="mb-3 flex flex-col items-center gap-0.5 text-center">
        <h3 className="font-mono text-sm font-bold tracking-wide text-text-primary">
          {name}
        </h3>
        <span className="font-mono text-[10px] text-text-muted">{ticker}</span>
      </div>
      <div>
        {top.length === 0 ? (
          <p className="px-2 py-3 text-xs text-text-muted">
            No operators in this view.
          </p>
        ) : (
          top.map((row, i) => {
            const display = recordValue(row, canonId);
            const real = row.operator.isPlaceholder === false;
            return (
              <HallSubmissionRow
                key={row.operator.operator_id}
                rank={i + 1}
                codename={row.operator.codename}
                displayName={row.operator.display_name}
                claimed={row.operator.claimed}
                classTier={row.snapshot.class_tier}
                platform={row.operator.primary_domain}
                value={display}
                canonId={canonId}
                isPlaceholder={!real}
                href={`/user/${row.operator.codename}`}
              />
            );
          })
        )}
      </div>
    </section>
  );
}
