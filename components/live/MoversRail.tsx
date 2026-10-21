/**
 * components/live/MoversRail.tsx — LB-15 "TOP MOVERS · 7D" rail module.
 *
 * Ports data.js `deriveMovers` + board.js `#movers` render. The workspace
 * resolves the entries itself (server `initial.movers` — derived from the
 * FULL ranking scope — wins; falls back to `deriveMovers(operators)` so the
 * component is standalone-correct either way). Each row carries the
 * operator's index into the supplied field so a click swaps the docked
 * profile — the reference already styled `.mv[data-op]` for exactly this.
 *
 * Delta sign: fixture mv7 values were all ≥0 so the reference hardcoded
 * "▲ +N"; live movement can be negative, so the arrow/chevron follows the
 * sign (same mono slot, same classes: `dlt up|dn`).
 *
 * Display name: the reference rendered `o.codename`, but its synced payload
 * stored the DISPLAY NAME in codename (sync.py `e.get("display_name") or
 * e["codename"]`). Production's MoverEntry.codename is the API identity
 * ("signal-…" for unnamed operators), so the rail renders `handle` — the
 * resolved display identity (@handle or operatorDisplayName) — and falls
 * back to codename only when the handle slot is empty.
 */
import { useEffect, useMemo, useState } from "react";
import type { LiveOperator, MoverEntry } from "@/lib/board/live-types";
import { deriveMovers, isVerifiedOp } from "./utils";
import { PixelBadge } from "./PixelBadge";
import { RailDialog } from "../profile-v2/RailDialog";

export interface MoverRow {
  /** display name — resolved handle, codename as honest fallback. */
  name: string;
  /** API codename — identity key for opIndex lookup + React keys. */
  codename: string;
  /** movement_7d spots — always a real number (null-mv7 rows never enter
   *  the movers set; an unmoved row is not a mover). */
  mv: number;
  /** index into the workspace operators array, or null when unresolvable. */
  opIndex: number | null;
  /** profile graphic (owner 2026-10-06: "show their profile graphic") —
   *  avatar_url resolved through the operators array; null → initial tile. */
  avatarUrl?: string | null;
  /** verified flag for the avatar-corner block badge. */
  verified?: boolean;
  /** optional right-side note — raw stat modes (e.g. token counts) render
      this instead of the Δ rank chip. */
  note?: string;
  /** False for a genuine measured mover; TBD slots carry no fake metrics. */
  placeholder?: boolean;
}

/** Resolve server-provided movers, else derive client-side from the field. */
export function moverRows(
  movers: MoverEntry[] | undefined,
  ops: LiveOperator[],
): MoverRow[] {
  const of = (k: number | null, o?: LiveOperator) => {
    const op = o ?? (k != null && k >= 0 ? ops[k] : undefined);
    return {
      avatarUrl: op?.avatarUrl ?? null,
      verified: isVerifiedOp(op?.verif),
    };
  };
  if (movers && movers.length) {
    return movers.map((m) => {
      const k = ops.findIndex((o) => o.codename === m.codename);
      return {
        name: m.handle || m.codename,
        codename: m.codename,
        mv: m.mv7,
        opIndex: k >= 0 ? k : null,
        ...of(k >= 0 ? k : null),
      };
    });
  }
  return deriveMovers(ops).map((m) => ({
    name: m.o.handle || m.o.codename,
    codename: m.o.codename,
    mv: m.mv,
    opIndex: m.i,
    ...of(null, m.o),
  }));
}

