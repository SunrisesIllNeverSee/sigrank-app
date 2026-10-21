"use client";

/**
 * BoardCards — the phone (<= 760px) leaderboard: one card per operator
 * (owner 2026-10-21). Same rows the desktop table renders (the workspace passes
 * its `ordered` slice), no extra fetches. Rank, avatar, name, "class · build",
 * trend sparkline, headline number (Υ Yield, or ∑ Total in Raw mode) and a ⇄
 * compare button. The signed-in operator's card is highlighted. Tapping a card
 * opens /user/<codename>.
 */
import Link from "next/link";
import { memo } from "react";
import type { LiveOperator } from "@/lib/board/live-types";
import { buildArchetypeWord, type BuildArchetypeKey } from "@/lib/analytics/build-archetypes";
import { Sparkline } from "../live/rows";
import { avatarStyle, isVerifiedOp } from "../live/utils";
import type { ColMode, ViewMode } from "../live/rows";
import "./board-mobile.css";

export interface BoardCardsProps {
  /** [operator, index into the full field] — the same pairs the table maps. */
  rows: [LiveOperator, number][];
  colMode: ColMode;
  viewMode: ViewMode;
  /** The signed-in operator's codename, if linked. */
  ownCodename: string | null;
}

/** "kinetic", "input-bound" → "kinetic", "input bound"; unknown keys → null. */
export function buildWord(archetype: string): string | null {
  const w = buildArchetypeWord(archetype as BuildArchetypeKey);
  return !w || w === "unknown" ? null : w.replace(/-/g, " ");
}

const Card = memo(function Card({
  o,
  i,
  r,
  colMode,
  viewMode,
  own,
}: {
  o: LiveOperator;
  i: number;
  r: number;
  colMode: ColMode;
  viewMode: ViewMode;
  own: boolean;
}) {
  const build = buildWord(o.archetype);
  const headline = colMode === "raw" ? o.total : viewMode === "out" ? (o.nc ? "—" : o.dev.toFixed(2)) : o.nc ? "—" : o.yield;
  const label = colMode === "raw" ? "∑ TOTAL" : viewMode === "out" ? "10×DEV" : "Υ YIELD";
  const href = `/user/${encodeURIComponent(o.codename)}`;
  const top = r <= 3 ? ` bc-top${r}` : "";
  return (
    <li className={`bc${own ? " bc-me" : ""}${top}`} data-op={i} data-own={own || undefined}>
      <Link href={href} className="bc-main" aria-label={`${o.name}, rank ${r}`} aria-current={own ? "true" : undefined}>
        <span className="bc-rk">{r}</span>
        <span className="bc-av" style={avatarStyle(i)} aria-hidden="true">
          {o.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element -- operator avatar URL; fixed 36px tile */
            <img src={o.avatarUrl} alt="" loading="lazy" />
          ) : (
            (o.name[0] ?? "·")
          )}
        </span>
        <span className="bc-who">
          <span className="bc-nm">
            <span className="bc-nmt">{o.name}</span>
            {isVerifiedOp(o.verif) ? <span className="bc-vchk" aria-label="verified"> ✓</span> : null}
          </span>
          <span className="bc-meta">
            {o.klass}
            {build ? ` · ${build}` : ""}
          </span>
        </span>
        <span className="bc-trend" aria-hidden="true">
          <Sparkline arr={o.trend ?? []} w={34} h={18} />
        </span>
        <span className="bc-yv">
          <b>{headline}</b>
          <small>{label}</small>
        </span>
      </Link>
      <Link href={`/compare?a=${encodeURIComponent(o.codename)}`} className="bc-cmp" aria-label={`Compare ${o.name}`} title="Compare">
        ⇄
      </Link>
    </li>
  );
});

export function BoardCards({ rows, colMode, viewMode, ownCodename }: BoardCardsProps) {
  return (
    <ol className="bc-list" aria-label="Leaderboard">
      {rows.map(([o, i], d) => (
        <Card
          key={`${i}-${o.codename}`}
          o={o}
          i={i}
          r={d + 1}
          colMode={colMode}
          viewMode={viewMode}
          own={ownCodename != null && o.codename === ownCodename}
        />
      ))}
    </ol>
  );
}