export function MoversRail({
  rows,
  onSelect,
  tag = "7d",
  boxHead,
  onPrev,
  onNext,
  slideKey,
}: {
  rows: MoverRow[];
  onSelect?: (opIndex: number) => void;
  tag?: string;
  boxHead?: string;
  onPrev?: () => void;
  onNext?: () => void;
  slideKey?: string;
}) {
  return (
    <div className="mbox" data-mover-slide={slideKey}>
      <div className="mbox-h">
        <span className="mbox-title">{boxHead}</span>
        {onPrev && onNext ? (
          <span className="mbox-nav">
            <button type="button" onClick={onPrev} title="Previous mover slide"
              aria-label="Previous mover slide">◂</button>
            <button type="button" onClick={onNext} title="Next mover slide"
              aria-label="Next mover slide">▸</button>
          </span>
        ) : null}
      </div>
      {rows.map((m, i) => {
        const clickable = !m.placeholder && m.opIndex != null && onSelect != null;
        return (
          <div
            key={m.placeholder ? "tbd-" + i : m.codename + "-" + i}
            className={"mv" + (m.placeholder ? " mv-tbd" : "")}
            data-op={clickable ? m.opIndex! : undefined}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={clickable ? () => onSelect(m.opIndex!) : undefined}
            onKeyDown={clickable ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(m.opIndex!);
              }
            } : undefined}
          >
            <span className="mav">
              {m.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element -- profile image */
                <img src={m.avatarUrl} alt="" loading="lazy" />
              ) : m.placeholder ? "·" : m.name[0] === "@" ?
                (m.name[1] ?? "·") : (m.name[0] ?? "·")}
              {m.verified && !m.placeholder ? (
                <span className="avbd"><PixelBadge name="verified" /></span>
              ) : null}
            </span>
            <span title={m.placeholder ? "No qualifying operator for this position" : m.name}>
              {m.name}
              {!m.placeholder ? (
                <> <span className="mut mono" style={{ fontSize: 9 }}>{tag}</span></>
              ) : null}
            </span>
            {m.placeholder ? (
              <span className="dlt vol mono" aria-label="No data">—</span>
            ) : m.note != null ? (
              <span className="dlt vol mono" title={m.note}>{m.note}</span>
            ) : (
              <span className={"dlt " + (m.mv >= 0 ? "up" : "dn")}>
                {m.mv >= 0 ? "▲ +" + m.mv : "▼ −" + Math.abs(m.mv)}
              </span>
            )}
            <span className="rk-pos">#{i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}

/* Board-filter-aware mover rail. Its slides rotate 7D, 24H, and raw
   volume INSIDE the selected HITL / Hybrid / Autonomous population.
   Unranked UR members are never in ops and cannot enter mover statistics. */
export type MoverBoardMode = "hitl" | "hybrid" | "agentic";

export function moverScopeMatches(o: LiveOperator, scope: MoverBoardMode): boolean {
  if (scope === "hybrid") return true;
  if (scope === "hitl") return o.wf === "hitl" || o.wf === "hybrid";
  // Legacy statistical outlier candidates are currently unresolved (null);
  // this is a display cohort, not verified Autonomous execution.
  return o.wf === "agentic" || o.wf === "hybrid" || o.wf === null;
}

/** Exactly five independently inspectable boards — never skip a slide. */
export const MOVER_MODES = ["7D", "24H", "Σ TOKENS", "OP RATIO", "10×DEV"] as const;
export type MoverSlideMode = typeof MOVER_MODES[number];
export const MOVER_SLOTS = 5;
/** Leading movers shown in the compact sidebar box (owner 2026-10-21: 1–3). */
const COMPACT_MOVERS = 3;

export function fillMoverSlots(rows: MoverRow[]): MoverRow[] {
  return Array.from({ length: MOVER_SLOTS }, (_, i) => rows[i] ?? {
    name: "TBD",
    codename: "tbd-" + i,
    mv: 0,
    opIndex: null,
    note: "—",
    placeholder: true,
  });
}

/** Real scored operators only. No UR account records, invalid ratios or
 * invented scores. Indexes always refer to the complete ranked op array. */
export function moverSlideRows(
  ops: LiveOperator[],
  server: MoverEntry[] | undefined,
  boardMode: MoverBoardMode,
  mode: MoverSlideMode,
): MoverRow[] {
  const scoped = ops.map((o, i) => ({ o, i }))
    .filter(({ o }) => moverScopeMatches(o, boardMode));

  const row = (o: LiveOperator, i: number, mv: number, note?: string): MoverRow => ({
    name: o.handle?.trim() || o.name?.trim() || o.codename?.trim() || "TBD",
    codename: o.codename,
    opIndex: i,
    mv,
    avatarUrl: o.avatarUrl ?? null,
    verified: isVerifiedOp(o.verif),
    ...(note != null ? { note } : {}),
  });

  if (mode === "7D") {
    if (boardMode === "hybrid" && server?.length) {
      const authoritative = moverRows(server, ops)
        .filter((m) => m.opIndex != null && m.mv !== 0 &&
          Number.isFinite(m.mv) && moverScopeMatches(ops[m.opIndex], boardMode))
        .map((m) => {
          const o = ops[m.opIndex!];
          return row(o, m.opIndex!, m.mv);
        });
      return fillMoverSlots(authoritative);
    }
    return fillMoverSlots(scoped
      .filter(({ o }) => o.mv7 != null && o.mv7 !== 0 && Number.isFinite(o.mv7))
      .sort((a, b) => (b.o.mv7 ?? 0) - (a.o.mv7 ?? 0))
      .slice(0, MOVER_SLOTS)
      .map(({ o, i }) => row(o, i, o.mv7!)));
  }
  if (mode === "24H") return fillMoverSlots(scoped
    .filter(({ o }) => o.mv24 != null && o.mv24 !== 0 && Number.isFinite(o.mv24))
    .sort((a, b) => Math.abs(b.o.mv24!) - Math.abs(a.o.mv24!))
    .slice(0, MOVER_SLOTS)
    .map(({ o, i }) => row(o, i, o.mv24!)));

  if (mode === "Σ TOKENS") return fillMoverSlots(scoped
    .filter(({ o }) => Number.isFinite(o.num.total) && o.num.total > 0)
    .sort((a, b) => b.o.num.total - a.o.num.total)
    .slice(0, MOVER_SLOTS)
    .map(({ o, i }) => row(o, i, 0, o.total)));

  // Operating ratio uses the existing full 3-component R:I:O display;
  // sort by its first canonical dimension (leverage R/I), consistent with
  // the board's "Op Ratio" sort. Do not synthesize a composite statistic.
  if (mode === "OP RATIO") return fillMoverSlots(scoped
    .filter(({ o }) => !o.nc && !!o.opratioFull &&
      Number.isFinite(o.num.lev) && o.num.lev >= 0)
    .sort((a, b) => b.o.num.lev - a.o.num.lev)
    .slice(0, MOVER_SLOTS)
    .map(({ o, i }) => row(o, i, 0, o.opratioFull!)));

  // 10×DEV is log10(leverage), not a made-up 10× multiplier.
  return fillMoverSlots(scoped
    .filter(({ o }) => !o.nc && Number.isFinite(o.num.dev ?? o.dev))
    .sort((a, b) => (b.o.num.dev ?? b.o.dev) - (a.o.num.dev ?? a.o.dev))
    .slice(0, MOVER_SLOTS)
    .map(({ o, i }) => row(o, i, 0,
      (o.num.dev ?? o.dev).toFixed(2))));
}

export function RotatingMovers({
  ops,
  server,
  onSelect,
  boardMode = "hybrid",
}: {
  ops: LiveOperator[];
  server?: MoverEntry[];
  onSelect?: (opIndex: number) => void;
  boardMode?: MoverBoardMode;
}) {
  const [mi, setMi] = useState(0);

  useEffect(() => { setMi(0); }, [boardMode]);

  /* owner 2026-10-21: the sidebar box is compact (leading movers) and the
     full list + pager live in a popup. Auto-rotation pauses while the popup
     is open so the list does not change under the reader. */
  const [popupOpen, setPopupOpen] = useState(false);
  useEffect(() => {
    if (popupOpen) return;
    const t = setInterval(() => setMi((i) => (i + 1) % MOVER_MODES.length), 5000);
    return () => clearInterval(t);
  }, [popupOpen]);

  const slide = MOVER_MODES[mi];
  const rows = useMemo(
    () => moverSlideRows(ops, server, boardMode, slide),
    [ops, server, boardMode, slide],
  );
  const boxHead = slide + " · " + (mi + 1) + "/" + MOVER_MODES.length;
  const tag = slide === "Σ TOKENS" ? "Σ" : slide === "24H" ? "24h" :
    slide === "OP RATIO" ? "R:I:O" : slide === "10×DEV" ? "10×" : "7d";
  const lead = rows.filter((m) => !m.placeholder).slice(0, COMPACT_MOVERS);
  return (
    <RailDialog
      title="TOP MOVERS"
      subtitle={boxHead}
      hint="OPEN ▸"
      lazy
      dialogClass="prl-dialog--movers"
      onOpenChange={setPopupOpen}
      trigger={
        <div className="mbox mbox--compact" data-mover-slide={slide}>
          <div className="mbox-compact-h"><span>{boxHead}</span></div>
          {lead.length ? lead.map((m, i) => (
            <div key={m.codename + "-" + i} className="mv">
              <span className="mav">
                {m.avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- profile image */
                  <img src={m.avatarUrl} alt="" loading="lazy" />
                ) : m.name[0] === "@" ? (m.name[1] ?? "·") : (m.name[0] ?? "·")}
              </span>
              <span title={m.name}>{m.name}</span>
              {m.note != null ? (
                <span className="dlt vol mono">{m.note}</span>
              ) : (
                <span className={"dlt " + (m.mv >= 0 ? "up" : "dn")}>
                  {m.mv >= 0 ? "▲ +" + m.mv : "▼ −" + Math.abs(m.mv)}
                </span>
              )}
              <span className="rk-pos">#{i + 1}</span>
            </div>
          )) : <div className="mv"><span className="mut mono">— NO MOVERS YET</span></div>}
        </div>
      }
    >
      {(close) => <MoversRail
        boxHead={boxHead}
        rows={rows}
        onSelect={onSelect ? (i) => { onSelect(i); close(); } : undefined}
        slideKey={slide}
        onPrev={() => setMi((i) => (i + MOVER_MODES.length - 1) % MOVER_MODES.length)}
        onNext={() => setMi((i) => (i + 1) % MOVER_MODES.length)}
        tag={tag}
      />}
    </RailDialog>
  );
}
